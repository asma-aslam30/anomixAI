import { RemediationPlan, ClassifiedSpike, RCAReport, BusinessImpactReport } from "@/lib/types";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import { generateJSON, isAvailable } from "./gemini-client";
import { analyze } from "./rca-engine";
import { calculate } from "./impact-calculator";

function buildPrompt(
  spike: ClassifiedSpike,
  rca: RCAReport,
  impact: BusinessImpactReport
): { system: string; user: string } {
  const system = `You are Anomix, an expert incident response advisor.
Respond ONLY with a valid JSON object matching this schema:
{
  "immediate_actions": ["<string>", ...],
  "short_term_actions": ["<string>", ...],
  "long_term_actions": ["<string>", ...]
}
immediate_actions: executable within 5 minutes.
short_term_actions: executable within 24 hours.
long_term_actions: architectural improvements.`;

  const user = `Generate a remediation plan for the following incident.

Service: ${spike.service_name}
Classification: ${spike.classification}
Root Cause: ${rca.root_cause_summary}
Correlated Anomalies: ${rca.correlated_anomalies.join(", ") || "none"}
Business Impact: ${impact.users_affected_pct}% users affected,
  ${impact.estimated_downtime_minutes} min downtime,
  PKR ${impact.revenue_loss_pkr.toLocaleString()} estimated revenue loss.

Rules:
- For NEGATIVE_SPIKE: immediate_actions MUST include at least one of: rollback, restart, IP block.
- For SUSPICIOUS_SPIKE: immediate_actions MUST include rate limiting or IP blocking.
- For POSITIVE_SPIKE: immediate_actions MUST be empty; focus on scaling suggestions.`;

  return { system, user };
}

function fallbackPlan(spike: ClassifiedSpike): RemediationPlan {
  const classification = spike.classification;
  let immediate: string[] = [];
  let shortTerm: string[] = [];
  const longTerm = [
    "Implement circuit breakers for downstream dependencies",
    "Add distributed tracing for better observability",
    "Review and update runbook for this service",
  ];

  if (classification === "NEGATIVE_SPIKE") {
    immediate = ["Rollback latest deployment", "Restart affected service pods", "Block suspicious source IPs"];
    shortTerm = ["Scale out service horizontally", "Increase connection pool size", "Add health check alerts"];
  } else if (classification === "SUSPICIOUS_SPIKE") {
    immediate = ["Enable rate limiting on affected endpoints", "Block offending IP ranges via WAF"];
    shortTerm = ["Review authentication logs", "Implement CAPTCHA for suspicious traffic patterns"];
  } else {
    immediate = [];
    shortTerm = ["Scale out service horizontally", "Review autoscaling thresholds", "Pre-warm caches"];
  }

  return {
    plan_id: newId(),
    spike_id: spike.spike_id,
    immediate_actions: immediate,
    short_term_actions: shortTerm,
    long_term_actions: longTerm,
  };
}

export async function advise(spikeId: string): Promise<RemediationPlan> {
  const spike = store.getSpike(spikeId);
  if (!spike) throw new Error(`Spike not found: ${spikeId}`);

  // Auto-run prerequisites if missing
  let rca = store.getRca(spikeId);
  if (!rca) rca = await analyze(spikeId);

  let impact = store.getImpact(spikeId);
  if (!impact) impact = calculate(spikeId);

  if (!isAvailable()) {
    const plan = fallbackPlan(spike);
    store.remediationPlans[spikeId] = plan;
    return plan;
  }

  try {
    const { system, user } = buildPrompt(spike, rca, impact);
    const raw = await generateJSON<{ immediate_actions: string[]; short_term_actions: string[]; long_term_actions: string[] }>(system, user);

    if (!raw) {
      const plan = fallbackPlan(spike);
      store.remediationPlans[spikeId] = plan;
      return plan;
    }

    const plan: RemediationPlan = {
      plan_id: newId(),
      spike_id: spikeId,
      immediate_actions: Array.isArray(raw.immediate_actions) ? raw.immediate_actions : [],
      short_term_actions: Array.isArray(raw.short_term_actions) ? raw.short_term_actions : [],
      long_term_actions: Array.isArray(raw.long_term_actions) ? raw.long_term_actions : [],
    };

    // Enforce: POSITIVE_SPIKE must have empty immediate_actions
    if (spike.classification === "POSITIVE_SPIKE") {
      plan.immediate_actions = [];
    }

    store.remediationPlans[spikeId] = plan;
    return plan;
  } catch {
    const plan = fallbackPlan(spike);
    store.remediationPlans[spikeId] = plan;
    return plan;
  }
}
