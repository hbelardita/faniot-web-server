import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber';
  progress: number;
}

export default function MetricCard({
  title,
  value,
  unit,
  icon,
  color,
  progress,
}: MetricCardProps) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-100',
  };

  const progressColorMap = {
    blue: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    emerald: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    amber: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
  };

  return (
    <section
      className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 group relative overflow-hidden flex flex-col justify-between"
      aria-labelledby={`title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {/* Decorative background element */}
      <div className={cn(
        "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-full",
        color === 'blue' ? 'bg-blue-400' : color === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'
      )} aria-hidden="true" />

      <div className="flex items-center gap-2 justify-between mb-8 relative z-10">
        <div
          className={cn('p-4 rounded-2xl transition-colors duration-300', colorMap[color])}
          aria-hidden="true"
        >
          {icon}
        </div>
        <h2
          id={`title-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]"
        >
          {title}
        </h2>
      </div>

      <div className="space-y-1 relative z-10">
        <div className="flex items-baseline gap-1">
          <span className="text-6xl font-black text-slate-900 tabular-nums tracking-tight">
            {value.toFixed(1)}
          </span>
          <span className="text-2xl font-bold text-slate-400">{unit}</span>
        </div>
      </div>

      <div className="mt-8 relative z-10">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
          <span>Nivel</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-out rounded-full',
              progressColorMap[color]
            )}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </section>
  );
}
