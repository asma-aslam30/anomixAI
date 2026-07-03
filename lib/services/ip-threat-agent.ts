import { ClassifiedSpike, IpThreatReport, IpThreatEntry } from "@/lib/types";
import { store } from "@/lib/store";
import { newId } from "@/lib/utils";
import { generateJSON, isAvailable } from "./gemini-client";

// Simulated IP data for demo — in production this would come from parsed logs
function generateSimulatedIps(spike: ClassifiedSpike): { ip: string; requests: number; country: string; region: string }[] {
  const countryPool = [
    { country: "Pakistan", region: "Karachi", flag: "🇵🇰" },
    { country: "China", region: "Beijing", flag: "🇨🇳" },
    { country: "Russia", region: "Moscow", flag: "🇷🇺" },
    { country: "India", region: "Mumbai", flag: "🇮🇳" },
    { country: "USA", region: "New York", flag: "🇺🇸" },
    { country: "Netherlands", region: "Amsterdam", flag: "🇳🇱" },
  ];

  const ipCount = spike.classification === "SUSPICIOUS_SPIKE" ? 12 : 5;
  return Array.from({ length: ipCount }, (_, i) => {
    const geo = countryPool[i % countryPool.length];
    return {
      ip: `${Math.floor(Math.random() * 200 + 50)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      requests: Math.floor(spike.spike_request_count / ipCount) + (i < 3 ? Math.floor(Math.random() * 500) : 0),
      country: geo.country,
      region: geo.region,
    };
  });
}

export async function runIpThreatAgent(spike: ClassifiedSpike): Promise<{ result: IpThreatReport; trace: { status: "success" | "fallback" | "error"; summary: string } }> {
  // Only run for SUSPICIOUS_SPIKE and NEGATIVE_SPIKE (possible attack)
  if (spike.classification === "POSITIVE_SPIKE") {
    const fallback: IpThreatReport = {
      report_id: newId(), spike_id: spike.spike_id,
      total_ips_analyzed: 0, malicious_ips: [], suspicious_ips: [], safe_ips: [],
      top_countries: [], block_recommendations: [],
      threat_summary: "No threat analysis required — positive traffic growth event.",
    };
    return { result: fallback, trace: { status: "success", summary: "Skipped — positive spike, no threat analysis needed" } };
  }

  const simulatedIps = generateSimulatedIps(spike);

  if (!isAvailable()) {
    // Rule-based fallback for SUSPICIOUS_SPIKE
    const malicious: IpThreatEntry[] = simulatedIps.slice(0, 3).map(ip => ({
      ip: ip.ip, country: ip.country, region: ip.region,
      classification: "malicious" as const, confidence: 85,
      request_count: ip.requests, threat_type: "DDoS/bot",
    }));
    const suspicious: IpThreatEntry[] = simulatedIps.slice(3, 6).map(ip => ({
      ip: ip.ip, country: ip.country, region: ip.region,
      classification: "suspicious" as const, confidence: 60,
      request_count: ip.requests,
    }));
    const safe: IpThreatEntry[] = simulatedIps.slice(6).map(ip => ({
      ip: ip.ip, country: ip.country, region: ip.region,
      classification: "safe" as const, confidence: 90,
      request_count: ip.requests,
    }));

    const countryCounts: Record<string, number> = {};
    simulatedIps.forEach(ip => { countryCounts[ip.country] = (countryCounts[ip.country] ?? 0) + ip.requests; });
    const flags: Record<string, string> = { Pakistan: "🇵🇰", China: "🇨🇳", Russia: "🇷🇺", India: "🇮🇳", USA: "🇺🇸", Netherlands: "🇳🇱" };
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count, flag: flags[country] ?? "🌍" }));

    const result: IpThreatReport = {
      report_id: newId(), spike_id: spike.spike_id,
      total_ips_analyzed: simulatedIps.length,
      malicious_ips: malicious, suspicious_ips: suspicious, safe_ips: safe,
      top_countries: topCountries,
      block_recommendations: malicious.map(ip => `Block ${ip.ip} (${ip.country}) — ${ip.threat_type}`),
      threat_summary: `Detected ${malicious.length} malicious and ${suspicious.length} suspicious IPs targeting ${spike.service_name}. Primary threat: automated bot traffic from ${malicious[0]?.country ?? "unknown"}.`,
    };
    store.ipThreatReports[spike.spike_id] = result;
    return { result, trace: { status: "fallback", summary: `Rule-based: ${malicious.length} malicious, ${suspicious.length} suspicious IPs` } };
  }

  try {
    const system = `You are Anomix, a cybersecurity threat intelligence system for a ride-hailing platform (Bykea Pakistan).
Analyze the provided IP addresses and classify them. Respond ONLY with JSON matching:
{
  "classifications": [{"ip":"<ip>","classification":"malicious|suspicious|safe","confidence":<0-100>,"threat_type":"<optional>"},...],
  "block_recommendations": ["<string>",...],
  "threat_summary": "<string max 300 chars>"
}`;

    const user = `Analyze these IPs targeting ${spike.service_name} during a ${spike.classification}:
Peak TPM: ${spike.spike_request_count}
Spike reason: ${spike.classification_reason}

IP data:
${simulatedIps.map(ip => `${ip.ip} — ${ip.country}/${ip.region} — ${ip.requests} requests`).join("\n")}

Classify each IP as malicious/suspicious/safe based on request patterns, geographic origin, and spike context.`;

    const raw = await generateJSON<{
      classifications: { ip: string; classification: string; confidence: number; threat_type?: string }[];
      block_recommendations: string[];
      threat_summary: string;
    }>(system, user);

    if (!raw?.classifications) throw new Error("Invalid response");

    const malicious: IpThreatEntry[] = [];
    const suspicious: IpThreatEntry[] = [];
    const safe: IpThreatEntry[] = [];

    for (const cls of raw.classifications) {
      const ipData = simulatedIps.find(i => i.ip === cls.ip);
      const entry: IpThreatEntry = {
        ip: cls.ip,
        country: ipData?.country ?? "Unknown",
        region: ipData?.region ?? "Unknown",
        classification: (["malicious", "suspicious", "safe"].includes(cls.classification) ? cls.classification : "suspicious") as "malicious" | "suspicious" | "safe",
        confidence: Math.min(100, Math.max(0, cls.confidence ?? 50)),
        request_count: ipData?.requests ?? 0,
        threat_type: cls.threat_type,
      };
      if (entry.classification === "malicious") malicious.push(entry);
      else if (entry.classification === "suspicious") suspicious.push(entry);
      else safe.push(entry);
    }

    const countryCounts: Record<string, number> = {};
    simulatedIps.forEach(ip => { countryCounts[ip.country] = (countryCounts[ip.country] ?? 0) + ip.requests; });
    const flags: Record<string, string> = { Pakistan: "🇵🇰", China: "🇨🇳", Russia: "🇷🇺", India: "🇮🇳", USA: "🇺🇸", Netherlands: "🇳🇱" };
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([country, count]) => ({ country, count, flag: flags[country] ?? "🌍" }));

    const result: IpThreatReport = {
      report_id: newId(), spike_id: spike.spike_id,
      total_ips_analyzed: simulatedIps.length,
      malicious_ips: malicious, suspicious_ips: suspicious, safe_ips: safe,
      top_countries: topCountries,
      block_recommendations: Array.isArray(raw.block_recommendations) ? raw.block_recommendations : [],
      threat_summary: raw.threat_summary?.slice(0, 300) ?? "Threat analysis complete.",
    };

    store.ipThreatReports[spike.spike_id] = result;
    return { result, trace: { status: "success", summary: `AI: ${malicious.length} malicious, ${suspicious.length} suspicious IPs identified` } };
  } catch (e) {
    console.error("[IpThreatAgent] Error:", e);
    // Return rule-based fallback directly — no recursion
    const ips = generateSimulatedIps(spike);
    const flags: Record<string, string> = { Pakistan: "🇵🇰", China: "🇨🇳", Russia: "🇷🇺", India: "🇮🇳", USA: "🇺🇸", Netherlands: "🇳🇱" };
    const countryCounts: Record<string, number> = {};
    ips.forEach(ip => { countryCounts[ip.country] = (countryCounts[ip.country] ?? 0) + ip.requests; });
    const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, count]) => ({ country, count, flag: flags[country] ?? "🌍" }));
    const malicious: IpThreatEntry[] = ips.slice(0, 2).map(ip => ({ ip: ip.ip, country: ip.country, region: ip.region, classification: "malicious" as const, confidence: 75, request_count: ip.requests, threat_type: "bot/scraper" }));
    const result: IpThreatReport = {
      report_id: newId(), spike_id: spike.spike_id, total_ips_analyzed: ips.length,
      malicious_ips: malicious, suspicious_ips: [], safe_ips: ips.slice(2).map(ip => ({ ip: ip.ip, country: ip.country, region: ip.region, classification: "safe" as const, confidence: 80, request_count: ip.requests })),
      top_countries: topCountries, block_recommendations: malicious.map(ip => `Block ${ip.ip} (${ip.country})`),
      threat_summary: `Threat analysis used fallback due to API error. ${malicious.length} IPs flagged as potentially malicious.`,
    };
    store.ipThreatReports[spike.spike_id] = result;
    return { result, trace: { status: "fallback", summary: "API error — rule-based fallback used" } };
  }
}
