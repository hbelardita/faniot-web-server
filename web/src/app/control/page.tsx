'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sprout, Plus, Minus, RotateCcw, CheckCircle2, AlertCircle, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ControlPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [customValue, setCustomValue] = useState<number>(10);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleCommand = async (accion: string, valor: number) => {
    setIsLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase
        .from('comandos')
        .insert([
          { accion, valor, ejecutado: false }
        ]);

      if (error) throw error;

      setStatus({ 
        type: 'success', 
        message: `Comando "${accion}" (${valor}) enviado con éxito.` 
      });
      
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.message || 'Error al enviar el comando' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-amber-50 blur-[120px] rounded-full opacity-60" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        <header className="text-center space-y-4">
          <div className="inline-flex p-5 rounded-3xl bg-white text-amber-500 shadow-xl shadow-amber-500/10 border border-amber-100 ring-4 ring-amber-50">
            <Sprout className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Control <span className="text-amber-500">Remoto</span>
            </h1>
            <p className="text-slate-500 font-medium tracking-wide text-sm uppercase">
              Gestión Dinámica de Semillas
            </p>
          </div>
        </header>

        <div className="min-h-[60px]">
          {status && (
            <div className={cn(
              "p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-lg",
              status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
            )}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              {status.message}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8">
          
          {/* Ajuste Rápido (+1 / -1) */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleCommand('sumar', 1)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-all font-bold text-sm shadow-md"
            >
              <Plus className="w-4 h-4" /> Ingreso +1
            </button>
            <button
              onClick={() => handleCommand('restar', 1)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl transition-all font-bold text-sm shadow-md"
            >
              <Minus className="w-4 h-4" /> Egreso -1
            </button>
          </div>

          {/* Ajuste por Lote (Input) */}
          <div className="space-y-4 pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              <Hash className="w-3 h-3" /> Cantidad por Lote
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={customValue}
                onChange={(e) => setCustomValue(parseInt(e.target.value) || 0)}
                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center text-xl font-black text-slate-800 focus:outline-none focus:border-amber-400 transition-colors"
                min="1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleCommand('sumar', customValue)}
                disabled={isLoading || customValue <= 0}
                className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-30"
              >
                Sumar {customValue}
              </button>
              <button
                onClick={() => handleCommand('restar', customValue)}
                disabled={isLoading || customValue <= 0}
                className="p-4 bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-500 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-30"
              >
                Restar {customValue}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => handleCommand('resetear', 0)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 p-4 text-red-400 hover:text-red-600 transition-colors font-bold text-[10px] uppercase tracking-widest"
            >
              <RotateCcw className="w-3 h-3" /> Resetear a Cero
            </button>
          </div>

        </div>

        <div className="text-center">
          <Link href="/" className="text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em]">
            ← Volver al Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}
