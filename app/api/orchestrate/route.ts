import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "@/lib/services/orchestrator";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import type { ClassifiedSpike } from "@/lib/types";

export async function POST(req: NextRequest) {
  const requestId = newId();
  try {
    const body = await req.json();
    const spikeId = body?.spike_id;
    const spike = body?.spike as ClassifiedSpike | undefined;
    if (!spikeId) return NextResponse.json({ detail: "spike_id is required", request_id: requestId }, { status: 400 });

    // Register spike in store if provided (handles serverless cold starts)
    if (!store.getSpike(spikeId) && spike) {
      store.spikes[spikeId] = spike;
    }

    if (!store.getSpike(spikeId)) return NextResponse.json({ detail: `Spike not found: ${spikeId}`, request_id: requestId }, { status: 404 });
    const result = await orchestrate(spikeId);
    return NextResponse.json({ ...result, request_id: requestId });
  } catch (err) {
    return NextResponse.json({ detail: String(err), request_id: requestId }, { status: 500 });
  }
}
