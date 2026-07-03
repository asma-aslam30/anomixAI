# Anomix — Sentinel AI

> **Incident Intelligence & Response** — upload logs, detect anomalies, and get AI-powered root cause analysis, business impact estimates, and remediation plans in seconds.

Built for the GDG Hackathon. Powered by **Google Gemini 2.5 Flash** and **Next.js 14**.

---

## What it does

Anomix ingests raw log files (CSV, JSON, plaintext), runs statistical spike detection, and drives a multi-agent AI pipeline that produces:

- **Root Cause Analysis** — Gemini-powered chain-of-thought diagnosis
- **Business Impact** — users affected, downtime estimate, revenue loss (PKR)
- **Remediation Plan** — immediate, short-term, and long-term actions
- **Correlation Analysis** — cascading failure patterns across services
- **Threat Intelligence** — attack classification for suspicious traffic spikes
- **IP Threat Report** — malicious/suspicious IP breakdown with block recommendations
- **Load Balancer Recommendations** — auto-scaling actions and cluster rebalancing
- **Executive Summary** — a ≤ 300-word plain-language incident brief
- **Real-time Alerts** — SSE-streamed browser notifications + mock email/WhatsApp for SEV-1/CRITICAL
- **AI Copilot Chat** — ask anything about the active incident in natural language

All of this runs as a single Next.js app — no separate backend, no database, no container setup. One `npm run dev` and you're live.

---

## Demo pipeline

```
Upload logs → Detect spikes (Z-score) → Classify (POSITIVE / NEGATIVE / SUSPICIOUS)
    → Multi-agent orchestration:
        RCA Agent → Impact Agent + Correlation Agent (parallel)
        → Remediation Agent → Threat Intel Agent (conditional)
        → IP Threat Agent → Load Balancer Agent → Summary Agent
    → Alert dispatch (SEV-1 / CRITICAL only)
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| UI | React 18, Tailwind CSS, ShadCN (Radix UI), Recharts |
| State | In-memory singleton store (Node.js process scope) |
| Alerts | Server-Sent Events (SSE), mock email, mock WhatsApp webhook |

---

## Project structure

```
sentinel-ai/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Single-page dashboard
│   └── api/
│       ├── upload-logs/           # POST — parse and store log file
│       ├── analyze/               # POST — spike detection + classification
│       ├── rca/                   # POST — root cause analysis
│       ├── impact/                # POST — business impact calculation
│       ├── fix/                   # POST — remediation plan
│       ├── chat/                  # POST — AI copilot
│       ├── orchestrate/           # POST — full multi-agent pipeline
│       ├── logs/                  # GET  — retrieve stored log entries
│       ├── health/                # GET  — health check
│       └── alerts/stream/         # GET  — SSE alert stream
├── components/
│   ├── dashboard/                 # Feature components (RCA, Impact, Chat, etc.)
│   └── ui/                        # ShadCN primitives
├── lib/
│   ├── types.ts                   # All TypeScript interfaces
│   ├── store.ts                   # In-memory store singleton
│   ├── api.ts                     # Typed client-side fetch wrappers
│   ├── utils.ts                   # Helpers (cn, formatPKR, newId)
│   └── services/
│       ├── ingestion.ts           # CSV / JSON / plaintext parser
│       ├── spike-detector.ts      # Z-score anomaly detection
│       ├── spike-classifier.ts    # POSITIVE / NEGATIVE / SUSPICIOUS classifier
│       ├── rca-engine.ts          # Gemini RCA prompt + fallback
│       ├── impact-calculator.ts   # Users, downtime, revenue loss
│       ├── remediation-advisor.ts # Gemini remediation + fallbacks
│       ├── alert-dispatcher.ts    # Severity assignment + alert channels
│       ├── chat-copilot.ts        # Gemini chat with incident context
│       ├── orchestrator.ts        # Multi-agent pipeline coordinator
│       ├── ip-threat-agent.ts     # IP threat intelligence
│       └── load-balancer-agent.ts # Load balancer recommendations
└── public/
    └── sample_logs.csv            # 50+ rows, 3 services, guaranteed spikes
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

