import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, RefreshCw, X, ArrowUpCircle } from 'lucide-react';

export const AppUpdateBanner = () => {
  const { isUpdateAvailable, isRefreshing, applyAppUpdate } = useApp();
  const [dismissed, setDismissed] = useState(false);

  if (!isUpdateAvailable || dismissed) return null;

  return (
    <aside aria-label="Mise à jour disponible" className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="p-3.5 rounded-2xl bg-[#1d2022]/95 backdrop-blur-xl border border-[#F2CA50]/50 shadow-2xl flex items-center justify-between space-x-3 gold-border">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40 shrink-0 relative">
            <Sparkles className="w-4 h-4 text-[#F2CA50] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#1d2022]"></span>
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 truncate">
              <span>Mise à jour prête !</span>
            </h4>
            <p className="text-[10px] text-[#d0c5af] truncate">
              Actualisez pour activer les nouveautés
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={applyAppUpdate}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Rechargement...' : 'Actualiser'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-[#99907c] hover:text-white hover:bg-white/10 transition-colors"
            title="Ignorer pour le moment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
