"use client";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const channelIcon: Record<string, string> = {
  email: "✉",
  whatsapp: "💬",
  sms: "📱",
  browser: "🔔",
};

const sevColor: Record<string, string> = {
  "SEV-3": "var(--muted-c)",
  "SEV-2": "var(--yellow)",
  "SEV-1": "var(--orange)",
  CRITICAL: "var(--red)",
};

const sevBg: Record<string, string> = {
  "SEV-3": "rgba(100,116,139,0.1)",
  "SEV-2": "rgba(245,158,11,0.1)",
  "SEV-1": "rgba(249,115,22,0.1)",
  CRITICAL: "rgba(239,68,68,0.12)",
};

export function AlertHistoryPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api.getAlerts().then(({ alerts: existing }) => {
      if (existing.length > 0) setAlerts(existing.slice().reverse());
    }).catch(() => {});

    const es = new EventSource("/api/alerts/stream");
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const alert = JSON.parse(e.data) as Alert;
        setAlerts(prev => [alert, ...prev].slice(0, 50));
      } catch { /* ignore */ }
    };
    return () => { es.close(); esRef.current = null; };
  }, []);

  if (alerts.length === 0) {
    return (
      <p className="text-xs" style={{ color: "var(--muted-c)" }}>
        No alerts dispatched yet — upload logs and analyse to trigger alerts.
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {alerts.map(a => {
        const color = sevColor[a.severity] ?? "var(--muted-c)";
        const bg = sevBg[a.severity] ?? "var(--surface2)";
        return (
          <div
            key={a.alert_id}
            className={cn("shrink-0 animate-fade-in")}
            style={{
              minWidth: "160px",
              borderRadius: "6px",
              padding: "10px 12px",
              background: bg,
              border: `1px solid ${color}40`,
              borderLeft: `3px solid ${color}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ fontSize: "12px" }}>{channelIcon[a.channel] ?? "🔔"}</span>
              <span className="text-xs font-bold uppercase" style={{ color: "var(--text)", letterSpacing: "0.05em" }}>
                {a.channel}
              </span>
              <span
                className="ml-auto text-xs font-bold"
                style={{ color: a.status === "sent" ? "var(--green)" : "var(--red)" }}
              >
                {a.status}
              </span>
            </div>
            <p className="text-xs font-bold uppercase mb-0.5" style={{ color }}>
              {a.severity}
            </p>
            <p className="text-xs" style={{ color: "var(--muted-c)" }}>
              {new Date(a.dispatched_at).toLocaleTimeString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
