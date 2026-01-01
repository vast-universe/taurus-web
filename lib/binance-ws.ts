/**
 * Binance WebSocket 客户端 - 实时价格
 */

export interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

type TickerHandler = (data: TickerData) => void;

class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Set<TickerHandler> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private symbols = ['btcusdt', 'ethusdt'];

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const streams = this.symbols.map(s => `${s}@ticker`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('Binance WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.data) {
            const d = msg.data;
            const ticker: TickerData = {
              symbol: d.s,  // BTCUSDT
              price: parseFloat(d.c),  // 最新价
              change24h: parseFloat(d.p),  // 24h涨跌额
              changePercent24h: parseFloat(d.P),  // 24h涨跌幅
            };
            this.handlers.forEach(handler => handler(ticker));
          }
        } catch (e) {
          console.error('Failed to parse Binance message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('Binance WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
      };
    } catch (e) {
      console.error('Failed to connect Binance:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(handler: TickerHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const binanceWS = new BinanceWebSocket();
