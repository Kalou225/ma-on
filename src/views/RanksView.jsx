import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, Sparkles, Trophy, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { RANKS_CONFIG, getNextRank, getRankDetails } from '../utils/ranks';

export const RanksView = () => {
  const { user, setShowRankSuccessModal, setSelectedRankCelebration, setShowUpgradeRankModal, setSelectedTargetRank } = useApp();

  const currentRankDetails = getRankDetails(user.rank || 'Apprenti');
  const nextRank = getNextRank(user.rank || 'Apprenti');
  const userCommission = user.commissionBalance ?? user.balance ?? 0;
  const isAccountActive = user.status === 'ACTIF' && (user.activationBalance || 0) > 0;

  const handleOpenUpgradeToRank = (rankName) => {
    if (setSelectedTargetRank) setSelectedTargetRank(rankName);
    setShowUpgradeRankModal(true);
  };

  const handlePreviewCelebration = (rankItem) => {
    setSelectedRankCelebration({
      title: `Aperçu du Grade ${rankItem.name} 🏆`,
      name: rankItem.name,
      bonus: 0,
      rate: rankItem.rateFormatted,
      levels: 3,
      benefits: `Taux de commission réseau de ${rankItem.rateFormatted} activé sur l'ensemble de votre branche directe.`,
    });
    setShowRankSuccessModal(true);
  };

  // Progression calculation towards next rank
  const nextCost = nextRank ? nextRank.cost : 0;
  const progressToNext = nextCost > 0 ? Math.min(100, Math.round((userCommission / nextCost) * 100)) : 100;
  const canAffordNext = nextRank && userCommission >= nextCost;

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      {/* Current Rank Banner */}
      <div className="p-5 rounded-3xl glass-card border border-[#d4af37]/40 relative overflow-hidden space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl gold-gradient-bg p-[2px] shadow-xl">
              <div className="w-full h-full bg-[#101416] rounded-[14px] flex items-center justify-center text-xl">
                {currentRankDetails.icon || '🏆'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold">
                Votre Rang Actuel
              </span>
              <h2 className="text-xl font-extrabold text-white gold-gradient-text">
                {user.rank}
              </h2>
              <span className="text-[11px] font-bold text-[#F2CA50]">
                Taux de commission réseau : {currentRankDetails.rateFormatted}
              </span>
            </div>
          </div>

          <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full border border-[#10B981]/30">
            {user.status}
          </span>
        </div>

        {/* Next Rank Progression Card */}
        {isAccountActive && nextRank && (
          <div className="p-3.5 rounded-2xl bg-[#101416]/90 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#99907c]">
                Objectif : <strong className="text-white">{nextRank.name} ({nextRank.rateFormatted})</strong>
              </span>
              <span className={`font-mono font-bold ${canAffordNext ? 'text-[#10B981]' : 'text-[#F2CA50]'}`}>
                {userCommission.toLocaleString()} / {nextCost.toLocaleString()} FCFA
              </span>
            </div>

            <div className="w-full bg-[#1d2022] rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  canAffordNext ? 'bg-[#10B981]' : 'bg-[#F2CA50]'
                }`}
                style={{ width: `${progressToNext}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-[#99907c]">
                {canAffordNext ? '🎉 Palier atteint ! Vous pouvez monter de grade.' : `Manque ${(nextCost - userCommission).toLocaleString()} FCFA sur le Solde Commission.`}
              </span>
              <button
                onClick={() => handleOpenUpgradeToRank(nextRank.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1 transition-all ${
                  canAffordNext
                    ? 'gold-gradient-bg text-black hover:brightness-110 shadow-md scale-105 active:scale-95'
                    : 'bg-[#272a2d] hover:bg-[#323538] text-[#F2CA50] border border-[#d4af37]/30'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Monter de grade</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ranks Ladder List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Grille des 8 Rangs & Conditions de Déblocage
        </h3>

        <div className="space-y-2.5">
          {RANKS_CONFIG.map((r, index) => {
            const isCurrent = (user.rank || 'Apprenti').trim().toLowerCase() === r.name.toLowerCase();
            const currentIndex = RANKS_CONFIG.findIndex(
              (x) => x.name.toLowerCase() === (user.rank || 'Apprenti').trim().toLowerCase()
            );
            const isPast = index < currentIndex;
            const isHigher = index > currentIndex;
            const canAfford = isHigher && isAccountActive && userCommission >= r.cost;

            return (
              <div
                key={r.name}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#1d2022] border-[#F2CA50] shadow-[0_0_15px_rgba(242,202,80,0.15)]'
                    : canAfford
                    ? 'bg-[#1d2022] border-[#10B981]/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : 'bg-[#191c1e] border-white/5 opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl border text-xs font-bold ${r.badgeColor}`}>
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white">{r.name}</h4>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#F2CA50] text-black">
                            Actuel
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-white/10 text-[#99907c] flex items-center space-x-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#10B981]" />
                            <span>Acquis</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#99907c]">
                        {isAccountActive && r.cost > 0 ? (
                          <>Seuil Commission : <strong className="text-white font-mono">{r.cost.toLocaleString()} FCFA</strong></>
                        ) : (
                          <>1er Dépôt requis : <strong className="text-white font-mono">{r.min.toLocaleString()} – {r.max === Infinity ? 'et +' : r.max.toLocaleString()} FCFA</strong></>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-xs font-mono font-bold text-[#F2CA50] block">
                      {r.rateFormatted}
                    </span>

                    {isHigher && isAccountActive ? (
                      <button
                        onClick={() => handleOpenUpgradeToRank(r.name)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                          canAfford
                            ? 'gold-gradient-bg text-black hover:brightness-110 shadow-sm'
                            : 'bg-[#272a2d] hover:bg-[#323538] text-[#d0c5af] border border-white/10'
                        }`}
                      >
                        {canAfford ? 'Débloquer 🚀' : 'Viser ce rang'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePreviewCelebration(r)}
                        className="text-[9px] text-[#99907c] hover:text-white flex items-center space-x-0.5 ml-auto"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Aperçu</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

