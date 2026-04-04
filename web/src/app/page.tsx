'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Thermometer, Droplets, Sprout, Activity, RefreshCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Lectura {
  id: number;
  temperatura: number;
  humedad: number;
  semillas: number;
  created_at: string;
}

export default function Dashboard() {
  const [ultimaLectura, setUltimaLectura] = useState<Lectura | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const { data, error } = await supabase
          .from('lecturas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
          throw error;
        }

        if (data) {
          setUltimaLectura(data);
        }
        setOnline(true);
      } catch (err: any) {
        setError(err.message);
        setOnline(false);
      } finally {
        setCargando(false);
      }
    }

    fetchInitialData();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('lecturas_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lecturas',
        },
        (payload) => {
          setUltimaLectura(payload.new as Lectura);
          setOnline(true);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Suscrito a cambios de Supabase');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Conectando a Faniot Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
              Faniot <span className="text-emerald-500">Cloud</span>
            </h1>
            <p className="text-slate-500 text-lg">Monitor Ambiental de Semillas 🚀☁️</p>
          </div>
          
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300",
            online ? "bg-emerald-100 text-emerald-700 shadow-emerald-100/50 shadow-lg" : "bg-red-100 text-red-700"
          )}>
            <div className={cn("w-2 h-2 rounded-full", online ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            {online ? "SISTEMA ONLINE" : "SISTEMA OFFLINE"}
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-medium">
            Error: {error}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card: Temperatura */}
          <MetricCard
            title="Temperatura"
            value={ultimaLectura?.temperatura ?? 0}
            unit="°C"
            icon={<Thermometer className="w-6 h-6" />}
            color="blue"
            progress={(ultimaLectura?.temperatura ?? 0) * 2.5}
          />

          {/* Card: Humedad */}
          <MetricCard
            title="Humedad"
            value={ultimaLectura?.humedad ?? 0}
            unit="%"
            icon={<Droplets className="w-6 h-6" />}
            color="emerald"
            progress={ultimaLectura?.humedad ?? 0}
          />

          {/* Card: Semillas */}
          <MetricCard
            title="Almacén Semillas"
            value={ultimaLectura?.semillas ?? 0}
            unit="ud"
            icon={<Sprout className="w-6 h-6" />}
            color="amber"
            progress={(ultimaLectura?.semillas ?? 0) / 10}
          />
        </div>

        {/* Footer info */}
        <footer className="pt-12 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              <Activity className="w-5 h-5 text-emerald-500" />
              Detalles del Sistema
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Última sincronización" value={ultimaLectura ? new Date(ultimaLectura.created_at).toLocaleTimeString() : '---'} />
              <InfoItem label="Intervalo de reporte" value="30 seg" />
              <InfoItem label="Protocolo" value="HTTPS / Realtime" />
              <InfoItem label="Host" value="Vercel + Supabase" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Acerca del Proyecto</p>
            <p className="text-slate-600 leading-relaxed text-sm">
              Dashboard de monitoreo remoto para Faniot. Los datos se envían desde un ESP32 y se visualizan en tiempo real mediante WebSockets gracias a Supabase Realtime.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({ 
  title, 
  value, 
  unit, 
  icon, 
  color, 
  progress 
}: { 
  title: string; 
  value: number; 
  unit: string; 
  icon: React.ReactNode; 
  color: 'blue' | 'emerald' | 'amber';
  progress: number;
}) {
  const colorMap = {
    blue: "text-blue-500 bg-blue-50 border-blue-100 progress-blue-500",
    emerald: "text-emerald-500 bg-emerald-50 border-emerald-100 progress-emerald-500",
    amber: "text-amber-500 bg-amber-50 border-amber-100 progress-amber-500",
  };

  const progressColorMap = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity bg-current" />
      
      <div className="flex items-center justify-between mb-8">
        <div className={cn("p-4 rounded-2xl", colorMap[color].split(' ').slice(0, 3).join(' '))}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-6xl font-black text-slate-900 tabular-nums">
            {value.toFixed(1)}
          </span>
          <span className="text-2xl font-bold text-slate-400">{unit}</span>
        </div>
      </div>

      <div className="mt-8 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-1000 ease-out rounded-full", progressColorMap[color])}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-bold text-slate-700">{value}</p>
    </div>
  );
}
