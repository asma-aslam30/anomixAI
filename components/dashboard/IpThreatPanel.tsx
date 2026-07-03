"use client";
import { IpThreatReport } from "@/lib/types";

interface Props { report: IpThreatReport | null; loading?: boolean; }

const classStyle = {
  malicious: { color: "var(--red)",    bg: "rgba(239,68,68,0.12)",  icon: "🚫" },
  suspicious:{ color: "var(--yellow)", bg: "rgba(245,158,11,0.1)",  icon: "⚠" },
  safe:      { color: "var(--green)",  bg: "rgba(16,185,129,0.1)",  icon: "✓" },
};

export function IpThreatPanel({ report, loading }: Props) {
  if (loading) {
    return (
      <Panel title="🛡️ IP Threat Intelligence" badge={null}>
        {[1,2,3].map(i => (
          <div key={i} className="rounded animate-pulse h-8 mb-2" style={{ background: "var(--surface2)" }} />
        ))}
      </Panel>
    );
  }
  if (!report) return (
    <Panel title="🛡️ IP Threat Intelligence" badge={null}>
      <div className="flex items-center justify-center" style={{ minHeight: "60px", color: "var(--muted-c)", fontSize: "11px" }}>
        <span>Awaiting IP threat data — select an incident with analysis results</span>
      </div>
    </Panel>
  );

  const allIps = [...report.malicious_ips, ...report.suspicious_ips, ...report.safe_ips];

  return (
    <Panel
      title="🛡️ IP Threat Intelligence"
      badge={<span className="text-xs" style={{ color: "var(--muted-c)" }}>{report.total_ips_analyzed} IPs</span>}
    >
      {/* Summary */}
      <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text)" }}>
        {report.threat_summary}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([
          ["Malicious", report.malicious_ips.length, "var(--red)"],
          ["Suspicious", report.suspicious_ips.length, "var(--yellow)"],
          ["Safe", report.safe_ips.length, "var(--green)"],
        ] as [string, number, string][]).map(([label, count, color]) => (
          <div
            key={label}
            className="text-center rounded py-2"
            style={{ background: "var(--bg)", border: "1px solid var(--border2)" }}
          >
            <p className="font-syne font-bold text-lg leading-none" style={{ color }}>{count}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-c)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Countries */}
      {report.top_countries.length > 0 && (
        <div className="mb-4">
          <SectionLabel>🌍 Traffic by Country</SectionLabel>
          <div className="space-y-1">
            {report.top_countries.map(c => (
              <div key={c.country} className="flex items-center gap-2 text-xs">
                <span>{c.flag}</span>
                <span className="flex-1" style={{ color: "var(--text)" }}>{c.country}</span>
                <span className="font-mono" style={{ color: "var(--muted-c)" }}>{c.count.toLocaleString()} req</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IP list */}
      {allIps.length > 0 && (
        <div className="mb-4">
          <SectionLabel>Top IPs</SectionLabel>
          <div className="space-y-1">
            {allIps.slice(0, 6).map(ip => {
              const s = classStyle[ip.classification];
              return (
                <div
                  key={ip.ip}
                  className="flex items-center gap-2 text-xs rounded px-2 py-1"
                  style={{ background: s.bg, border: `1px solid ${s.color}30` }}
                >
                  <span>{s.icon}</span>
                  <span className="font-mono" style={{ color: s.color }}>{ip.ip}</span>
                  <span style={{ color: "var(--muted-c)" }}>{ip.country}</span>
                  <span className="ml-auto" style={{ color: s.color }}>{ip.confidence}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Block recommendations */}
      {report.block_recommendations.length > 0 && (
        <div>
          <SectionLabel>🚫 Block Recommendations</SectionLabel>
          <ul className="space-y-1">
            {report.block_recommendations.slice(0, 3).map((r, i) => (
              <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--red)" }}>
                <span>▸</span><span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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

function Panel({ title, badge, children }: { title: string; badge: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="font-syne font-bold text-sm" style={{ color: "var(--text)" }}>{title}</span>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
