import { NextRequest, NextResponse } from "next/server";
import { detect } from "@/lib/services/spike-detector";
import { classify } from "@/lib/services/spike-classifier";
import { dispatch } from "@/lib/services/alert-dispatcher";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import type { LogEntry } from "@/lib/types";

export async function POST(request: NextRequest) {
  const requestId = newId();
  const body = await request.json().catch(() => ({}));
  const logEntries = (body?.log_entries as LogEntry[] | undefined) ?? store.logEntries;

  if (logEntries.length === 0) {
    return NextResponse.json({ incidents: [], warnings: ["No log entries found. Please upload logs first."], request_id: requestId });
  }

  const { spikes, warnings } = detect(logEntries, Number(process.env.Z_SCORE_THRESHOLD ?? 2.0));

  if (spikes.length === 0) {
    return NextResponse.json({ incidents: [], warnings: [...warnings, "No spikes detected."], request_id: requestId });
  }

  const incidents = spikes.map(spike => classify(spike, logEntries));

  // Auto-dispatch alerts for SEV-1 and CRITICAL incidents
  for (const incident of incidents) {
    if (incident.severity === "SEV-1" || incident.severity === "CRITICAL") {
      await dispatch(incident);
    }
  }

  return NextResponse.json({ incidents, warnings, request_id: requestId });
}
