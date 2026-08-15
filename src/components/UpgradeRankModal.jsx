import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Award, X, Sparkles, Check, ArrowRight, ShieldCheck, TrendingUp, AlertCircle, Users, Share2 } from 'lucide-react';
import { RANKS_CONFIG, getNextRank, getRankDetails, getHigherRanks } from '../utils/ranks';

export const UpgradeRankModal = () => {
  const {
    showUpgradeRankModal,
    setShowUpgradeRankModal,
    selectedTargetRank,
    setSelectedTargetRank,
    upgradeRank,
    user,
    setShowShareModal,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTargetName, setActiveTargetName] = useState(null);

  const currentRankDetails = getRankDetails(user.rank || 'Apprenti');
  const higherRanks = getHigherRanks(user.rank || 'Apprenti');
  const defaultNext = getNextRank(user.rank || 'Apprenti');

  useEffect(() => {
    if (selectedTargetRank) {
      setActiveTargetName(selectedTargetRank);
    } else if (defaultNext) {
      setActiveTargetName(defaultNext.name);
    }
  }, [selectedTargetRank, defaultNext, showUpgradeRankModal]);

  if (!showUpgradeRankModal) return null;

  const targetRankDetails = activeTargetName ? getRankDetails(activeTargetName) : defaultNext;
  const userCommission = user.commissionBalance ?? user.balance ?? 0;
  const isGrandMaster = !defaultNext && user.rank === 'Grand Maître';

  const requiredCost = targetRankDetails ? targetRankDetails.cost : 0;
  const hasSufficientBalance = userCommission >= requiredCost;
  const missingAmount = Math.max(0, requiredCost - userCommission);
  const progressPercent = requiredCost > 0 ? Math.min(100, Math.round((userCommission / requiredCost) * 100)) : 100;
  const remainingAfter = Math.max(0, userCommission - requiredCost);

  const handleConfirmUpgrade = async () => {
    if (!targetRankDetails || !hasSufficientBalance || isLoading) return;
    setIsLoading(true);
    try {
      await upgradeRank(targetRankDetails.name);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1d2022] border border-[#d4af37]/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gold-gradient-bg/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl gold-gradient-bg p-[2px] shadow-lg">
              <div className="w-full h-full bg-[#101416] rounded-[10px] flex items-center justify-center">
                <Award className="w-4 h-4 text-[#F2CA50]" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e0e3e6]">Monter de Grade</h3>
              <p className="text-[11px] text-[#99907c]">Évolution via Solde Commission</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowUpgradeRankModal(false);
              if (setSelectedTargetRank) setSelectedTargetRank(null);
            }}
            className="p-1.5 rounded-full bg-[#272a2d] hover:bg-[#323538] text-[#99907c] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {isGrandMaster ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-full gold-gradient-bg mx-auto flex items-center justify-center text-3xl shadow-xl">
                🏆
              </div>
              <h4 className="text-lg font-extrabold text-white gold-gradient-text">
                Grade Suprême Atteint !
              </h4>
              <p className="text-xs text-[#d0c5af]">
                Félicitations ! Vous êtes <strong>Grand Maître</strong> et bénéficiez déjà du taux de commission réseau maximal de <strong>20%</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Higher Ranks Selection Pills (if more than 1 higher rank available) */}
              {higherRanks.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#99907c] uppercase tracking-wider block">
                    Choisissez votre grade cible :
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {higherRanks.map((r) => {
                      const isSelected = targetRankDetails?.name === r.name;
                      const canAfford = userCommission >= r.cost;
                      return (
                        <button
                          key={r.name}
                          type="button"
                          onClick={() => setActiveTargetName(r.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                            isSelected
                              ? 'bg-[#F2CA50] text-black border-[#F2CA50] shadow-md scale-105'
                              : canAfford
                              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 hover:border-[#10B981]'
                              : 'bg-[#101416] text-[#99907c] border-white/10 hover:text-white'
                          }`}
                        >
                          <span>{r.name} ({r.rateFormatted})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rank Transition Showcase Card */}
              <div className="p-4 rounded-2xl bg-[#101416] border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  {/* Current Rank */}
                  <div className="text-left space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#99907c] tracking-wider block">
                      Grade Actuel
                    </span>
                    <p className="text-xs font-bold text-white truncate max-w-[120px]">
                      {currentRankDetails.name}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-[#99907c] block">
                      {currentRankDetails.rateFormatted} commission
                    </span>
                  </div>

                  {/* Arrow Icon */}
                  <div className="w-8 h-8 rounded-full bg-[#F2CA50]/15 flex items-center justify-center border border-[#F2CA50]/30 shrink-0 mx-2">
                    <ArrowRight className="w-4 h-4 text-[#F2CA50]" />
                  </div>

                  {/* Target Rank */}
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#F2CA50] tracking-wider block">
                      Grade Cible
                    </span>
                    <p className="text-xs font-extrabold text-[#F2CA50] truncate max-w-[130px]">
                      {targetRankDetails?.name}
                    </p>
                    <span className="text-[10px] font-mono font-extrabold text-[#10B981] block">
                      {targetRankDetails?.rateFormatted} commission 🚀
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Card */}
              <div className="p-4 rounded-2xl bg-[#191c1e] border border-white/10 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#99907c]">Coût du palier (Solde Commission) :</span>
                  <strong className="text-white font-mono text-sm font-bold">
                    {requiredCost.toLocaleString()} FCFA
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#99907c]">Votre Solde Commission disponible :</span>
                  <strong className={`font-mono font-bold ${hasSufficientBalance ? 'text-[#10B981]' : 'text-[#E63946]'}`}>
                    {userCommission.toLocaleString()} FCFA
                  </strong>
                </div>

                {hasSufficientBalance ? (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[#d0c5af]">
                    <span>Solde restant après déblocage :</span>
                    <strong className="text-white font-mono">{remainingAfter.toLocaleString()} FCFA</strong>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#E63946] font-semibold">Montant manquant :</span>
                      <strong className="text-[#E63946] font-mono font-bold">
                        -{missingAmount.toLocaleString()} FCFA
                      </strong>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-[#101416] rounded-full h-2 overflow-hidden border border-white/10">
                      <div
                        className="bg-[#F2CA50] h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-right text-[#99907c]">{progressPercent}% de l'objectif atteint</p>
                  </div>
                )}
              </div>

              {/* Action Buttons & Helpers */}
              {hasSufficientBalance ? (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmUpgrade}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Déblocage en cours... ⏳</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black" />
                        <span>Confirmer le Passage à {targetRankDetails?.name}</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-[#99907c]">
                    🔒 Le prélèvement est immédiat et votre nouveau taux de {targetRankDetails?.rateFormatted} s'applique instantanément.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#F2CA50]/10 border border-[#F2CA50]/30 text-xs text-[#d0c5af] space-y-1">
                    <div className="flex items-center space-x-1.5 text-[#F2CA50] font-bold">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>Comment obtenir les {missingAmount.toLocaleString()} FCFA manquants ?</span>
                    </div>
                    <p className="text-[11px]">
                      Partagez votre lien de parrainage. Chaque nouveau membre activé dans votre équipe crédite instantanément votre Solde Commission !
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUpgradeRankModal(false);
                      setShowShareModal(true);
                    }}
                    className="w-full py-3 rounded-2xl bg-[#272a2d] hover:bg-[#323538] text-white font-bold text-xs flex items-center justify-center space-x-2 border border-white/10 active:scale-95 transition-all shadow-md"
                  >
                    <Share2 className="w-4 h-4 text-[#F2CA50]" />
                    <span>Partager mon Code de Parrainage</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
