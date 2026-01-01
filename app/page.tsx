'use client';

import { useSignals, useStats } from '@/hooks/useSignals';
import { SignalCard } from '@/components/SignalCard';
import { StatsCard } from '@/components/StatsCard';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export default function Home() {
  const { signals, loading: signalsLoading } = useSignals(20);
  const { stats, loading: statsLoading } = useStats();

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
        <StatsCard stats={stats} loading={statsLoading} />

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
            <h2 className="text-lg font-semibold text-white">历史信号</h2>
            <span className="text-sm text-zinc-500">最近 {settledSignals.length} 条</span>
          </div>
          
          {signalsLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-zinc-800/50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : settledSignals.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-zinc-700">
              <p className="text-zinc-500">暂无历史信号</p>
              <p className="text-zinc-600 text-sm mt-1">等待市场出现超买/超卖机会...</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {settledSignals.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-800 mt-12 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>S级 ~81%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>A级 ~75%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>B级 ~70%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                <span>C级 ~63%</span>
              </div>
            </div>
            <div className="text-zinc-600">盈亏平衡胜率: 55.56%</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
