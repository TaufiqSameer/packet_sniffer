import type { Packet, Alert, Stats, TopIP } from "../types";

const BASE = "http://localhost:5000/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export const fetchPackets = (limit = 100) => get<Packet[]>(`/packets?limit=${limit}`);
export const fetchStats = () => get<Stats>("/stats");
export const fetchAlerts = () => get<Alert[]>("/alerts");
export const fetchTopIPs = (n = 10) => get<TopIP[]>(`/top-ips?n=${n}`);

export async function clearData(): Promise<void> {
  await fetch(`${BASE}/clear`, { method: "DELETE" });
}

export function downloadCSV(): void {
  window.open(`${BASE}/export/csv`, "_blank");
}

export function downloadJSON(): void {
  window.open(`${BASE}/export/json`, "_blank");
}
