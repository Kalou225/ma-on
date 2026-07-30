import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, Check, Sparkles, ChevronRight, Lock, Trophy } from 'lucide-react';

export const RanksView = () => {
  const { user, setShowRankSuccessModal, setSelectedRankCelebration } = useApp();

  const ranks = [
    {
      name: 'Apprenti',
      badgeColor: 'border-slate-500 text-slate-300 bg-slate-500/10',
      volumeRequired: 250000,
      referralsRequired: 2,
      bonus: 25000,
      rate: '5%',
      levels: 1,
      achieved: true,
    },
    {
      name: 'Compagnon',
      badgeColor: 'border-[#F2CA50] text-[#F2CA50] bg-[#F2CA50]/10',
      volumeRequired: 1000000,
      referralsRequired: 5,
      bonus: 100000,
      rate: '10%',
      levels: 2,
      achieved: true, // Current active rank
    },
    {
      name: 'Maître',
      badgeColor: 'border-[#10B981] text-[#10B981] bg-[#10B981]/10',
      volumeRequired: 5000000,
      referralsRequired: 10,
      bonus: 500000,
      rate: '15%',
      levels: 3,
      achieved: false,
    },
    {
      name: 'Grand Maître',
      badgeColor: 'border-purple-500 text-purple-300 bg-purple-500/10',
      volumeRequired: 25000000,
      referralsRequired: 25,
      bonus: 2500000,
      rate: '20%',
      levels: 5,
      achieved: false,
    },
  ];

  const handleTestCelebration = (rankItem) => {
    setSelectedRankCelebration(rankItem);
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
            Niveau 2 Débloqué
          </span>
        </div>

        {/* Progress bar to next rank (Maître) */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex justify-between text-xs">
            <span className="text-[#99907c]">Progression vers <strong>Maître</strong></span>
            <span className="font-mono font-bold text-[#F2CA50]">37%</span>
          </div>
          <div className="w-full h-2.5 bg-[#101416] rounded-full overflow-hidden border border-white/5">
            <div className="h-full gold-gradient-bg rounded-full w-[37%] transition-all duration-500" />
          </div>
          <p className="text-[10px] text-[#99907c]">
            Volume équipe actuel : {user.teamVolume.toLocaleString()} / 5 000 000 FCFA
          </p>
        </div>
      </div>

      {/* Ranks Ladder List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Échelle des Rangs & Avantages MLM
        </h3>

        <div className="space-y-3">
          {ranks.map((r) => (
            <div
              key={r.name}
              className={`p-4 rounded-3xl border transition-all ${
                user.rank === r.name
                  ? 'bg-[#1d2022] border-[#F2CA50] shadow-[0_0_20px_rgba(242,202,80,0.15)]'
                  : r.achieved
                  ? 'bg-[#1d2022] border-white/10 opacity-90'
                  : 'bg-[#191c1e] border-white/5 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl border text-xs font-bold ${r.badgeColor}`}>
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{r.name}</h4>
                      {user.rank === r.name && (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#F2CA50] text-black">
                          Actuel
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#99907c]">Bonus de grade : +{r.bonus.toLocaleString()} FCFA</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#F2CA50]">{r.rate}</span>
                  <span className="text-[10px] text-[#99907c] block">Commission</span>
                </div>
              </div>

              {/* Requirements & Action */}
              <div className="pt-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="text-[#d0c5af]">
                    🎯 Volume requis : <strong className="text-white font-mono">{r.volumeRequired.toLocaleString()} FCFA</strong>
                  </p>
                  <p className="text-[#99907c] text-[11px]">
                    👥 Filleuls directs minimum : <strong>{r.referralsRequired}</strong>
                  </p>
                </div>

                <button
                  onClick={() => handleTestCelebration(r)}
                  className="px-3 py-1.5 rounded-xl bg-[#272a2d] hover:bg-[#323538] text-[#F2CA50] text-[11px] font-bold border border-[#d4af37]/30 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Tester Célébration</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
