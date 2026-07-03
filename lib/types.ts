export type SpikeClassification = "POSITIVE_SPIKE" | "NEGATIVE_SPIKE" | "SUSPICIOUS_SPIKE";
export type SeverityLevel = "SEV-3" | "SEV-2" | "SEV-1" | "CRITICAL";
export type SpikeMetric = "request_count" | "error_rate" | "latency_ms";
export type AlertChannel = "email" | "whatsapp" | "sms" | "browser";
export type AlertStatus = "sent" | "failed";

export interface LogEntry {
  id: string;
  timestamp: string;
  service_name: string;
  request_count: number;
  error_rate: number;
  latency_ms: number;
  status_codes: Record<string, number>;
}

export interface Spike {
  spike_id: string;
  service_name: string;
  spike_metric: SpikeMetric;
  spike_value: number;
  baseline_mean: number;
  baseline_stddev: number;
  z_score: number;
  timestamp: string;
  // per-metric Z-scores stored here for classifier use
  request_count_z: number;
  error_rate_z: number;
  latency_ms_z: number;
  // raw values during spike window
  spike_request_count: number;
  spike_error_rate: number;
  spike_latency_ms: number;
  total_request_count: number;
}

export interface ClassifiedSpike extends Spike {
  classification: SpikeClassification;
  confidence_score: number;
  classification_reason: string;
  severity: SeverityLevel | null;
}

export interface RCAReport {
  rca_id: string;
  spike_id: string;
  root_cause_summary: string;
  correlated_anomalies: string[];
  confidence_score: number;
}

export interface BusinessImpactReport {
  impact_id: string;
  spike_id: string;
  users_affected_pct: number;
  estimated_downtime_minutes: number;
  revenue_loss_pkr: number;
  notes: string;
}

export interface RemediationPlan {
  plan_id: string;
  spike_id: string;
  immediate_actions: string[];
  short_term_actions: string[];
  long_term_actions: string[];
}

export interface Alert {
  alert_id: string;
  incident_id: string;
  channel: AlertChannel;
  severity: SeverityLevel;
  dispatched_at: string;
  status: AlertStatus;
}

export interface ChatRequest {
  message: string;
  incident_id?: string | null;
}

export interface ChatResponse {
  reply: string;
  incident_id: string | null;
  request_id: string;
}

export interface UploadResponse {
  parsed_count: number;
  skipped_count: number;
  log_entries?: LogEntry[];
  request_id: string;
}

export interface AnalyzeResponse {
  incidents: ClassifiedSpike[];
  warnings: string[];
  request_id: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  request_id: string;
}

// Multi-agent orchestration types
export interface AgentTraceEntry {
  agent_name: string;
  started_at: string;
  completed_at: string;
  status: "success" | "fallback" | "error";
  output_summary: string;
}

export interface CorrelationReport {
  correlation_id: string;
  spike_ids: string[];
  pattern: string;
  dependency_chain: string[];
  confidence: number;
}

export interface ThreatIntelReport {
  threat_id: string;
  spike_id: string;
  attack_type: string;
  threat_confidence: number;
  countermeasures: string[];
  indicators: string[];
}

export interface OrchestrationResult {
  spike_id: string;
  rca: RCAReport | null;
  impact: BusinessImpactReport | null;
  remediation: RemediationPlan | null;
  correlation: CorrelationReport | null;
  threat_intel: ThreatIntelReport | null;
  ip_threat?: IpThreatReport | null;
  load_balancer?: LoadBalancerReport | null;
  system_health?: SystemHealthMetrics[] | null;
  summary: string | null;
  agent_trace: AgentTraceEntry[];
  total_duration_ms: number;
}

// IP Threat Intelligence
export interface IpThreatEntry {
  ip: string;
  country: string;
  region: string;
  classification: "malicious" | "suspicious" | "safe";
  confidence: number;
  request_count: number;
  threat_type?: string;
}

export interface IpThreatReport {
  report_id: string;
  spike_id: string;
  total_ips_analyzed: number;
  malicious_ips: IpThreatEntry[];
  suspicious_ips: IpThreatEntry[];
  safe_ips: IpThreatEntry[];
  top_countries: { country: string; count: number; flag: string }[];
  block_recommendations: string[];
  threat_summary: string;
}

// Load Balancer Recommendation
export interface ClusterRecommendation {
  cluster_id: string;
  region: string;
  current_load_pct: number;
  recommended_load_pct: number;
  action: "scale_out" | "scale_up" | "maintain" | "reduce";
}

export interface LoadBalancerReport {
  report_id: string;
  spike_id: string;
  current_tpm: number;
  projected_tpm: number;
  cluster_recommendations: ClusterRecommendation[];
  auto_scaling_actions: string[];
  estimated_capacity_needed: string;
  lb_summary: string;
}

// System Health
export interface SystemHealthMetrics {
  service_name: string;
  cpu_pct: number;
  memory_pct: number;
  error_rate_pct: number;
  avg_latency_ms: number;
  p99_latency_ms: number;
  health_status: "healthy" | "degraded" | "critical";
}
