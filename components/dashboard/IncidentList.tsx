"use client";

import { ClassifiedSpike } from "@/lib/types";
import IncidentBadge from "./IncidentBadge";
import { cn } from "@/lib/utils";

interface IncidentListProps {
  incidents: ClassifiedSpike[];
  selectedId: string | null;
  onSelect: (incident: ClassifiedSpike) => void;
}

export default function IncidentList({ incidents, selectedId, onSelect }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-48 gap-3">
        <span className="text-3xl opacity-20">◈</span>
        <p className="text-xs text-center uppercase tracking-widest" style={{ color: "var(--muted-c)" }}>
          No incidents detected<br />Upload logs to begin
        </p>
      </div>
    );
  }

  const sorted = [...incidents].sort((a, b) => b.z_score - a.z_score);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-c)" }}>
          ⬝ Incidents
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: "var(--surface2)", color: "var(--muted-c)", border: "1px solid var(--border2)" }}
        >
          {incidents.length}
        </span>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {sorted.map((incident) => {
          const isSelected = selectedId === incident.spike_id;
          const isCritical = incident.severity === "CRITICAL";
          const isSev1 = incident.severity === "SEV-1";

          return (
            <li
              key={incident.spike_id}
              onClick={() => onSelect(incident)}
              className={cn("cursor-pointer transition-all animate-fade-in")}
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                background: isSelected
                  ? "rgba(0,212,255,0.07)"
                  : isCritical
                  ? "rgba(239,68,68,0.04)"
                  : "transparent",
                borderLeft: isSelected
                  ? "3px solid var(--cyan)"
                  : isCritical
                  ? "3px solid var(--red)"
                  : isSev1
                  ? "3px solid var(--orange)"
                  : "3px solid transparent",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p
                  className="font-semibold text-xs truncate"
                  style={{ color: isSelected ? "var(--cyan)" : "var(--text)" }}
                >
                  {incident.service_name}
                </p>
                {(isCritical || isSev1) && (
                  <span
                    className="shrink-0 w-1.5 h-1.5 rounded-full mt-1"
                    style={{
                      background: isCritical ? "var(--red)" : "var(--orange)",
                      boxShadow: isCritical ? "0 0 6px var(--red)" : "0 0 6px var(--orange)",
                    }}
                  />
                )}
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--muted-c)" }}>
                {new Date(incident.timestamp).toLocaleTimeString()} · Z={incident.z_score.toFixed(1)} · {incident.confidence_score}%
              </p>
              <IncidentBadge
                classification={incident.classification}
                severity={incident.severity}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
