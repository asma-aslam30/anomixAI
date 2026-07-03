"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ClassifiedSpike,
  RCAReport,
  BusinessImpactReport,
  RemediationPlan,
  OrchestrationResult,
  IpThreatReport,
  LoadBalancerReport,
} from "@/lib/types";
import { api } from "@/lib/api";
import { audio } from "@/lib/audio";
import UploadControl from "@/components/dashboard/UploadControl";
import IncidentList from "@/components/dashboard/IncidentList";
import { RCACard } from "@/components/dashboard/RCACard";
import { BusinessImpactCard } from "@/components/dashboard/BusinessImpactCard";
import { RemediationPanel } from "@/components/dashboard/RemediationPanel";
import { TimelineChart } from "@/components/dashboard/TimelineChart";
import { AlertHistoryPanel } from "@/components/dashboard/AlertHistoryPanel";
import { AgentTracePanel } from "@/components/dashboard/AgentTracePanel";
import { IpThreatPanel } from "@/components/dashboard/IpThreatPanel";
import { LoadBalancerPanel } from "@/components/dashboard/LoadBalancerPanel";

/* ─── AI investigation steps ─── */
const INVESTIGATION_STEPS = [
  "Collecting evidence...",
  "Inspecting packets...",
  "Checking network behavior...",
  "Analyzing payload...",
  "Matching threat signatures...",
  "Consulting threat intelligence...",
  "Behavior analysis...",
  "Correlating historical incidents...",
  "Mapping MITRE ATT&CK...",
  "Extracting IOCs...",
  "Risk modeling...",
  "Predicting attacker intent...",
  "Generating recommendations...",
];

