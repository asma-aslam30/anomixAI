import { NextRequest, NextResponse } from "next/server";
import { advise } from "@/lib/services/remediation-advisor";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const requestId = newId();
  const body = await request.json().catch(() => ({}));
  const spikeId = body?.spike_id as string | undefined;

  if (!spikeId) {
    return NextResponse.json({ detail: "spike_id is required", request_id: requestId }, { status: 400 });
  }

  if (!store.getSpike(spikeId)) {
    return NextResponse.json({ detail: `Spike not found: ${spikeId}`, request_id: requestId }, { status: 404 });
  }

  try {
    const plan = await advise(spikeId);
    return NextResponse.json({ ...plan, request_id: requestId });
  } catch (err) {
    return NextResponse.json({ detail: String(err), request_id: requestId }, { status: 500 });
  }
}
