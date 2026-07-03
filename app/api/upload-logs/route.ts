import { NextRequest, NextResponse } from "next/server";
import { parseUpload } from "@/lib/services/ingestion";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const requestId = newId();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ detail: "File is empty", request_id: requestId }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ detail: "File size exceeds 10 MB limit", request_id: requestId }, { status: 413 });
    }

    const content = await file.text();
    const { entries, parsedCount, skippedCount } = parseUpload(file.name, content);

    store.reset();
    store.logEntries = entries;
    store.logsByService = {};
    for (const entry of entries) {
      if (!store.logsByService[entry.service_name]) {
        store.logsByService[entry.service_name] = [];
      }
      store.logsByService[entry.service_name].push(entry);
    }

    return NextResponse.json({ parsed_count: parsedCount, skipped_count: skippedCount, log_entries: entries, request_id: requestId });
  } catch (err) {
    return NextResponse.json({ detail: `Parse error: ${String(err)}`, request_id: requestId }, { status: 422 });
  }
}
