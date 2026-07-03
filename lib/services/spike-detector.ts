import { LogEntry, Spike, SpikeMetric } from "@/lib/types";
import { newId } from "@/lib/utils";

export function computeStats(values: number[]): { mean: number; stddev: number } {
  if (values.length === 0) return { mean: 0, stddev: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return { mean, stddev: Math.sqrt(variance) };
}

export function zScore(value: number, mean: number, stddev: number): number {
  if (stddev === 0) return 0;
  return (value - mean) / stddev;
}

const FIVE_MIN_MS = 5 * 60 * 1000;

export function detect(entries: LogEntry[], zThreshold = 2.0): { spikes: Spike[]; warnings: string[] } {
  const warnings: string[] = [];
  const spikes: Spike[] = [];

  // Group entries by service
  const byService: Record<string, LogEntry[]> = {};
  for (const e of entries) {
    if (!byService[e.service_name]) byService[e.service_name] = [];
    byService[e.service_name].push(e);
  }

  for (const [serviceName, serviceEntries] of Object.entries(byService)) {
    if (serviceEntries.length < 3) {
      warnings.push(`${serviceName}: insufficient data (${serviceEntries.length} entries, need ≥ 3)`);
      continue;
    }

    // Sort by timestamp
    const sorted = [...serviceEntries].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Compute stats for each metric
    const rcValues = sorted.map(e => e.request_count);
    const erValues = sorted.map(e => e.error_rate);
    const latValues = sorted.map(e => e.latency_ms);

    const rcStats = computeStats(rcValues);
    const erStats = computeStats(erValues);
    const latStats = computeStats(latValues);

    // Find spike windows — group flagged entries by 5-minute windows
    const windowMap: Record<number, {
      entries: LogEntry[];
      rc_z: number; er_z: number; lat_z: number;
    }> = {};

    for (const entry of sorted) {
      const ts = new Date(entry.timestamp).getTime();
      const windowKey = Math.floor(ts / FIVE_MIN_MS);

      const rc_z = zScore(entry.request_count, rcStats.mean, rcStats.stddev);
      const er_z = zScore(entry.error_rate, erStats.mean, erStats.stddev);
      const lat_z = zScore(entry.latency_ms, latStats.mean, latStats.stddev);

      const isFlagged = rc_z > zThreshold || er_z > zThreshold || lat_z > zThreshold;
      if (!isFlagged) continue;

      if (!windowMap[windowKey]) {
        windowMap[windowKey] = { entries: [], rc_z: 0, er_z: 0, lat_z: 0 };
      }
      const w = windowMap[windowKey];
      w.entries.push(entry);
      w.rc_z = Math.max(w.rc_z, rc_z);
      w.er_z = Math.max(w.er_z, er_z);
      w.lat_z = Math.max(w.lat_z, lat_z);
    }

    // Merge consecutive windows and produce one Spike per window group
    for (const [_key, window] of Object.entries(windowMap)) {
      const peakEntry = window.entries.reduce((best, e) => {
        const bz = Math.max(
          zScore(best.request_count, rcStats.mean, rcStats.stddev),
          zScore(best.error_rate, erStats.mean, erStats.stddev),
          zScore(best.latency_ms, latStats.mean, latStats.stddev)
        );
        const ez = Math.max(
          zScore(e.request_count, rcStats.mean, rcStats.stddev),
          zScore(e.error_rate, erStats.mean, erStats.stddev),
          zScore(e.latency_ms, latStats.mean, latStats.stddev)
        );
        return ez > bz ? e : best;
      });

      // Determine dominant metric
      const zScores: [SpikeMetric, number][] = [
        ["request_count", window.rc_z],
        ["error_rate", window.er_z],
        ["latency_ms", window.lat_z],
      ];
      zScores.sort((a, b) => b[1] - a[1]);
      const [dominantMetric, dominantZ] = zScores[0];

      const spikeValue =
        dominantMetric === "request_count" ? peakEntry.request_count
        : dominantMetric === "error_rate" ? peakEntry.error_rate
        : peakEntry.latency_ms;

      const baselineMean =
        dominantMetric === "request_count" ? rcStats.mean
        : dominantMetric === "error_rate" ? erStats.mean
        : latStats.mean;

      const baselineStddev =
        dominantMetric === "request_count" ? rcStats.stddev
        : dominantMetric === "error_rate" ? erStats.stddev
        : latStats.stddev;

      // Aggregate spike window values
      const totalRequests = sorted.reduce((s, e) => s + e.request_count, 0);
      const peakRequestCount = Math.max(...window.entries.map(e => e.request_count));
      const peakErrorRate = Math.max(...window.entries.map(e => e.error_rate));
      const peakLatency = Math.max(...window.entries.map(e => e.latency_ms));

      spikes.push({
        spike_id: newId(),
        service_name: serviceName,
        spike_metric: dominantMetric,
        spike_value: spikeValue,
        baseline_mean: baselineMean,
        baseline_stddev: baselineStddev,
        z_score: dominantZ,
        timestamp: peakEntry.timestamp,
        request_count_z: window.rc_z,
        error_rate_z: window.er_z,
        latency_ms_z: window.lat_z,
        spike_request_count: peakRequestCount,
        spike_error_rate: peakErrorRate,
        spike_latency_ms: peakLatency,
        total_request_count: totalRequests,
      });
    }
  }

  return { spikes, warnings };
}
