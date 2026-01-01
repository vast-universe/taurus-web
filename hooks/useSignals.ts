'use client';

import { useEffect, useState, useCallback } from 'react';
import { Signal, getLatestSignals, getStats, Stats } from '@/lib/api';
import { signalWS, WSMessage, SettlementData } from '@/lib/websocket';

export function useSignals(limit = 20) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    try {
      const data = await getLatestSignals(limit);
      setSignals(data.signals);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSignals();

    // WebSocket 实时更新
    signalWS.connect();
    const unsubscribe = signalWS.subscribe((message: WSMessage) => {
      if (message.type === 'signal') {
        const newSignal = message.data as Signal;
        setSignals(prev => {
          // 检查是否已存在，避免重复
          if (prev.some(s => s.id === newSignal.id)) {
            return prev;
          }
          return [newSignal, ...prev.slice(0, limit - 1)];
        });
      } else if (message.type === 'settlement') {
        const settlement = message.data as SettlementData;
        setSignals(prev => prev.map(s => 
          s.id === settlement.id 
            ? { 
                ...s, 
                settle_price: settlement.settle_price,
                settle_at: settlement.settle_at,
                is_win: settlement.is_win,
                pnl: settlement.pnl,
                status: 'settled' as const 
              }
            : s
        ));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchSignals, limit]);

  return { signals, loading, error, refetch: fetchSignals };
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // 监听结算事件，自动刷新统计
    signalWS.connect();
    const unsubscribe = signalWS.subscribe((message: WSMessage) => {
      if (message.type === 'settlement') {
        // 结算后延迟 500ms 刷新统计（等数据库写入完成）
        setTimeout(fetchStats, 500);
      }
    });

    const interval = setInterval(fetchStats, 60000); // 每分钟刷新

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
