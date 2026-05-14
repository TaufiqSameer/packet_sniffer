export interface Packet {
  id: string;
  timestamp: number;
  src_ip: string;
  dst_ip: string;
  protocol: string;
  src_port: number;
  dst_port: number;
  length: number;
}

export interface Alert {
  id: string;
  timestamp: number;
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  src_ip: string;
}

export interface Stats {
  total_packets: number;
  total_bytes: number;
  packets_per_sec: number;
  protocol_counts: Record<string, number>;
  uptime_seconds: number;
}

export interface TopIP {
  ip: string;
  bytes: number;
  packets: number;
}
