"use client";
import { LoadBalancerReport } from "@/lib/types";

interface Props { report: LoadBalancerReport | null; loading?: boolean; }

const actionStyle = {
  scale_out: { color: "var(--cyan)",   bg: "rgba(0,212,255,0.1)",   label: "↗ Scale Out" },
  scale_up:  { color: "var(--purple)", bg: "rgba(124,58,237,0.1)",  label: "⬆ Scale Up" },
  maintain:  { color: "var(--green)",  bg: "rgba(16,185,129,0.1)",  label: "✓ Maintain"  },
  reduce:    { color: "var(--muted-c)","bg": "var(--surface2)",      label: "↘ Reduce"    },
} as const;

export function LoadBalancerPanel({ report, loading }: Props) {
  if (loading) {
    return (
      <Panel title="⚖️ Load Balancer Intelligence">
        {[1,2,3].map(i => (
          <div key={i} className="rounded animate-pulse h-8 mb-2" style={{ background: "var(--surface2)" }} />
        ))}
      </Panel>
    );
  }
  if (!report) return (
    <Panel title="⚖️ Load Balancer Intelligence">
      <div className="flex items-center justify-center" style={{ minHeight: "60px", color: "var(--muted-c)", fontSize: "11px" }}>
        <span>Awaiting load balancer data — select an incident with analysis results</span>
      </div>
    </Panel>
  );

  return (
    <Panel title="⚖️ Load Balancer Intelligence">
      {/* TPM */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Current TPM", value: report.current_tpm.toLocaleString(), color: "var(--orange)" },
          { label: "Projected TPM", value: report.projected_tpm.toLocaleString(), color: "var(--cyan)" },
        ].map(m => (
          <div
            key={m.label}
            className="text-center rounded py-3"
            style={{ background: "var(--bg)", border: "1px solid var(--border2)" }}
          >
            <p className="font-syne font-bold text-xl leading-none" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-c)" }}>{m.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text)" }}>
        {report.lb_summary}
      </p>

      {/* Cluster distribution */}
      <div className="mb-4">
        <SectionLabel>◫ Cluster Distribution</SectionLabel>
        <div className="space-y-3">
          {report.cluster_recommendations.map(c => {
            const s = actionStyle[c.action as keyof typeof actionStyle] ?? actionStyle.maintain;
            return (
              <div key={c.cluster_id}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs" style={{ color: "var(--muted-c)", width: "80px" }}>
                    {c.cluster_id}
                  </span>
                  <span className="text-xs flex-1" style={{ color: "var(--text)" }}>{c.region}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "var(--border2)" }}>
                    <div style={{ height: "100%", width: `${c.current_load_pct}%`, background: "var(--orange)", borderRadius: "2px" }} />
                  </div>
                  <span style={{ color: "var(--orange)", width: "32px", textAlign: "right" }}>{c.current_load_pct}%</span>
                  <span style={{ color: "var(--muted-c)" }}>→</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: "4px", background: "var(--border2)" }}>
                    <div style={{ height: "100%", width: `${c.recommended_load_pct}%`, background: "var(--cyan)", borderRadius: "2px" }} />
                  </div>
                  <span style={{ color: "var(--cyan)", width: "32px", textAlign: "right" }}>{c.recommended_load_pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-scaling */}
      {report.auto_scaling_actions.length > 0 && (
        <div className="mb-4">
          <SectionLabel>⚡ Auto-Scaling Actions</SectionLabel>
          <ol className="space-y-1">
            {report.auto_scaling_actions.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="font-bold shrink-0" style={{ color: "var(--cyan)" }}>{i + 1}.</span>
                <span style={{ color: "var(--text)" }}>{a}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-xs" style={{ color: "var(--muted-c)" }}>
        Capacity needed: <span style={{ color: "var(--text)" }}>{report.estimated_capacity_needed}</span>
      </p>
    </Panel>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-c)", fontSize: "10px" }}>
      {children}
    </p>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
