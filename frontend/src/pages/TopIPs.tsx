import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchTopIPs } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type { TopIP, Stats } from '../types';

const formatBytes = (b: number) => {
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
  return `${b} B`;
};

const gradients = [
  'linear-gradient(90deg, #06b6d4, #8b5cf6)',
  'linear-gradient(90deg, #8b5cf6, #ec4899)',
  'linear-gradient(90deg, #10b981, #06b6d4)',
  'linear-gradient(90deg, #f59e0b, #ef4444)',
  'linear-gradient(90deg, #ef4444, #8b5cf6)',
];

const TopIPs: React.FC = () => {
  const [topIPs, setTopIPs] = useState<TopIP[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchTopIPs(15)
      .then(setTopIPs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  // Refresh on new stats from socket too
  const onStats = useCallback((_stats: Stats) => { load(); }, [load]);
  useSocket<Stats>('stats', onStats);

  const max = topIPs[0]?.bytes ?? 1;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Top IP Addresses</h1>
            <p>Devices consuming the most bandwidth — auto-refreshes every 5s</p>
          </div>
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {topIPs.length === 0 ? (
        <div className="card empty-state">
          <h3>No data yet</h3>
          <p>Start the Python sniffer to see bandwidth consumers</p>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            <div className="card-header">
              <span className="card-title">Bandwidth by Source IP</span>
              <span className="text-xs text-muted">Top {topIPs.length} addresses</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              {topIPs.map((ip, i) => (
                <div key={ip.ip} className="ip-bar-row" style={{ marginBottom: 14 }}>
                  <span className="ip-bar-label" style={{ color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 6, fontSize: 11 }}>#{i + 1}</span>
                    {ip.ip}
                  </span>
                  <div className="ip-bar-track" style={{ height: 10 }}>
                    <div
                      className="ip-bar-fill"
                      style={{
                        width: `${(ip.bytes / max) * 100}%`,
                        background: gradients[i % gradients.length],
                      }}
                    />
                  </div>
                  <span className="ip-bar-value">{formatBytes(ip.bytes)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Full Table</span>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>IP Address</th>
                    <th>Total Bytes</th>
                    <th>Packets</th>
                    <th>Avg Pkt Size</th>
                  </tr>
                </thead>
                <tbody>
                  {topIPs.map((ip, i) => (
                    <tr key={ip.ip}>
                      <td className="text-muted">#{i + 1}</td>
                      <td className="text-cyan">{ip.ip}</td>
                      <td>{formatBytes(ip.bytes)}</td>
                      <td>{ip.packets.toLocaleString()}</td>
                      <td>{ip.packets > 0 ? formatBytes(Math.round(ip.bytes / ip.packets)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TopIPs;
