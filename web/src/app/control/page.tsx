'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sprout, Plus, Minus, RotateCcw, CheckCircle2, AlertCircle, Hash, WifiOff } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useReadings } from '@/hooks/useReadings';

export default function ControlPage() {
  const { isOnline, isLoading: isReadingsLoading } = useReadings();
  const [isSending, setIsSending] = useState(false);
  const [customValue, setCustomValue] = useState<number>(10);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const handleCommand = async (accion: string, valor: number) => {
    if (!isOnline) {
      setStatus({
        type: 'warning',
        message: 'Sistema Offline: El hardware no recibirá el comando ahora mismo.',
      });
      setTimeout(() => setStatus(null), 5000);
      return;
    }

    setIsSending(true);
    setStatus(null);

    try {
      const { error } = await supabase
        .from('comandos')
        .insert([{ accion, valor, ejecutado: false }]);

      if (error) throw error;

      setStatus({
        type: 'success',
        message: `Comando "${accion}" (${valor}) enviado con éxito.`,
      });
      setTimeout(() => setStatus(null), 4000);
    } catch (err: unknown) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al enviar el comando',
      });
    } finally {
      setIsSending(false);
    }
  };

  const isInteractionDisabled = !isOnline || isSending || isReadingsLoading;

  return (
    <AppShell isOnline={isOnline}>
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 animate-fade-in">
          {/* Header */}
          <header className="text-center space-y-4">
            <div
              className="inline-flex p-5 rounded-2xl transition-transform duration-500 hover:scale-110"
              style={{
                background: isOnline ? 'var(--amber-glow)' : 'rgba(239, 68, 68, 0.1)',
                color: isOnline ? 'var(--amber-500)' : 'var(--status-offline)',
                boxShadow: isOnline ? 'var(--shadow-glow-amber)' : 'none',
              }}
            >
              {isOnline ? <Sprout className="w-10 h-10" /> : <WifiOff className="w-10 h-10" />}
            </div>
            <div className="space-y-1">
              <h1
                className="text-3xl font-black tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Control <span style={{ color: isOnline ? 'var(--amber-500)' : 'var(--text-muted)' }}>Remoto</span>
              </h1>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--text-muted)' }}
              >
                {isOnline ? 'Gestión de Semillas' : 'Hardware Desconectado'}
              </p>
            </div>
          </header>

          {/* Status feedback */}
          <div className="min-h-[64px]">
            {status && (
              <div
                className="p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-slide-up shadow-lg"
                style={{
                  background: 
                    status.type === 'success' ? 'var(--emerald-glow)' : 
                    status.type === 'warning' ? 'var(--amber-glow)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${
                    status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 
                    status.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                  }`,
                  color: 
                    status.type === 'success' ? 'var(--emerald-400)' : 
                    status.type === 'warning' ? 'var(--amber-400)' : 'var(--status-offline)',
                }}
              >
                {status.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                {status.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                {status.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                {status.message}
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div
            className={`p-6 rounded-3xl space-y-6 transition-all duration-500 ${!isOnline ? 'grayscale opacity-75' : ''}`}
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              backdropFilter: 'blur(20px)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Quick adjust */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleCommand('sumar', 1)}
                disabled={isInteractionDisabled}
                className="group relative flex items-center justify-center gap-2 p-5 rounded-2xl font-bold text-sm transition-all duration-300 disabled:opacity-30 active:scale-95"
                style={{
                  background: 'var(--emerald-500)',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
                }}
              >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> 
                <span className="hidden sm:inline">Ingreso</span> +1
              </button>
              <button
                onClick={() => handleCommand('restar', 1)}
                disabled={isInteractionDisabled}
                className="group relative flex items-center justify-center gap-2 p-5 rounded-2xl font-bold text-sm transition-all duration-300 disabled:opacity-30 active:scale-95"
                style={{
                  background: 'var(--amber-500)',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
                }}
              >
                <Minus className="w-5 h-5 transition-transform group-hover:scale-125" /> 
                <span className="hidden sm:inline">Egreso</span> -1
              </button>
            </div>

            {/* Batch adjust */}
            <div
              className="space-y-4 pt-6 border-t text-center"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div
                className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"
                style={{ color: 'var(--text-muted)' }}
              >
                <Hash className="w-3 h-3" /> Cantidad por Lote
              </div>

              <div className="relative group">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(parseInt(e.target.value) || 0)}
                  disabled={isInteractionDisabled}
                  className="w-full rounded-2xl p-5 text-center text-3xl font-black transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:opacity-50"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '2px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleCommand('sumar', customValue)}
                  disabled={isInteractionDisabled || customValue <= 0}
                  className="p-5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-30 bg-[var(--surface-overlay)] border border-[var(--border-default)] hover:border-[var(--emerald-500)] text-[var(--text-primary)]"
                >
                  Sumar {customValue}
                </button>
                <button
                  onClick={() => handleCommand('restar', customValue)}
                  disabled={isInteractionDisabled || customValue <= 0}
                  className="p-5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-30 bg-transparent border border-[var(--border-default)] hover:border-[var(--amber-500)] text-[var(--text-secondary)]"
                >
                  Restar {customValue}
                </button>
              </div>
            </div>

            {/* Reset */}
            <div className="pt-4" >
              <button
                onClick={() => handleCommand('resetear', 0)}
                disabled={isInteractionDisabled}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 opacity-40 hover:opacity-100 hover:text-red-500"
                style={{ color: 'var(--text-muted)' }}
              >
                <RotateCcw className="w-3 h-3" /> Reiniciar Contador
              </button>
            </div>
          </div>

          {/* Info Footer */}
          {!isOnline && (
            <p className="text-center text-[10px] font-medium text-red-500/60 uppercase tracking-widest animate-pulse">
              Revisa la conexión del ESP32 para operar
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
