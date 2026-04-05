import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Reading } from '@/components/HistoryChart';

export function useReadings() {
  const [history, setHistory] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  const latestReading = history[0] || null;

  useEffect(() => {
    if (!latestReading) return;

    const checkStatus = () => {
      const lastReadingTime = new Date(latestReading.created_at).getTime();
      // Consider offline if no reading in the last 60 seconds
      const isNowOnline = Date.now() - lastReadingTime < 60000;
      setIsOnline(isNowOnline);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [latestReading]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const { data, error } = await supabase
          .from('lecturas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;

        if (data && data.length > 0) {
          setHistory(data);
          // isOnline is derived from the heartbeat effect based on latest reading
        }
      } catch (err: any) {
        setError(err.message);
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialData();

    // Realtime subscription
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
          setHistory(prev => [newReading, ...prev].slice(0, 30));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscription active');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    history,
    latestReading,
    isLoading,
    error,
    isOnline
  };
}
