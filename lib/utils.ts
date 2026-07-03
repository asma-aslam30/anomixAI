import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPKR(n: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function parseTimestamp(raw: string | number): Date {
  if (typeof raw === "number") {
    const d = new Date(raw < 1e10 ? raw * 1000 : raw);
    if (isNaN(d.getTime())) throw new Error(`Unparseable timestamp: ${raw}`);
    return d;
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  throw new Error(`Unparseable timestamp: ${raw}`);
}
