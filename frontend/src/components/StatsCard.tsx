import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'cyan' | 'purple' | 'green' | 'orange' | 'red';
  subtitle?: string;
}

const colorMap = {
  cyan:   { bg: 'rgba(6,182,212,0.12)',   icon: 'var(--accent-cyan)',   accent: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))' },
  purple: { bg: 'rgba(139,92,246,0.12)',  icon: 'var(--accent-purple)', accent: 'linear-gradient(90deg, var(--accent-purple), #ec4899)' },
  green:  { bg: 'rgba(16,185,129,0.12)',  icon: 'var(--accent-green)',  accent: 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))' },
  orange: { bg: 'rgba(245,158,11,0.12)',  icon: 'var(--accent-orange)', accent: 'linear-gradient(90deg, var(--accent-orange), #f97316)' },
  red:    { bg: 'rgba(239,68,68,0.12)',   icon: 'var(--accent-red)',    accent: 'linear-gradient(90deg, var(--accent-red), var(--accent-orange))' },
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const c = colorMap[color];
  return (
    <div className="stat-card" style={{ '--card-accent': c.accent } as React.CSSProperties}>
      <div className="stat-icon" style={{ background: c.bg }}>
        <Icon size={20} color={c.icon} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {subtitle && <div className="text-xs text-muted" style={{ marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
};

export default StatsCard;
