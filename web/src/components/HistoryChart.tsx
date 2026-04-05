'use client';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import type { TimePeriod } from '@/hooks/useReadings';

export interface Reading {
  id: number;
  temperatura: number;
  humedad: number;
  semillas: number;
  created_at: string;
}

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-4 rounded-xl text-sm backdrop-blur-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid var(--border-hover)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: entry.color,
                  boxShadow: `0 0 6px ${entry.color}`,
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                {entry.name}:{' '}
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {entry.value.toFixed(1)}
                  {entry.name === 'Temperatura' ? '°C' : '%'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface HistoryChartProps {
  data: Reading[];
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

export default function HistoryChart({ data, period, onPeriodChange }: HistoryChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="relative w-full min-w-0 p-5 md:p-8 rounded-2xl overflow-hidden transition-all duration-500 min-h-[380px] md:min-h-[440px] flex flex-col items-center justify-center"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-default)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="absolute inset-0 opacity-[0.03] animate-shimmer pointer-events-none" />
        <div className="flex flex-col items-center gap-4 relative z-10 text-center animate-fade-in">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center opacity-70"
            style={{ background: 'var(--surface-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-secondary)' }}>
              Sin registros
            </h3>
            <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
              No hay datos para mostrar en este periodo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = [...data].reverse().map(item => ({
    ...item,
    time: new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  return (
    <div
      className="relative w-full min-w-0 p-5 md:p-8 rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h3
            className="text-lg font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Flujo de Datos
          </h3>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            Temperatura y humedad en tiempo real
          </p>
        </div>

        {/* Period buttons */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'var(--surface-raised)' }}
        >
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onPeriodChange(value)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200"
              style={{
                background: period === value ? 'var(--surface-overlay)' : 'transparent',
                color: period === value ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: period === value ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--amber-500)', boxShadow: '0 0 8px var(--amber-glow-strong)' }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Temperatura
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--emerald-500)', boxShadow: '0 0 8px var(--emerald-glow-strong)' }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Humedad
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[280px] md:h-[340px] -ml-2 md:ml-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="6 6"
              vertical={false}
              stroke="rgba(148, 163, 184, 0.06)"
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              minTickGap={40}
              tickMargin={12}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              tickMargin={8}
              domain={['auto', 'auto']}
              width={48}
              tickCount={5}
              tickFormatter={(v) => `${v.toFixed(0)}°`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              tickMargin={8}
              domain={['auto', 'auto']}
              width={48}
              tickCount={5}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(148, 163, 184, 0.1)', strokeWidth: 1 }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="temperatura"
              name="Temperatura"
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeLinecap="round"
              fillOpacity={1}
              fill="url(#gradTemp)"
              animationDuration={1200}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="humedad"
              name="Humedad"
              stroke="#10b981"
              strokeWidth={2.5}
              strokeLinecap="round"
              fillOpacity={1}
              fill="url(#gradHum)"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
