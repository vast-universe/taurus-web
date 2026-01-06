'use client';

import { useEffect, useState } from 'react';

interface Signal {
  timestamp: string;
  settle_time: string;
  symbol: string;
  direction: string;
  level: string;
  confidence: number;
  entry_price: number;
  settle_price: number;
  bet_amount: number;
  is_win: boolean;
  pnl: number;
  rsi6: number;
  bb_pct: number;
  cumulative_pnl: number;
}

interface Stats {
  total: number;
  wins: number;
  winRate: number;
  pnl: number;
}

export default function AnalysisPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ symbol: 'ALL', direction: 'ALL' });
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['S', 'A', 'B', 'C']);
  const [dateFilter, setDateFilter] = useState<string | null>(null); // 日期或月份筛选
  const [slotLimit, setSlotLimit] = useState(true); // 5单限制

  useEffect(() => {
    fetch('/signals.csv')
      .then(res => res.text())
      .then(csv => {
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => {
          const values = line.split(',');
          const obj: Record<string, string | number | boolean> = {};
          headers.forEach((h, i) => {
            if (['confidence', 'entry_price', 'settle_price', 'bet_amount', 'pnl', 'rsi6', 'bb_pct', 'cumulative_pnl'].includes(h)) {
              obj[h] = parseFloat(values[i]);
            } else if (h === 'is_win') {
              obj[h] = values[i] === 'True';
            } else {
              obj[h] = values[i];
            }
          });
          return obj as unknown as Signal;
        });
        setSignals(data);
        setLoading(false);
      });
  }, []);

  // 应用5单限制过滤
  const applySlotLimit = (data: Signal[]): Signal[] => {
    if (!slotLimit) return data;
    
    const result: Signal[] = [];
    const pendingSlots: string[] = []; // 存储结算时间
    
    for (const s of data) {
      // 清理已结算的槽位
      while (pendingSlots.length > 0 && pendingSlots[0] <= s.timestamp) {
        pendingSlots.shift();
      }
      
      // 检查是否有空槽位
      if (pendingSlots.length < 5) {
        result.push(s);
        // 插入并保持排序
        pendingSlots.push(s.settle_time);
        pendingSlots.sort();
      }
    }
    
    return result;
  };

  const filteredSignals = applySlotLimit(signals.filter(s => {
    if (filter.symbol !== 'ALL' && s.symbol !== filter.symbol) return false;
    if (filter.direction !== 'ALL' && s.direction !== filter.direction) return false;
    if (selectedLevels.length > 0 && !selectedLevels.includes(s.level)) return false;
    return true;
  }));

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const calcStats = (data: Signal[]): Stats => {
    const wins = data.filter(s => s.is_win).length;
    return {
      total: data.length,
      wins,
      winRate: data.length > 0 ? wins / data.length * 100 : 0,
      pnl: data.reduce((sum, s) => sum + s.pnl, 0),
    };
  };

  const overallStats = calcStats(filteredSignals);

  // 按等级统计
  const levelStats = ['S', 'A', 'B', 'C'].map(level => ({
    level,
    ...calcStats(filteredSignals.filter(s => s.level === level)),
  }));

  // 按月统计
  const monthlyStats = filteredSignals.reduce((acc, s) => {
    const month = s.timestamp.slice(0, 7);
    if (!acc[month]) acc[month] = { month, signals: [], pnl: 0 };
    acc[month].signals.push(s);
    acc[month].pnl += s.pnl;
    return acc;
  }, {} as Record<string, { month: string; signals: Signal[]; pnl: number }>);

  const monthlyData = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white">加载数据中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">2024-2025年回测数据分析</h1>

        {/* 筛选器 */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 items-center">
          <select
            className="bg-zinc-800 px-3 sm:px-4 py-2 rounded text-sm"
            value={filter.symbol}
            onChange={e => setFilter({ ...filter, symbol: e.target.value })}
          >
            <option value="ALL">全部币种</option>
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
          </select>
          <select
            className="bg-zinc-800 px-3 sm:px-4 py-2 rounded text-sm"
            value={filter.direction}
            onChange={e => setFilter({ ...filter, direction: e.target.value })}
          >
            <option value="ALL">全部方向</option>
            <option value="LONG">做多</option>
            <option value="SHORT">做空</option>
          </select>
          
          {/* 5单限制 */}
          <button
            onClick={() => setSlotLimit(!slotLimit)}
            className={`px-3 py-2 rounded text-sm font-bold transition-colors ${
              slotLimit
                ? 'bg-yellow-500/30 text-yellow-400 ring-1 ring-yellow-500'
                : 'bg-zinc-800 text-zinc-600'
            }`}
          >
            5单限制
          </button>
          
          {/* 等级多选 */}
          <div className="flex gap-1">
            {['S', 'A', 'B', 'C'].map(level => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-2 sm:px-3 py-2 rounded text-sm font-bold transition-colors ${
                  selectedLevels.includes(level)
                    ? level === 'S' ? 'bg-purple-500/30 text-purple-400 ring-1 ring-purple-500'
                    : level === 'A' ? 'bg-blue-500/30 text-blue-400 ring-1 ring-blue-500'
                    : level === 'B' ? 'bg-green-500/30 text-green-400 ring-1 ring-green-500'
                    : 'bg-zinc-500/30 text-zinc-300 ring-1 ring-zinc-500'
                    : 'bg-zinc-800 text-zinc-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          
          {dateFilter && (
            <button
              className="bg-yellow-500/20 text-yellow-400 px-3 sm:px-4 py-2 rounded flex items-center gap-2 text-sm"
              onClick={() => setDateFilter(null)}
            >
              <span>📅 {dateFilter}</span>
              <span>✕</span>
            </button>
          )}
        </div>

        {/* 总体统计 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-zinc-800 p-3 sm:p-4 rounded-xl">
            <div className="text-zinc-500 text-xs sm:text-sm">总信号</div>
            <div className="text-lg sm:text-2xl font-bold">{overallStats.total.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-800 p-3 sm:p-4 rounded-xl">
            <div className="text-zinc-500 text-xs sm:text-sm">胜率</div>
            <div className={`text-lg sm:text-2xl font-bold ${overallStats.winRate >= 55.6 ? 'text-green-400' : 'text-red-400'}`}>
              {overallStats.winRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-zinc-800 p-3 sm:p-4 rounded-xl">
            <div className="text-zinc-500 text-xs sm:text-sm">盈利次数</div>
            <div className="text-lg sm:text-2xl font-bold text-green-400">{overallStats.wins.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-800 p-3 sm:p-4 rounded-xl">
            <div className="text-zinc-500 text-xs sm:text-sm">总盈亏</div>
            <div className={`text-lg sm:text-2xl font-bold ${overallStats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {overallStats.pnl >= 0 ? '+' : ''}{overallStats.pnl.toFixed(0)}U
            </div>
          </div>
        </div>

        {/* 按等级统计 */}
        <div className="bg-zinc-800 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">按等级统计</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {levelStats.map(s => {
              const betAmount = s.level === 'S' ? 30 : s.level === 'A' ? 20 : s.level === 'B' ? 10 : 5;
              return (
                <div key={s.level} className="bg-zinc-700/50 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className={`font-bold text-sm sm:text-base ${
                      s.level === 'S' ? 'text-purple-400' :
                      s.level === 'A' ? 'text-blue-400' :
                      s.level === 'B' ? 'text-green-400' : 'text-zinc-400'
                    }`}>{s.level}级 <span className="text-xs font-normal text-zinc-500">({betAmount}U)</span></span>
                    <span className="text-xs sm:text-sm text-zinc-500">{s.total}笔</span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">胜率</span>
                      <span className={s.winRate >= 55.6 ? 'text-green-400' : 'text-red-400'}>
                        {s.winRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">盈亏</span>
                      <span className={s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {s.pnl >= 0 ? '+' : ''}{s.pnl.toFixed(0)}U
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 月度盈亏 */}
        <div className="bg-zinc-800 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">月度盈亏</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {monthlyData.map(m => (
                <div 
                  key={m.month} 
                  className={`bg-zinc-700/50 p-2 sm:p-3 rounded-lg w-20 sm:w-24 text-center cursor-pointer hover:bg-zinc-600/50 transition-colors ${dateFilter === m.month ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => setDateFilter(dateFilter === m.month ? null : m.month)}
                >
                  <div className="text-xs text-zinc-500 mb-1">{m.month}</div>
                  <div className={`font-bold text-sm sm:text-base ${m.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {m.pnl >= 0 ? '+' : ''}{(m.pnl / 1000).toFixed(1)}k
                  </div>
                  <div className="text-xs text-zinc-500">{m.signals.length}笔</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 每日盈亏 */}
        <div className="bg-zinc-800 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
            每日盈亏明细
            {dateFilter && dateFilter.length === 7 && <span className="text-zinc-500 text-sm font-normal ml-2">({dateFilter})</span>}
          </h2>
          {(() => {
            // 如果选择了月份，只显示该月的数据
            const signalsForDaily = dateFilter && dateFilter.length === 7
              ? filteredSignals.filter(s => s.timestamp.startsWith(dateFilter))
              : filteredSignals;
            
            const dailyStats = signalsForDaily.reduce((acc, s) => {
              const day = s.timestamp.slice(0, 10);
              if (!acc[day]) acc[day] = { day, signals: 0, wins: 0, pnl: 0 };
              acc[day].signals++;
              if (s.is_win) acc[day].wins++;
              acc[day].pnl += s.pnl;
              return acc;
            }, {} as Record<string, { day: string; signals: number; wins: number; pnl: number }>);
            
            const dailyData = Object.values(dailyStats).sort((a, b) => b.day.localeCompare(a.day));
            const profitDays = dailyData.filter(d => d.pnl > 0).length;
            const lossDays = dailyData.filter(d => d.pnl < 0).length;
            const maxProfit = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.pnl)) : 0;
            const maxLoss = dailyData.length > 0 ? Math.min(...dailyData.map(d => d.pnl)) : 0;
            const avgDaily = dailyData.length > 0 ? dailyData.reduce((sum, d) => sum + d.pnl, 0) / dailyData.length : 0;
            
            return (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="bg-zinc-700/50 p-2 sm:p-3 rounded-lg text-center">
                    <div className="text-xs text-zinc-500">盈利天数</div>
                    <div className="text-base sm:text-lg font-bold text-green-400">{profitDays}</div>
                  </div>
                  <div className="bg-zinc-700/50 p-2 sm:p-3 rounded-lg text-center">
                    <div className="text-xs text-zinc-500">亏损天数</div>
                    <div className="text-base sm:text-lg font-bold text-red-400">{lossDays}</div>
                  </div>
                  <div className="bg-zinc-700/50 p-2 sm:p-3 rounded-lg text-center">
                    <div className="text-xs text-zinc-500">日均盈亏</div>
                    <div className={`text-base sm:text-lg font-bold ${avgDaily >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {avgDaily >= 0 ? '+' : ''}{avgDaily.toFixed(1)}U
                    </div>
                  </div>
                  <div className="bg-zinc-700/50 p-2 sm:p-3 rounded-lg text-center hidden sm:block">
                    <div className="text-xs text-zinc-500">最大单日盈利</div>
                    <div className="text-base sm:text-lg font-bold text-green-400">+{maxProfit.toFixed(0)}U</div>
                  </div>
                  <div className="bg-zinc-700/50 p-2 sm:p-3 rounded-lg text-center hidden sm:block">
                    <div className="text-xs text-zinc-500">最大单日亏损</div>
                    <div className="text-base sm:text-lg font-bold text-red-400">{maxLoss.toFixed(0)}U</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-800">
                      <tr className="text-zinc-500 border-b border-zinc-700">
                        <th className="text-left py-2">日期</th>
                        <th className="text-right py-2">信号数</th>
                        <th className="text-right py-2">胜率</th>
                        <th className="text-right py-2">盈亏</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.map(d => (
                        <tr 
                          key={d.day} 
                          className={`border-b border-zinc-700/50 hover:bg-zinc-700/30 cursor-pointer ${dateFilter === d.day ? 'bg-yellow-500/20' : ''}`}
                          onClick={() => setDateFilter(dateFilter === d.day ? null : d.day)}
                        >
                          <td className="py-2">{d.day}</td>
                          <td className="py-2 text-right">{d.signals}</td>
                          <td className={`py-2 text-right ${d.wins / d.signals >= 0.556 ? 'text-green-400' : 'text-red-400'}`}>
                            {(d.wins / d.signals * 100).toFixed(1)}%
                          </td>
                          <td className={`py-2 text-right font-mono ${d.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {d.pnl >= 0 ? '+' : ''}{d.pnl.toFixed(1)}U
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>

        {/* 信号列表 */}
        <div className="bg-zinc-800 p-3 sm:p-4 rounded-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
            {dateFilter ? `${dateFilter} 的信号` : '最近100条信号'}
          </h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="sticky top-0 bg-zinc-800">
                <tr className="text-zinc-500 border-b border-zinc-700">
                  <th className="text-left py-2">时间</th>
                  <th className="text-left py-2 hidden sm:table-cell">结算</th>
                  <th className="text-left py-2">币种</th>
                  <th className="text-left py-2">方向</th>
                  <th className="text-left py-2">等级</th>
                  <th className="text-right py-2 hidden sm:table-cell">入场价</th>
                  <th className="text-right py-2 hidden sm:table-cell">结算价</th>
                  <th className="text-right py-2">结果</th>
                  <th className="text-right py-2">盈亏</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let displaySignals = filteredSignals;
                  if (dateFilter) {
                    displaySignals = filteredSignals.filter(s => s.timestamp.startsWith(dateFilter));
                  } else {
                    displaySignals = filteredSignals.slice(-100);
                  }
                  return displaySignals.slice().reverse().map((s, i) => (
                    <tr key={i} className="border-b border-zinc-700/50 hover:bg-zinc-700/30">
                      <td className="py-2">{s.timestamp.slice(5, 16)}</td>
                      <td className="py-2 hidden sm:table-cell">{s.settle_time.slice(5, 16)}</td>
                      <td className="py-2">{s.symbol.replace('USDT', '')}</td>
                      <td className={`py-2 ${s.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {s.direction === 'LONG' ? '多' : '空'}
                      </td>
                      <td className={`py-2 ${
                        s.level === 'S' ? 'text-purple-400' :
                        s.level === 'A' ? 'text-blue-400' :
                        s.level === 'B' ? 'text-green-400' : 'text-zinc-400'
                      }`}>{s.level}</td>
                      <td className="py-2 text-right font-mono hidden sm:table-cell">{s.entry_price.toLocaleString()}</td>
                      <td className="py-2 text-right font-mono hidden sm:table-cell">{s.settle_price.toLocaleString()}</td>
                      <td className={`py-2 text-right ${s.is_win ? 'text-green-400' : 'text-red-400'}`}>
                        {s.is_win ? '✓' : '✗'}
                      </td>
                      <td className={`py-2 text-right font-mono ${s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {s.pnl >= 0 ? '+' : ''}{s.pnl.toFixed(1)}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
