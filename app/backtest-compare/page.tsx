'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 从时间字符串提取时分
function getTimeOnly(timestamp: string): string {
  // timestamp 格式: "2026-01-08 11:41" (已经是北京时间)
  return timestamp.slice(11, 16);
}

interface BacktestSignal {
  timestamp: string;
  symbol: string;
  direction: string;
  level: string;
  confidence: number;
  entry_price: number;
  settle_price: number | null;
  is_win: boolean | null;
  pnl: number | null;
  rsi6: number;
  bb_pct: number;
  vol_spike: number;
}

interface LiveSignal {
  id: number;
  timestamp: string;
  symbol: string;
  direction: string;
  level: string;
  confidence: number;
  entry_price: number;
  settle_price: number | null;
  is_win: boolean | null;
  pnl: number | null;
  status: string;
}

interface ModelInfo {
  trained_down: number;
  trained_up: number;
  train_klines: number;
  test_klines: number;
}

interface CompareResult {
  date: string;
  mode: string;
  model_info: Record<string, ModelInfo>;
  backtest: {
    signals: BacktestSignal[];
    count: number;
    win_rate: number | null;
    pnl: number;
  };
  live: {
    signals: LiveSignal[];
    count: number;
    win_rate: number | null;
    pnl: number;
  };
  comparison: {
    common: number;
    only_backtest: number;
    only_live: number;
    match_rate: number | null;
  };
  only_backtest_signals: BacktestSignal[];
  only_live_signals: LiveSignal[];
}

