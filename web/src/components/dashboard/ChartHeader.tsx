import type { TimePeriod } from '@/hooks/useReadings';

interface ChartHeaderProps {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  periods: { value: TimePeriod; label: string }[];
}

export default function ChartHeader({ period, onPeriodChange, periods }: ChartHeaderProps) {
  return (
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
          {periods.map(({ value, label }) => (
            <option key={value} value={value} style={{ background: 'var(--surface-base)' }}>
              {label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
          <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}