/**
 * WebSocket 客户端 - 实时信号推送
 */

import { Signal } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export type MessageType = 'signal' | 'settlement' | 'ticker';

export interface TickerMessage {
  symbol: string;
  price: number;
  rsi6: number;
  rsi14: number;
  bb_pct: number;
  prob_down: number;
  prob_up: number;
  timestamp: string;
}

export interface WSMessage {
  type: MessageType;
  data: Signal | SettlementData | TickerMessage;
}

export interface SettlementData {
  id: number;
  symbol: string;
  direction: 'UP' | 'DOWN';
  level: 'S' | 'A' | 'B' | 'C';
  entry_price: number;
  settle_price: number;
  settle_at?: string;
  is_win: boolean;
  pnl: number;
}

type MessageHandler = (message: WSMessage) => void;

class SignalWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // 响应服务端的 ping
          if (message.type === 'ping') {
            this.ws?.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          
          this.handlers.forEach(handler => handler(message as WSMessage));
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('Failed to connect:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 单例
export const signalWS = new SignalWebSocket();
