import React, { useState, useCallback, useEffect } from 'react';
import { Activity, Server, Layers, Zap } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import TrafficGraph from '../components/TrafficGraph';
import PacketTable from '../components/PacketTable';
import { useSocket } from '../hooks/useSocket';
import { fetchStats } from '../services/api';
import type { Stats } from '../types';

const formatBytes = (b: number) => {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
  return `${b} B`;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
    const interval = setInterval(() => fetchStats().then(setStats).catch(() => {}), 5000);
    return () => clearInterval(interval);
  }, []);

  const onStats = useCallback((s: Stats) => setStats(s), []);
  useSocket<Stats>('stats', onStats);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Network Dashboard</h1>
        <p>Real-time packet capture and traffic analysis</p>
      </div>

      <div className="stats-grid">
        <StatsCard
          title="Total Packets"
          value={stats?.total_packets.toLocaleString() ?? '—'}
          icon={Layers}
          color="cyan"
          subtitle="Since session start"
        />
        <StatsCard
          title="Total Traffic"
          value={stats ? formatBytes(stats.total_bytes) : '—'}
          icon={Activity}
          color="purple"
          subtitle="Bytes captured"
        />
        <StatsCard
          title="Packets / Sec"
          value={stats?.packets_per_sec.toFixed(2) ?? '—'}
          icon={Zap}
          color="green"
          subtitle="Rolling average"
        />
        <StatsCard
          title="Uptime"
          value={stats ? `${Math.floor(stats.uptime_seconds / 60)}m ${stats.uptime_seconds % 60}s` : '—'}
          icon={Server}
          color="orange"
          subtitle="Backend session"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Traffic Rate</span>
            <span className="text-xs text-muted">Packets per second · last 60s</span>
          </div>
          <TrafficGraph />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Protocol Distribution</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {stats && Object.entries(stats.protocol_counts).length > 0 ? (
              Object.entries(stats.protocol_counts)
                .sort(([, a], [, b]) => b - a)
                .map(([proto, count]) => {
                  const total = Object.values(stats.protocol_counts).reduce((a, b) => a + b, 0);
                  const pct = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={proto} className="ip-bar-row">
                      <span className="ip-bar-label">{proto}</span>
                      <div className="ip-bar-track">
                        <div className="ip-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="ip-bar-value">{pct}%</span>
                    </div>
                  );
                })
            ) : (
              <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 20 }}>
                No data yet
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Live Packet Feed</span>
          <span className="text-xs text-muted">Last 200 packets</span>
        </div>
        <PacketTable />
      </div>
    </div>
  );
};

export default Dashboard;
