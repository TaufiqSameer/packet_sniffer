import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { socket } from '../services/socket';
import { clearData } from '../services/api';
import type { Stats } from '../types';

interface NavbarProps {
  pageTitle: string;
  stats: Stats | null;
}

const Navbar: React.FC<NavbarProps> = ({ pageTitle, stats }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect    = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleClear = async () => {
    if (confirm('Clear all captured packet data?')) {
      await clearData();
    }
  };

  const formatBytes = (b: number) => {
    if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
    if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`;
    if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
    return `${b} B`;
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-title">{pageTitle}</span>
        {isConnected ? (
          <span className="live-badge">
            <span className="live-dot" />
            LIVE
          </span>
        ) : (
          <span className="offline-badge">OFFLINE</span>
        )}
      </div>

      <div className="navbar-right">
        {stats && (
          <span className="packet-counter">
            {stats.total_packets.toLocaleString()} pkts &nbsp;·&nbsp; {formatBytes(stats.total_bytes)} &nbsp;·&nbsp; {stats.packets_per_sec}/s
          </span>
        )}
        <button className="btn btn-danger" onClick={handleClear}>
          <Trash2 size={13} />
          Clear
        </button>
      </div>
    </header>
  );
};

export default Navbar;
