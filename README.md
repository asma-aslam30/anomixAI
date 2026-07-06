 
```md
# AnomixAI

> **Incident Intelligence & Response** — upload logs, detect anomalies, and get AI-powered root cause analysis, business impact estimates, and remediation plans in seconds.

Built for the Hackathon. Powered by **Google Gemini 2.5 Flash** and **Next.js 14**.

---

## 🚨 Real-Time Incident Story

### It’s Friday — 6:45 PM

Everyone is getting ready to leave the office.

Suddenly...

- CPU usage jumps to 95%  
- Requests per second spike  
- Error rates start increasing  

Slack starts exploding.

DevOps opens Grafana.  
Backend engineers start digging through logs.  
Security suspects a DDoS attack.  
Management wants answers immediately.

### ❓ Is this a real incident or just a healthy spike?

Not every spike is bad.

- Sometimes it means your product just went viral  
- Sometimes it’s a scheduled deployment  
- Sometimes it’s Black Friday traffic  
- Sometimes it’s a system outage  

Teams spend 30–60 minutes investigating...

And then realize:

> It was just a successful marketing campaign.

No attack. No outage. No emergency.

Just wasted time, delayed decisions, and alert fatigue.

---

## 💡 Why Anomix Exists

**Anomix – Sentinel AI** is an AI-powered Incident Intelligence and Response platform that understands incidents before engineers waste time investigating them.

It processes:

- CSV logs  
- JSON logs  
- Plaintext logs  

in seconds.

---

## ⚙️ What It Does

Anomix produces:

- 🔍 Root Cause Analysis (AI-powered)
- 💰 Business Impact (users, downtime, revenue loss in PKR)
- 🛠 Remediation Plans (short + long term fixes)
- 🔗 Correlation Analysis (cross-service failures)
- 🛡 Threat Intelligence (DDoS / abuse detection)
- 🌐 IP Threat Reports (malicious IP identification)
- ⚖️ Load Balancer Recommendations
- 🧾 Executive Summary (≤ 300 words)
- 📡 Real-time Alerts (SSE + email + WhatsApp mock)
- 🤖 AI Copilot Chat (natural language incident Q&A)

---

## 🧠 Demo Pipeline

```

Upload Logs
↓
Z-Score Spike Detection
↓
Classification:

* POSITIVE_SPIKE
* NEGATIVE_SPIKE
* SUSPICIOUS_SPIKE
  ↓
  Multi-Agent AI System:
  RCA Agent
  Impact Agent + Correlation Agent
  Remediation Agent
  Threat Intelligence Agent (conditional)
  IP Threat Agent
  Load Balancer Agent
  Summary Agent
  ↓
  Real-time Alerts (SEV-1 / CRITICAL)

```

---

## 🧱 Tech Stack

| Layer | Technology |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| AI | Google Gemini 2.5 Flash |
| UI | React, Tailwind CSS, ShadCN UI |
| Visualization | Recharts |
| State | In-memory store |
| Alerts | Server-Sent Events (SSE) |

---

## 📁 Project Structure

```

anomixAI/
├── app/
│   ├── api/
│   │   ├── upload-logs/
│   │   ├── analyze/
│   │   ├── rca/
│   │   ├── impact/
│   │   ├── fix/
│   │   ├── chat/
│   │   ├── orchestrate/
│   │   ├── logs/
│   │   ├── health/
│   │   └── alerts/stream/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
│   ├── services/
│   ├── store.ts
│   ├── types.ts
│   └── utils.ts
└── public/
└── sample_logs.csv

````

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
````

### 2. Setup environment

```bash
cp .env.example .env.local
```

Add:

```env
GEMINI_API_KEY=your_api_key_here
REVENUE_PER_MINUTE_PKR=50000
Z_SCORE_THRESHOLD=2.0
MOCK_EMAIL=true
```

---

### 3. Run project

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🧪 How It Works

1. Upload logs (CSV / JSON / TXT)
2. System detects anomalies using Z-score
3. Classifies spike type
4. Runs multi-agent AI pipeline
5. Generates:

   * RCA
   * Impact analysis
   * Fix suggestions
   * Threat detection
   * Executive summary
6. Streams real-time alerts
7. Chat with AI Copilot

---

## 📊 Spike Types

| Type             | Meaning                               |
| ---------------- | ------------------------------------- |
| POSITIVE_SPIKE   | Traffic surge (viral / load increase) |
| NEGATIVE_SPIKE   | Service degradation                   |
| SUSPICIOUS_SPIKE | Potential attack or abuse             |

---

## 🤖 Multi-Agent System

* RCA Agent
* Impact Agent
* Correlation Agent
* Remediation Agent
* Threat Intelligence Agent
* IP Analysis Agent
* Load Balancer Agent
* Summary Agent

All outputs are tracked in an **Agent Trace system**.

---

## 📡 API Reference

| Method | Endpoint           |
| ------ | ------------------ |
| GET    | /api/health        |
| POST   | /api/upload-logs   |
| POST   | /api/analyze       |
| POST   | /api/rca           |
| POST   | /api/impact        |
| POST   | /api/fix           |
| POST   | /api/orchestrate   |
| POST   | /api/chat          |
| GET    | /api/logs          |
| GET    | /api/alerts/stream |

---

## 📄 Log Format

```
timestamp, service_name, request_count, error_rate, latency_ms
```

Also supports JSON and plaintext logs.

---

## ⚡ Why Anomix?

Because incidents don’t wait.

And neither should your investigation.

---

## 🏁 Final Statement

Anomix transforms raw logs into intelligent decisions — helping organizations detect, understand, and respond to incidents before they become disasters.

```

---

If you want next step, I can also:
- :contentReference[oaicite:0]{index=0}
- :contentReference[oaicite:1]{index=1}
- or :contentReference[oaicite:2]{index=2}
```
