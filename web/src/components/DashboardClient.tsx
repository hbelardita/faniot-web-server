'use client';

import dynamic from 'next/dynamic';
import { Thermometer, Droplets, Sprout } from 'lucide-react';
import { useReadings } from '@/hooks/useReadings';
import MetricCard from '@/components/MetricCard';
import AppShell from '@/components/layout/AppShell';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

const HistoryChart = dynamic(() => import('@/components/HistoryChart'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-[420px] rounded-2xl animate-shimmer"
      style={{ background: 'var(--surface-raised)' }}
    />
  ),
});

export default function DashboardClient() {
  const { history, latestReading, isLoading, error, isOnline, period, setPeriod, getSparkData } = useReadings();

  if (isLoading) {
    return (
      <AppShell isOnline={false}>
        <DashboardSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell isOnline={isOnline}>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <header className="space-y-2">
          <h1
            className="text-4xl md:text-5xl font-black tracking-tighter"
            style={{ color: 'var(--text-primary)' }}
          >
            Dashboard <span style={{ color: 'var(--emerald-500)' }}>de Monitoreo</span>
          </h1>
          <p
            className="text-sm font-medium max-w-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            Visualización inteligente de datos ambientales para el Almacén de Semillas.
          </p>
        </header>

        {/* Offline banner */}
        {!isOnline && history.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest animate-slide-up"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: 'var(--status-offline)',
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'var(--status-offline)', boxShadow: '0 0 8px var(--status-offline-glow)' }}
            />
            Hardware desconectado — mostrando datos históricos
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="p-4 rounded-xl text-sm font-bold animate-slide-up"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--status-offline)',
            }}
            role="alert"
          >
            ⚠️ Error de conexión: {error}
          </div>
        )}

        {/* Bento Grid — Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <MetricCard
            title="Temperatura"
            value={latestReading?.temperatura ?? null}
            unit="°C"
            icon={<Thermometer className="w-5 h-5" />}
            color="amber"
            gaugeMax={50}
            sparkData={getSparkData('temperatura')}
            className="animate-slide-up stagger-1"
          />
          <MetricCard
            title="Humedad"
            value={latestReading?.humedad ?? null}
            unit="%"
            icon={<Droplets className="w-5 h-5" />}
            color="emerald"
            gaugeMax={100}
            sparkData={getSparkData('humedad')}
            className="animate-slide-up stagger-2"
          />
          <MetricCard
            title="Semillas"
            value={latestReading?.semillas ?? null}
            unit="ud"
            icon={<Sprout className="w-5 h-5" />}
            color="blue"
            gaugeMax={1000}
            sparkData={getSparkData('semillas')}
            className="animate-slide-up stagger-3"
          />
        </div>

        {/* History Chart */}
        <div className="animate-slide-up stagger-4">
          <HistoryChart data={history} period={period} onPeriodChange={setPeriod} />
        </div>

        {/* Footer */}
        <footer
          className="pt-8 border-t flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Última sincronización
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {latestReading ? new Date(latestReading.created_at).toLocaleString() : '---'}
            </p>
          </div>
          <div
            className="text-xs leading-relaxed max-w-md"
            style={{ color: 'var(--text-muted)' }}
          >
            Hardware:{' '}
            <a
              href="https://faniot.com.ar/producto-kitmaker2-0"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline transition-colors"
              style={{ color: 'var(--emerald-400)' }}
            >
              Kit Maker 2.0
            </a>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
