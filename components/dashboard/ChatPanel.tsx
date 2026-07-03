"use client";
import { useState, useRef, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({ incidentId }: { incidentId?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await api.chat({ message: text, incident_id: incidentId ?? null });
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast({
        title: "Chat Error",
        description: e instanceof ApiError ? e.detail : "AI unavailable",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-center pt-6 leading-relaxed" style={{ color: "var(--muted-c)" }}>
            Ask anything about<br />the current incidents…
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex gap-2 text-xs animate-fade-in", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" && (
              <span style={{ color: "var(--cyan)", marginTop: "2px", fontSize: "14px" }}>⬡</span>
            )}
            <div
              style={{
                maxWidth: "82%",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "12px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: m.role === "user" ? "rgba(0,212,255,0.1)" : "var(--surface2)",
                border: `1px solid ${m.role === "user" ? "rgba(0,212,255,0.3)" : "var(--border2)"}`,
                color: m.role === "user" ? "var(--cyan)" : "var(--text)",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center">
            <span style={{ color: "var(--cyan)", fontSize: "14px" }}>⬡</span>
            <div
              className="flex items-center gap-1.5"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border2)",
                borderRadius: "6px",
                padding: "8px 12px",
              }}
            >
              {[0, 0.2, 0.4].map((delay, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: "var(--cyan)", animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex gap-2 p-3 shrink-0"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Ask about this incident…"
          style={{
            flex: 1,
            background: "var(--bg)",
            border: "1px solid var(--border2)",
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "12px",
            color: "var(--text)",
            fontFamily: "'JetBrains Mono', monospace",
            outline: "none",
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--cyan)"; }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--border2)"; }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid var(--border2)",
            background: loading || !input.trim() ? "var(--surface2)" : "rgba(0,212,255,0.1)",
            color: loading || !input.trim() ? "var(--muted-c)" : "var(--cyan)",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
