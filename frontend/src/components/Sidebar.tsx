import React from 'react';
import {
  LayoutDashboard, Wifi, AlertTriangle, Download, Radio
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'top-ips',   label: 'Top IPs',   icon: Wifi },
  { id: 'alerts',    label: 'Alerts',    icon: AlertTriangle },
  { id: 'export',    label: 'Export',    icon: Download },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <Radio size={18} color="var(--accent-cyan)" />
          <h2>NetScope</h2>
        </div>
        <p>Packet Analysis Dashboard</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${currentPage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>NetScope v1.0</p>
        <p style={{ marginTop: 2 }}>Powered by Scapy + Node.js</p>
      </div>
    </aside>
  );
};

export default Sidebar;
