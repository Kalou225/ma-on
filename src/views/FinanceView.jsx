import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, ArrowDownRight, ArrowUpRight, Copy, Check, Clock, PhoneCall, ShieldCheck, Filter, Trophy } from 'lucide-react';
import { getNextRank } from '../utils/ranks';

export const FinanceView = () => {
  const { user, paymentNumbers, transactions, setShowDepositModal, setShowWithdrawModal, setShowUpgradeRankModal } = useApp();

  const isAccountActive = user.status === 'ACTIF' && (user.activationBalance || 0) > 0;
  const nextRank = getNextRank(user.rank || 'Apprenti');
  const userCommission = user.commissionBalance ?? user.balance ?? 0;
  const isEligibleForUpgrade = nextRank && userCommission >= nextRank.cost;

  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'EN_ATTENTE' | 'VALIDÉ' | 'REJETÉ'
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (num, id) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      {/* Wallet Summary Card */}
      <div className="p-5 rounded-3xl glass-card border border-[#d4af37]/30 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40">
              <Wallet className="w-4 h-4 text-[#F2CA50]" />
            </div>
            <h2 className="font-bold text-[#e0e3e6] text-sm">Gestion Financière</h2>
          </div>
          <span className="text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/30">
            {user.rank} • {user.status}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[#99907c] font-semibold tracking-wider">
            Solde en Portefeuille
          </span>
          <div className="text-3xl font-extrabold font-mono text-white gold-gradient-text">
            {user.balance.toLocaleString()} <span className="text-sm text-[#d0c5af] font-sans">FCFA</span>
          </div>
        </div>

        {/* Buttons for Manual Deposit & Withdrawal */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
          {!isAccountActive ? (
            <button
              onClick={() => setShowDepositModal(true)}
              className="py-3 px-3 rounded-2xl gold-gradient-bg text-black font-bold text-xs flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Dépôt d'Activation</span>
            </button>
          ) : (
            <button
              onClick={() => setShowUpgradeRankModal(true)}
              className={`py-3 px-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg transition-all active:scale-95 border ${
                isEligibleForUpgrade
                  ? 'gold-gradient-bg text-black border-[#F2CA50] hover:brightness-110 shadow-[0_0_15px_rgba(242,202,80,0.3)]'
                  : 'bg-[#191c1e] text-[#F2CA50] border-[#d4af37]/30 hover:border-[#F2CA50]'
              }`}
            >
              <Trophy className={`w-4 h-4 ${isEligibleForUpgrade ? 'text-black' : 'text-[#F2CA50]'}`} />
              <span className="truncate">Monter de grade</span>
              {isEligibleForUpgrade && (
                <span className="text-[8px] bg-black text-[#F2CA50] px-1 py-0.2 rounded font-black uppercase shrink-0">
                  Prêt
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="py-3 px-3 rounded-2xl bg-[#272a2d] hover:bg-[#323538] text-white font-bold text-xs flex items-center justify-center space-x-2 border border-white/10 active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-4 h-4 text-[#F2CA50]" />
            <span>Effectuer un Retrait</span>
          </button>
        </div>
      </div>

      {/* Admin Registered Mobile Money Numbers Box */}
      <div className="p-4 rounded-3xl bg-[#1d2022] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-[#F2CA50]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Numéros de Dépôt Officiels (Admin)
            </h3>
          </div>
          <span className="text-[10px] text-[#99907c]">Saisie Manuelle</span>
        </div>

        <p className="text-xs text-[#d0c5af]">
          Effectuez votre transfert directement vers l'un de ces numéros enregistrés par l'administration :
        </p>

        <div className="space-y-2">
          {paymentNumbers.filter(p => p.active).map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-2xl bg-[#101416] border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{p.icon}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{p.provider}</span>
                    <span className="text-[10px] text-[#99907c]">({p.holder})</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-[#F2CA50]">{p.number}</p>
                </div>
              </div>

              <button
                onClick={() => handleCopy(p.number, p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  copiedId === p.id
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#272a2d] hover:bg-[#323538] text-[#F2CA50] border border-[#d4af37]/30'
                }`}
              >
                {copiedId === p.id ? 'Copié !' : 'Copier'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Status Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Historique des Opérations
          </h3>
          <div className="flex items-center space-x-1 text-[11px]">
            {['ALL', 'EN_ATTENTE', 'VALIDÉ', 'REJETÉ'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  filterStatus === st
                    ? 'bg-[#F2CA50]/20 text-[#F2CA50] border border-[#F2CA50]/40'
                    : 'text-[#99907c] hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Tous' : st === 'EN_ATTENTE' ? 'En attente' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-[#99907c] bg-[#1d2022] rounded-2xl text-xs">
              Aucune transaction trouvée pour ce filtre.
            </div>
          ) : (
            filteredTransactions.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{t.label}</span>
                    <span className="text-[10px] font-mono text-[#99907c]">{t.id}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    +{t.amount.toLocaleString()} FCFA
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#99907c]">
                  <span>{t.dateTime} • Ref: {t.txnId || 'N/A'}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      t.status === 'VALIDÉ'
                        ? 'bg-[#10B981]/15 text-[#10B981]'
                        : t.status === 'EN_ATTENTE'
                        ? 'bg-[#F2CA50]/15 text-[#F2CA50]'
                        : 'bg-[#E63946]/15 text-[#E63946]'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                {t.note && <p className="text-[10px] text-[#d0c5af] italic">{t.note}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
