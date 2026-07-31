import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, Sparkles, Trophy } from 'lucide-react';

export const RanksView = () => {
  const { user, setShowRankSuccessModal, setSelectedRankCelebration } = useApp();

  const ranks = [
    { name: 'Apprenti', min: '1 000', max: '200 000', rate: '2%', badgeColor: 'border-slate-500 text-slate-300 bg-slate-500/10' },
    { name: 'Compagnon Niveau 3', min: '201 000', max: '400 000', rate: '3%', badgeColor: 'border-[#F2CA50] text-[#F2CA50] bg-[#F2CA50]/10' },
    { name: 'Compagnon Niveau 2', min: '401 000', max: '600 000', rate: '4%', badgeColor: 'border-[#F2CA50] text-[#F2CA50] bg-[#F2CA50]/10' },
    { name: 'Compagnon Niveau 1', min: '601 000', max: '800 000', rate: '5%', badgeColor: 'border-[#F2CA50] text-[#F2CA50] bg-[#F2CA50]/10' },
    { name: 'Maître Niveau 3', min: '801 000', max: '1 000 000', rate: '6%', badgeColor: 'border-[#10B981] text-[#10B981] bg-[#10B981]/10' },
    { name: 'Maître Niveau 2', min: '1 001 000', max: '5 000 000', rate: '7%', badgeColor: 'border-[#10B981] text-[#10B981] bg-[#10B981]/10' },
    { name: 'Maître Niveau 1', min: '5 001 000', max: '19 999 999', rate: '8%', badgeColor: 'border-[#10B981] text-[#10B981] bg-[#10B981]/10' },
    { name: 'Grand Maître', min: '20 000 000', max: 'et +', rate: '20%', badgeColor: 'border-purple-500 text-purple-300 bg-purple-500/10' },
  ];

  const handleTestCelebration = (rankItem) => {
    setSelectedRankCelebration({
      title: `Félicitations pour le rang ${rankItem.name} ! 🎉`,
      rankName: rankItem.name,
      benefits: `Taux de commission réseau de ${rankItem.rate} activé sur l'ensemble de votre branche directe.`,
    });
    setShowRankSuccessModal(true);
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      {/* Current Rank Banner */}
      <div className="p-5 rounded-3xl glass-card border border-[#d4af37]/40 relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl gold-gradient-bg p-[2px] shadow-xl">
              <div className="w-full h-full bg-[#101416] rounded-[14px] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#F2CA50]" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold">
                Votre Rang Actuel
              </span>
              <h2 className="text-xl font-extrabold text-white gold-gradient-text">
                {user.rank}
              </h2>
            </div>
          </div>

          <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full border border-[#10B981]/30">
            {user.status}
          </span>
        </div>

        {/* Solde d'Activation Stats */}
        <div className="space-y-1 pt-2 border-t border-white/10 text-xs">
          <div className="flex justify-between">
            <span className="text-[#99907c]">Solde d'activation cumulé :</span>
            <strong className="text-white font-mono">{(user.activationBalance || 0).toLocaleString()} FCFA</strong>
          </div>
          <p className="text-[10px] text-[#99907c]">
            Le rang est attribué automatiquement selon le solde d'activation du compte.
          </p>
        </div>
      </div>

      {/* Ranks Ladder List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Grille des 8 Rangs & Plages d'Activation
        </h3>

        <div className="space-y-2.5">
          {ranks.map((r) => {
            const isCurrent = user.rank === r.name;
            return (
              <div
                key={r.name}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#1d2022] border-[#F2CA50] shadow-[0_0_15px_rgba(242,202,80,0.15)]'
                    : 'bg-[#191c1e] border-white/5 opacity-85'
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
                            Rang Actuel
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#99907c]">
                        Solde activation : <strong className="text-white font-mono">{r.min} – {r.max} FCFA</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-[#F2CA50] block">{r.rate}</span>
                    <button
                      onClick={() => handleTestCelebration(r)}
                      className="text-[9px] text-[#99907c] hover:text-white flex items-center space-x-0.5 mt-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Aperçu</span>
                    </button>
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
