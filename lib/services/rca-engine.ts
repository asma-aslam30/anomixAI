import { RCAReport, ClassifiedSpike, LogEntry } from "@/lib/types";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import { generateJSON, isAvailable } from "./gemini-client";

function buildPrompt(spike: ClassifiedSpike, contextEntries: LogEntry[]): { system: string; user: string } {
  const system = `You are Anomix, an expert site reliability engineer performing root cause analysis.
Respond ONLY with a valid JSON object matching this schema:
{
  "root_cause_summary": "<string, max 500 chars>",
  "correlated_anomalies": ["<string>", ...],
  "confidence_score": <integer 0-100>
}`;

  const contextLines = contextEntries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20)
    .map(e => `  ${e.timestamp} | req:${e.request_count} err:${e.error_rate.toFixed(3)} lat:${e.latency_ms}ms`)
    .join("\n");

  const user = `Analyze the following incident data and provide a root cause analysis.

Service: ${spike.service_name}
Spike Classification: ${spike.classification}
Spike Metric: ${spike.spike_metric}
Observed Value: ${spike.spike_value}
Baseline Mean: ${spike.baseline_mean.toFixed(2)} | Baseline StdDev: ${spike.baseline_stddev.toFixed(2)}
Z-Score: ${spike.z_score.toFixed(2)}
Per-Metric Z-Scores:
  request_count_z: ${spike.request_count_z.toFixed(2)}
  error_rate_z: ${spike.error_rate_z.toFixed(2)}
  latency_ms_z: ${spike.latency_ms_z.toFixed(2)}

Representative log entries around the spike (up to 20 lines):
${contextLines}

Identify the most probable root cause, list any correlated anomalies you observe,
and rate your confidence. Keep root_cause_summary under 500 characters.`;

  return { system, user };
}

function fallbackReport(spikeId: string): RCAReport {
  return {
    rca_id: newId(),
    spike_id: spikeId,
    root_cause_summary: "AI analysis unavailable — manual review required",
    correlated_anomalies: [],
    confidence_score: 0,
  };
}

export async function analyze(spikeId: string): Promise<RCAReport> {
  const spike = store.getSpike(spikeId);
  if (!spike) throw new Error(`Spike not found: ${spikeId}`);

  const contextEntries = store.logsByService[spike.service_name] ?? [];

  if (!isAvailable()) {
    const report = fallbackReport(spikeId);
    store.rcaReports[spikeId] = report;
    return report;
  }

  try {
    const { system, user } = buildPrompt(spike, contextEntries);
    const raw = await generateJSON<{ root_cause_summary: string; correlated_anomalies: string[]; confidence_score: number }>(system, user);

    if (!raw || !raw.root_cause_summary) {
      const report = fallbackReport(spikeId);
      store.rcaReports[spikeId] = report;
      return report;
    }

    const report: RCAReport = {
      rca_id: newId(),
      spike_id: spikeId,
      root_cause_summary: raw.root_cause_summary.slice(0, 500),
      correlated_anomalies: Array.isArray(raw.correlated_anomalies) ? raw.correlated_anomalies : [],
      confidence_score: Math.min(100, Math.max(0, Math.round(raw.confidence_score ?? 0))),
    };

    store.rcaReports[spikeId] = report;
    return report;
  } catch {
    const report = fallbackReport(spikeId);
    store.rcaReports[spikeId] = report;
    return report;
  }
}
