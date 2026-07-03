import { SpikeClassification, SeverityLevel } from "@/lib/types";

const classStyles: Record<SpikeClassification, { bg: string; color: string; label: string }> = {
  POSITIVE_SPIKE:  { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Positive" },
  NEGATIVE_SPIKE:  { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Negative" },
  SUSPICIOUS_SPIKE:{ bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Suspicious" },
};

const sevStyles: Record<SeverityLevel, { bg: string; color: string }> = {
  "SEV-3":   { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  "SEV-2":   { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  "SEV-1":   { bg: "rgba(249,115,22,0.15)", color: "#f97316" },
  "CRITICAL":{ bg: "rgba(239,68,68,0.2)",   color: "#ef4444" },
};

interface IncidentBadgeProps {
  classification: SpikeClassification;
  severity?: SeverityLevel | null;
  showSeverity?: boolean;
}

const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

export default function IncidentBadge({ classification, severity, showSeverity = true }: IncidentBadgeProps) {
  const cs = classStyles[classification];
  const ss = severity ? sevStyles[severity] : null;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
      <span style={{ ...badgeBase, background: cs.bg, color: cs.color }}>
        {cs.label}
      </span>
      {showSeverity && ss && (
        <span style={{ ...badgeBase, background: ss.bg, color: ss.color }}>
          {severity}
        </span>
      )}
    </span>
  );
}
