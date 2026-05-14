import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { fetchPackets } from '../services/api';
import type { Packet } from '../types';

const MAX_DISPLAY = 200;

const getProtocolClass = (proto: string) => {
  switch (proto.toUpperCase()) {
    case 'TCP':  return 'proto-tcp';
    case 'UDP':  return 'proto-udp';
    case 'ICMP': return 'proto-icmp';
    default:     return 'proto-other';
  }
};

const formatTime = (ts: number) =>
  new Date(ts * 1000).toLocaleTimeString('en', { hour12: false });

const PacketTable: React.FC = () => {
  const [packets, setPackets]   = useState<Packet[]>([]);
  const [filter,  setFilter]    = useState('');
  const [proto,   setProto]     = useState('ALL');
  const [newIds,  setNewIds]    = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPackets(100).then(setPackets).catch(() => {});
  }, []);

  const onPackets = useCallback((incoming: Packet[]) => {
    setPackets(prev => {
      const next = [...prev, ...incoming].slice(-MAX_DISPLAY);
      return next;
    });
    const ids = new Set(incoming.map(p => p.id));
    setNewIds(ids);
    setTimeout(() => setNewIds(new Set()), 700);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  useSocket<Packet[]>('packets', onPackets);

  const filtered = packets.filter(p => {
    const matchProto = proto === 'ALL' || p.protocol === proto;
    const matchFilter = !filter ||
      p.src_ip.includes(filter) ||
      p.dst_ip.includes(filter) ||
      p.protocol.toLowerCase().includes(filter.toLowerCase());
    return matchProto && matchFilter;
  });

  return (
    <div>
      <div className="filter-bar">
        <div className="flex items-center gap-2" style={{ flex: 1, position: 'relative' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10 }} />
          <input
            className="filter-input"
            style={{ paddingLeft: 32 }}
            placeholder="Filter by IP or protocol..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={proto}
          onChange={e => setProto(e.target.value)}
        >
          <option value="ALL">All Protocols</option>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="ICMP">ICMP</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Src IP</th>
              <th>Dst IP</th>
              <th>Protocol</th>
              <th>Src Port</th>
              <th>Dst Port</th>
              <th>Length</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                  No packets captured yet. Start the Python sniffer.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={p.id} className={newIds.has(p.id) ? 'new-row' : ''}>
                  <td className="text-muted">{i + 1}</td>
                  <td className="text-muted">{formatTime(p.timestamp)}</td>
                  <td className="text-cyan">{p.src_ip}</td>
                  <td className="text-purple">{p.dst_ip}</td>
                  <td>
                    <span className={`proto-badge ${getProtocolClass(p.protocol)}`}>
                      {p.protocol}
                    </span>
                  </td>
                  <td>{p.src_port || '—'}</td>
                  <td>{p.dst_port || '—'}</td>
                  <td>{p.length.toLocaleString()} B</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default PacketTable;
