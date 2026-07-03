import { ClassifiedSpike, OrchestrationResult, AgentTraceEntry, CorrelationReport, ThreatIntelReport } from "@/lib/types";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import { analyze } from "./rca-engine";
import { calculate } from "./impact-calculator";
import { advise } from "./remediation-advisor";
import { generateJSON, isAvailable } from "./gemini-client";
import { dispatch } from "./alert-dispatcher";
import { runIpThreatAgent } from "./ip-threat-agent";
import { runLoadBalancerAgent } from "./load-balancer-agent";

function traceEntry(name: string, started: number, status: AgentTraceEntry["status"], summary: string): AgentTraceEntry {
  return { agent_name: name, started_at: new Date(started).toISOString(), completed_at: new Date().toISOString(), status, output_summary: summary };
}

async function runCorrelationAgent(spike: ClassifiedSpike): Promise<{ result: CorrelationReport; trace: AgentTraceEntry }> {
  const t = Date.now();
  const allIncidents = Object.values(store.spikes);
  if (!isAvailable() || allIncidents.length < 2) {
    return { result: { correlation_id: newId(), spike_ids: [spike.spike_id], pattern: "no_correlation", dependency_chain: [], confidence: 0 }, trace: traceEntry("correlation_agent", t, "fallback", "Skipped — insufficient incidents or Gemini unavailable") };
  }
  try {
    const system = `You are Anomix, an expert in distributed failure analysis. Respond ONLY with JSON: {"pattern":"<string>","dependency_chain":["<service>",...],"confidence":<int 0-100>}`;
    const user = `Analyze these ${allIncidents.length} concurrent incidents for cascading patterns:\n${JSON.stringify(allIncidents.map(i => ({ service: i.service_name, classification: i.classification, z_score: i.z_score, timestamp: i.timestamp })), null, 2)}\nTarget: ${spike.service_name} (${spike.classification}) at ${spike.timestamp}`;
    const raw = await generateJSON<{ pattern: string; dependency_chain: string[]; confidence: number }>(system, user);
    if (!raw) throw new Error("null response");
    const result: CorrelationReport = { correlation_id: newId(), spike_ids: allIncidents.map(i => i.spike_id), pattern: raw.pattern ?? "no_correlation", dependency_chain: Array.isArray(raw.dependency_chain) ? raw.dependency_chain : [], confidence: Math.min(100, Math.max(0, raw.confidence ?? 0)) };
    return { result, trace: traceEntry("correlation_agent", t, "success", `Pattern: ${result.pattern} (${result.confidence}% confidence)`) };
  } catch {
    return { result: { correlation_id: newId(), spike_ids: [spike.spike_id], pattern: "no_correlation", dependency_chain: [], confidence: 0 }, trace: traceEntry("correlation_agent", t, "fallback", "Correlation analysis failed — using fallback") };
  }
}

async function runThreatIntelAgent(spike: ClassifiedSpike): Promise<{ result: ThreatIntelReport | null; trace: AgentTraceEntry }> {
  const t = Date.now();
  if (spike.classification !== "SUSPICIOUS_SPIKE") {
    return { result: null, trace: traceEntry("threat_intel_agent", t, "success", "Skipped — not a SUSPICIOUS_SPIKE") };
  }
  if (!isAvailable()) {
    return { result: { threat_id: newId(), spike_id: spike.spike_id, attack_type: "unknown", threat_confidence: 0, countermeasures: ["Enable rate limiting"], indicators: [] }, trace: traceEntry("threat_intel_agent", t, "fallback", "Gemini unavailable — returning generic threat intel") };
  }
  try {
    const system = `You are a cybersecurity threat intelligence analyst. Respond ONLY with JSON: {"attack_type":"<DDoS|credential_stuffing|scraping|brute_force|api_abuse|unknown>","threat_confidence":<int 0-100>,"countermeasures":["<string>",...],"indicators":["<string>",...]}`;
    const user = `Analyze SUSPICIOUS_SPIKE on ${spike.service_name}: request_count_z=${spike.request_count_z.toFixed(2)}, error_rate=${spike.spike_error_rate.toFixed(3)}, reason="${spike.classification_reason}"`;
    const raw = await generateJSON<{ attack_type: string; threat_confidence: number; countermeasures: string[]; indicators: string[] }>(system, user);
    if (!raw) throw new Error("null response");
    const result: ThreatIntelReport = { threat_id: newId(), spike_id: spike.spike_id, attack_type: raw.attack_type ?? "unknown", threat_confidence: Math.min(100, Math.max(0, raw.threat_confidence ?? 0)), countermeasures: Array.isArray(raw.countermeasures) ? raw.countermeasures : [], indicators: Array.isArray(raw.indicators) ? raw.indicators : [] };
    return { result, trace: traceEntry("threat_intel_agent", t, "success", `Attack type: ${result.attack_type} (${result.threat_confidence}% confidence)`) };
  } catch {
    return { result: { threat_id: newId(), spike_id: spike.spike_id, attack_type: "unknown", threat_confidence: 0, countermeasures: ["Enable rate limiting", "Block suspicious IPs"], indicators: [] }, trace: traceEntry("threat_intel_agent", t, "fallback", "Threat intel failed — using fallback") };
  }
}

