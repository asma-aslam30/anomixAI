<div align="center">

# 🛡️ AnomixAI — Sentinel AI

### Incident Intelligence & Response Platform

**Upload logs → Detect anomalies → Get AI-powered root cause analysis, business impact, and remediation — in seconds.**

Built for the Hackathon · Powered by **Google Gemini 2.5 Flash** & **Next.js 14**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

</div>

---

## 📑 Table of Contents

1. [The Problem](#-the-problem)
2. [The Story: A Friday Evening Incident](#-the-story-a-friday-evening-incident)
3. [Why Anomix Exists](#-why-anomix-exists)
4. [What It Does](#️-what-it-does)
5. [How It Works](#-how-it-works)
6. [Demo Pipeline](#-demo-pipeline)
7. [Multi-Agent AI System](#-multi-agent-ai-system)
8. [Spike Classification](#-spike-classification)
9. [Tech Stack](#-tech-stack)
10. [Project Structure](#-project-structure)
11. [Getting Started](#-getting-started)
12. [Environment Variables](#-environment-variables)
13. [API Reference](#-api-reference)
14. [Log Format Support](#-log-format-support)
15. [Why Choose Anomix](#-why-choose-anomix)
16. [Roadmap](#-roadmap)
17. [Contributing](#-contributing)
18. [License](#-license)

---

## 🚨 The Problem

Not every traffic spike is an incident — but every spike gets treated like one.

Engineering teams routinely burn **30–60 minutes** investigating alerts that turn out to be nothing:

- A viral product moment
- A scheduled deployment
- A marketing campaign that worked *too well*
- Seasonal traffic (Black Friday, flash sales, etc.)

The cost isn't just wasted time — it's **alert fatigue**, **delayed decision-making**, and **eroded trust** in the monitoring stack itself.

---

## 🎬 The Story: A Friday Evening Incident

> **6:45 PM, Friday.** Everyone is getting ready to leave the office.

Suddenly:

- 🔺 CPU usage jumps to **95%**
- 🔺 Requests per second spike sharply
- 🔺 Error rates start climbing

Chaos follows:

- **Slack** starts exploding with alerts
- **DevOps** opens Grafana, scrambling for answers
- **Backend engineers** start digging through raw logs
- **Security** suspects a DDoS attack
- **Management** wants answers — immediately

### ❓ Is this a real incident, or just a healthy spike?

Nobody knows yet. And that uncertainty is expensive.

An hour later, the verdict comes in:

> *"It was just a successful marketing campaign."*

No attack. No outage. No real emergency. Just an hour of engineering time, stress, and delayed priorities — spent answering a question that AI could have answered in seconds.

**This is exactly the gap Anomix was built to close.**

---

## 💡 Why Anomix Exists

**Anomix – Sentinel AI** is an AI-powered **Incident Intelligence & Response** platform that understands an incident *before* engineers waste time investigating it manually.

Instead of humans staring at dashboards trying to reconstruct what happened, Anomix ingests raw logs and instantly tells you:

- What happened
- Why it happened
- How much it's costing the business
- What to do about it — right now and long-term

It accepts logs in the formats teams already have lying around:

| Format | Supported |
|---|---|
| CSV | ✅ |
| JSON | ✅ |
| Plaintext | ✅ |

All processed in **seconds**, not hours.

---

## ⚙️ What It Does

Anomix runs a full incident-response workflow and produces a complete intelligence report:

| Capability | Description |
|---|---|
| 🔍 **Root Cause Analysis (RCA)** | AI-generated explanation of *why* the anomaly occurred |
| 💰 **Business Impact Estimation** | Affected users, downtime duration, and estimated revenue loss (in **PKR**) |
| 🛠 **Remediation Plans** | Both short-term mitigations and long-term structural fixes |
| 🔗 **Correlation Analysis** | Detects cross-service failures and cascading effects |
| 🛡 **Threat Intelligence** | Flags potential DDoS attacks or abuse patterns |
| 🌐 **IP Threat Reports** | Identifies and reports on malicious/suspicious IP addresses |
| ⚖️ **Load Balancer Recommendations** | Suggests traffic distribution or scaling adjustments |
| 🧾 **Executive Summary** | A concise, non-technical summary (≤ 300 words) for leadership |
| 📡 **Real-Time Alerts** | Delivered via Server-Sent Events (SSE), email, and mock WhatsApp notifications |
| 🤖 **AI Copilot Chat** | Ask natural-language questions about the incident and get contextual answers |

---

## 🧪 How It Works

The end-to-end flow, from raw log upload to actionable insight:

1. **Upload logs** — CSV, JSON, or plaintext
2. **Anomaly detection** — statistical Z-score analysis flags deviations
3. **Spike classification** — the anomaly is categorized by type and severity
4. **Multi-agent AI pipeline** — specialized agents analyze the incident in parallel/sequence
5. **Report generation** — RCA, business impact, remediation plans, and threat detection are compiled
6. **Real-time alerting** — critical incidents are pushed out immediately
7. **Conversational follow-up** — the AI Copilot is available for deeper Q&A

---

## 🧠 Demo Pipeline

```

                    Upload Logs
                        │
                        ▼
            Z-Score Spike Detection
                        │
                        ▼
                  Classification
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
POSITIVE_SPIKE   NEGATIVE_SPIKE   SUSPICIOUS_SPIKE
      │                 │                 │
      └─────────────────┼─────────────────┘
                        ▼
              Multi-Agent AI System
      ┌──────────┬──────────┬──────────────┬─────────────┐
      ▼          ▼          ▼              ▼             ▼
  RCA Agent  Impact +   Remediation   Threat Intel   IP Threat /
             Correlation    Agent    Agent (cond.)  Load Balancer
              Agents                                    Agents
      └──────────┴──────────┴──────────────┴─────────────┘
                        ▼
                  Summary Agent
                        ▼
        Real-Time Alerts (SEV-1 / CRITICAL)

```

---

## 🤖 Multi-Agent AI System

Anomix doesn't rely on a single monolithic prompt — it orchestrates a team of specialized AI agents, each responsible for one dimension of the incident:

| Agent | Responsibility |
|---|---|
| **RCA Agent** | Determines the root cause of the anomaly |
| **Impact Agent** | Estimates affected users, downtime, and revenue loss |
| **Correlation Agent** | Cross-references related services to find cascading failures |
| **Remediation Agent** | Produces short-term and long-term fix recommendations |
| **Threat Intelligence Agent** | Runs conditionally when abuse/attack patterns are suspected |
| **IP Analysis Agent** | Investigates and reports on suspicious IP addresses |
| **Load Balancer Agent** | Recommends traffic routing or scaling changes |
| **Summary Agent** | Synthesizes everything into a concise executive summary |

Every agent's output is logged in an **Agent Trace system**, giving full transparency into how the AI reached its conclusions — useful for both debugging and building trust in the system's recommendations.

---

## 📊 Spike Classification

| Type | Meaning |
|---|---|
| `POSITIVE_SPIKE` | Traffic surge — viral growth, marketing success, or legitimate load increase |
| `NEGATIVE_SPIKE` | Service degradation — dropping performance or availability |
| `SUSPICIOUS_SPIKE` | Potential attack or abuse pattern requiring threat analysis |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **AI Engine** | Google Gemini 2.5 Flash |
| **UI** | React, Tailwind CSS, ShadCN UI |
| **Data Visualization** | Recharts |
| **State Management** | In-memory store |
| **Real-Time Alerts** | Server-Sent Events (SSE) |

---

## 📁 Project Structure

```

anomixAI/
├── app/
│   ├── api/
│   │   ├── upload-logs/        # Handles log ingestion (CSV/JSON/TXT)
│   │   ├── analyze/            # Runs Z-score anomaly detection
│   │   ├── rca/                # Root Cause Analysis endpoint
│   │   ├── impact/             # Business impact estimation endpoint
│   │   ├── fix/                # Remediation plan generation
│   │   ├── chat/                # AI Copilot conversational endpoint
│   │   ├── orchestrate/         # Coordinates the multi-agent pipeline
│   │   ├── logs/                # Log retrieval endpoint
│   │   ├── health/              # Health check endpoint
│   │   └── alerts/stream/       # SSE endpoint for real-time alerts
│   ├── layout.tsx
│   └── page.tsx
├── components/                  # UI components
├── lib/
│   ├── services/                 # Core business logic & AI agent services
│   ├── store.ts                  # In-memory state store
│   ├── types.ts                  # Shared TypeScript types
│   └── utils.ts                  # Utility functions
└── public/
    └── sample_logs.csv           # Sample log file for testing

```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/anomixAI.git
cd anomixAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your own values (see [Environment Variables](#-environment-variables) below).

### 4. Run the development server

```bash
npm run dev
```

### 5. Open the app

Navigate to:

```
http://localhost:3000
```

---

## 🔐 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key | `your_api_key_here` |
| `REVENUE_PER_MINUTE_PKR` | Estimated revenue per minute, used for business impact calculations | `50000` |
| `Z_SCORE_THRESHOLD` | Sensitivity threshold for anomaly detection | `2.0` |
| `MOCK_EMAIL` | Whether to mock email alerts instead of sending real ones | `true` |

Example `.env.local`:

```env
GEMINI_API_KEY=your_api_key_here
REVENUE_PER_MINUTE_PKR=50000
Z_SCORE_THRESHOLD=2.0
MOCK_EMAIL=true
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check for the service |
| `POST` | `/api/upload-logs` | Upload logs (CSV/JSON/TXT) for processing |
| `POST` | `/api/analyze` | Run Z-score anomaly detection on uploaded logs |
| `POST` | `/api/rca` | Trigger Root Cause Analysis |
| `POST` | `/api/impact` | Get business impact estimates |
| `POST` | `/api/fix` | Generate remediation plans |
| `POST` | `/api/orchestrate` | Run the full multi-agent pipeline end-to-end |
| `POST` | `/api/chat` | Chat with the AI Copilot about an incident |
| `GET` | `/api/logs` | Retrieve stored/processed logs |
| `GET` | `/api/alerts/stream` | Subscribe to real-time alerts via SSE |

---

## 📄 Log Format Support

### CSV / Structured format

```
timestamp, service_name, request_count, error_rate, latency_ms
```

### Also supported

- **JSON** logs
- **Plaintext** logs

Anomix automatically detects the format and normalizes it internally before running anomaly detection.

---

## ⚡ Why Choose Anomix?

Because incidents don't wait — and neither should your investigation.

Anomix replaces hours of manual log-digging and cross-team Slack threads with a single, AI-driven pipeline that tells you **what happened, why, how much it costs, and what to do next** — all before your team finishes opening Grafana.

---

## 🗺️ Roadmap

> Ideas for future iterations beyond the hackathon build:

- [ ] Persistent database storage (replace in-memory store)
- [ ] Real email/WhatsApp integrations (beyond mock mode)
- [ ] Historical incident dashboard & analytics
- [ ] Multi-tenant support for teams/organizations
- [ ] Configurable alerting rules and thresholds per service
- [ ] Integration with existing observability tools (Grafana, Datadog, etc.)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** — see the `LICENSE` file for details.

---

<div align="center">

### 🏁 Final Statement

**Anomix transforms raw logs into intelligent decisions** — helping organizations detect, understand, and respond to incidents before they become disasters.

</div>
