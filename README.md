Here is your **updated complete README as a markdown file** (ready to copy-paste into `README.md`):

```md
# AnomixAI

> **Incident Intelligence & Response** — upload logs, detect anomalies, and get AI-powered root cause analysis, business impact estimates, and remediation plans in seconds.

Built for the Hackathon. Powered by **Google Gemini 2.5 Flash** and **Next.js 14**.

---

## 🚨 Real-Time Incident Story

## It’s Friday — 6:45 PM

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

### ❓ The Big Question

Is this a real incident or just a healthy traffic spike?

Because not every spike is bad.

- Sometimes it means your product just went viral  
- Sometimes it’s a scheduled deployment  
- Sometimes it’s Black Friday traffic  
- Sometimes it’s a system outage starting  

Teams spend 30–60 minutes investigating...

And then realize:

> It was just a successful marketing campaign.

No attack.  
No outage.  
No emergency.  

Just wasted time and delayed decisions.

---

# 💡 Why Anomix Exists

## Anomix – Sentinel AI

Anomix is an AI-powered Incident Intelligence and Response platform that understands incidents before humans waste time investigating them.

Instead of manually inspecting logs, Anomix analyzes:

- CSV logs  
- JSON logs  
- Plaintext logs  

within seconds.

---

## ⚙️ What it does

Anomix ingests raw log files and produces:

- 🔍 **Root Cause Analysis** — Gemini-powered diagnosis  
- 💰 **Business Impact** — users affected, downtime, revenue loss (PKR)  
- 🛠 **Remediation Plan** — immediate + long-term fixes  
- 🔗 **Correlation Analysis** — cascading service failures  
- 🛡 **Threat Intelligence** — DDoS / abuse detection  
- 🌐 **IP Threat Report** — malicious IP identification  
- ⚖️ **Load Balancer Recommendations** — scaling suggestions  
- 🧾 **Executive Summary** — ≤ 300-word plain explanation  
- 📡 **Real-time Alerts** — SSE + email + WhatsApp mock  
- 🤖 **AI Copilot Chat** — ask questions in natural language  

---

## 🧠 Demo Pipeline

```

Upload logs
↓
Z-Score Spike Detection
↓
Classification:

* POSITIVE
* NEGATIVE
* SUSPICIOUS
  ↓
  Multi-Agent Orchestration:
  RCA Agent
  Impact Agent + Correlation Agent
  Remediation Agent
  Threat Intelligence (conditional)
  IP Threat Agent
  Load Balancer Agent
  Summary Agent
  ↓
  Real-time Alerts (SEV-1 / CRITICAL)

```

---

## 🧱 Tech Stack

| Layer | Technology |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| AI Engine | Google Gemini 2.5 Flash |
| UI | React, Tailwind CSS, ShadCN |
| Visualization | Recharts |
| State | In-memory singleton store |
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
│
├── components/
├── lib/
│   ├── services/
│   ├── store.ts
│   ├── types.ts
│   └── utils.ts
│
└── public/
└── sample_logs.csv

````

---

## 🚀 Getting Started

### 1. Install

```bash
cd anomixAI
npm install
````

---

### 2. Configure Environment

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY=your_key_here
REVENUE_PER_MINUTE_PKR=50000
Z_SCORE_THRESHOLD=2.0
MOCK_EMAIL=true
```

---

### 3. Run Project

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🧪 Using the System

1. Upload logs (`CSV / JSON / TXT`)
2. System auto-detects spikes
3. Select incident from dashboard
4. Explore:

   * RCA
   * Impact
   * Remediation
   * Threats
   * Load balancing
5. Chat with AI Copilot
6. View real-time alerts

---

## 📊 Spike Types

| Type             | Meaning                  |
| ---------------- | ------------------------ |
| POSITIVE_SPIKE   | Viral / traffic surge    |
| NEGATIVE_SPIKE   | Drop or degradation      |
| SUSPICIOUS_SPIKE | Possible attack or abuse |

---

## 🤖 Multi-Agent System

Each incident runs through:

* RCA Agent
* Impact Agent
* Correlation Agent
* Remediation Agent
* Threat Intelligence Agent
* IP Analysis Agent
* Load Balancer Agent
* Summary Agent

All outputs are traced in real-time via **Agent Trace UI**.

---

## 📡 API Endpoints

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

Supports:

* CSV
* JSON
* Plaintext logs

---

## 🧠 Key Idea

> From raw logs → to intelligent decisions in seconds

---

## ⚡ Why Anomix?

Because incidents don’t wait.

And neither should your investigation.

---

## 🏁 Final Statement

Anomix transforms raw logs into intelligent decisions — helping organizations detect, understand, and respond to incidents before they become disasters.

```

---

If you want next upgrade, I can also:
- make it **GitHub viral README (with badges + GIF + architecture diagram)**
- or turn it into a **hackathon pitch deck (10 slides)**
```
