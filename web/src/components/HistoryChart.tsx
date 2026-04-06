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
  { value: '1h', label: 'Última 1 Hora' },
  { value: '6h', label: 'Últimas 6 Horas' },
  { value: '24h', label: 'Últimas 24 Horas' },
  { value: '7d', label: 'Últimos 7 Días' },
  { value: '15d', label: 'Últimos 15 Días' },
  { value: '30d', label: 'Últimos 30 Días' },
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
          background: 'var(--surface-card)',
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
      {/* Header + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 md:px-0">
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

        {/* Period selector */}
        <div className="relative">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as TimePeriod)}
            className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 outline-none"
            style={{
              background: 'var(--surface-raised)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {PERIODS.map(({ value, label }) => (
              <option key={value} value={value} style={{ background: 'var(--surface-base)' }}>
                {label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mx-4 md:mx-0 relative w-auto h-[280px] md:h-[340px] flex flex-col items-center justify-center rounded-2xl overflow-hidden mt-4" style={{ border: '1px dashed var(--border-hover)', background: 'var(--surface-raised)' }}>
          <div className="absolute inset-0 opacity-[0.03] animate-shimmer pointer-events-none" />
          <div className="flex flex-col items-center gap-4 relative z-10 text-center animate-fade-in">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center opacity-70 transition-transform hover:scale-105"
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
      ) : (
        <>
          {/* Legend */}
      <div className="flex gap-5 mb-4 px-4 md:px-0">
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
      <div className="w-full h-[280px] md:h-[340px]  md:ml-0">
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
        </>
      )}

      {/* Analytics Summary */}
      {data.length > 0 && (
        <div className="px-4 md:px-0 pt-6 mt-4 border-t space-y-6" style={{ borderColor: 'var(--border-default)' }}>
          {/* Temperature Section */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] px-4 md:px-0" style={{ color: 'var(--amber-500)' }}>
              Estadísticas de Temperatura
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 px-4 md:px-0">
              <div className="flex md:flex-col justify-between items-center md:items-start p-3 md:p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ color: 'var(--text-muted)' }}>Mínima</p>
                <p className="text-lg md:text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {Math.min(...data.map(d => d.temperatura)).toFixed(1)}°C
                </p>
              </div>
              <div className="flex md:flex-col justify-between items-center md:items-start p-3 md:p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ color: 'var(--text-muted)' }}>Promedio</p>
                <p className="text-lg md:text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {(data.reduce((acc, d) => acc + d.temperatura, 0) / data.length).toFixed(1)}°C
                </p>
              </div>
              <div className="flex md:flex-col justify-between items-center md:items-start p-3 md:p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ color: 'var(--text-muted)' }}>Máxima</p>
                <p className="text-lg md:text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {Math.max(...data.map(d => d.temperatura)).toFixed(1)}°C
                </p>
              </div>
            </div>
          </div>

          {/* Humidity Section */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] px-4 md:px-0" style={{ color: 'var(--emerald-500)' }}>
              Estadísticas de Humedad
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 px-4 md:px-0">
              <div className="flex md:flex-col justify-between items-center md:items-start p-3 md:p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ color: 'var(--text-muted)' }}>Mínima</p>
                <p className="text-lg md:text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {Math.min(...data.map(d => d.humedad)).toFixed(0)}%
                </p>
              </div>
              <div className="flex md:flex-col justify-between items-center md:items-start p-3 md:p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ color: 'var(--text-muted)' }}>Promedio</p>
                <p className="text-lg md:text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {(data.reduce((acc, d) => acc + d.humedad, 0) / data.length).toFixed(0)}%
                </p>
              </div>
              <div className="flex md:flex-col justify-between items-center md:items-start p-3 md:p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground" style={{ color: 'var(--text-muted)' }}>Máxima</p>
                <p className="text-lg md:text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {Math.max(...data.map(d => d.humedad)).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
