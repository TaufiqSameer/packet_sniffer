import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Shield, Info, RefreshCw } from 'lucide-react';
import { fetchAlerts } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type { Alert } from '../types';

const severityIcon = (s: Alert['severity']) => {
  if (s === 'critical') return <AlertTriangle size={16} color="var(--accent-red)" />;
  if (s === 'warning')  return <AlertTriangle size={16} color="var(--accent-orange)" />;
  return <Info size={16} color="var(--accent-cyan)" />;
};

const Alerts: React.FC = () => {
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [filter, setFilter]       = useState<string>('ALL');
  const [loading, setLoading]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchAlerts()
      .then(setAlerts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onNewAlerts = useCallback((incoming: Alert[]) => {
    setAlerts(prev => [...incoming, ...prev].slice(0, 200));
  }, []);

  useSocket<Alert[]>('alerts', onNewAlerts);

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.severity === filter);
  const critCount = alerts.filter(a => a.severity === 'critical').length;
  const warnCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Security Alerts</h1>
            <p>Anomaly detection — port scans, large payloads, ICMP floods</p>
          </div>
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-red)' } as React.CSSProperties}>
          <div className="stat-icon" style={{ background: 'var(--accent-red-glow)' }}>
            <AlertTriangle size={20} color="var(--accent-red)" />
          </div>
          <div className="stat-value">{critCount}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-orange)' } as React.CSSProperties}>
          <div className="stat-icon" style={{ background: 'var(--accent-orange-glow)' }}>
            <Shield size={20} color="var(--accent-orange)" />
          </div>
          <div className="stat-value">{warnCount}</div>
          <div className="stat-label">Warnings</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-cyan)' } as React.CSSProperties}>
          <div className="stat-icon" style={{ background: 'var(--accent-cyan-glow)' }}>
            <Info size={20} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value">{alerts.length}</div>
          <div className="stat-label">Total Alerts</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Alert Feed</span>
          <div className="flex gap-2">
            {(['ALL', 'critical', 'warning', 'info'] as const).map(s => (
              <button
                key={s}
                className={`btn btn-ghost`}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  background: filter === s ? 'rgba(6,182,212,0.15)' : undefined,
                  color: filter === s ? 'var(--accent-cyan)' : undefined,
                  borderColor: filter === s ? 'rgba(6,182,212,0.3)' : undefined,
                }}
                onClick={() => setFilter(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Shield size={40} />
            <h3>No alerts</h3>
            <p>The network looks clean — no anomalies detected yet</p>
          </div>
        ) : (
          <div className="alert-feed">
            {filtered.map(alert => (
              <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                <div>{severityIcon(alert.severity)}</div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <span className={`severity-badge severity-${alert.severity}`}>{alert.severity}</span>
                    <span className="text-xs text-muted text-mono">{alert.type}</span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-meta">
                    {new Date(alert.timestamp).toLocaleString()} · src: {alert.src_ip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
