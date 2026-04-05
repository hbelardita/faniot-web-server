'use client';

import { useEffect, useRef, useState } from 'react';
import GaugeArc from '@/components/dashboard/GaugeArc';
import Sparkline from '@/components/dashboard/Sparkline';

interface MetricCardProps {
  title: string;
  value: number | null;
  unit: string;
  icon: React.ReactNode;
  color: 'amber' | 'emerald' | 'blue';
  gaugeMax: number;
  sparkData: number[];
  className?: string;
}

const COLOR_MAP = {
  amber: {
    accent: 'var(--amber-500)',
    light: 'var(--amber-400)',
    glow: 'var(--amber-glow)',
    glowStrong: 'var(--amber-glow-strong)',
    shadow: 'var(--shadow-glow-amber)',
  },
  emerald: {
    accent: 'var(--emerald-500)',
    light: 'var(--emerald-400)',
    glow: 'var(--emerald-glow)',
    glowStrong: 'var(--emerald-glow-strong)',
    shadow: 'var(--shadow-glow-emerald)',
  },
  blue: {
    accent: 'var(--blue-500)',
    light: 'var(--blue-400)',
    glow: 'var(--blue-glow)',
    glowStrong: 'var(--blue-glow-strong)',
    shadow: 'var(--shadow-glow-blue)',
  },
};

function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const diff = target - from;
    if (Math.abs(diff) < 0.01) {
      prevRef.current = target;
      return;
    }

    const start = performance.now();
    let frame: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + diff * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}

export default function MetricCard({
  title,
  value,
  unit,
  icon,
  color,
  gaugeMax,
  sparkData,
  className = '',
}: MetricCardProps) {
  const colors = COLOR_MAP[color];
  const displayValue = useCountUp(value ?? 0);
  const isInteger = unit === 'ud';
  const isNull = value === null;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-500 group ${className} ${isNull ? 'opacity-80 grayscale-[0.3]' : ''}`}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isNull ? 'var(--border-default)' : 'var(--border-hover)';
        e.currentTarget.style.boxShadow = isNull ? 'var(--shadow-card)' : colors.shadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
      aria-labelledby={`metric-${color}`}
    >
      {/* Ambient glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 ${isNull ? '' : 'group-hover:opacity-100'} transition-opacity duration-700 pointer-events-none`}
        style={{ background: isNull ? 'transparent' : colors.glowStrong }}
        aria-hidden="true"
      />

      {/* Header: icon + title */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl transition-colors duration-500"
            style={{ 
              background: isNull ? 'var(--surface-subtle)' : colors.glow, 
              color: isNull ? 'var(--text-muted)' : colors.accent 
            }}
            aria-hidden="true"
          >
            {icon}
          </div>
          <h2
            id={`metric-${color}`}
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Value + Gauge */}
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-5xl font-black tabular-nums tracking-tighter"
              style={{ color: isNull ? 'var(--text-muted)' : 'var(--text-primary)' }}
            >
              {isNull ? '--' : (isInteger ? Math.round(displayValue) : displayValue.toFixed(1))}
            </span>
            <span
              className="text-xl font-bold transition-opacity"
              style={{ color: 'var(--text-muted)', opacity: isNull ? 0.3 : 1 }}
            >
              {unit}
            </span>
          </div>

          {/* Sparkline */}
          {!isNull && sparkData.length >= 2 && (
            <div className="pt-2 animate-fade-in">
              <Sparkline
                data={sparkData}
                color={colors.accent}
                glowColor={colors.glowStrong}
              />
            </div>
          )}
          {isNull && (
            <div className="pt-2 h-[32px] flex items-end animate-fade-in">
              <div className="w-24 border-b-2 border-dashed border-[var(--surface-subtle)]" />
            </div>
          )}
        </div>

        {/* Gauge */}
        <div className={`flex-shrink-0 transition-all duration-700 ${isNull ? 'opacity-30 grayscale' : ''}`}>
          <GaugeArc
            value={isNull ? 0 : value}
            max={gaugeMax}
            color={isNull ? 'var(--text-muted)' : colors.accent}
          />
        </div>
      </div>
    </section>
  );
}
