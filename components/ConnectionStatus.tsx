'use client';

import { useEffect, useState } from 'react';
import { signalWS } from '@/lib/websocket';

export function ConnectionStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setConnected(signalWS.isConnected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      connected 
        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
        : 'bg-red-500/10 text-red-400 border border-red-500/20'
    }`}>
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
      {connected ? '已连接' : '未连接'}
    </div>
  );
}
