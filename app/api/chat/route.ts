import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/services/chat-copilot";
import { newId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const requestId = newId();
  const body = await request.json().catch(() => ({}));
  const message = body?.message as string | undefined;
  const incidentId = body?.incident_id as string | null | undefined;

  if (!message || message.trim() === "") {
    return NextResponse.json({ detail: "Message is required", request_id: requestId }, { status: 400 });
  }

  const response = await chat(message, incidentId);
  return NextResponse.json(response);
}