export default function BacktestComparePage() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/backtest/today?date=${date}`);
      if (!res.ok) {
        throw new Error(`请求失败: ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">回测 vs 实盘对比</h1>
            <p className="text-zinc-500 text-sm mt-1">独立回测模型，验证实盘预训练逻辑</p>
          </div>
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
            ← 返回首页
          </Link>
        </div>

        {/* 控制面板 */}
        <div className="bg-zinc-800 p-4 rounded-xl mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-zinc-500 text-sm mb-1">选择日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-zinc-700 px-4 py-2 rounded text-white"
              />
            </div>
            <button
              onClick={runBacktest}
              disabled={loading}
              className={`px-6 py-2 rounded font-semibold transition-colors ${
                loading
                  ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {loading ? '运行中...' : '运行回测'}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* 结果展示 */}
        {result && (
          <>
            {/* 对比概览 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-sm">回测信号</div>
                <div className="text-2xl font-bold text-blue-400">{result.backtest.count}</div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-sm">实盘信号</div>
                <div className="text-2xl font-bold text-green-400">{result.live.count}</div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-sm">共同信号</div>
                <div className="text-2xl font-bold text-yellow-400">{result.comparison.common}</div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-xl">
                <div className="text-zinc-500 text-sm">匹配率</div>
                <div className={`text-2xl font-bold ${
                  (result.comparison.match_rate || 0) >= 0.8 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.comparison.match_rate 
                    ? (result.comparison.match_rate * 100).toFixed(1) + '%'
                    : '--'}
                </div>
              </div>
            </div>

            {/* 详细对比 */}
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              {/* 回测结果 */}
              <div className="bg-zinc-800 p-4 rounded-xl">
                <h3 className="text-lg font-semibold mb-3 text-blue-400">📊 回测结果</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">信号数</span>
                    <span>{result.backtest.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">胜率</span>
                    <span className={
                      (result.backtest.win_rate || 0) >= 0.556 ? 'text-green-400' : 'text-red-400'
                    }>
                      {result.backtest.win_rate 
                        ? (result.backtest.win_rate * 100).toFixed(1) + '%'
                        : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">盈亏</span>
                    <span className={result.backtest.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {result.backtest.pnl >= 0 ? '+' : ''}{result.backtest.pnl.toFixed(1)}U
                    </span>
                  </div>
                </div>
              </div>

              {/* 实盘结果 */}
              <div className="bg-zinc-800 p-4 rounded-xl">
                <h3 className="text-lg font-semibold mb-3 text-green-400">🔴 实盘结果</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">信号数</span>
                    <span>{result.live.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">胜率</span>
                    <span className={
                      (result.live.win_rate || 0) >= 0.556 ? 'text-green-400' : 'text-red-400'
                    }>
                      {result.live.win_rate 
                        ? (result.live.win_rate * 100).toFixed(1) + '%'
                        : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">盈亏</span>
                    <span className={result.live.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {result.live.pnl >= 0 ? '+' : ''}{result.live.pnl.toFixed(1)}U
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 模型信息 */}
            <div className="bg-zinc-800 p-4 rounded-xl mb-6">
              <h3 className="text-lg font-semibold mb-3">🧠 回测模型训练信息</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(result.model_info).map(([symbol, info]) => (
                  <div key={symbol} className="bg-zinc-700/50 p-3 rounded-lg">
                    <div className="font-semibold mb-2">{symbol}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-zinc-500">做空训练:</span>
                        <span className="ml-2">{info.trained_down.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">做多训练:</span>
                        <span className="ml-2">{info.trained_up.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">训练K线:</span>
                        <span className="ml-2">{info.train_klines.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">测试K线:</span>
                        <span className="ml-2">{info.test_klines.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 差异信号 */}
            {(result.only_backtest_signals.length > 0 || result.only_live_signals.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                {/* 仅回测有 */}
                {result.only_backtest_signals.length > 0 && (
                  <div className="bg-zinc-800 p-4 rounded-xl">
                    <h3 className="text-lg font-semibold mb-3 text-blue-400">
                      仅回测有 ({result.comparison.only_backtest})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.only_backtest_signals.map((s, i) => (
                        <div key={i} className="bg-zinc-700/50 p-2 rounded text-sm flex justify-between">
                          <span>{getTimeOnly(s.timestamp)} {s.symbol.replace('USDT', '')} {s.direction === 'UP' ? '多' : '空'}</span>
                          <span className="text-zinc-400">{s.level} {(s.confidence * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 仅实盘有 */}
                {result.only_live_signals.length > 0 && (
                  <div className="bg-zinc-800 p-4 rounded-xl">
                    <h3 className="text-lg font-semibold mb-3 text-green-400">
                      仅实盘有 ({result.comparison.only_live})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.only_live_signals.map((s, i) => (
                        <div key={i} className="bg-zinc-700/50 p-2 rounded text-sm flex justify-between">
                          <span>{getTimeOnly(s.timestamp)} {s.symbol.replace('USDT', '')} {s.direction === 'UP' ? '多' : '空'}</span>
                          <span className="text-zinc-400">{s.level} {(s.confidence * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 回测信号列表 */}
            <div className="bg-zinc-800 p-4 rounded-xl">
              <h3 className="text-lg font-semibold mb-3">回测信号明细</h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-800">
                    <tr className="text-zinc-500 border-b border-zinc-700">
                      <th className="text-left py-2 px-2">时间</th>
                      <th className="text-left py-2 px-2">币种</th>
                      <th className="text-left py-2 px-2">方向</th>
                      <th className="text-center py-2 px-2">等级</th>
                      <th className="text-right py-2 px-2">置信度</th>
                      <th className="text-right py-2 px-2">下单价</th>
                      <th className="text-right py-2 px-2">结算价</th>
                      <th className="text-right py-2 px-2">RSI6</th>
                      <th className="text-right py-2 px-2">BB%</th>
                      <th className="text-center py-2 px-2">结果</th>
                      <th className="text-right py-2 px-2">盈亏</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.backtest.signals.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-700/50 hover:bg-zinc-700/30">
                        <td className="py-2 px-2">{getTimeOnly(s.timestamp)}</td>
                        <td className="py-2 px-2">{s.symbol.replace('USDT', '')}</td>
                        <td className={`py-2 px-2 ${s.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                          {s.direction === 'UP' ? '多' : '空'}
                        </td>
                        <td className={`py-2 px-2 text-center ${
                          s.level === 'S' ? 'text-purple-400' :
                          s.level === 'A' ? 'text-blue-400' :
                          s.level === 'B' ? 'text-green-400' : 'text-zinc-400'
                        }`}>{s.level}</td>
                        <td className="py-2 px-2 text-right">{(s.confidence * 100).toFixed(1)}%</td>
                        <td className="py-2 px-2 text-right">{s.entry_price.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right">
                          {s.settle_price ? s.settle_price.toLocaleString() : '--'}
                        </td>
                        <td className="py-2 px-2 text-right">{s.rsi6.toFixed(0)}</td>
                        <td className="py-2 px-2 text-right">{(s.bb_pct * 100).toFixed(0)}%</td>
                        <td className="py-2 px-2 text-center">
                          {s.is_win === null ? '--' : s.is_win ? '✓' : '✗'}
                        </td>
                        <td className={`py-2 px-2 text-right ${
                          s.pnl === null ? 'text-zinc-500' :
                          s.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {s.pnl === null ? '--' : (s.pnl >= 0 ? '+' : '') + s.pnl.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
