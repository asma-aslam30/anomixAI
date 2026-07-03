"use client";

import { useRef, useState, DragEvent } from "react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ClassifiedSpike } from "@/lib/types";
import { Loader2, FileUp, Zap } from "lucide-react";

interface UploadControlProps {
  onComplete: (incidents: ClassifiedSpike[]) => void;
  onUploadStart?: () => void;
}

export default function UploadControl({ onComplete, onUploadStart }: UploadControlProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (f: File) => {
    setFile(f);
    onUploadStart?.();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await api.uploadLogs(file);
      const { incidents } = await api.analyze();
      await Promise.all(
        incidents.map(inc =>
          Promise.all([api.rca(inc.spike_id), api.impact(inc.spike_id), api.fix(inc.spike_id)])
        )
      );
      onComplete(incidents);
      toast({ title: "Analysis complete", description: `${incidents.length} incident(s) detected.` });
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Error", description: detail, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 cursor-pointer rounded px-4 py-1.5 text-xs transition-all"
        style={{
          border: `1px dashed ${dragging ? "var(--cyan)" : "var(--border2)"}`,
          background: dragging ? "rgba(0,212,255,0.06)" : "var(--surface2)",
          color: file ? "var(--text)" : "var(--muted-c)",
          boxShadow: dragging ? "0 0 12px rgba(0,212,255,0.15)" : "none",
        }}
      >
        <FileUp size={13} style={{ color: "var(--cyan)" }} />
        <span>{file ? file.name : "Drop logs or click to browse"}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,.txt,.log"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* Analyse button */}
      <button
        onClick={handleAnalyse}
        disabled={!file || loading}
        className="flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all"
        style={{
          background: !file || loading ? "var(--surface2)" : "rgba(0,212,255,0.1)",
          border: `1px solid ${!file || loading ? "var(--border2)" : "var(--cyan)"}`,
          color: !file || loading ? "var(--muted-c)" : "var(--cyan)",
          cursor: !file || loading ? "not-allowed" : "pointer",
          boxShadow: file && !loading ? "0 0 12px rgba(0,212,255,0.15)" : "none",
        }}
      >
        {loading
          ? <Loader2 size={12} className="animate-spin" />
          : <Zap size={12} />
        }
        {loading ? "Analysing…" : "⚡ Analyse"}
      </button>
    </div>
  );
}
