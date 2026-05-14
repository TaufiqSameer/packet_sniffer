import React, { useRef, useEffect, useCallback } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { useSocket } from '../hooks/useSocket';
import type { Stats } from '../types';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

const MAX_POINTS = 60;

const createGradient = (ctx: CanvasRenderingContext2D, height: number) => {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(6,182,212,0.35)');
  grad.addColorStop(1, 'rgba(6,182,212,0.01)');
  return grad;
};

const TrafficGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);
  const labelsRef = useRef<string[]>([]);
  const dataRef   = useRef<number[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const gradient = createGradient(ctx, 260);

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labelsRef.current,
        datasets: [{
          label: 'Packets / sec',
          data: dataRef.current,
          borderColor: '#06b6d4',
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            borderColor: 'rgba(6,182,212,0.4)',
            borderWidth: 1,
            titleColor: '#8b9dc3',
            bodyColor: '#f0f6ff',
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y.toFixed(2)} pkt/s`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#4b5e82', font: { size: 10 }, maxTicksLimit: 8 },
            grid:  { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#4b5e82', font: { size: 10 } },
            grid:  { color: 'rgba(255,255,255,0.04)' },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, []);

  const onStats = useCallback((stats: Stats) => {
    const now = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    labelsRef.current.push(now);
    dataRef.current.push(stats.packets_per_sec);

    if (labelsRef.current.length > MAX_POINTS) {
      labelsRef.current.shift();
      dataRef.current.shift();
    }

    if (chartRef.current) {
      chartRef.current.data.labels = [...labelsRef.current];
      chartRef.current.data.datasets[0].data = [...dataRef.current];
      chartRef.current.update('none');
    }
  }, []);

  useSocket<Stats>('stats', onStats);

  return (
    <div className="chart-container">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default TrafficGraph;
