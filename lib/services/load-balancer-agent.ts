import { ClassifiedSpike, LoadBalancerReport, ClusterRecommendation } from "@/lib/types";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import { generateJSON, isAvailable } from "./gemini-client";

const BYKEA_CLUSTERS = [
  { id: "pk-khi-01", region: "Karachi, PK", current_load: 65 },
  { id: "pk-lhr-01", region: "Lahore, PK", current_load: 45 },
  { id: "pk-isl-01", region: "Islamabad, PK", current_load: 30 },
  { id: "uae-dxb-01", region: "Dubai, UAE", current_load: 20 },
];

function getFallbackReport(spike: ClassifiedSpike, currentTpm: number, projectedTpm: number): LoadBalancerReport {
  const recommendations: ClusterRecommendation[] = BYKEA_CLUSTERS.map(c => ({
    cluster_id: c.id,
    region: c.region,
    current_load_pct: c.current_load,
    recommended_load_pct: spike.classification === "POSITIVE_SPIKE"
      ? Math.min(80, c.current_load + Math.floor((100 - c.current_load) * 0.3))
      : (c.id === "pk-khi-01" ? 30 : Math.min(75, c.current_load + 15)),
    action: c.current_load > 70 ? "scale_out" : c.current_load < 30 ? "scale_up" : "maintain",
  }));

  const actions = spike.classification === "POSITIVE_SPIKE"
    ? [
        `Scale out ${spike.service_name} by 3 instances in pk-khi-01`,
        "Enable auto-scaling policy: trigger at 70% CPU",
        "Increase connection pool from 100 to 300",
        "Enable Redis caching for driver location queries",
      ]
    : [
        `Reroute ${spike.service_name} traffic from pk-khi-01 to pk-lhr-01`,
        "Activate circuit breaker on affected endpoints",
        "Deploy emergency pod scaling (+2 replicas)",
      ];

  return {
    report_id: newId(),
    spike_id: spike.spike_id,
    current_tpm: currentTpm,
    projected_tpm: projectedTpm,
    cluster_recommendations: recommendations,
    auto_scaling_actions: actions,
    estimated_capacity_needed: `${Math.ceil(projectedTpm / 500)} server instances`,
    lb_summary: spike.classification === "POSITIVE_SPIKE"
      ? `Traffic surge detected on ${spike.service_name}. Recommend distributing load across ${BYKEA_CLUSTERS.length} clusters and scaling out by 3 instances to handle ${projectedTpm} projected TPM.`
      : `Service degradation on ${spike.service_name}. Recommending traffic redistribution to healthy clusters.`,
  };
}

export async function runLoadBalancerAgent(spike: ClassifiedSpike): Promise<{ result: LoadBalancerReport; trace: { status: "success" | "fallback" | "error"; summary: string } }> {
  // Only relevant for POSITIVE_SPIKE (legitimate traffic growth needs scaling)
  // Also run for NEGATIVE_SPIKE to redistribute load away from failing service
  const currentTpm = spike.spike_request_count;
  const projectedTpm = Math.round(currentTpm * 1.3); // 30% growth buffer

  if (!isAvailable()) {
    const result = getFallbackReport(spike, currentTpm, projectedTpm);
    store.loadBalancerReports[spike.spike_id] = result;
    return { result, trace: { status: "fallback", summary: `Rule-based: ${result.auto_scaling_actions.length} scaling actions recommended` } };
  }

  try {
    const system = `You are Anomix Load Balancer Intelligence for Bykea, Pakistan's ride-hailing platform.
Respond ONLY with JSON:
{
  "cluster_recommendations": [{"cluster_id":"<id>","recommended_load_pct":<0-100>,"action":"scale_out|scale_up|maintain|reduce","rationale":"<string>"},...],
  "auto_scaling_actions": ["<string>",...],
  "estimated_capacity_needed": "<string>",
  "lb_summary": "<string max 250 chars>"
}`;

    const user = `Analyze load distribution for Bykea ${spike.service_name} experiencing ${spike.classification}.

Current TPM: ${currentTpm} | Projected TPM: ${projectedTpm}
Spike Z-score: ${spike.z_score.toFixed(2)}

Available clusters:
${BYKEA_CLUSTERS.map(c => `- ${c.id} (${c.region}): ${c.current_load}% load`).join("\n")}

Provide optimal traffic distribution, auto-scaling actions, and capacity estimates for Bykea's Pakistan operations.`;

    const raw = await generateJSON<{
      cluster_recommendations: { cluster_id: string; recommended_load_pct: number; action: string; rationale: string }[];
      auto_scaling_actions: string[];
      estimated_capacity_needed: string;
      lb_summary: string;
    }>(system, user);

    if (!raw?.cluster_recommendations) throw new Error("Invalid response");

    const recommendations: ClusterRecommendation[] = raw.cluster_recommendations.map(r => {
      const cluster = BYKEA_CLUSTERS.find(c => c.id === r.cluster_id) ?? BYKEA_CLUSTERS[0];
      return {
        cluster_id: r.cluster_id,
        region: cluster.region,
        current_load_pct: cluster.current_load,
        recommended_load_pct: Math.min(100, Math.max(0, r.recommended_load_pct)),
        action: (["scale_out", "scale_up", "maintain", "reduce"].includes(r.action) ? r.action : "maintain") as ClusterRecommendation["action"],
      };
    });

    const result: LoadBalancerReport = {
      report_id: newId(), spike_id: spike.spike_id,
      current_tpm: currentTpm, projected_tpm: projectedTpm,
      cluster_recommendations: recommendations,
      auto_scaling_actions: Array.isArray(raw.auto_scaling_actions) ? raw.auto_scaling_actions : [],
      estimated_capacity_needed: raw.estimated_capacity_needed ?? `${Math.ceil(projectedTpm / 500)} instances`,
      lb_summary: raw.lb_summary?.slice(0, 250) ?? "Load balancer analysis complete.",
    };

    store.loadBalancerReports[spike.spike_id] = result;
    return { result, trace: { status: "success", summary: `AI: ${recommendations.length} cluster optimizations, ${result.auto_scaling_actions.length} scaling actions` } };
  } catch (e) {
    console.error("[LoadBalancerAgent] Error:", e);
    const result = getFallbackReport(spike, currentTpm, projectedTpm);
    store.loadBalancerReports[spike.spike_id] = result;
    return { result, trace: { status: "fallback", summary: "API error — rule-based fallback used" } };
  }
}
