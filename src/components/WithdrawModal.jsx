import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ArrowUpRight, AlertCircle, Check } from 'lucide-react';

export const WithdrawModal = () => {
  const { showWithdrawModal, setShowWithdrawModal, requestWithdrawal, user } = useApp();

  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState(user.defaultPaymentProvider || 'Orange Money');
  const [phone, setPhone] = useState(user.defaultPaymentNumber || user.phone || '');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (showWithdrawModal && user) {
      if (user.defaultPaymentProvider) setProvider(user.defaultPaymentProvider);
      if (user.defaultPaymentNumber) setPhone(user.defaultPaymentNumber);
      else if (user.phone) setPhone(user.phone);
    }
  }, [showWithdrawModal, user]);

  const maxWithdrawable = Math.floor((user.activationBalance || 0) / 3);
  const commBalance = user.commissionBalance || user.balance || 0;

  if (!showWithdrawModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (user.status === 'INACTIF' || (user.activationBalance || 0) <= 0) {
      setError('Retrait impossible : Votre compte est actuellement INACTIF. Vous devez effectuer votre premier dépôt d\'activation pour débloquer les retraits (vos commissions accumulées restent bien conservées).');
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Veuillez entrer un montant valide.');
      return;
    }
    if (amt > commBalance) {
      setError(`Solde commission insuffisant. Solde retirable disponible : ${commBalance.toLocaleString()} FCFA`);
      return;
    }
    if (amt > maxWithdrawable) {
      setError(`Montant supérieur au plafond de 1/3. Votre limite maximale autorisée est de ${maxWithdrawable.toLocaleString()} FCFA.`);
      return;
    }
    if (!phone.trim()) {
      setError('Veuillez entrer le numéro de téléphone de réception.');
      return;
    }

    requestWithdrawal({ amount: amt, provider, phone });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1d2022] border border-[#d4af37]/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40">
              <ArrowUpRight className="w-4 h-4 text-[#F2CA50]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e0e3e6]">Demande de Retrait</h3>
              <p className="text-[11px] text-[#99907c]">1 seul retrait autorisé par mois calendaire</p>
            </div>
          </div>
          <button
            onClick={() => setShowWithdrawModal(false)}
            className="p-1.5 rounded-full bg-[#272a2d] text-[#99907c] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-[#191c1e] border border-white/5 space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#99907c]">Solde Commission retirable :</span>
            <span className="font-mono font-bold text-[#F2CA50] text-sm">
              {commBalance.toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[11px]">
            <span className="text-[#99907c]">Plafond Autorisé (1/3 du Solde Activation) :</span>
            <strong className="text-white font-mono">{maxWithdrawable.toLocaleString()} FCFA</strong>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-[#E63946]/10 border border-[#E63946]/30 flex items-center space-x-2 text-xs text-[#E63946]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#99907c] mb-1 font-semibold">Montant à retirer (FCFA)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="ex: 20000"
              required
              className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-[#F2CA50] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#99907c] mb-1 font-semibold">Opérateur Mobile Money</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none"
            >
              <option value="Orange Money">Orange Money</option>
              <option value="Wave">Wave</option>
              <option value="MTN MoMo">MTN MoMo</option>
              <option value="Moov Money">Moov Money</option>
            </select>
          </div>

          <div>
            <label className="block text-[#99907c] mb-1 font-semibold">Numéro de Téléphone Récepteur</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ex: +225 07 12 34 56 78"
              required
              className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl gold-gradient-bg text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-98 transition-all mt-4"
          >
            <span>Confirmer la demande de retrait</span>
          </button>
        </form>
      </div>
    </div>
  );
};
