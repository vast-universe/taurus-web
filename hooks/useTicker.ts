'use client';

import { useEffect, useState, useCallback } from 'react';
import { binanceWS, TickerData } from '@/lib/binance-ws';
import { signalWS, WSMessage } from '@/lib/websocket';

export interface TickerInfo {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  rsi6?: number;
  rsi14?: number;
  bb_pct?: number;
  prob_down?: number;
  prob_up?: number;
  lastUpdate?: string;
}

export function useTicker() {
  const [tickers, setTickers] = useState<Record<string, TickerInfo>>({
    BTCUSDT: { symbol: 'BTCUSDT', price: 0, change24h: 0, changePercent24h: 0 },
    ETHUSDT: { symbol: 'ETHUSDT', price: 0, change24h: 0, changePercent24h: 0 },
  });

  useEffect(() => {
    // 连接 Binance WebSocket 获取实时价格
    binanceWS.connect();
    const unsubBinance = binanceWS.subscribe((data: TickerData) => {
      setTickers(prev => ({
        ...prev,
        [data.symbol]: {
          ...prev[data.symbol],
          symbol: data.symbol,
          price: data.price,
          change24h: data.change24h,
          changePercent24h: data.changePercent24h,
        },
      }));
    });

    // 连接信号服务 WebSocket 获取指标和概率
    signalWS.connect();
    const unsubSignal = signalWS.subscribe((message: WSMessage) => {
      if (message.type === 'ticker') {
        const data = message.data as {
          symbol: string;
          price: number;
          rsi6: number;
          rsi14: number;
          bb_pct: number;
          prob_down: number;
          prob_up: number;
          timestamp: string;
        };
        setTickers(prev => ({
          ...prev,
          [data.symbol]: {
            ...prev[data.symbol],
            rsi6: data.rsi6,
            rsi14: data.rsi14,
            bb_pct: data.bb_pct,
            prob_down: data.prob_down,
            prob_up: data.prob_up,
            lastUpdate: data.timestamp,
          },
        }));
      }
    });

    return () => {
      unsubBinance();
      unsubSignal();
    };
  }, []);

  return { tickers };
}
