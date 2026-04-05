import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reading } from '@/components/HistoryChart';

export type TimePeriod = '1h' | '6h' | '24h' | '7d';

const PERIOD_LIMITS: Record<TimePeriod, number> = {
  '1h': 60,
  '6h': 60,
  '24h': 120,
  '7d': 200,
};

function getPeriodDate(period: TimePeriod): string {
  const now = new Date();
  switch (period) {
    case '1h': now.setHours(now.getHours() - 1); break;
    case '6h': now.setHours(now.getHours() - 6); break;
    case '24h': now.setHours(now.getHours() - 24); break;
    case '7d': now.setDate(now.getDate() - 7); break;
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

  // Heartbeat: check if hardware is online based on last reading timestamp
  useEffect(() => {
    if (!latestReading) return;

    const checkStatus = () => {
      const lastReadingTime = new Date(latestReading.created_at).getTime();
      setIsOnline(Date.now() - lastReadingTime < 60000);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [latestReading]);

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
    setIsLoading(true);
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
