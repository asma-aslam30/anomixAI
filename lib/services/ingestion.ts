import { LogEntry } from "@/lib/types";
import { newId, parseTimestamp } from "@/lib/utils";

// ─── CSV Parser ──────────────────────────────────────────────────────────────
export function parseCSV(content: string): { records: Record<string, string>[]; skipped: number } {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { records: [], skipped: 0 };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const records: Record<string, string>[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length !== headers.length) { skipped++; continue; }
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => { record[h] = values[idx]; });
    // Validate timestamp early — skip if invalid
    const tsField = record["timestamp"] ?? record["time"] ?? record["ts"] ?? "";
    try { parseTimestamp(tsField); records.push(record); }
    catch { skipped++; }
  }
  return { records, skipped };
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}

// ─── JSON Parser ─────────────────────────────────────────────────────────────
export function parseJSON(content: string): { records: Record<string, unknown>[]; skipped: number } {
  let skipped = 0;
  // Try JSON array first
  try {
    const parsed = JSON.parse(content.trim());
    if (Array.isArray(parsed)) return { records: parsed, skipped: 0 };
    if (typeof parsed === "object" && parsed !== null) return { records: [parsed], skipped: 0 };
  } catch {}
  // Try newline-delimited JSON
  const records: Record<string, unknown>[] = [];
  for (const line of content.split(/\r?\n/).filter(Boolean)) {
    try { records.push(JSON.parse(line)); }
    catch { skipped++; }
  }
  return { records, skipped };
}

// ─── Plaintext Parser ─────────────────────────────────────────────────────────
export function parsePlaintext(content: string): { records: Record<string, string>[]; skipped: number } {
  const records: Record<string, string>[] = [];
  let skipped = 0;
  const lines = content.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    try {
      const record: Record<string, string> = {};
      // Try to extract ISO timestamp
      const tsMatch = line.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
      if (!tsMatch) { skipped++; continue; }
      record["timestamp"] = tsMatch[0];
      // Extract service name
      const svcMatch = line.match(/service[=: ]+([a-z0-9-]+)/i) || line.match(/\[([a-z0-9-]+)\]/i);
      if (svcMatch) record["service_name"] = svcMatch[1];
      // Extract numeric fields
      const rcMatch = line.match(/requests?[=: ]+(\d+)/i);
      if (rcMatch) record["request_count"] = rcMatch[1];
      const erMatch = line.match(/error_rate[=: ]+([0-9.]+)/i);
      if (erMatch) record["error_rate"] = erMatch[1];
      const latMatch = line.match(/latency[=: ]+(\d+)/i);
      if (latMatch) record["latency_ms"] = latMatch[1];
      records.push(record);
    } catch { skipped++; }
  }
  return { records, skipped };
}

// ─── Record Coercion ─────────────────────────────────────────────────────────
export function coerceLogRecord(raw: Record<string, unknown>): LogEntry | null {
  // Support common field name aliases
  const tsRaw = raw["timestamp"] ?? raw["time"] ?? raw["ts"] ?? raw["@timestamp"];
  if (tsRaw == null || tsRaw === "") return null;
  let timestamp: string;
  try { timestamp = parseTimestamp(String(tsRaw)).toISOString(); }
  catch { return null; }

  const serviceName = String(
    raw["service_name"] ?? raw["service"] ?? raw["svc"] ?? raw["source"] ?? "unknown"
  );

  const requestCount = Math.max(0, parseInt(String(raw["request_count"] ?? raw["requests"] ?? raw["count"] ?? "0"), 10) || 0);
  const rawErrorRate = parseFloat(String(raw["error_rate"] ?? raw["error"] ?? raw["errors"] ?? "0")) || 0;
  // Normalise error_rate: if > 1, assume it's a percentage
  const errorRate = Math.min(1, Math.max(0, rawErrorRate > 1 ? rawErrorRate / 100 : rawErrorRate));
  const latencyMs = Math.max(0, parseInt(String(raw["latency_ms"] ?? raw["latency"] ?? raw["duration"] ?? "0"), 10) || 0);

  // status_codes: try to parse or build from individual fields
  let statusCodes: Record<string, number> = {};
  if (raw["status_codes"] && typeof raw["status_codes"] === "object") {
    statusCodes = raw["status_codes"] as Record<string, number>;
  } else {
    for (const key of Object.keys(raw)) {
      const match = key.match(/^status[_-]?(\d{3})$/i);
      if (match) statusCodes[match[1]] = parseInt(String(raw[key]), 10) || 0;
    }
    if (raw["status_code"]) statusCodes[String(raw["status_code"])] = requestCount;
  }

  return {
    id: newId(),
    timestamp,
    service_name: serviceName,
    request_count: requestCount,
    error_rate: errorRate,
    latency_ms: latencyMs,
    status_codes: statusCodes,
  };
}

// ─── Upload Dispatcher ───────────────────────────────────────────────────────
export function parseUpload(
  fileName: string,
  content: string
): { entries: LogEntry[]; parsedCount: number; skippedCount: number } {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  let rawRecords: Record<string, unknown>[] = [];
  let baseSkipped = 0;
  if (ext === "csv") {
    const { records, skipped } = parseCSV(content);
    rawRecords = records;
    baseSkipped = skipped;
  } else if (ext === "json") {
    const { records, skipped } = parseJSON(content);
    rawRecords = records as Record<string, unknown>[];
    baseSkipped = skipped;
  } else {
    const { records, skipped } = parsePlaintext(content);
    rawRecords = records;
    baseSkipped = skipped;
  }
  const entries: LogEntry[] = [];
  let coerceSkipped = 0;
  for (const raw of rawRecords) {
    const entry = coerceLogRecord(raw as Record<string, unknown>);
    if (entry) entries.push(entry);
    else coerceSkipped++;
  }
  return { entries, parsedCount: entries.length, skippedCount: baseSkipped + coerceSkipped };
}
