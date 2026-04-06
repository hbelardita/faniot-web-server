import type { Reading } from '@/components/HistoryChart';

interface StatSectionProps {
  title: string;
  data: Reading[];
  field: keyof Pick<Reading, 'temperatura' | 'humedad'>;
  unit: string;
  colorVar: string;
}

function StatSection({ title, data, field, unit, colorVar }: StatSectionProps) {
  const values = data.map((d) => d[field]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
  const isInteger = unit === '%';

  const stats = [
    { label: 'Mínima', value: min },
    { label: 'Promedio', value: avg },
    { label: 'Máxima', value: max },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] px-4 md:px-0" style={{ color: `var(${colorVar})` }}>
        {title}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 px-4 md:px-0">
        {stats.map((stat) => (
          <div key={stat.label} className="flex md:flex-col justify-between items-center md:items-start p-3 md:p-4 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {stat.label}
            </p>
            <p className="text-lg md:text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {isInteger ? stat.value.toFixed(0) : stat.value.toFixed(1)}{unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartAnalyticsProps {
  data: Reading[];
}

export default function ChartAnalytics({ data }: ChartAnalyticsProps) {
  if (data.length === 0) return null;

  return (
    <div className="px-4 md:px-0 pt-6 mt-4 border-t space-y-6" style={{ borderColor: 'var(--border-default)' }}>
      <StatSection 
        title="Estadísticas de Temperatura" 
        data={data} 
        field="temperatura" 
        unit="°C" 
        colorVar="--amber-500" 
      />
      <StatSection 
        title="Estadísticas de Humedad" 
        data={data} 
        field="humedad" 
        unit="%" 
        colorVar="--emerald-500" 
      />
    </div>
  );
}