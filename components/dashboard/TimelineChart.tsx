"use client";
import { ClassifiedSpike, LogEntry } from "@/lib/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

interface Props {
  spike: ClassifiedSpike | null;
  logEntries?: LogEntry[];
}

/* Custom dark tooltip */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border2)",
        borderRadius: "6px",
        padding: "8px 12px",
        fontSize: "11px",
        color: "var(--text)",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <p style={{ color: "var(--muted-c)", marginBottom: "4px" }}>{label}</p>
      {payload.map((p: { name: string; color: string; value: number }) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span style={{ color: "var(--text)" }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function TimelineChart({ spike, logEntries = [] }: Props) {
  if (!spike) return null;

  const data = logEntries
    .filter((e) => e.service_name === spike.service_name)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((e) => ({
      t: new Date(e.timestamp).toLocaleTimeString(),
      rc: e.request_count,
      er: Math.round(e.error_rate * 1000) / 10,
      lat: e.latency_ms,
    }));

  const spikeTime = new Date(spike.timestamp).toLocaleTimeString();

  const refColor =
    spike.classification === "NEGATIVE_SPIKE"   ? "#ef4444" :
    spike.classification === "SUSPICIOUS_SPIKE" ? "#f59e0b" : "#10b981";

  if (data.length === 0) {
    return (
      <div
        className="rounded-lg flex items-center justify-center text-xs"
        style={{
          height: "160px",
          background: "var(--surface)",
          border: "1px dashed var(--border2)",
          color: "var(--muted-c)",
        }}
      >
        No time-series data for <strong style={{ color: "var(--text)", marginLeft: "4px" }}>{spike.service_name}</strong>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg"
      style={{ background: "var(--surface)", border: "1px solid var(--border2)", padding: "12px" }}
    >
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--muted-c)" }}>
        Error rate — {spike.service_name}
      </p>
      <div style={{ height: "160px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
            <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#64748b", fontFamily: "'JetBrains Mono', monospace" }} />
            <YAxis tick={{ fontSize: 9, fill: "#64748b", fontFamily: "'JetBrains Mono', monospace" }} />
            <Tooltip content={<DarkTooltip />} />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}
            />
            <ReferenceLine
              x={spikeTime}
              stroke={refColor}
              strokeDasharray="4 2"
              label={{ value: "⚡ Spike", fontSize: 9, fill: refColor }}
            />
            <Line type="monotone" dataKey="rc"  stroke="#00d4ff" dot={false} strokeWidth={1.5} name="Requests" />
            <Line type="monotone" dataKey="er"  stroke="#ef4444" dot={false} strokeWidth={1.5} name="Error %" />
            <Line type="monotone" dataKey="lat" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Latency ms" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
