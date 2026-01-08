'use client';

import { useState } from 'react';
import { useKlines } from '@/hooks/useKlines';

interface KlineStatusProps {
  symbol: string;
}

export function KlineStatus({ symbol }: KlineStatusProps) {
  const { data, loading, error, refresh } = useKlines(symbol, 100);
  const [expanded, setExpanded] = useState(true);

  if (loading && !data) {
    return (
      <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 animate-pulse">
        <div className="h-4 bg-zinc-700 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-800/50 rounded-xl p-4 border border-red-700/50">
        <div className="text-red-400 text-sm">加载失败: {error}</div>
        <button onClick={refresh} className="text-xs text-blue-400 mt-1 hover:underline">
          重试
        </button>
      </div>
    );
  }

  if (!data) return null;

  const formatTime = (timeStr: string) => {
    return timeStr.replace('T', ' ').replace('Z', '').slice(5, 16);
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">{symbol.replace('USDT', '')}</span>
          <span className="text-zinc-500 text-xs">/USDT</span>
        </div>
        <div className="flex items-center gap-2">
          {data.is_continuous ? (
            <span className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              连续
            </span>
          ) : (
            <span className="text-red-400 text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              有间隙 ({data.gaps.length})
            </span>
          )}
          <button 
            onClick={refresh} 
            className="text-zinc-500 hover:text-white text-xs"
            title="刷新"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-zinc-500">K线数: </span>
          <span className="text-white font-mono">{data.total_klines}</span>
        </div>
        <div>
          <span className="text-zinc-500">最新: </span>
          <span className="text-white font-mono">
            {data.last_time ? formatTime(data.last_time) : '--'}
          </span>
        </div>
      </div>

      {/* 显示间隙 */}
      {data.gaps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-red-700/50">
          <div className="text-xs text-red-400 mb-2">⚠️ K线间隙</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {data.gaps.map((gap, i) => (
              <div key={i} className="text-xs text-red-300">
                {formatTime(gap.prev_time)} → {formatTime(gap.curr_time)} 
                <span className="text-red-400 ml-1">({gap.gap_minutes}分钟)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 展开/收起 100 根 K 线 */}
      <div className="mt-3 pt-3 border-t border-zinc-700/50">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-400 hover:text-blue-300 w-full text-left flex items-center justify-between"
        >
          <span>{expanded ? '收起' : '展开'} 全部 {data.klines.length} 根 K 线</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>
        
        {expanded && (
          <div className="mt-2 max-h-80 overflow-y-auto">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-zinc-800">
                <tr className="text-zinc-500">
                  <th className="text-left py-1">#</th>
                  <th className="text-left py-1">时间(北京)</th>
                  <th className="text-right py-1">收盘</th>
                  <th className="text-right py-1">涨跌</th>
                </tr>
              </thead>
              <tbody>
                {[...data.klines].reverse().map((k, i) => {
                  const change = k.close - k.open;
                  const changePct = (change / k.open) * 100;
                  return (
                    <tr key={i} className="border-t border-zinc-700/30">
                      <td className="py-1 text-zinc-500">{data.klines.length - i}</td>
                      <td className="py-1 text-zinc-400">{k.time_beijing.slice(5)}</td>
                      <td className="py-1 text-right text-white">
                        {k.close.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-1 text-right ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
