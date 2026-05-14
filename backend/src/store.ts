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

const MAX_PACKETS = 2000;
const MAX_ALERTS = 200;

class PacketStore {
  private packets: Packet[] = [];
  private alerts: Alert[] = [];
  private bandwidthByIP: Map<string, number> = new Map();
  private packetsByIP: Map<string, number> = new Map();
  private protocolCounts: Map<string, number> = new Map();
  private totalBytes = 0;
  private startTime = Date.now();

  // Port scan detection: track ports per IP per window
  private portScanTracker: Map<string, { ports: Set<number>; ts: number }> = new Map();
  // ICMP flood detection
  private icmpTracker: Map<string, { count: number; ts: number }> = new Map();

  private idCounter = 0;

  addPackets(incoming: Omit<Packet, "id">[]): { packets: Packet[]; alerts: Alert[] } {
    const newPackets: Packet[] = [];
    const newAlerts: Alert[] = [];

    for (const p of incoming) {
      const packet: Packet = { ...p, id: `pkt-${++this.idCounter}` };
      this.packets.push(packet);
      if (this.packets.length > MAX_PACKETS) this.packets.shift();

      // Bandwidth tracking
      const prev = this.bandwidthByIP.get(p.src_ip) ?? 0;
      this.bandwidthByIP.set(p.src_ip, prev + p.length);
      const prevPkts = this.packetsByIP.get(p.src_ip) ?? 0;
      this.packetsByIP.set(p.src_ip, prevPkts + 1);
      this.totalBytes += p.length;

      // Protocol counts
      const proto = p.protocol || "OTHER";
      this.protocolCounts.set(proto, (this.protocolCounts.get(proto) ?? 0) + 1);

      // Alert: large payload
      if (p.length > 10000) {
        newAlerts.push(this.makeAlert("LARGE_PAYLOAD", "warning", `Large packet (${p.length} bytes) from ${p.src_ip}`, p.src_ip));
      }

      // Alert: port scan detection
      const now = Date.now();
      const psEntry = this.portScanTracker.get(p.src_ip);
      if (!psEntry || now - psEntry.ts > 10000) {
        this.portScanTracker.set(p.src_ip, { ports: new Set([p.dst_port]), ts: now });
      } else {
        psEntry.ports.add(p.dst_port);
        if (psEntry.ports.size > 15) {
          newAlerts.push(this.makeAlert("PORT_SCAN", "critical", `Possible port scan from ${p.src_ip} (${psEntry.ports.size} unique ports in 10s)`, p.src_ip));
          this.portScanTracker.delete(p.src_ip); // reset after alert
        }
      }

      // Alert: ICMP flood
      if (proto === "ICMP") {
        const icmpEntry = this.icmpTracker.get(p.src_ip);
        if (!icmpEntry || now - icmpEntry.ts > 5000) {
          this.icmpTracker.set(p.src_ip, { count: 1, ts: now });
        } else {
          icmpEntry.count++;
          if (icmpEntry.count > 50) {
            newAlerts.push(this.makeAlert("ICMP_FLOOD", "critical", `ICMP flood from ${p.src_ip} (${icmpEntry.count} packets in 5s)`, p.src_ip));
            this.icmpTracker.delete(p.src_ip);
          }
        }
      }

      newPackets.push(packet);
    }

    for (const alert of newAlerts) {
      this.alerts.push(alert);
      if (this.alerts.length > MAX_ALERTS) this.alerts.shift();
    }

    return { packets: newPackets, alerts: newAlerts };
  }

  private makeAlert(type: string, severity: Alert["severity"], message: string, src_ip: string): Alert {
    return {
      id: `alert-${++this.idCounter}`,
      timestamp: Date.now(),
      type,
      severity,
      message,
      src_ip,
    };
  }

  getPackets(limit = 100): Packet[] {
    return this.packets.slice(-limit);
  }

  getAllPackets(): Packet[] {
    return [...this.packets];
  }

  getAlerts(): Alert[] {
    return [...this.alerts].reverse();
  }

  getTopIPs(n = 10): TopIP[] {
    const entries: TopIP[] = [];
    for (const [ip, bytes] of this.bandwidthByIP.entries()) {
      entries.push({ ip, bytes, packets: this.packetsByIP.get(ip) ?? 0 });
    }
    return entries.sort((a, b) => b.bytes - a.bytes).slice(0, n);
  }

  getStats(): Stats {
    const uptimeSec = (Date.now() - this.startTime) / 1000;
    const protocol_counts: Record<string, number> = {};
    for (const [k, v] of this.protocolCounts.entries()) protocol_counts[k] = v;

    return {
      total_packets: this.packets.length,
      total_bytes: this.totalBytes,
      packets_per_sec: parseFloat((this.packets.length / Math.max(uptimeSec, 1)).toFixed(2)),
      protocol_counts,
      uptime_seconds: Math.floor(uptimeSec),
    };
  }

  clearAll(): void {
    this.packets = [];
    this.alerts = [];
    this.bandwidthByIP.clear();
    this.packetsByIP.clear();
    this.protocolCounts.clear();
    this.totalBytes = 0;
    this.startTime = Date.now();
    this.portScanTracker.clear();
    this.icmpTracker.clear();
    this.idCounter = 0;
  }
}

export const store = new PacketStore();
