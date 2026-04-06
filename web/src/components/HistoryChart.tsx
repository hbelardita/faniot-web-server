'use client';

import type { TimePeriod } from '@/hooks/useReadings';
import ChartHeader from './dashboard/ChartHeader';
import ChartArea from './dashboard/ChartArea';
import ChartAnalytics from './dashboard/ChartAnalytics';

export interface Reading {
  id: number;
  temperatura: number;
  humedad: number;
  semillas: number;
  created_at: string;
}

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '1h', label: 'Última 1 Hora' },
  { value: '6h', label: 'Últimas 6 Horas' },
  { value: '24h', label: 'Últimas 24 Horas' },
  { value: '7d', label: 'Últimos 7 Días' },
  { value: '15d', label: 'Últimos 15 Días' },
  { value: '30d', label: 'Últimos 30 Días' },
];

interface HistoryChartProps {
  data: Reading[];
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export default function HistoryChart({ data, period, onPeriodChange }: HistoryChartProps) {
  const chartData = [...data].reverse().map(item => ({
    ...item,
    time: new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  return (
    <div
      className="relative w-full min-w-0 py-5 px-0 md:p-8 md:rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: 'var(--surface-card)',
        borderTop: '1px solid var(--border-default)',
        borderBottom: '1px solid var(--border-default)',
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <ChartHeader 
        period={period} 
        onPeriodChange={onPeriodChange} 
        periods={PERIODS} 
      />

      <ChartArea data={chartData} />

      <ChartAnalytics data={data} />
    </div>
  );
}
