import React from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, ArrowDownRight, ArrowUpRight, Users, Award, ShieldAlert, Sparkles, Copy, Check, ChevronRight, PhoneCall } from 'lucide-react';

export const DashboardView = () => {
  const { user, setShowDepositModal, setShowWithdrawModal, setActiveTab, transactions } = useApp();
  const [copiedLink, setCopiedLink] = React.useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://illuminati-mlm.app/ref/${user.myReferralCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      {/* Account Activation Banner if Inactive */}
      {user.status === 'INACTIF' && (
        <div className="p-4 rounded-3xl bg-[#E63946]/10 border border-[#E63946]/30 space-y-2 shadow-lg">
          <div className="flex items-center space-x-2 text-[#E63946]">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-bold text-xs uppercase tracking-wide">Compte Non Enregistré / Inactif</span>
          </div>
          <p className="text-xs text-[#d0c5af]">
            Veuillez effectuer un dépôt manuel d'activation (minimum 25 000 FCFA) vers un numéro mobile money officiel de l'administrateur.
          </p>
          <button
            onClick={() => setShowDepositModal(true)}
            className="w-full py-2.5 rounded-xl bg-[#E63946] text-white font-bold text-xs flex items-center justify-center space-x-2 hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Faire le Dépôt Manuel d'Activation</span>
          </button>
        </div>
      )}

      {/* Main Balance Financial Card */}
      <div className="p-5 rounded-3xl glass-card gold-border relative overflow-hidden space-y-4 shadow-2xl">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#F2CA50]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#99907c]">
            Solde Total Disponible
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30">
            {user.rank}
          </span>
        </div>

        <div>
          <div className="text-3xl font-extrabold font-mono text-white tracking-tight gold-gradient-text">
            {user.balance.toLocaleString()} <span className="text-sm font-sans font-normal text-[#d0c5af]">FCFA</span>
          </div>
          <p className="text-[11px] text-[#99907c] mt-1">
            Gains cumulés du réseau : <strong className="text-[#10B981] font-mono">+{user.networkEarnings.toLocaleString()} FCFA</strong>
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
          <button
            onClick={() => setShowDepositModal(true)}
            className="py-3 px-3 rounded-2xl gold-gradient-bg text-black font-bold text-xs flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Dépôt Manuel</span>
          </button>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="py-3 px-3 rounded-2xl bg-[#272a2d] hover:bg-[#323538] text-[#e0e3e6] font-bold text-xs flex items-center justify-center space-x-2 border border-white/10 active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-4 h-4 text-[#F2CA50]" />
            <span>Demander Retrait</span>
          </button>
        </div>
      </div>

      {/* Key Network Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[#99907c]">
            <span className="text-[11px] font-medium">Filleuls Directs</span>
            <Users className="w-4 h-4 text-[#F2CA50]" />
          </div>
          <p className="text-xl font-bold font-mono text-white">{user.activeDirectReferrals} Membres</p>
          <span className="text-[10px] text-[#10B981] font-semibold">+2 ce mois</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[#99907c]">
            <span className="text-[11px] font-medium">Volume d'Équipe</span>
            <Sparkles className="w-4 h-4 text-[#F2CA50]" />
          </div>
          <p className="text-lg font-bold font-mono text-[#F2CA50]">
            {(user.teamVolume / 1000).toFixed(0)}k FCFA
          </p>
          <span className="text-[10px] text-[#99907c]">Objectif grade : 2.5M</span>
        </div>
      </div>

      {/* Referral Link Quick Banner */}
      <div className="p-4 rounded-2xl bg-[#191c1e] border border-[#d4af37]/20 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold">
            Mon Code de Parrainage
          </span>
          <p className="text-sm font-mono font-bold text-[#F2CA50] mt-0.5">{user.myReferralCode}</p>
        </div>
        <button
          onClick={handleCopyLink}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
            copiedLink
              ? 'bg-[#10B981] text-white'
              : 'bg-[#272a2d] text-[#F2CA50] border border-[#d4af37]/30 hover:bg-[#323538]'
          }`}
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Lien Copié</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier Lien</span>
            </>
          )}
        </button>
      </div>

      {/* Recent Activity List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#e0e3e6] uppercase tracking-wider">Dernières Activités</h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs text-[#F2CA50] hover:underline flex items-center space-x-1"
          >
            <span>Voir tout</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {transactions.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                    item.status === 'VALIDÉ'
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : item.status === 'EN_ATTENTE'
                      ? 'bg-[#F2CA50]/15 text-[#F2CA50]'
                      : 'bg-[#E63946]/15 text-[#E63946]'
                  }`}
                >
                  {item.status === 'VALIDÉ' ? '✓' : item.status === 'EN_ATTENTE' ? '⏳' : '✕'}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-[#99907c]">
                    {item.dateTime} • Ref: {item.txnId || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-mono font-bold text-white">
                  +{item.amount.toLocaleString()} FCFA
                </p>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.status === 'VALIDÉ'
                      ? 'text-[#10B981] bg-[#10B981]/10'
                      : item.status === 'EN_ATTENTE'
                      ? 'text-[#F2CA50] bg-[#F2CA50]/10'
                      : 'text-[#E63946] bg-[#E63946]/10'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
