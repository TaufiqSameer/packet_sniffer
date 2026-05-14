import React, { useEffect, useState } from 'react';
import { FileText, Code2, Database, ExternalLink } from 'lucide-react';
import { downloadCSV, downloadJSON, fetchPackets } from '../services/api';
import type { Packet } from '../types';

const formatBytes = (b: number) => {
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
  return `${b} B`;
};

const estimateCSVSize = (count: number) => count * 120; // ~120 bytes per row
const estimateJSONSize = (count: number) => count * 200;

const Export: React.FC = () => {
  const [packets, setPackets]   = useState<Packet[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPackets(10)
      .then(setPackets)
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetchPackets(10).then(setPackets).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Export Data</h1>
        <p>Download captured packet data in your preferred format</p>
      </div>

      <div className="export-grid mb-6">
        {/* CSV Card */}
        <div className="export-card">
          <div className="export-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <FileText size={28} color="var(--accent-green)" />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>CSV Export</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Comma-separated values — compatible with Excel, Google Sheets, and most data tools.
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Headers: id, timestamp, src_ip, dst_ip, protocol, src_port, dst_port, length</span>
          </div>
          <button className="btn btn-success" style={{ marginTop: 4 }} onClick={downloadCSV}>
            <ExternalLink size={13} />
            Download CSV
          </button>
        </div>

        {/* JSON Card */}
        <div className="export-card">
          <div className="export-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
            <Code2 size={28} color="var(--accent-purple)" />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>JSON Export</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Structured JSON array — ideal for programmatic processing, APIs, and custom analysis.
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Format: Array of packet objects with all fields</span>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={downloadJSON}>
            <ExternalLink size={13} />
            Download JSON
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="card" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', marginBottom: 20 }}>
        <div className="flex items-center gap-4">
          <Database size={24} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              Session Data Only
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Exports contain all packets captured since the backend started. Clearing data will reset the export.
              Database persistence will be added in a future release.
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Preview — Last 10 Packets</span>
          {packets.length > 0 && (
            <div className="flex gap-4 text-xs text-muted">
              <span>CSV: ~{formatBytes(estimateCSVSize(packets.length))}</span>
              <span>JSON: ~{formatBytes(estimateJSONSize(packets.length))}</span>
            </div>
          )}
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Src IP</th>
                <th>Dst IP</th>
                <th>Protocol</th>
                <th>Src Port</th>
                <th>Dst Port</th>
                <th>Length</th>
              </tr>
            </thead>
            <tbody>
              {packets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                    {loading ? 'Loading...' : 'No packets captured yet'}
                  </td>
                </tr>
              ) : (
                packets.map(p => (
                  <tr key={p.id}>
                    <td className="text-muted">{new Date(p.timestamp * 1000).toLocaleTimeString()}</td>
                    <td className="text-cyan">{p.src_ip}</td>
                    <td className="text-purple">{p.dst_ip}</td>
                    <td>{p.protocol}</td>
                    <td>{p.src_port || '—'}</td>
                    <td>{p.dst_port || '—'}</td>
                    <td>{p.length.toLocaleString()} B</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Export;
