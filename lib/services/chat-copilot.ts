import { ChatResponse } from "@/lib/types";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import { generateJSON, isAvailable } from "./gemini-client";

function buildContext(incidentId?: string | null): string {
  if (incidentId) {
    const spike = store.getSpike(incidentId);
    if (!spike) return `No incident found with ID: ${incidentId}`;
    const rca = store.getRca(incidentId);
    const impact = store.getImpact(incidentId);
    const plan = store.getPlan(incidentId);
    return JSON.stringify({ spike, rca, impact, remediation: plan }, null, 2);
  }
  // Summarise all incidents
  const summaries = Object.values(store.spikes).map(s => ({
    spike_id: s.spike_id,
    service: s.service_name,
    classification: s.classification,
    severity: s.severity,
    confidence: s.confidence_score,
    timestamp: s.timestamp,
  }));
  return JSON.stringify({ total_incidents: summaries.length, incidents: summaries }, null, 2);
}

export async function chat(message: string, incidentId?: string | null): Promise<ChatResponse> {
  const fallback: ChatResponse = {
    reply: "AI assistant is temporarily unavailable. Please try again shortly.",
    incident_id: incidentId ?? null,
    request_id: newId(),
  };

  if (!isAvailable()) return fallback;

  const context = buildContext(incidentId);

  const system = `You are SentinelAI Chat, an AI assistant with full context of the current incidents.
Answer concisely and accurately. If asked about a specific incident, use the context provided.

CONTEXT:
${context}`;

  const user = message;

  try {
    // Chat uses free-form text response — we wrap it in a minimal JSON schema
    const raw = await generateJSON<{ reply: string }>(
      system + "\n\nRespond ONLY with JSON: { \"reply\": \"<your answer here>\" }",
      user
    );

    if (!raw?.reply) return fallback;

    return {
      reply: raw.reply,
      incident_id: incidentId ?? null,
      request_id: newId(),
    };
  } catch {
    return fallback;
  }
}
