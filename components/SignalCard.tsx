'use client';

import { useState, useEffect } from 'react';
import { Signal } from '@/lib/api';

interface SignalCardProps {
  signal: Signal;
}

function useCountdown(targetTime: Date | null) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!targetTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetTime.getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return { minutes, seconds, timeLeft };
}

export function SignalCard({ signal }: SignalCardProps) {
  const isUp = signal.direction === 'UP';
  const isPending = signal.status === 'pending';
  
  // 计算结算时间 (创建时间 + 10分钟)
  const settleTime = isPending 
    ? new Date(new Date(signal.created_at).getTime() + 10 * 60 * 1000)
    : null;
  const { minutes, seconds, timeLeft } = useCountdown(settleTime);
  
  const levelConfig = {
    S: { color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    A: { color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    B: { color: 'from-green-500 to-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    C: { color: 'from-zinc-500 to-zinc-600', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' },
  };

  const config = levelConfig[signal.level];

  return (
    <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.02] ${
      isPending 
        ? 'bg-zinc-800/50 border-yellow-500/30' 
        : signal.is_win 
          ? 'bg-green-500/5 border-green-500/30' 
          : 'bg-red-500/5 border-red-500/30'
    }`}>
      {/* Level Badge */}
      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r ${config.color} text-white text-xs font-bold`}>
        {signal.level}级
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${
            isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isUp ? 'LONG' : 'SHORT'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">{signal.symbol}</span>
              <span className={`text-sm font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '做多' : '做空'}
              </span>
            </div>
            <div className="text-sm text-zinc-500">
              {new Date(signal.created_at).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="text-zinc-500 text-xs">入场价格</div>
            <div className="text-white font-mono">${signal.entry_price.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-2">
            <div className="text-zinc-500 text-xs">置信度</div>
            <div className="text-white font-mono">{(signal.confidence * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Result */}
        <div className={`mt-3 rounded-lg p-3 ${
          isPending 
            ? 'bg-yellow-500/10 border border-yellow-500/20' 
            : signal.is_win 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
        }`}>
          {isPending ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-sm">下注 {signal.bet_amount}U</span>
              </div>
              <div className="font-mono text-lg font-bold text-yellow-400">
                {timeLeft > 0 ? (
                  <>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</>
                ) : (
                  <span className="text-sm">结算中...</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className={`font-medium ${signal.is_win ? 'text-green-400' : 'text-red-400'}`}>
                {signal.is_win ? '盈利' : '亏损'}
              </span>
              <div className={`font-mono font-bold ${signal.is_win ? 'text-green-400' : 'text-red-400'}`}>
                {signal.pnl && signal.pnl > 0 ? '+' : ''}{signal.pnl?.toFixed(1)}U
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
