import { EventEmitter } from "events";
import { Alert, AlertStatus, ClassifiedSpike, SeverityLevel } from "@/lib/types";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import nodemailer from "nodemailer";

// Module-level EventEmitter for SSE route subscription
export const alertEmitter = new EventEmitter();
alertEmitter.setMaxListeners(50);

export function assignSeverity(spike: ClassifiedSpike): SeverityLevel {
  if (spike.classification === "POSITIVE_SPIKE") return "SEV-3";
  if (spike.classification === "SUSPICIOUS_SPIKE") return "SEV-2";
  return spike.confidence_score >= 70 ? "CRITICAL" : "SEV-1";
}

export async function sendEmail(alert: Alert, spike: ClassifiedSpike): Promise<AlertStatus> {
  const to = process.env.ALERT_EMAIL ?? "alerts@sentinelai.local";
  const subject = `[${alert.severity}] Incident on ${spike.service_name}`;
  const body = `
SentinelAI Alert
----------------
Incident ID  : ${alert.incident_id}
Severity     : ${alert.severity}
Service      : ${spike.service_name}
Classification: ${spike.classification}
Summary      : ${spike.classification_reason}
Detected At  : ${spike.timestamp}
  `.trim();

  const pass = process.env.SMTP_PASS;
  const isMock = process.env.MOCK_EMAIL === "true" || !pass;

  if (isMock) {
    console.log(`█████████████████████████████████████████████████████████████████`);
    console.log(`📧 ALERT EMAIL (mocked — no SMTP_PASS set)`);
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:\n${body}`);
    console.log(`█████████████████████████████████████████████████████████████████`);
    return "sent";
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass },
    });
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text: body,
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return "sent";
  } catch (err) {
    console.error(`[EMAIL FAILED] To: ${to} | ${err instanceof Error ? err.message : err}`);
    return "failed";
  }
}

export async function sendWhatsApp(alert: Alert, spike: ClassifiedSpike): Promise<AlertStatus> {
  const url = process.env.WHATSAPP_WEBHOOK_URL;
  if (!url) return "failed";

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incident_id: alert.incident_id,
        severity: alert.severity,
        classification: spike.classification,
        service_name: spike.service_name,
        summary: spike.classification_reason,
      }),
    });
    return resp.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export async function sendSms(alert: Alert, spike: ClassifiedSpike): Promise<AlertStatus> {
  const url = process.env.SMS_WEBHOOK_URL;
  const message = `[${alert.severity}] ${spike.service_name}: ${spike.classification_reason} (ID: ${alert.incident_id})`;

  if (!url) {
    console.log(`[MOCK SMS] To: ${process.env.ALERT_EMAIL}\n${message}`);
    return "sent";
  }

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: process.env.ALERT_EMAIL,
        message,
        incident_id: alert.incident_id,
        severity: alert.severity,
      }),
    });
    return resp.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export function sendBrowser(alert: Alert): AlertStatus {
  alertEmitter.emit("alert", alert);
  return "sent";
}

export async function dispatch(incident: ClassifiedSpike): Promise<Alert[]> {
  const severity = assignSeverity(incident);

  // Only dispatch for SEV-1 and CRITICAL
  if (severity !== "SEV-1" && severity !== "CRITICAL") return [];

  const now = new Date().toISOString();
  const alerts: Alert[] = [];

  // Email channel
  try {
    const emailAlert: Alert = {
      alert_id: newId(),
      incident_id: incident.spike_id,
      channel: "email",
      severity,
      dispatched_at: now,
      status: "sent",
    };
    const emailStatus = await sendEmail(emailAlert, incident);
    emailAlert.status = emailStatus;
    alerts.push(emailAlert);
  } catch {
    alerts.push({ alert_id: newId(), incident_id: incident.spike_id, channel: "email", severity, dispatched_at: now, status: "failed" });
  }

  // WhatsApp channel
  try {
    const waAlert: Alert = {
      alert_id: newId(),
      incident_id: incident.spike_id,
      channel: "whatsapp",
      severity,
      dispatched_at: now,
      status: "sent",
    };
    const waStatus = await sendWhatsApp(waAlert, incident);
    waAlert.status = waStatus;
    alerts.push(waAlert);
  } catch {
    alerts.push({ alert_id: newId(), incident_id: incident.spike_id, channel: "whatsapp", severity, dispatched_at: now, status: "failed" });
  }

  // SMS / Text channel
  try {
    const smsAlert: Alert = {
      alert_id: newId(),
      incident_id: incident.spike_id,
      channel: "sms",
      severity,
      dispatched_at: now,
      status: "sent",
    };
    const smsStatus = await sendSms(smsAlert, incident);
    smsAlert.status = smsStatus;
    alerts.push(smsAlert);
  } catch {
    alerts.push({ alert_id: newId(), incident_id: incident.spike_id, channel: "sms", severity, dispatched_at: now, status: "failed" });
  }

  // Browser/SSE channel
  try {
    const browserAlert: Alert = {
      alert_id: newId(),
      incident_id: incident.spike_id,
      channel: "browser",
      severity,
      dispatched_at: now,
      status: "sent",
    };
    const browserStatus = sendBrowser(browserAlert);
    browserAlert.status = browserStatus;
    alerts.push(browserAlert);
  } catch {
    alerts.push({ alert_id: newId(), incident_id: incident.spike_id, channel: "browser", severity, dispatched_at: now, status: "failed" });
  }

  // Write all alerts to store
  store.alerts.push(...alerts);
  return alerts;
}
