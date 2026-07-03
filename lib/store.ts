import type {
  LogEntry,
  ClassifiedSpike,
  RCAReport,
  BusinessImpactReport,
  RemediationPlan,
  Alert,
  IpThreatReport,
  LoadBalancerReport,
} from "./types";

class InMemoryStore {
  logEntries: LogEntry[] = [];
  logsByService: Record<string, LogEntry[]> = {};
  spikes: Record<string, ClassifiedSpike> = {};
  rcaReports: Record<string, RCAReport> = {};
  impactReports: Record<string, BusinessImpactReport> = {};
  remediationPlans: Record<string, RemediationPlan> = {};
  alerts: Alert[] = [];
  ipThreatReports: Record<string, IpThreatReport> = {};
  loadBalancerReports: Record<string, LoadBalancerReport> = {};

  reset(): void {
    this.logEntries = [];
    this.logsByService = {};
    this.spikes = {};
    this.rcaReports = {};
    this.impactReports = {};
    this.remediationPlans = {};
    this.alerts = [];
    this.ipThreatReports = {};
    this.loadBalancerReports = {};
  }

  getSpike(spikeId: string): ClassifiedSpike | null {
    return this.spikes[spikeId] ?? null;
  }

  getRca(spikeId: string): RCAReport | null {
    return this.rcaReports[spikeId] ?? null;
  }

  getImpact(spikeId: string): BusinessImpactReport | null {
    return this.impactReports[spikeId] ?? null;
  }

  getPlan(spikeId: string): RemediationPlan | null {
    return this.remediationPlans[spikeId] ?? null;
  }
}

// Module-level singleton that persists across requests in the same Node.js process
const globalForStore = global as unknown as { __sentinelStore: InMemoryStore };
if (!globalForStore.__sentinelStore) {
  globalForStore.__sentinelStore = new InMemoryStore();
}
export const store: InMemoryStore = globalForStore.__sentinelStore;
