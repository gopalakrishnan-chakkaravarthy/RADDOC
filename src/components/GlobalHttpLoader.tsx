import React, { useState, useEffect } from 'react';
import { subscribeApiState } from '../services/api';
import { Loader2, Database, Zap } from 'lucide-react';

export const GlobalHttpLoader: React.FC = () => {
  const [apiState, setApiState] = useState<{ activeRequests: number; isLoading: boolean }>({
    activeRequests: 0,
    isLoading: false
  });

  useEffect(() => {
    const unsubscribe = subscribeApiState((state) => {
      setApiState(state);
    });
    return unsubscribe;
  }, []);

  if (!apiState.isLoading) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-slate-900/90 text-white backdrop-blur border border-cyan-500/40 shadow-2xl rounded-full px-4 py-2 flex items-center gap-2.5 text-xs font-semibold">
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <Zap className="w-2 h-2 text-cyan-200 absolute" />
        </div>
        <span className="text-slate-200">
          Syncing Database API...
        </span>
        {apiState.activeRequests > 1 && (
          <span className="bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono">
            {apiState.activeRequests} pending
          </span>
        )}
      </div>
    </div>
  );
};
