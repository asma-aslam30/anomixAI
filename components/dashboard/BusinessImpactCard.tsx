"use client";
import { BusinessImpactReport } from "@/lib/types";
import { formatPKR, formatDuration } from "@/lib/utils";

interface Props {
  impact: BusinessImpactReport | null;
  loading?: boolean;
}

export function BusinessImpactCard({ impact, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
        <div className="flex items-center px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>💰 Business Impact</span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded animate-pulse h-16" style={{ background: "var(--surface2)" }} />
          ))}
        </div>
      </div>
    );
  }
  if (!impact) return (
    <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
      <div className="flex items-center px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>💰 Business Impact</span>
      </div>
      <div className="flex items-center justify-center" style={{ minHeight: "60px", color: "var(--muted-c)", fontSize: "11px" }}>
        <span>Awaiting impact data — select an incident with analysis results</span>
      </div>
    </div>
  );

  const metrics = [
    { label: "Users Affected", value: `${impact.users_affected_pct.toFixed(1)}%`, color: "var(--red)" },
    { label: "Downtime",       value: formatDuration(impact.estimated_downtime_minutes), color: "var(--orange)" },
    { label: "Revenue Risk",   value: formatPKR(impact.revenue_loss_pkr), color: "var(--red)" },
  ];

  return (
    <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
      <div className="flex items-center px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>💰 Business Impact</span>
      </div>
      <div className="p-4 grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg text-center py-3"
            style={{ background: "var(--bg)", border: "1px solid var(--border2)" }}
          >
            <p className="font-syne font-bold text-xl leading-none mb-1" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="text-xs" style={{ color: "var(--muted-c)" }}>{m.label}</p>
          </div>
        ))}
        {impact.notes && (
          <p className="col-span-3 text-xs" style={{ color: "var(--muted-c)" }}>
            {impact.notes}
          </p>
        )}
      </div>
    </div>
  );
}
