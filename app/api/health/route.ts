import { NextResponse } from "next/server";
import { newId } from "@/lib/utils";

export async function GET() {
  return NextResponse.json({ status: "ok", version: "1.0.0", request_id: newId() });
}
