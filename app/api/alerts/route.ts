import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";

// Returns all alerts already in the store (for seeding the UI on load)
export async function GET() {
  return NextResponse.json({
    alerts: store.alerts,
    request_id: newId(),
  });
}
