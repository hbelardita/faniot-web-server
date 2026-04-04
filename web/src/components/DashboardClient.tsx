'use client';

import dynamic from 'next/dynamic';
import { Thermometer, Droplets, Sprout, Activity, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReadings } from '@/hooks/useReadings';
import MetricCard from '@/components/MetricCard';
import InfoItem from '@/components/InfoItem';

// Dynamic import for the chart to avoid SSR cascading renders
const HistoryChart = dynamic(() => import('@/components/HistoryChart'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-white/50 backdrop-blur-sm p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center">
      <div className="animate-pulse text-slate-400 font-medium">Preparando gráficos del sistema...</div>
    </div>
  )
});

export default function DashboardClient() {
  const { history, latestReading, isLoading, error, isOnline } = useReadings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-busy="true">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <RefreshCcw className="w-12 h-12 text-emerald-500 animate-spin" />
            <div className="absolute inset-0 blur-xl bg-emerald-400/20 animate-pulse rounded-full" />
          </div>
          <p className="text-slate-500 font-semibold tracking-tight animate-pulse">
            Sincronizando con Faniot Cloud...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      {/* Status Badge */}
      <div className="flex justify-end">
        <div 
          className={cn(
            "inline-flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-500 border backdrop-blur-md",
            isOnline 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
              : "bg-red-50 text-red-700 border-red-100 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
          )}
          aria-live="polite"
        >
          <div className={cn(
            "w-2.5 h-2.5 rounded-full ring-4", 
            isOnline 
              ? "bg-emerald-500 ring-emerald-500/20 animate-pulse" 
              : "bg-red-500 ring-red-500/20"
          )} />
          {isOnline ? "Sistema en Línea" : "Sistema Desconectado"}
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-[2rem] font-bold text-sm shadow-xl shadow-red-500/5 animate-bounce" role="alert">
          ⚠️ Error de conexión: {error}
        </div>
      )}

      {/* Contenido Principal (Cards y Gráfico) con feedback de estado Offline */}
      <div className={cn(
        "space-y-12 transition-all duration-700 relative",
        !isOnline && "opacity-50 grayscale-[0.5] pointer-events-none"
      )}>
        {!isOnline && history.length > 0 && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase font-black tracking-[0.2em] px-6 py-2 rounded-full z-20 shadow-2xl animate-in zoom-in duration-300">
            Mostrando últimos datos conocidos
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <MetricCard
            title="Temperatura Ambiente"
            value={latestReading?.temperatura ?? 0}
            unit="°C"
            icon={<Thermometer className="w-6 h-6" />}
            color="blue"
            progress={(latestReading?.temperatura ?? 0) * 2.5}
          />

          <MetricCard
            title="Humedad Relativa"
            value={latestReading?.humedad ?? 0}
            unit="%"
            icon={<Droplets className="w-6 h-6" />}
            color="emerald"
            progress={latestReading?.humedad ?? 0}
          />

          <MetricCard
            title="Almacén de Semillas"
            value={latestReading?.semillas ?? 0}
            unit="ud"
            icon={<Sprout className="w-6 h-6" />}
            color="amber"
            progress={(latestReading?.semillas ?? 0) / 10}
          />
        </div>

        {/* History Chart */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
          <HistoryChart data={history} />
        </section>
      </div>

      {/* Footer info */}
      <footer className="pt-16 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h3 className="flex items-center gap-3 font-black text-slate-800 uppercase tracking-tighter text-xl">
            <Activity className="w-6 h-6 text-emerald-500" />
            Estado Técnico
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <InfoItem label="Sincronización" value={latestReading ? new Date(latestReading.created_at).toLocaleTimeString() : '---'} />
            <InfoItem label="Frecuencia" value="30 segundos" />
            <InfoItem label="Transferencia" value="HTTPS Secure" />
            <InfoItem label="Infraestructura" value="Edge Computing" />
          </div>
        </div>
        
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/50 space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Acerca del Proyecto</p>
          <p className="text-slate-600 leading-relaxed font-medium">
            Proyecto desarrollado y presentado por la sede de <strong>General Urquiza</strong> de <a href="https://redmakermisiones.com.ar/espaciosmaker" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors font-bold">Red Maker Misiones</a>. El hardware base utilizado para este monitor ambiental es la placa <a href="https://faniot.com.ar/producto-kitmaker2-0" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors font-bold">Kit Maker 2.0 de Faniot</a>. Este dashboard procesa flujos de datos en tiempo real permitiendo una toma de decisiones inmediata.
          </p>
        </div>
      </footer>
    </div>
  );
}
