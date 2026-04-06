import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reading } from '@/components/HistoryChart';

export type TimePeriod = '1h' | '6h' | '24h' | '7d' | '15d' | '30d';

const PERIOD_LIMITS: Record<TimePeriod, number> = {
  '1h': 60,
  '6h': 120,
  '24h': 200,
  '7d': 400,
  '15d': 600,
  '30d': 1000,
};

function getPeriodDate(period: TimePeriod): string {
  const now = new Date();
  switch (period) {
    case '1h': now.setHours(now.getHours() - 1); break;
    case '6h': now.setHours(now.getHours() - 6); break;
    case '24h': now.setHours(now.getHours() - 24); break;
    case '7d': now.setDate(now.getDate() - 7); break;
    case '15d': now.setDate(now.getDate() - 15); break;
    case '30d': now.setDate(now.getDate() - 30); break;
  }
  return now.toISOString();
}

export function useReadings() {
  const [history, setHistory] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [period, setPeriod] = useState<TimePeriod>('1h');

  const latestReading = history[0] || null;

  // Heartbeat: check if hardware is online based on the dispositivos table
  useEffect(() => {
    let lastKnownPing = Date.now();

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('dispositivos')
        .select('last_ping')
        .eq('id', 'faniot-main')
        .single();
        
      if (data && data.last_ping) {
        lastKnownPing = new Date(data.last_ping).getTime();
        setIsOnline(Date.now() - lastKnownPing < 65000); // 65s tolerancia
      }
    };
    fetchStatus();

    // Check status localmente cada 10 segundos
    const interval = setInterval(() => {
      setIsOnline(Date.now() - lastKnownPing < 65000);
    }, 10000);

    // Suscribirse a actualizaciones (PATCH) de Heartbeat
    const channel = supabase
      .channel('heartbeat_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dispositivos',
          filter: 'id=eq.faniot-main',
        },
        (payload) => {
          if (payload.new && payload.new.last_ping) {
            lastKnownPing = new Date(payload.new.last_ping).getTime();
            setIsOnline(true);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = useCallback(async (selectedPeriod: TimePeriod) => {
    try {
      setError(null);
      const since = getPeriodDate(selectedPeriod);

      const { data, error: queryError } = await supabase
        .from('lecturas')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(PERIOD_LIMITS[selectedPeriod]);

      if (queryError) throw queryError;
      console.log(data)
      if (data) {
        setHistory(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch + refetch on period change
  useEffect(() => {
    // No establecemos setIsLoading(true) aquí para que las tarjetas de arriba
    // no se desmonten y la data del gráfico se actualice en background (silenciosamente)
    fetchData(period);
  }, [period, fetchData]);

  // Realtime subscription (always listens, regardless of period)
  useEffect(() => {
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
          const newReading = payload.new as Reading;
          setHistory(prev => [newReading, ...prev].slice(0, PERIOD_LIMITS[period]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [period]);

  // Extract spark data for a specific field (last 10 readings, chronological)
  const getSparkData = useCallback(
    (field: keyof Pick<Reading, 'temperatura' | 'humedad' | 'semillas'>) => {
      return history
        .slice(0, 10)
        .map(r => r[field])
        .reverse();
    },
    [history]
  );

  return {
    history,
    latestReading,
    isLoading,
    error,
    isOnline,
    period,
    setPeriod,
    getSparkData,
  };
}
