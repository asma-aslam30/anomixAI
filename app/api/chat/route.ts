import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/services/chat-copilot";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import type { ClassifiedSpike, RCAReport, BusinessImpactReport, RemediationPlan } from "@/lib/types";

export async function POST(request: NextRequest) {
  const requestId = newId();
  const body = await request.json().catch(() => ({}));
  const message = body?.message as string | undefined;
  const incidentId = body?.incident_id as string | null | undefined;

  // Accept spike context directly (for serverless compat)
  const spike = body?.spike as ClassifiedSpike | undefined;
  const rca = body?.rca as RCAReport | undefined;
  const impact = body?.impact as BusinessImpactReport | undefined;
  const plan = body?.plan as RemediationPlan | undefined;

  if (!message || message.trim() === "") {
    return NextResponse.json({ detail: "Message is required", request_id: requestId }, { status: 400 });
  }

  // Register context in store if provided (handles serverless cold starts)
  if (incidentId && spike && !store.getSpike(incidentId)) {
    store.spikes[incidentId] = spike;
    if (rca) store.rcaReports[incidentId] = rca;
    if (impact) store.impactReports[incidentId] = impact;
    if (plan) store.remediationPlans[incidentId] = plan;
  }

  const response = await chat(message, incidentId);
  return NextResponse.json(response);
}