async function runSummaryAgent(spike: ClassifiedSpike, result: Omit<OrchestrationResult, "summary" | "agent_trace" | "total_duration_ms">): Promise<{ summary: string; trace: AgentTraceEntry }> {
  const t = Date.now();
  if (!isAvailable()) {
    const summary = `${spike.classification} detected on ${spike.service_name} at ${spike.timestamp}. Confidence: ${spike.confidence_score}%. Severity: ${spike.severity}. ${result.rca?.root_cause_summary ?? "No RCA available."}`;
    return { summary, trace: traceEntry("summary_agent", t, "fallback", "Generated rule-based summary") };
  }
  try {
    const system = `You are Anomix incident commander. Write a concise executive summary (max 300 words) in plain text. Do NOT output JSON.`;
    const user = `Summarize this incident:\nService: ${spike.service_name}\nClassification: ${spike.classification} (${spike.severity})\nRCA: ${result.rca?.root_cause_summary ?? "N/A"}\nImpact: ${result.impact?.users_affected_pct ?? 0}% users, ${result.impact?.estimated_downtime_minutes ?? 0} min downtime, PKR ${result.impact?.revenue_loss_pkr?.toLocaleString() ?? 0}\nImmediate actions: ${result.remediation?.immediate_actions?.join(", ") ?? "none"}\nIP Threats: ${(result as { ip_threat?: { threat_summary?: string } }).ip_threat?.threat_summary ?? "N/A"}\nLoad Balancer: ${(result as { load_balancer?: { lb_summary?: string } }).load_balancer?.lb_summary ?? "N/A"}`;
    const raw = await generateJSON<{ reply: string }>(system + '\n\nRespond as JSON: {"reply":"<summary>"}', user);
    const summary = raw?.reply ?? `${spike.classification} on ${spike.service_name}. ${result.rca?.root_cause_summary ?? ""}`;
    return { summary, trace: traceEntry("summary_agent", t, "success", "Executive summary generated") };
  } catch {
    const summary = `${spike.classification} detected on ${spike.service_name}. ${result.rca?.root_cause_summary ?? ""}`;
    return { summary, trace: traceEntry("summary_agent", t, "fallback", "Summary generation failed — using fallback") };
  }
}

// Small delay between Gemini calls to avoid rate limiting on free tier
function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

export async function orchestrate(spikeId: string): Promise<OrchestrationResult> {
  const spike = store.getSpike(spikeId);
  if (!spike) throw new Error(`Spike not found: ${spikeId}`);

  const startTime = Date.now();
  const traces: AgentTraceEntry[] = [];

  // Step 1: RCA (sequential)
  const t1 = Date.now();
  const rca = await analyze(spikeId).catch(() => null);
  traces.push(traceEntry("rca_agent", t1, rca?.confidence_score ? "success" : "fallback", rca ? `RCA confidence: ${rca.confidence_score}%` : "RCA fallback used"));
  await sleep(500);

  // Step 2: Impact (no Gemini, instant) + Correlation (Gemini) — sequential to avoid 429
  const t2Impact = Date.now();
  let impactResult = null;
  try {
    impactResult = calculate(spikeId);
    traces.push(traceEntry("impact_agent", t2Impact, "success", `Revenue loss: PKR ${impactResult.revenue_loss_pkr.toLocaleString()}`));
  } catch {
    traces.push(traceEntry("impact_agent", t2Impact, "fallback", "Impact calculation failed"));
  }

  const { result: correlationResult, trace: corrTrace } = await runCorrelationAgent(spike);
  traces.push(corrTrace);
  await sleep(500);

  // Step 3: Remediation (sequential)
  const t3 = Date.now();
  const remediation = await advise(spikeId).catch(() => null);
  traces.push(traceEntry("remediation_agent", t3, remediation ? "success" : "fallback", remediation ? `${remediation.immediate_actions.length} immediate actions` : "Remediation fallback used"));
  await sleep(500);

  // Step 4: Threat Intel (conditional — Gemini only for SUSPICIOUS)
  const { result: threatIntel, trace: threatTrace } = await runThreatIntelAgent(spike);
  traces.push(threatTrace);
  if (spike.classification === "SUSPICIOUS_SPIKE") await sleep(500);

  // Step 4b: IP Threat (sequential, not concurrent — avoids rate limit)
  const tIp = Date.now();
  const { result: ipThreatResult, trace: ipTrace } = await runIpThreatAgent(spike);
  traces.push(traceEntry("ip_threat_agent", tIp, ipTrace.status, ipTrace.summary));
  await sleep(300);

  // Load Balancer (no Gemini needed if fallback, always fast)
  const tLb = Date.now();
  const { result: lbResult, trace: lbTrace } = await runLoadBalancerAgent(spike);
  traces.push(traceEntry("load_balancer_agent", tLb, lbTrace.status, lbTrace.summary));
  await sleep(300);

  // Step 5: Summary (sequential)
  const partialResult = { spike_id: spikeId, rca, impact: impactResult, remediation, correlation: correlationResult, threat_intel: threatIntel, ip_threat: ipThreatResult, load_balancer: lbResult };
  const { summary, trace: summaryTrace } = await runSummaryAgent(spike, partialResult);
  traces.push(summaryTrace);

  // Step 6: Alerts
  if (spike.severity === "SEV-1" || spike.severity === "CRITICAL") {
    await dispatch(spike).catch(() => {});
  }

  return { ...partialResult, summary, agent_trace: traces, total_duration_ms: Date.now() - startTime };
}