### 1. Install dependencies

```bash
cd sentinel-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and set your key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The other variables have sensible defaults and are optional:

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | **Required.** Google Gemini API key |
| `REVENUE_PER_MINUTE_PKR` | `50000` | Revenue rate for impact calculation (PKR/min) |
| `Z_SCORE_THRESHOLD` | `2.0` | Z-score cutoff for spike detection |
| `MOCK_EMAIL` | `true` | Log alert emails to console instead of sending |
| `ALERT_EMAIL` | `alerts@sentinelai.local` | Recipient for incident alerts |
| `WHATSAPP_WEBHOOK_URL` | `http://localhost:9000/mock-webhook` | WhatsApp webhook target |

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using the dashboard

1. **Upload logs** — click the upload button in the header or use the included `public/sample_logs.csv` as a quick start.
2. **Run analysis** — the pipeline triggers automatically after upload, detecting and classifying spikes.
3. **Select an incident** — click any incident in the left sidebar to load its full AI analysis.
4. **Explore panels** — RCA, Business Impact, Remediation, IP Threats, Load Balancer, and the Agent Trace all populate for the selected incident.
5. **Chat** — use the AI Copilot on the right to ask questions about the active incident in plain language.
6. **Alerts** — SEV-1 and CRITICAL incidents dispatch browser alerts visible in the footer.

---

## Spike classification

| Type | Description |
|---|---|
| `POSITIVE_SPIKE` | Unusual traffic surge — potential viral event or capacity issue |
| `NEGATIVE_SPIKE` | Sharp drop in requests / elevated errors — likely service degradation |
| `SUSPICIOUS_SPIKE` | Anomalous pattern matching DDoS, scraping, credential stuffing, or API abuse |

Severity levels: `SEV-3` → `SEV-2` → `SEV-1` → `CRITICAL`

---

## Multi-agent orchestration

The `POST /api/orchestrate` endpoint runs all agents in dependency order:

```
Step 1  RCA Agent              (sequential)
Step 2  Impact Agent           (sequential — no Gemini call needed)
        Correlation Agent      (Gemini — cross-incident pattern detection)
Step 3  Remediation Agent      (sequential — uses RCA + Impact)
Step 4  Threat Intel Agent     (conditional — SUSPICIOUS_SPIKE only)
Step 4b IP Threat Agent        (sequential)
        Load Balancer Agent    (sequential)
Step 5  Summary Agent          (synthesises all outputs → ≤ 300-word brief)
Step 6  Alert dispatch         (SEV-1 / CRITICAL only)
```

Each agent appends an `AgentTraceEntry` to the result — visible in the Agent Trace panel on the dashboard.

All agents have rule-based fallbacks so the pipeline always completes, even without a Gemini API key.

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload-logs` | Upload a log file (multipart) |
| `POST` | `/api/analyze` | Run spike detection + classification |
| `POST` | `/api/rca` | Run root cause analysis for a spike |
| `POST` | `/api/impact` | Calculate business impact for a spike |
| `POST` | `/api/fix` | Generate remediation plan for a spike |
| `POST` | `/api/orchestrate` | Run full multi-agent pipeline for a spike |
| `POST` | `/api/chat` | Send a message to the AI copilot |
| `GET` | `/api/logs` | Retrieve stored log entries |
| `GET` | `/api/alerts/stream` | SSE stream of dispatched alerts |

---

## Log file format

Upload a CSV with these columns (extra columns are ignored):

```
timestamp, service_name, request_count, error_rate, latency_ms, status_200, status_500, status_503
```

JSON and plaintext formats are also supported — the ingestion layer applies best-effort field coercion.

A ready-to-use sample file is at `public/sample_logs.csv`.

---

## Development commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript check (no emit)
```

---

## Notes

- All state is in-memory and resets on server restart or new upload. There is no persistent storage by design.
- Gemini calls include 300–500 ms delays between sequential requests to respect free-tier rate limits.
- Without a `GEMINI_API_KEY`, all agents fall back to deterministic rule-based outputs — the dashboard still works end-to-end.
