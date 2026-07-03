import type {
  UploadResponse,
  AnalyzeResponse,
  RCAReport,
  BusinessImpactReport,
  RemediationPlan,
  ChatRequest,
  ChatResponse,
  OrchestrationResult,
  ClassifiedSpike,
  LogEntry,
  Alert,
} from "./types";

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = (err as { detail?: string }).detail ?? detail;
    } catch { /* ignore parse errors */ }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  async uploadLogs(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-logs", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, (err as { detail?: string }).detail ?? `HTTP ${res.status}`);
    }
    return res.json();
  },

  analyze(logEntries?: LogEntry[]): Promise<AnalyzeResponse> {
    return request<AnalyzeResponse>("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ log_entries: logEntries }),
    });
  },

  rca(spikeId: string, spike?: ClassifiedSpike): Promise<RCAReport> {
    return request<RCAReport>("/api/rca", {
      method: "POST",
      body: JSON.stringify({ spike_id: spikeId, spike }),
    });
  },

  impact(spikeId: string, spike?: ClassifiedSpike): Promise<BusinessImpactReport> {
    return request<BusinessImpactReport>("/api/impact", {
      method: "POST",
      body: JSON.stringify({ spike_id: spikeId, spike }),
    });
  },

  fix(spikeId: string, spike?: ClassifiedSpike): Promise<RemediationPlan> {
    return request<RemediationPlan>("/api/fix", {
      method: "POST",
      body: JSON.stringify({ spike_id: spikeId, spike }),
    });
  },

  chat(req: ChatRequest & { spike?: ClassifiedSpike; rca?: RCAReport; impact?: BusinessImpactReport; plan?: RemediationPlan }): Promise<ChatResponse> {
    return request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  orchestrate(spikeId: string, spike?: ClassifiedSpike): Promise<OrchestrationResult> {
    return request<OrchestrationResult>("/api/orchestrate", {
      method: "POST",
      body: JSON.stringify({ spike_id: spikeId, spike }),
    });
  },

  getLogs(): Promise<{ log_entries: LogEntry[] }> {
    return request<{ log_entries: LogEntry[] }>("/api/logs", { method: "GET" });
  },

  getAlerts(): Promise<{ alerts: Alert[] }> {
    return request<{ alerts: Alert[] }>("/api/alerts", { method: "GET" });
  },
};
