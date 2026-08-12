import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

export const InstallPWAPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if user already dismissed or installed app recently
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone || dismissed) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      // Delay prompt slightly for smooth UX
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Handle Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 animate-fade-in">
      <div className="bg-[#182226]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl shadow-emerald-950/50 text-white relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded-full bg-white/5 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-0.5 shadow-lg shadow-emerald-500/20 flex-shrink-0 flex items-center justify-center">
            <img src="/icon-192x192.png" alt="Eco-Finance" className="w-full h-full rounded-[10px] object-cover" />
          </div>

          <div className="flex-1 pr-4">
            <h4 className="font-semibold text-sm text-emerald-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Installer l'application Mobile
            </h4>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Installez Eco-Finance sur votre écran d'accueil pour un accès instantané en plein écran.
            </p>

            {isIOS ? (
              <div className="mt-3 p-2 bg-white/5 rounded-lg border border-white/10 text-[11px] text-gray-300 flex items-center gap-2">
                <span>Appuyez sur <Share className="w-3.5 h-3.5 inline text-blue-400" /> puis <strong>'Sur l'écran d'accueil'</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" /></span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="mt-3 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-medium py-2 px-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Installer sur mon téléphone
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