/* ─── Health checks ─── */
const HEALTH_CHECKS = [
  { id: "detection",   label: "Detection Engine",      ok: true  },
  { id: "ai",          label: "AI Analysis",            ok: true  },
  { id: "email",       label: "Email Service",          ok: true  },
  { id: "alert",       label: "Alert System",           ok: true  },
  { id: "voice",       label: "Voice Notification",     ok: true  },
  { id: "response",    label: "Response Engine",        ok: true  },
];

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<ClassifiedSpike[]>([]);
  const [logEntries, setLogEntries] = useState<import("@/lib/types").LogEntry[]>([]);
  const [selected, setSelected] = useState<ClassifiedSpike | null>(null);
  const [rca, setRca] = useState<RCAReport | null>(null);
  const [impact, setImpact] = useState<BusinessImpactReport | null>(null);
  const [plan, setPlan] = useState<RemediationPlan | null>(null);
  const [orchResult, setOrchResult] = useState<OrchestrationResult | null>(null);
  const [ipThreat, setIpThreat] = useState<IpThreatReport | null>(null);
  const [loadBalancer, setLoadBalancer] = useState<LoadBalancerReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [investigationStep, setInvestigationStep] = useState(-1);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [screenShake, setScreenShake] = useState(false);
  const [prevThreatLevel, setPrevThreatLevel] = useState("NORMAL");
  const [bootPhase, setBootPhase] = useState(-1);
  const [bootDone, setBootDone] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [entityVisible, setEntityVisible] = useState(false);
  const [entityLog, setEntityLog] = useState<string[]>([]);
  const [emfLevel, setEmfLevel] = useState(0);
  const [staticBurst, setStaticBurst] = useState(false);
  const [showEntityPanel, setShowEntityPanel] = useState(false);
  const [entityScanning, setEntityScanning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const ambientStarted = useRef(false);

  const BOOT_LINES = [
    { text: "SENTINELAI SOC v2.0 — INITIALIZING SYSTEM...", delay: 200 },
    { text: "> Loading kernel modules... OK", delay: 400, cls: "success" },
    { text: "> Mounting encrypted filesystems... OK", delay: 600, cls: "success" },
    { text: "> Starting AI inference engine... OK", delay: 800, cls: "success" },
    { text: "> Connecting to threat intelligence feeds... OK", delay: 1000, cls: "success" },
    { text: "> Calibrating anomaly detection sensors... OK", delay: 1200, cls: "success" },
    { text: "> Initializing audio environment... OK", delay: 1400, cls: "success" },
    { text: "> Establishing secure communication channels... OK", delay: 1600, cls: "success" },
    { text: "WARNING: 3 unpatched CVEs detected in dependency stack", delay: 1800, cls: "warn" },
    { text: "> Applying runtime mitigations... OK", delay: 2000, cls: "success" },
    { text: "SYSTEM READY — ALL MODULES OPERATIONAL", delay: 2400, cls: "success" },
  ];

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleComplete = async (newIncidents: ClassifiedSpike[]) => {
    setIncidents(newIncidents);
    setSelected(null);
    setRca(null);
    setImpact(null);
    setPlan(null);
    setOrchResult(null);
    setIpThreat(null);
    setLoadBalancer(null);
    audio.play("complete");
    const crit = newIncidents.filter((i) => i.severity === "CRITICAL").length;
    const susp = newIncidents.filter((i) => i.classification === "SUSPICIOUS_SPIKE").length;
    if (crit > 0) {
      audio.speak(`${crit} CRITICAL INCIDENT${crit > 1 ? "S" : ""} DETECTED`);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
    }
    if (susp > 0) {
      audio.speak(`UNKNOWN ENTITY SIGNATURE DETECTED IN ${susp} INCIDENT${susp > 1 ? "S" : ""}`);
      setEntityVisible(true);
      audio.play("staticburst");
      setStaticBurst(true);
      setTimeout(() => { setEntityVisible(false); setStaticBurst(false); }, 2500);
    }
    try {
      const { log_entries } = await api.getLogs();
      setLogEntries(log_entries);
    } catch { /* non-fatal */ }
  };

  const handleSelect = async (spike: ClassifiedSpike) => {
    setSelected(spike);
    setDetailLoading(true);
    setRca(null);
    setImpact(null);
    setPlan(null);
    setOrchResult(null);
    setIpThreat(null);
    setLoadBalancer(null);
    setInvestigationStep(-1);

    const isCrit = spike.severity === "CRITICAL";
    const isSuspicious = spike.classification === "SUSPICIOUS_SPIKE";
    const lowConfidence = spike.confidence_score < 50;
    const highZ = spike.z_score > 5;

    audio.play(isCrit ? "critical" : "alert");

    if (isCrit) {
      setScreenShake(true);
      setStaticBurst(true);
      setTimeout(() => { setScreenShake(false); setStaticBurst(false); }, 500);
      addEntityLog(`CRITICAL ANOMALY — ${spike.service_name} — Z: ${spike.z_score.toFixed(2)}`);
    }

    /* Whisper on uncertain / high-z incidents (data-driven) */
    if (lowConfidence || highZ) {
      audio.play("whisper");
      addEntityLog(`UNCERTAIN SIGNATURE — CONFIDENCE: ${spike.confidence_score}% — Z: ${spike.z_score.toFixed(2)}`);
    }

    /* Entity watcher appears during suspicious spike investigation */
    if (isSuspicious) {
      setEntityVisible(true);
      audio.play("staticburst");
      setStaticBurst(true);
      addEntityLog(`ENTITY DETECTED IN: ${spike.service_name} — REASON: ${spike.classification_reason}`);
      setTimeout(() => { setEntityVisible(false); setStaticBurst(false); }, 3000);
      audio.speak("UNKNOWN ENTITY SIGNATURE ANALYZING");
    }

    /* Scream jumpscare: only when critical + low confidence + high z (very anomalous) */
    if (isCrit && lowConfidence && highZ) {
      setTimeout(() => audio.play("scream"), 800);
    }

    /* ── Static burst during investigation ── */
    setStaticBurst(true);
    setTimeout(() => setStaticBurst(false), 150);

    /* ── Animated investigation sequence ── */
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setInvestigationStep(step);
      audio.play("analyse");
      if (step >= INVESTIGATION_STEPS.length - 1) clearInterval(interval);
    }, 350);

    try {
      const [rcaRes, impactRes, planRes] = await Promise.all([
        api.rca(spike.spike_id).catch(() => null),
        api.impact(spike.spike_id).catch(() => null),
        api.fix(spike.spike_id).catch(() => null),
      ]);
      setRca(rcaRes);
      setImpact(impactRes);
      setPlan(planRes);
      const orchRes = await api.orchestrate(spike.spike_id).catch(() => null);
      setOrchResult(orchRes);
      if (orchRes) {
        setIpThreat((orchRes as unknown as { ip_threat?: IpThreatReport }).ip_threat ?? null);
        setLoadBalancer((orchRes as unknown as { load_balancer?: LoadBalancerReport }).load_balancer ?? null);
      }
    } finally {
      clearInterval(interval);
      setInvestigationStep(INVESTIGATION_STEPS.length);
      setDetailLoading(false);
      audio.play("complete");
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    audio.play("chat");
    try {
      const res = await api.chat({ message: msg, incident_id: selected?.spike_id ?? null });
      const reply = res.reply;
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }]);
      audio.play("complete");
      if (reply.toLowerCase().includes("unknown") || reply.toLowerCase().includes("anomal") || reply.toLowerCase().includes("entity")) {
        audio.play("whisper");
        addEntityLog(`AI COPILOT DETECTED ANOMALOUS PATTERN: "${reply.slice(0, 60)}..."`);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", text: "AI Copilot unavailable. Check API key." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleSound = useCallback(() => {
    const enabled = audio.toggle();
    setSoundEnabled(enabled);
    if (enabled) {
      audio.startAmbient();
      audio.speak("AUDIO SYSTEM REACTIVATED");
    }
  }, []);

  useEffect(() => {
    if (bootDone) return;
    if (bootPhase >= BOOT_LINES.length) {
      const t = setTimeout(() => setBootDone(true), 800);
      return () => clearTimeout(t);
    }
    if (bootPhase === -1) {
      const t = setTimeout(() => setBootPhase(0), 300);
      return () => clearTimeout(t);
    }
    const line = BOOT_LINES[bootPhase];
    const t = setTimeout(() => setBootPhase(p => p + 1), line.delay);
    return () => clearTimeout(t);
  }, [bootPhase, bootDone]);

  useEffect(() => {
    if (bootDone) {
      audio.play("powerup");
    }
  }, [bootDone]);

  /* ── EMF level: computed from actual incident data ── */
  useEffect(() => {
    if (incidents.length === 0) {
      setEmfLevel(0);
      return;
    }
    const avgZ = incidents.reduce((s, i) => s + i.z_score, 0) / incidents.length;
    const avgConf = incidents.reduce((s, i) => s + i.confidence_score, 0) / incidents.length;
    const critRatio = incidents.filter(i => i.severity === "CRITICAL").length / incidents.length;
    const suspRatio = incidents.filter(i => i.classification === "SUSPICIOUS_SPIKE").length / incidents.length;
    const emf = Math.min(100, Math.round(
      (avgZ / 10) * 30 +
      (1 - avgConf / 100) * 30 +
      critRatio * 25 +
      suspRatio * 25
    ));
    setEmfLevel(emf);
  }, [incidents]);

  /* ── Entity panel: data-driven from suspicious spikes + Gemini RCA ── */
  useEffect(() => {
    const hasSuspicious = incidents.some(i => i.classification === "SUSPICIOUS_SPIKE");
    setShowEntityPanel(hasSuspicious);
    if (hasSuspicious && !entityScanning) {
      setEntityScanning(true);
    }
  }, [incidents]);

  /* ── Entity scan: runs once when suspicious spikes are first detected ── */
  useEffect(() => {
    if (!entityScanning || incidents.length === 0) return;
    const suspicious = incidents.filter(i => i.classification === "SUSPICIOUS_SPIKE");
    if (suspicious.length === 0) return;
    const names = suspicious.map(s => s.service_name).join(", ");
    addEntityLog(`ANOMALOUS PATTERN DETECTED IN: ${names}`);
    suspicious.forEach(s => {
      addEntityLog(`ENTITY SIGNATURE: ${s.classification_reason}`);
    });
    addEntityLog(`CORRELATION CONFIDENCE: ${suspicious[0].confidence_score}%`);
  }, [entityScanning, incidents]);

  const addEntityLog = (msg: string) => {
    setEntityLog(prev => [...prev.slice(-4), msg]);
  };

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!ambientStarted.current) {
      ambientStarted.current = true;
      const startAudio = () => {
        audio.startAmbient();
        document.removeEventListener("click", startAudio);
      };
      document.addEventListener("click", startAudio);
      return () => document.removeEventListener("click", startAudio);
    }
  }, []);

  const criticalCount  = incidents.filter(i => i.severity === "CRITICAL").length;
  const sev1Count      = incidents.filter(i => i.severity === "SEV-1").length;
  const suspiciousCount = incidents.filter(i => i.classification === "SUSPICIOUS_SPIKE").length;
  const totalDuration = orchResult?.total_duration_ms ?? null;

  const threatLevel = criticalCount > 0 ? "CRITICAL" : sev1Count > 0 ? "HIGH" : suspiciousCount > 0 ? "ELEVATED" : "NORMAL";
  const threatColor = criticalCount > 0 ? "var(--red)" : sev1Count > 0 ? "var(--orange)" : suspiciousCount > 0 ? "var(--yellow)" : "var(--green)";
  const threatPct = criticalCount > 0 ? 100 : sev1Count > 0 ? 70 : suspiciousCount > 0 ? 40 : 10;

  useEffect(() => {
    const tl = threatLevel;
    audio.setThreatLevel(threatPct / 100);
    if (tl !== prevThreatLevel) {
      setPrevThreatLevel(tl);
      if (tl === "CRITICAL") {
        audio.play("bassdrop");
        audio.speak("THREAT LEVEL IS NOW CRITICAL");
        const suspicious = incidents.filter(i => i.classification === "SUSPICIOUS_SPIKE").length;
        if (suspicious > 0) {
          audio.speak(`WARNING — ${suspicious} UNKNOWN ENTIT${suspicious > 1 ? "IES" : "Y"} IN NETWORK`);
        }
      } else if (tl === "HIGH") {
        audio.play("warning");
        audio.speak("THREAT LEVEL ELEVATED TO HIGH");
      } else if (tl === "NORMAL") {
        audio.speak("ALL CLEAR — THREAT LEVEL NORMALIZED");
      }
    }
  }, [threatLevel, threatPct, prevThreatLevel, incidents]);

  const isCritical = threatLevel === "CRITICAL";

  return (
    <div className={`min-h-screen flex flex-col ${screenShake ? "screen-shake" : ""}`} style={{ background: "var(--bg)" }}>

      {/* Boot / Splash Screen */}
      {!bootDone && (
        <div className={`boot-screen ${bootPhase >= BOOT_LINES.length ? "exit" : ""}`}>
          <div className="text-xs font-mono mb-6" style={{ color: "var(--cyan)" }}>
            SENTINEL<span style={{ color: "var(--purple)" }}>AI</span> SOC v2.0
          </div>
          {BOOT_LINES.slice(0, Math.min(bootPhase + 1, BOOT_LINES.length)).map((line, i) => (
            <div key={i} className={`boot-line ${line.cls || ""}`} style={{ animationDelay: "0s" }}>
              {line.text}
            </div>
          ))}
          {bootPhase >= BOOT_LINES.length && (
            <div className="boot-prompt">
              <span className="blink-cursor" style={{ display: "inline" }}>PRESS ANY KEY TO CONTINUE</span>
            </div>
          )}
        </div>
      )}

      {/* Screen overlays */}
      <div className={`glitch-flash ${isCritical ? "critical" : ""}`} />
      <div className={`side-glow-left ${isCritical ? "critical" : ""}`} />
      <div className={`side-glow-right ${isCritical ? "critical" : ""}`} />
      <div className="vignette" />
      <div className={`corruption-overlay ${isCritical ? "critical" : ""}`} />
      <div className="grid-overlay" />
      <div className={`hud-corner hud-corner-tl ${isCritical ? "critical" : ""}`} />
      <div className={`hud-corner hud-corner-tr ${isCritical ? "critical" : ""}`} />
      <div className={`hud-corner hud-corner-bl ${isCritical ? "critical" : ""}`} />
      <div className={`hud-corner hud-corner-br ${isCritical ? "critical" : ""}`} />
      <div className={`mouse-glow ${isCritical ? "critical" : ""}`} style={{ left: mousePos.x, top: mousePos.y }} />
      <div className={`static-overlay ${isCritical ? "active critical" : staticBurst ? "burst" : entityVisible ? "active" : ""}`} />
      {isCritical && (
        <>
          <div className="red-drip" />
          <div className="red-drip" />
          <div className="red-drip" />
          <div className="red-drip" />
          <div className="red-drip" />
        </>
      )}
      {entityVisible && <div className="entity-watcher" />}
      <div className="data-rain" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            style={{
              "--x": Math.random() * 100,
              "--d": 5 + Math.random() * 15,
              "--dd": Math.random() * 10,
              "--o": 3 + Math.random() * 7,
              left: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * -8}s`,
              opacity: 0.1 + Math.random() * 0.15,
            } as React.CSSProperties}
          >
            {Array.from({ length: 6 + Math.floor(Math.random() * 8) })
              .map(() => (Math.random() > 0.5 ? "1" : "0"))
              .join("")}
          </span>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
         SOC COMMAND CENTER HEADER
         ═══════════════════════════════════════════════════════ */}
      <div className="glass-edge sticky top-0 z-50">
        <div className="flex items-center justify-between px-5 py-2.5">
          {/* Left: Logo + system ID */}
          <div className="flex items-center gap-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "linear-gradient(135deg, var(--cyan), var(--purple))", boxShadow: "0 0 16px rgba(0,212,255,0.25)" }}
            >
              <span style={{ color: "#fff" }}>S</span>
            </div>
            <div>
              <span className="font-syne font-extrabold text-base tracking-tight glitch-text" data-text="SENTINELAI" style={{ color: "var(--text)" }}>
                SENTINEL<span style={{ color: "var(--cyan)" }}>AI</span>
              </span>
              <span className="ml-2 text-[10px]" style={{ color: "var(--muted-c)" }}>SOC v2.0</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              <span className="status-dot up" />
              <span className={`text-[10px] font-mono ${isCritical ? "glitch-text" : ""}`} data-text="ALL SYSTEMS NOMINAL" style={{ color: isCritical ? "var(--red)" : "var(--green)" }}>
                {isCritical ? "⚠ CRITICAL THREAT ACTIVE" : "ALL SYSTEMS NOMINAL"}
              </span>
            </div>
          </div>

          {/* Center: real-time stats */}
          <div className="hidden lg:flex items-center gap-5 text-[10px] font-mono" style={{ color: "var(--muted-c)" }}>
            <div className="flex items-center gap-1.5">
              <span className="status-dot ai-active" />
              <span>AI ENGINE: ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="status-dot up" style={{ width: 6, height: 6 }} />
              <span>NODES: 4/4</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--cyan)" }}>●</span>
              <span>{currentTime} UTC</span>
            </div>
            <div className="emf-meter">
              <span>EMF</span>
              <div className="emf-bar">
                <div className="emf-bar-fill" style={{ width: `${emfLevel}%` }} />
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs" style={{ color: incidents.length > 0 ? "var(--red)" : "var(--muted-c)" }}>
              <span className={`${incidents.length > 0 ? "status-dot down threat-pulse" : "status-dot standby"}`} />
              <span className="font-mono font-bold">{incidents.length} ALERTS</span>
            </div>
            <button
              onClick={toggleSound}
              className="soc-btn text-[10px]"
              style={{
                padding: "5px 10px",
                background: soundEnabled ? "rgba(0,212,255,0.08)" : "rgba(239,68,68,0.08)",
                borderColor: soundEnabled ? "rgba(0,212,255,0.2)" : "rgba(239,68,68,0.2)",
                color: soundEnabled ? "var(--cyan)" : "var(--red)",
              }}
              title={soundEnabled ? "Mute audio" : "Enable audio"}
            >
              {soundEnabled ? "🔊 AUDIO" : "🔇 MUTED"}
            </button>
            <button
              onClick={() => { setCopilotOpen(!copilotOpen); if (!copilotOpen && !chatMessages.length) setChatMessages([{ role: "assistant", text: "AI Copilot ready. Ask me anything about threats, incidents, or remediation." }]); }}
              className="soc-btn soc-btn-primary text-[10px]"
              style={{ padding: "5px 12px" }}
            >
              <span>✦</span>
              {copilotOpen ? "CLOSE AI" : "AI COPILOT"}
            </button>
            <UploadControl onComplete={handleComplete} onUploadStart={() => audio.play("upload")} />
          </div>
        </div>

        {/* Threat level bar */}
        <div className="px-5 pb-2.5">
          <div className="flex items-center gap-3 text-[10px] font-mono mb-1.5">
            <span
              className={`${threatLevel !== "NORMAL" ? "heartbeat" : ""} neon-${isCritical ? "red" : threatLevel === "HIGH" ? "orange" : threatLevel === "ELEVATED" ? "yellow" : "green"}`}
              style={{ color: threatColor, fontWeight: 700 }}
            >
              {isCritical && "⚠ "}THREAT LEVEL: {threatLevel}
              {isCritical && " ⚠"}
            </span>
            <span className="flex items-center gap-0.5" style={{ color: threatColor }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} className="threat-tick" style={{ opacity: i <= threatPct / 20 ? 1 : 0.15 }} />
              ))}
            </span>
            <span className="flex-1" />
            <span style={{ color: "var(--muted-c)" }}>PROTECTED ASSETS: 24</span>
            <span style={{ color: "var(--border2)" }}>|</span>
            <span style={{ color: "var(--muted-c)" }}>ACTIVE MONITORS: 12</span>
          </div>
          <div className={`threat-bar ${isCritical ? "threat-pulse-border" : ""}`}>
            <div
              className="threat-bar-fill"
              style={{
                width: `${threatPct}%`,
                background: threatColor,
                boxShadow: `0 0 ${isCritical ? "16" : "8"}px ${threatColor}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
         SECURITY STATUS — Health Checks
         ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 px-5 py-2 overflow-x-auto shrink-0" style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid var(--border)" }}>
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--muted-c)", whiteSpace: "nowrap" }}>System Health</span>
        {HEALTH_CHECKS.map(h => (
          <div key={h.id} className="health-item">
            <span className={`status-dot ${h.ok ? "up" : "standby"}`} />
            <span className="text-[10px] font-mono" style={{ color: h.ok ? "var(--text)" : "var(--muted-c)", whiteSpace: "nowrap" }}>{h.label}</span>
            <span className="text-[9px] font-mono" style={{ color: h.ok ? "var(--green)" : "var(--muted-c)" }}>{h.ok ? "OK" : "OFF"}</span>
          </div>
        ))}
        <span className="ml-auto flex items-center gap-2 text-[10px] font-mono" style={{ color: "var(--muted-c)", whiteSpace: "nowrap" }}>
          <span className="glow-ping" style={{ width: 4, height: 4, borderRadius: "50%", display: "inline-block", background: "var(--cyan)" }} />
          LIVE MONITORING
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════
         MAIN LAYOUT
         ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Incident sidebar ── */}
        <aside
          className="w-72 shrink-0 flex flex-col overflow-hidden"
          style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
        >
          <div
            className="px-4 py-2.5 flex items-center gap-2 text-[10px] font-mono"
            style={{ background: "rgba(0,212,255,0.03)", borderBottom: "1px solid var(--border)", color: "var(--cyan)" }}
          >
            <span className="status-dot ai-active" />
            <span>INCIDENT FEED</span>
            <span className="ml-auto text-[10px]" style={{ color: incidents.length > 0 ? "var(--red)" : "var(--muted-c)" }}>
              {incidents.length} TOTAL
            </span>
          </div>
          <IncidentList
            incidents={incidents}
            selectedId={selected?.spike_id ?? null}
            onSelect={handleSelect}
          />
        </aside>

        {/* ── Investigation workspace / Main panel ── */}
        <main
          className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start"
          style={{ background: "var(--bg)" }}
        >
          {selected ? (
            <>
              {/* Investigation in progress */}
              {investigationStep >= 0 && investigationStep < INVESTIGATION_STEPS.length && (
                <div className={`xl:col-span-2 soc-card p-4 ${isCritical ? "card-threat-pulse" : ""}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="status-dot ai-active" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider" style={{ color: "var(--cyan)" }}>
                      AI Deep Investigation
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--muted-c)" }}>
                      {Math.round((investigationStep / (INVESTIGATION_STEPS.length - 1)) * 100)}%
                    </span>
                    <div className="flex-1" />
                    <div className="sound-wave">
                      {[1,2,3,4,5].map(i => <span key={i} />)}
                    </div>
                  </div>
                  <div className="threat-bar mb-3">
                    <div
                      className="threat-bar-fill"
                      style={{
                        width: `${(investigationStep / (INVESTIGATION_STEPS.length - 1)) * 100}%`,
                        background: "var(--cyan)",
                        boxShadow: "0 0 6px var(--cyan)",
                      }}
                    />
                  </div>
                  <div className="space-y-0.5">
                    {INVESTIGATION_STEPS.slice(0, Math.min(investigationStep + 1, INVESTIGATION_STEPS.length)).map((step, i) => (
                      <div
                        key={i}
                        className={`investigation-step ${i < investigationStep ? "complete" : i === investigationStep ? "active" : ""}`}
                      >
                        <div className="step-dot" />
                        <span className="text-[11px] font-mono" style={{ color: i <= investigationStep ? "var(--text)" : "var(--muted-c)" }}>
                          {step}
                          {i === investigationStep && investigationStep < INVESTIGATION_STEPS.length - 1 && (
                            <span className="ai-thinking" style={{ marginLeft: 4 }}><span /><span /><span /></span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incident header */}
              <div
                className="xl:col-span-2 soc-card flex items-center gap-3 px-4 py-2.5 text-xs"
                style={{ borderLeft: `3px solid ${threatColor}` }}
              >
                <span className="status-dot" style={{ background: threatColor, boxShadow: `0 0 6px ${threatColor}` }} />
                <span className="font-bold" style={{ color: "var(--cyan)" }}>{selected.service_name}</span>
                <span style={{ color: "var(--border2)" }}>·</span>
                <span className="font-mono" style={{ color: "var(--muted-c)" }}>{selected.classification_reason}</span>
                <span className="ml-auto flex items-center gap-3 font-mono" style={{ color: "var(--muted-c)" }}>
                  <span>Z: {selected.z_score.toFixed(2)}</span>
                  <span>CONF: {selected.confidence_score}%</span>
                  <span className={selected.severity === "CRITICAL" ? "sev-critical" : selected.severity === "SEV-1" ? "sev-high" : "sev-medium"} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                    {selected.severity}
                  </span>
                </span>
              </div>

              {/* Content panels */}
              <div className="xl:col-span-2">
                <TimelineChart spike={selected} logEntries={logEntries} />
              </div>
              <RCACard rca={rca} loading={detailLoading} />
              <BusinessImpactCard impact={impact} loading={detailLoading} />
              <div className="xl:col-span-2">
                <RemediationPanel plan={plan} loading={detailLoading} />
              </div>
              <IpThreatPanel report={ipThreat} loading={detailLoading} />
              <LoadBalancerPanel report={loadBalancer} loading={detailLoading} />
              <div className="xl:col-span-2">
                <AgentTracePanel result={orchResult} loading={detailLoading} />
              </div>
            </>
          ) : (
            <div className="xl:col-span-2 flex flex-col items-center justify-center h-80 gap-4">
              <div className="radar-sweep" style={{ width: 100, height: 100, borderRadius: "50%", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span className="text-4xl" style={{ color: "var(--muted-c)", textShadow: "0 0 12px rgba(0,212,255,0.2)" }}>⬡</span>
              </div>
              <p className="text-sm font-mono blink-cursor" style={{ color: "var(--muted-c)" }}>
                {incidents.length === 0
                  ? "Upload a log file to begin analysis"
                  : "Select an incident from the feed"}
              </p>
              {incidents.length === 0 ? (
                <p className="text-[10px] font-mono" style={{ color: "var(--border2)" }}>
                  SYSTEM AWAITING DATA INGESTION
                </p>
              ) : (
                <p className="text-[10px] font-mono" style={{ color: "var(--border2)" }}>
                  {incidents.length === 1 ? "1 INCIDENT DETECTED" : `${incidents.length} INCIDENTS DETECTED`} — CLICK TO INVESTIGATE
                </p>
              )}
            </div>
          )}
        </main>

        {/* ── AI Copilot Panel ── */}
        {copilotOpen && (
          <aside
            className="w-80 shrink-0 flex flex-col overflow-hidden"
            style={{
              background: "rgba(11,15,26,0.95)",
              backdropFilter: "blur(16px)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="status-dot ai-active" />
                <span className="text-xs font-bold font-mono" style={{ color: "var(--cyan)" }}>AI COPILOT</span>
              </div>
              <button onClick={() => setCopilotOpen(false)} className="soc-btn soc-btn-ghost" style={{ padding: "2px 8px", fontSize: "10px" }}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  <div
                    className="rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[85%]"
                    style={{
                      background: m.role === "user" ? "rgba(0,212,255,0.08)" : "var(--surface2)",
                      border: `1px solid ${m.role === "user" ? "rgba(0,212,255,0.15)" : "var(--border)"}`,
                      color: "var(--text)",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2">
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted-c)" }}>
                    <span className="ai-thinking">Analyzing<span /><span /><span /></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleChat()}
                  placeholder="Ask about threats, IOCs, remediation..."
                  className="flex-1 rounded px-3 py-2 text-xs font-mono"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border2)",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
                <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} className="soc-btn soc-btn-primary" style={{ padding: "6px 12px" }}>
                  ▶
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
         UNKNOWN ENTITY PANEL
         ═══════════════════════════════════════════════════════ */}
      {showEntityPanel && (
        <div className="unknown-entity-panel">
          <div className="scan-line" />
          <div className="label">⚠ UNKNOWN ENTITY</div>
          <div className="value">
            <span className="sig-bar" style={{ height: 8 + emfLevel * 0.1 }} />
            <span className="sig-bar" style={{ height: 6 + emfLevel * 0.12, animationDelay: "0.1s" }} />
            <span className="sig-bar" style={{ height: 10 + emfLevel * 0.08, animationDelay: "0.2s" }} />
            <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--red)" }}>
              SIG: {Math.round(emfLevel)}%
            </span>
          </div>
          {entityLog.map((msg, i) => (
            <div key={i} className="entity-log-line">{'> '}{msg}</div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         FOOTER — Alert Log + System Status
         ═══════════════════════════════════════════════════════ */}
      <footer className="shrink-0" style={{ background: "rgba(0,0,0,0.4)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4 px-5 py-1.5 text-[9px] font-mono" style={{ borderBottom: "1px solid var(--border)", color: "var(--muted-c)" }}>
          <span style={{ color: "var(--green)" }}>● SYSOK</span>
          <span style={{ color: "var(--border2)" }}>|</span>
          <span>PROC: {incidents.length > 0 ? `${incidents.length}Q` : "IDLE"}</span>
          <span style={{ color: "var(--border2)" }}>|</span>
          <span>MEM: 62%</span>
          <span style={{ color: "var(--border2)" }}>|</span>
          <span>AGENTS: {orchResult ? `${orchResult.agent_trace.length} RUN` : "0 IDLE"}</span>
          <span style={{ color: "var(--border2)" }}>|</span>
          <span>THREAT: {threatLevel}</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="sound-wave" style={{ height: 10 }}>
              {[1,2,3].map(i => <span key={i} style={{ height: 3, width: 1.5, background: "var(--muted-c)" }} />)}
            </span>
            <span>{currentTime} UTC</span>
          </span>
        </div>
        <div className="px-5 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider" style={{ color: "var(--cyan)" }}>
              {'>'} ALERT HISTORY LOG
            </span>
            <span className="status-dot up" />
          </div>
          <AlertHistoryPanel />
        </div>
      </footer>
    </div>
  );
}
