import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";

// Returns parsed log entries from the in-memory store
export async function GET() {
  return NextResponse.json({
    log_entries: store.logEntries,
    request_id: newId(),
  });
}
