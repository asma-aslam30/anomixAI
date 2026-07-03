import { alertEmitter } from "@/lib/services/alert-dispatcher";
import type { Alert } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const onAlert = (alert: Alert) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(alert)}\n\n`));
        } catch {
          // Controller may be closed
        }
      };

      alertEmitter.on("alert", onAlert);

      // Send a heartbeat comment every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on stream close
      (controller as unknown as { close: () => void; signal?: AbortSignal }).signal?.addEventListener?.("abort", () => {
        alertEmitter.off("alert", onAlert);
        clearInterval(heartbeat);
      });
    },
    cancel() {
      // Cleanup handled above
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
