import { ClassifiedSpike, LogEntry, Spike, SeverityLevel } from "@/lib/types";
import { store } from "@/lib/store";

export function detectBotPattern(entries: LogEntry[], spike: Spike): boolean {
  // Get entries for this service sorted by time
  const serviceEntries = entries
    .filter(e => e.service_name === spike.service_name)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (serviceEntries.length < 2) return false;

  // Check rapid doubling: any consecutive pair where ratio > 2
  for (let i = 1; i < serviceEntries.length; i++) {
    const prev = serviceEntries[i - 1].request_count;
    const curr = serviceEntries[i].request_count;
    if (prev > 0 && curr / prev > 2.0) return true;
  }
  return false;
}

export function computeConfidence(spike: Spike): number {
  const raw =
    (spike.request_count_z * 0.3) +
    (spike.error_rate_z * 0.5) +
    (spike.latency_ms_z * 0.2);
  return Math.min(100, Math.max(0, Math.round((raw / 6.0) * 100)));
}

export function assignSeverity(spike: ClassifiedSpike): SeverityLevel {
  if (spike.classification === "POSITIVE_SPIKE") return "SEV-3";
  if (spike.classification === "SUSPICIOUS_SPIKE") return "SEV-2";
  // NEGATIVE_SPIKE
  return spike.confidence_score >= 70 ? "CRITICAL" : "SEV-1";
}

export function classify(spike: Spike, allEntries: LogEntry[]): ClassifiedSpike {
  const botPattern = detectBotPattern(allEntries, spike);

  let classification: ClassifiedSpike["classification"];
  let reason: string;

  // Priority 1: NEGATIVE
  if (spike.error_rate_z > 2.0 || spike.latency_ms_z > 2.0) {
    classification = "NEGATIVE_SPIKE";
    const triggers: string[] = [];
    if (spike.error_rate_z > 2.0) triggers.push(`error_rate Z=${spike.error_rate_z.toFixed(2)}`);
    if (spike.latency_ms_z > 2.0) triggers.push(`latency Z=${spike.latency_ms_z.toFixed(2)}`);
    reason = `System degradation detected: ${triggers.join(", ")} exceeded threshold`;
  }
  // Priority 2: SUSPICIOUS
  else if (spike.request_count_z > 2.0 && botPattern) {
    classification = "SUSPICIOUS_SPIKE";
    reason = `Traffic spike with bot-like pattern: request_count Z=${spike.request_count_z.toFixed(2)}, rapid doubling detected`;
  }
  // Priority 3: POSITIVE
  else if (spike.request_count_z > 2.0 && spike.error_rate_z <= 1.0 && spike.latency_ms_z <= 1.0) {
    classification = "POSITIVE_SPIKE";
    reason = `Healthy traffic surge: request_count Z=${spike.request_count_z.toFixed(2)}, error rate and latency stable`;
  }
  // Fallback
  else {
    classification = "POSITIVE_SPIKE";
    reason = `Spike detected (Z=${spike.z_score.toFixed(2)}) but pattern inconclusive — classified as growth event`;
  }

  const classified: ClassifiedSpike = {
    ...spike,
    classification,
    classification_reason: reason,
    confidence_score: 0,
    severity: null,
  };

  classified.confidence_score = computeConfidence(classified);
  classified.severity = assignSeverity(classified);

  // Persist to store
  store.spikes[spike.spike_id] = classified;
  return classified;
}
