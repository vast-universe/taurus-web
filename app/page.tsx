'use client';

import { useSignals, useStats } from '@/hooks/useSignals';
import { useTicker } from '@/hooks/useTicker';
import { SignalCard } from '@/components/SignalCard';
import { StatsCard } from '@/components/StatsCard';
import { TickerCard } from '@/components/TickerCard';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export default function Home() {
  const { signals, loading: signalsLoading } = useSignals();
  const { stats, todayStats, loading: statsLoading } = useStats();
  const { tickers } = useTicker();

  const pendingSignals = signals.filter(s => s.status === 'pending');
  const settledSignals = signals.filter(s => s.status === 'settled');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Taurus Signal</h1>
            <p className="text-xs text-zinc-500">币安事件合约信号系统</p>
          </div>
          <ConnectionStatus />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 实时行情 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">实时行情</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <TickerCard ticker={tickers.BTCUSDT} />
            <TickerCard ticker={tickers.ETHUSDT} />
          </div>
        </section>

        <StatsCard stats={stats} todayStats={todayStats} loading={statsLoading} />

        {pendingSignals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
              <h2 className="text-lg font-semibold text-white">待结算信号</h2>
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                {pendingSignals.length}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {pendingSignals.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">今日信号</h2>
              <span className="text-sm text-zinc-500">({settledSignals.length} 条)</span>
            </div>
            <a href="/analysis" className="text-sm text-blue-400 hover:text-blue-300">
              查看回测分析 →
            </a>
          </div>
          
          {signalsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : settledSignals.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-zinc-700">
              <p className="text-zinc-500">暂无历史信号</p>
              <p className="text-zinc-600 text-sm mt-1">等待市场出现超买/超卖机会...</p>
            </div>
          ) : (
            <div className="bg-zinc-800/50 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-700/50">
                    <th className="text-left py-3 px-4">入场时间</th>
                    <th className="text-left py-3 px-4">结算时间</th>
                    <th className="text-left py-3 px-4">币种</th>
                    <th className="text-left py-3 px-4">方向</th>
                    <th className="text-center py-3 px-4">等级</th>
                    <th className="text-right py-3 px-4">置信度</th>
                    <th className="text-right py-3 px-4">下单</th>
                    <th className="text-right py-3 px-4">入场价</th>
                    <th className="text-right py-3 px-4">结算价</th>
                    <th className="text-center py-3 px-4">结果</th>
                    <th className="text-right py-3 px-4">盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {settledSignals.map(signal => (
                    <tr key={signal.id} className="border-b border-zinc-700/30 hover:bg-zinc-700/20">
                      <td className="py-3 px-4 text-zinc-400">
                        {new Date(signal.created_at).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {signal.settle_at ? new Date(signal.settle_at).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }) : '--'}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">{signal.symbol.replace('USDT', '')}</td>
                      <td className={`py-3 px-4 ${signal.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                        {signal.direction === 'UP' ? '做多' : '做空'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          signal.level === 'S' ? 'bg-purple-500/20 text-purple-400' :
                          signal.level === 'A' ? 'bg-blue-500/20 text-blue-400' :
                          signal.level === 'B' ? 'bg-green-500/20 text-green-400' :
                          'bg-zinc-500/20 text-zinc-400'
                        }`}>{signal.level}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-300">
                        {(signal.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-yellow-400">
                        {signal.bet_amount}U
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-white">
                        ${signal.entry_price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-400">
                        ${signal.settle_price?.toLocaleString() || '--'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-lg ${signal.is_win ? 'text-green-400' : 'text-red-400'}`}>
                          {signal.is_win ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${signal.pnl && signal.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {signal.pnl ? (signal.pnl > 0 ? '+' : '') + signal.pnl.toFixed(1) : '--'}U
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-800 mt-12 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-zinc-600">
          Taurus Signal © 2025
        </div>
      </footer>
    </div>
  );
}
