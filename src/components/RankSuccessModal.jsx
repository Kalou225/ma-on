import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, X, Sparkles, Check, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RankSuccessModal = () => {
  const { showRankSuccessModal, setShowRankSuccessModal, selectedRankCelebration } = useApp();

  if (!showRankSuccessModal || !selectedRankCelebration) return null;

  const handleClaimBonus = () => {
    try {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    } catch (e) {}
    setShowRankSuccessModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
      <div className="bg-[#1d2022] border-2 border-[#F2CA50] rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_50px_rgba(242,202,80,0.3)] text-center p-6 space-y-5">
        {/* Shimmer Badge Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full gold-gradient-bg animate-ping opacity-20" />
          <div className="w-20 h-20 rounded-2xl gold-gradient-bg p-[2px] shadow-2xl">
            <div className="w-full h-full bg-[#101416] rounded-[14px] flex items-center justify-center">
              <Award className="w-10 h-10 text-[#F2CA50]" />
            </div>
          </div>
          <Sparkles className="w-6 h-6 text-[#F2CA50] absolute -top-2 -right-2 animate-bounce" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#F2CA50]/20 text-[#F2CA50] border border-[#F2CA50]/40">
            FÉLICITATIONS !
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2 gold-gradient-text">
            GRADE {selectedRankCelebration.name.toUpperCase()} DÉBLOQUÉ
          </h2>
          <p className="text-xs text-[#d0c5af] mt-1.5 px-2">
            Vous avez validé les exigences et franchi une nouvelle étape majeure dans le réseau.
          </p>
        </div>

        {/* Reward card */}
        <div className="p-4 rounded-2xl bg-[#191c1e] border border-white/10 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#99907c]">Bonus de Grade :</span>
            <span className="font-mono font-bold text-[#F2CA50] text-sm">
              +{selectedRankCelebration.bonus.toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#99907c]">Taux de Commission :</span>
            <span className="font-bold text-white">{selectedRankCelebration.rate}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#99907c]">Niveaux débloqués :</span>
            <span className="font-bold text-[#10B981]">Jusqu'au Niveau {selectedRankCelebration.levels}</span>
          </div>
        </div>

        <button
          onClick={handleClaimBonus}
          className="w-full py-3.5 rounded-xl gold-gradient-bg text-black font-bold text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <Check className="w-4 h-4" />
          <span>Recevoir mon Bonus & Continuer</span>
        </button>
      </div>
    </div>
  );
};
