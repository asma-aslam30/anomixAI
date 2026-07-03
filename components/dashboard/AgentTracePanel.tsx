"use client";
import { AgentTraceEntry, OrchestrationResult } from "@/lib/types";

const statusStyles: Record<AgentTraceEntry["status"], { color: string; bg: string; label: string }> = {
  success:  { color: "#10b981", bg: "rgba(16,185,129,0.12)",  label: "success"  },
  fallback: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "fallback" },
  error:    { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   label: "error"    },
};

function TraceRow({ entry, index }: { entry: AgentTraceEntry; index: number }) {
  const ms = new Date(entry.completed_at).getTime() - new Date(entry.started_at).getTime();
  const s = statusStyles[entry.status];

  return (
    <div
      className="flex items-start gap-3 animate-fade-in"
      style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}
    >
      {/* Step number + connector */}
      <div className="flex flex-col items-center shrink-0" style={{ width: "20px" }}>
        <span className="text-xs font-bold" style={{ color: "var(--muted-c)" }}>{index + 1}</span>
      </div>

      {/* Dot */}
      <div
        className="mt-1 shrink-0 w-2 h-2 rounded-full"
        style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold capitalize" style={{ color: "var(--text)" }}>
            {entry.agent_name.replace(/_/g, " ")}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-xs font-bold uppercase"
            style={{ background: s.bg, color: s.color, fontSize: "9px", letterSpacing: "0.05em" }}
          >
            {s.label}
          </span>
          <span className="ml-auto text-xs font-mono shrink-0" style={{ color: "var(--muted-c)" }}>
            {ms}ms
          </span>
        </div>
        <p className="text-xs truncate" style={{ color: "var(--muted-c)" }}>
          {entry.output_summary}
        </p>
      </div>
    </div>
  );
}

interface Props {
  result: OrchestrationResult | null;
  loading?: boolean;
}

export function AgentTracePanel({ result, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>🤖 Agent Execution Trace</span>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded animate-pulse h-8" style={{ background: "var(--surface2)" }} />
          ))}
        </div>
      </div>
    );
  }
  if (!result) return (
    <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>
          🤖 Agent Execution Trace
        </span>
      </div>
      <div className="flex items-center justify-center" style={{ minHeight: "60px", color: "var(--muted-c)", fontSize: "11px" }}>
        <span>Awaiting agent trace — select an incident with analysis results</span>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>
          🤖 Agent Execution Trace
        </span>
        <span className="text-xs font-mono" style={{ color: "var(--cyan)" }}>
          {result.total_duration_ms}ms total
        </span>
      </div>

      <div className="p-4 space-y-3">
        {result.agent_trace.map((t, i) => (
          <TraceRow key={i} entry={t} index={i} />
        ))}
      </div>

      {result.summary && (
        <div
          className="mx-4 mb-4 rounded-lg p-4 text-xs leading-relaxed"
          style={{ background: "var(--bg)", border: "1px solid var(--border2)" }}
        >
          <p
            className="font-bold uppercase tracking-widest mb-2"
            style={{ color: "var(--cyan)", fontSize: "10px" }}
          >
            Executive Summary
          </p>
          <p style={{ color: "var(--text)", lineHeight: "1.7" }}>{result.summary}</p>
        </div>
      )}
    </div>
  );
}
