'use client';

import { useEffect, useState, useCallback } from 'react';
import { signalWS, WSMessage, KlineMessage } from '@/lib/websocket';

export interface KlineData {
  timestamp: number;
  time_utc: string;
  time_beijing: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KlineGap {
  index: number;
  prev_time: string;
  curr_time: string;
  gap_minutes: number;
}

export interface KlineInfo {
  symbol: string;
  total_klines: number;
  returned: number;
  is_continuous: boolean;
  gaps: KlineGap[];
  first_time: string | null;
  last_time: string | null;
  klines: KlineData[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useKlines(symbol: string, limit: number = 100) {
  const [data, setData] = useState<KlineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKlines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/klines/${symbol}?limit=${limit}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [symbol, limit]);

  // 检查 K 线连续性
  const checkContinuity = useCallback((klines: KlineData[]) => {
    const gaps: KlineGap[] = [];
    for (let i = 1; i < klines.length; i++) {
      const expectedTs = klines[i - 1].timestamp + 60000;
      const actualTs = klines[i].timestamp;
      if (actualTs !== expectedTs) {
        const gapMinutes = (actualTs - klines[i - 1].timestamp) / 60000;
        gaps.push({
          index: i,
          prev_time: klines[i - 1].time_utc,
          curr_time: klines[i].time_utc,
          gap_minutes: gapMinutes,
        });
      }
    }
    return gaps;
  }, []);

  useEffect(() => {
    // 初始加载
    fetchKlines();

    // 监听 WS 推送的 K 线
    const unsub = signalWS.subscribe((message: WSMessage) => {
      if (message.type === 'kline') {
        const kline = message.data as KlineMessage;
        if (kline.symbol !== symbol) return;

        setData((prev) => {
          if (!prev) return prev;

          // 检查是否重复（同一时间戳）
          const lastKline = prev.klines[prev.klines.length - 1];
          let newKlines: KlineData[];

          if (lastKline && lastKline.timestamp === kline.timestamp) {
            // 更新最后一根
            newKlines = [...prev.klines.slice(0, -1), kline];
          } else {
            // 添加新的，保持最多 limit 根
            newKlines = [...prev.klines, kline].slice(-limit);
          }

          const gaps = checkContinuity(newKlines);

          return {
            ...prev,
            total_klines: kline.total_klines,
            returned: newKlines.length,
            is_continuous: gaps.length === 0,
            gaps,
            first_time: newKlines[0]?.time_utc || null,
            last_time: newKlines[newKlines.length - 1]?.time_utc || null,
            klines: newKlines,
          };
        });
      }
    });

    return () => {
      unsub();
    };
  }, [symbol, limit, fetchKlines, checkContinuity]);

  return { data, loading, error, refresh: fetchKlines };
}
