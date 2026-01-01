/**
 * 信号服务 API 客户端
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Signal {
  id: number;
  symbol: string;
  direction: 'UP' | 'DOWN';
  level: 'S' | 'A' | 'B' | 'C';
  confidence: number;
  entry_price: number;
  bet_amount: number;
  created_at: string;
  settle_at?: string;
  settle_price?: number;
  is_win?: boolean;
  pnl?: number;
  status: 'pending' | 'settled';
}

export interface LevelStats {
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
  pnl: number;
}

export interface Stats {
  total_signals: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
  by_level?: {
    S: LevelStats;
    A: LevelStats;
    B: LevelStats;
    C: LevelStats;
  };
}

export interface Health {
  status: string;
  service: string;
  websocket_connected: boolean;
  pending_signals: number;
}

// 健康检查
export async function getHealth(): Promise<Health> {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

// 获取信号列表
export async function getSignals(params?: {
  symbol?: string;
  status?: string;
  limit?: number;
}): Promise<{ signals: Signal[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.symbol) searchParams.set('symbol', params.symbol);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  
  const res = await fetch(`${API_URL}/api/signals?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch signals');
  return res.json();
}

// 获取最新信号
export async function getLatestSignals(limit = 10): Promise<{ signals: Signal[]; total: number }> {
  const res = await fetch(`${API_URL}/api/signals/latest?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch latest signals');
  return res.json();
}

// 获取统计数据
export async function getStats(days?: number): Promise<Stats> {
  const url = days ? `${API_URL}/api/stats?days=${days}` : `${API_URL}/api/stats`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// 获取今日统计
export async function getTodayStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/stats/today`);
  if (!res.ok) throw new Error('Failed to fetch today stats');
  return res.json();
}
