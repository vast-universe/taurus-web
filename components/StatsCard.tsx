'use client';

import { useState } from 'react';
import { Stats } from '@/lib/api';

interface StatsCardProps {
  stats: Stats | null;
  loading: boolean;
}

export function StatsCard({ stats, loading }: StatsCardProps) {
  const [showLevelStats, setShowLevelStats] = useState(false);
  if (loading) {
    return (
      <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700/50 p-6 animate-pulse">
        <div className="h-6 bg-zinc-700 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-zinc-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const winRate = stats.total_signals > 0 ? stats.win_rate * 100 : 0;
  const isProfitable = stats.total_pnl > 0;
  const isGoodWinRate = winRate >= 55.56;

  const levelConfig = {
    S: { label: 'S级', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    A: { label: 'A级', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    B: { label: 'B级', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    C: { label: 'C级', color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' },
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-800/40 border border-zinc-700/50 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">实时统计</h2>
        <span className="text-xs text-zinc-500">自动刷新</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Signals */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900/50 p-4 border border-zinc-700/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="text-3xl font-bold text-white">{stats.total_signals}</div>
            <div className="text-sm text-zinc-500 mt-1">总信号数</div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900/50 p-4 border border-zinc-700/30">
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${
            isGoodWinRate ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}></div>
          <div className="relative">
            <div className={`text-3xl font-bold ${isGoodWinRate ? 'text-green-400' : 'text-red-400'}`}>
              {winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
              胜率
              {isGoodWinRate && <span className="text-green-500">✓</span>}
            </div>
          </div>
        </div>

        {/* Wins */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900/50 p-4 border border-zinc-700/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="text-3xl font-bold text-green-400">{stats.wins}</div>
            <div className="text-sm text-zinc-500 mt-1">盈利次数</div>
          </div>
        </div>

        {/* Total PnL */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900/50 p-4 border border-zinc-700/30">
          <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 ${
            isProfitable ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}></div>
          <div className="relative">
            <div className={`text-3xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              {isProfitable ? '+' : ''}{stats.total_pnl.toFixed(1)}
            </div>
            <div className="text-sm text-zinc-500 mt-1">总盈亏 (U)</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {stats.total_signals > 0 && (
        <div className="mt-6">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>盈利 {stats.wins}</span>
            <span>亏损 {stats.losses}</span>
          </div>
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${winRate}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Level Stats - Collapsible */}
      {stats.by_level && (
        <div className="mt-6 pt-6 border-t border-zinc-700/50">
          <button
            onClick={() => setShowLevelStats(!showLevelStats)}
            className="w-full flex items-center justify-between text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <span>按等级统计</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showLevelStats ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showLevelStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {(['S', 'A', 'B', 'C'] as const).map(level => {
                const levelStats = stats.by_level![level];
                const config = levelConfig[level];
                const levelWinRate = levelStats.total > 0 ? levelStats.win_rate * 100 : 0;
                const isLevelGood = levelWinRate >= 55.56;

                return (
                  <div 
                    key={level}
                    className={`rounded-xl p-3 ${config.bg} border ${config.border}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold ${config.color}`}>{config.label}</span>
                      <span className="text-xs text-zinc-500">{levelStats.total}笔</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">胜率</span>
                        <span className={isLevelGood ? 'text-green-400' : 'text-zinc-400'}>
                          {levelWinRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">盈亏</span>
                        <span className={levelStats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {levelStats.pnl >= 0 ? '+' : ''}{levelStats.pnl.toFixed(1)}U
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
