'use client';

import { TickerInfo } from '@/hooks/useTicker';

interface TickerCardProps {
  ticker: TickerInfo;
}

export function TickerCard({ ticker }: TickerCardProps) {
  const isUp = ticker.changePercent24h >= 0;
  const hasIndicators = ticker.rsi6 !== undefined;

  // RSI 状态判断
  const getRsiStatus = (rsi: number) => {
    if (rsi >= 70) return { text: '超买', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (rsi <= 30) return { text: '超卖', color: 'text-green-400', bg: 'bg-green-500/10' };
    return null;
  };

  const rsiStatus = ticker.rsi6 ? getRsiStatus(ticker.rsi6) : null;

  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
      {/* 顶部：左边币对，右边价格 */}
      <div className="flex items-center justify-between">
        {/* 左侧：币对 + 状态 */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">
              {ticker.symbol.replace('USDT', '')}
            </span>
            <span className="text-xs text-zinc-500">/USDT</span>
          </div>
          {rsiStatus && (
            <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${rsiStatus.color} ${rsiStatus.bg}`}>
              {rsiStatus.text}
            </span>
          )}
        </div>

        {/* 右侧：价格 + 涨幅 */}
        <div className="text-right">
          <div className="text-xl font-mono font-bold text-white">
            ${ticker.price > 0
              ? ticker.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '--'}
          </div>
          <div className={`text-sm font-mono ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? '+' : ''}{ticker.changePercent24h.toFixed(2)}% 24h
          </div>
        </div>
      </div>

      {/* 底部：指标 + 概率 */}
      {hasIndicators ? (
        <div className="mt-3 pt-3 border-t border-zinc-700/50">
          <div className="flex items-center justify-between text-xs">
            {/* 指标 */}
            <div className="flex items-center gap-3">
              <div>
                <span className="text-zinc-500">RSI6 </span>
                <span className={`font-mono ${
                  ticker.rsi6! >= 70 ? 'text-red-400' : 
                  ticker.rsi6! <= 30 ? 'text-green-400' : 'text-white'
                }`}>
                  {ticker.rsi6?.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">RSI14 </span>
                <span className="font-mono text-white">{ticker.rsi14?.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-zinc-500">BB </span>
                <span className={`font-mono ${
                  ticker.bb_pct! >= 0.8 ? 'text-red-400' : 
                  ticker.bb_pct! <= 0.2 ? 'text-green-400' : 'text-white'
                }`}>
                  {(ticker.bb_pct! * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* 净倾向 */}
            {(() => {
              const diff = ((ticker.prob_down || 0) - (ticker.prob_up || 0)) * 100;
              const absDiff = Math.abs(diff);
              if (absDiff < 3) {
                return <span className="text-zinc-500 font-mono">中性</span>;
              }
              if (diff > 0) {
                return <span className="text-red-400 font-mono">偏空 +{absDiff.toFixed(0)}%</span>;
              }
              return <span className="text-green-400 font-mono">偏多 +{absDiff.toFixed(0)}%</span>;
            })()}
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-500 pt-3 mt-3 border-t border-zinc-700/50 text-center">
          等待指标数据...
        </div>
      )}
    </div>
  );
}
