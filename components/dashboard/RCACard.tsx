"use client";
import { RCAReport } from "@/lib/types";

interface Props {
  rca: RCAReport | null;
  loading?: boolean;
}

function SkeletonLine({ w = "100%" }: { w?: string }) {
  return (
    <div
      className="rounded animate-pulse"
      style={{ height: "12px", width: w, background: "var(--surface2)", marginBottom: "8px" }}
    />
  );
}

export function RCACard({ rca, loading }: Props) {
  if (loading) {
    return (
      <Panel title="Root Cause Analysis" badge={null}>
        <SkeletonLine />
        <SkeletonLine w="80%" />
        <SkeletonLine w="60%" />
      </Panel>
    );
  }
  if (!rca) return (
    <Panel title="Root Cause Analysis" badge={null}>
      <div className="flex items-center justify-center" style={{ minHeight: "60px", color: "var(--muted-c)", fontSize: "11px" }}>
        <span>Awaiting RCA data — select an incident with analysis results</span>
      </div>
    </Panel>
  );

  const confColor =
    rca.confidence_score >= 80 ? "var(--green)" :
    rca.confidence_score >= 50 ? "var(--yellow)" : "var(--red)";

  return (
    <Panel
      title="Root Cause Analysis"
      badge={<span style={{ fontSize: "10px", color: confColor }}>{rca.confidence_score}% CONF</span>}
    >
      {/* Confidence bar */}
      <div style={{ height: "3px", background: "var(--border2)", borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
        <div style={{ height: "100%", width: `${rca.confidence_score}%`, background: confColor, borderRadius: "2px", transition: "width 0.8s ease" }} />
      </div>

      {/* Summary */}
      <div
        className="rounded text-xs leading-relaxed"
        style={{ background: "var(--bg)", border: "1px solid var(--border2)", padding: "12px", color: "var(--text)", marginBottom: "12px" }}
      >
        {rca.root_cause_summary}
      </div>

      {/* Correlated anomalies */}
      {rca.correlated_anomalies.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--muted-c)" }}>
            Correlated Anomalies
          </p>
          <ul className="space-y-1">
            {rca.correlated_anomalies.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--muted-c)" }}>
                <span style={{ color: "var(--cyan)" }}>▸</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/* shared card shell */
function Panel({ title, badge, children }: { title: string; badge: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg"
      style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>
          🔍 {title}
        </span>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
