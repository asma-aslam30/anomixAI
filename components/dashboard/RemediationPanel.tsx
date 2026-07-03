"use client";
import { useState } from "react";
import { RemediationPlan } from "@/lib/types";

interface Props {
  plan: RemediationPlan | null;
  loading?: boolean;
}

const tabs = [
  { key: "immediate", label: "Immediate", color: "var(--red)" },
  { key: "short",     label: "Short-term", color: "var(--yellow)" },
  { key: "long",      label: "Long-term",  color: "var(--cyan)" },
] as const;

function ActionList({ actions, color }: { actions: string[]; color: string }) {
  if (actions.length === 0) {
    return <p className="text-xs italic" style={{ color: "var(--muted-c)" }}>No actions defined.</p>;
  }
  return (
    <ol className="space-y-2">
      {actions.map((a, i) => (
        <li key={i} className="flex gap-3 text-xs">
          <span className="font-bold shrink-0 w-5 text-right" style={{ color }}>{i + 1}.</span>
          <span style={{ color: "var(--text)", lineHeight: "1.6" }}>{a}</span>
        </li>
      ))}
    </ol>
  );
}

export function RemediationPanel({ plan, loading }: Props) {
  const [active, setActive] = useState<"immediate" | "short" | "long">("immediate");

  if (loading) {
    return (
      <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>🔧 Remediation Plan</span>
        </div>
        <div className="p-4">
          <div className="h-20 rounded animate-pulse" style={{ background: "var(--surface2)" }} />
        </div>
      </div>
    );
  }
  if (!plan) return (
    <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>🔧 Remediation Plan</span>
      </div>
      <div className="flex items-center justify-center" style={{ minHeight: "60px", color: "var(--muted-c)", fontSize: "11px" }}>
        <span>Awaiting remediation plan — select an incident with analysis results</span>
      </div>
    </div>
  );

  const counts = {
    immediate: plan.immediate_actions.length,
    short: plan.short_term_actions.length,
    long: plan.long_term_actions.length,
  };

  const actions = {
    immediate: plan.immediate_actions,
    short: plan.short_term_actions,
    long: plan.long_term_actions,
  };

  return (
    <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>🔧 Remediation Plan</span>
      </div>

      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all"
            style={{
              background: active === t.key ? "rgba(0,212,255,0.06)" : "transparent",
              color: active === t.key ? t.color : "var(--muted-c)",
              borderBottom: active === t.key ? `2px solid ${t.color}` : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {t.label}
            <span
              className="ml-2 px-1.5 py-0.5 rounded text-xs"
              style={{ background: "var(--surface2)", color: "var(--muted-c)" }}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      <div
        className="p-4 rounded-b-lg"
        style={{ background: "rgba(0,0,0,0.2)", minHeight: "80px" }}
      >
        <ActionList actions={actions[active]} color={tabs.find(t => t.key === active)!.color} />
      </div>
    </div>
  );
}
