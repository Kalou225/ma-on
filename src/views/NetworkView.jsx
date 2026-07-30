import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, GitFork, Copy, Check, ChevronDown, Award, Sparkles, TrendingUp } from 'lucide-react';

export const NetworkView = () => {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('L1');

  // Simulated MLM Genealogy Tree data
  const referrals = [
    { id: 1, name: 'Jean-Marc Koffi', rank: 'Compagnon', level: 'L1', volume: 450000, status: 'ACTIF', date: '12 Juillet 2026' },
    { id: 2, name: 'Aminata Diallo', rank: 'Apprenti', level: 'L1', volume: 200000, status: 'ACTIF', date: '18 Juillet 2026' },
    { id: 3, name: 'Kouassi Yves', rank: 'Apprenti', level: 'L1', volume: 150000, status: 'ACTIF', date: '22 Juillet 2026' },
    { id: 4, name: 'Bamba Sekou', rank: 'Apprenti', level: 'L2', volume: 300000, status: 'ACTIF', date: '25 Juillet 2026' },
    { id: 5, name: 'Sylvie N\'Guessan', rank: 'Apprenti', level: 'L2', volume: 100000, status: 'INACTIF', date: '28 Juillet 2026' },
    { id: 6, name: 'Emanuel Badou', rank: 'Apprenti', level: 'L3', volume: 650000, status: 'ACTIF', date: '29 Juillet 2026' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://illuminati-mlm.app/ref/${user.myReferralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredReferrals = referrals.filter((r) => r.level === selectedLevel);

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      {/* Header Info */}
      <div className="p-5 rounded-3xl glass-card border border-[#d4af37]/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40">
              <GitFork className="w-4 h-4 text-[#F2CA50]" />
            </div>
            <h2 className="font-bold text-[#e0e3e6] text-sm">Arbre Généalogique MLM</h2>
          </div>
          <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/15 px-2.5 py-1 rounded-full border border-[#10B981]/30">
            {user.totalNetworkMembers} Membres au total
          </span>
        </div>

        {/* Share Link Banner */}
        <div className="p-3 rounded-2xl bg-[#101416] border border-white/10 flex items-center justify-between">
          <div className="truncate mr-2">
            <span className="text-[10px] text-[#99907c] block uppercase tracking-wider font-semibold">
              Votre Lien de Parrainage
            </span>
            <p className="text-xs font-mono font-bold text-[#F2CA50] truncate">
              https://illuminati-mlm.app/ref/{user.myReferralCode}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              copied ? 'bg-[#10B981] text-white' : 'gold-gradient-bg text-black hover:brightness-110'
            }`}
          >
            {copied ? 'Copié !' : 'Partager'}
          </button>
        </div>
      </div>

      {/* Network Earnings Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
          <span className="text-[10px] text-[#99907c] block">Commissions L1 (10%)</span>
          <span className="text-xs font-mono font-bold text-[#F2CA50]">180 000 FCFA</span>
        </div>
        <div className="p-3 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
          <span className="text-[10px] text-[#99907c] block">Commissions L2 (5%)</span>
          <span className="text-xs font-mono font-bold text-white">85 000 FCFA</span>
        </div>
        <div className="p-3 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
          <span className="text-[10px] text-[#99907c] block">Commissions L3 (3%)</span>
          <span className="text-xs font-mono font-bold text-white">45 000 FCFA</span>
        </div>
      </div>

      {/* Level Selection Tabs */}
      <div className="flex bg-[#191c1e] p-1 rounded-2xl border border-white/5">
        {['L1', 'L2', 'L3'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedLevel === lvl
                ? 'gold-gradient-bg text-black shadow-md'
                : 'text-[#99907c] hover:text-white'
            }`}
          >
            Niveau {lvl} ({referrals.filter((r) => r.level === lvl).length})
          </button>
        ))}
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {filteredReferrals.length === 0 ? (
          <div className="p-8 text-center text-[#99907c] bg-[#191c1e] rounded-2xl">
            Aucun filleul à ce niveau.
          </div>
        ) : (
          filteredReferrals.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#272a2d] border border-white/10 flex items-center justify-center font-bold text-sm text-[#F2CA50]">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white">{r.name}</h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#272a2d] text-[#d0c5af]">
                      {r.rank}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#99907c] mt-0.5">Rejoint le {r.date}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-mono font-bold text-[#F2CA50]">
                  {r.volume.toLocaleString()} FCFA
                </p>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    r.status === 'ACTIF' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#E63946]/15 text-[#E63946]'
                  }`}
                >
                  {r.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
