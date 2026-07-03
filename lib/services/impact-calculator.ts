import { BusinessImpactReport, ClassifiedSpike, LogEntry } from "@/lib/types";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";

export function computeUsersAffected(spike: ClassifiedSpike): number {
  if (spike.classification !== "NEGATIVE_SPIKE") return 0;
  return Math.round(spike.spike_error_rate * 100 * 100) / 100;
}

export function computeDowntime(entries: LogEntry[], spike: ClassifiedSpike): number {
  if (spike.classification !== "NEGATIVE_SPIKE") return 0;
  const spikeTs = new Date(spike.timestamp).getTime();
  const windowMs = 30 * 60 * 1000; // 30-min window around spike
  const windowEntries = entries.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return Math.abs(t - spikeTs) <= windowMs && e.error_rate > 0.1;
  });
  if (windowEntries.length === 0) return 1;
  const times = windowEntries.map(e => new Date(e.timestamp).getTime());
  const first = Math.min(...times);
  const last = Math.max(...times);
  return Math.max(1, Math.round((last - first) / 60000));
}

export function computeRevenueLoss(downtimeMinutes: number): number {
  if (downtimeMinutes === 0) return 0;
  return downtimeMinutes * Number(process.env.REVENUE_PER_MINUTE_PKR ?? 50000);
}

export function calculate(spikeId: string): BusinessImpactReport {
  const spike = store.getSpike(spikeId);
  if (!spike) throw new Error(`Spike not found: ${spikeId}`);

  const entries = store.logsByService[spike.service_name] ?? [];
  const usersAffectedPct = computeUsersAffected(spike);
  const downtimeMinutes = computeDowntime(entries, spike);
  const revenueLoss = computeRevenueLoss(downtimeMinutes);

  const notes =
    spike.classification !== "NEGATIVE_SPIKE"
      ? "Impact estimation applies only to NEGATIVE_SPIKE incidents."
      : "";

  const report: BusinessImpactReport = {
    impact_id: newId(),
    spike_id: spikeId,
    users_affected_pct: usersAffectedPct,
    estimated_downtime_minutes: downtimeMinutes,
    revenue_loss_pkr: revenueLoss,
    notes,
  };

  store.impactReports[spikeId] = report;
  return report;
}
