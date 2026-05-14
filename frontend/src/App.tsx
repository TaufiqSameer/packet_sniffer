import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TopIPs from './pages/TopIPs';
import Alerts from './pages/Alerts';
import Export from './pages/Export';
import { fetchStats } from './services/api';
import { useSocket } from './hooks/useSocket';
import type { Stats } from './types';

const pageTitle: Record<string, string> = {
  'dashboard': 'Network Dashboard',
  'top-ips':   'Top IP Addresses',
  'alerts':    'Security Alerts',
  'export':    'Export Data',
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats]             = useState<Stats | null>(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []);

  const onStats = useCallback((s: Stats) => setStats(s), []);
  useSocket<Stats>('stats', onStats);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'top-ips':   return <TopIPs />;
      case 'alerts':    return <Alerts />;
      case 'export':    return <Export />;
      default:          return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="main-content">
        <Navbar pageTitle={pageTitle[currentPage] ?? 'Dashboard'} stats={stats} />
        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
