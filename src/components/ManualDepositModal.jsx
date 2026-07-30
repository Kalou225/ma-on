import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Copy, Check, Send, AlertCircle, PhoneCall, ShieldCheck, ArrowRight } from 'lucide-react';

export const ManualDepositModal = () => {
  const { showDepositModal, setShowDepositModal, paymentNumbers, submitManualDeposit, user } = useApp();

  const [selectedProviderId, setSelectedProviderId] = useState(paymentNumbers[0]?.id || 1);
  const [amount, setAmount] = useState(user.status === 'INACTIF' ? 25000 : 50000);
  const [senderNumber, setSenderNumber] = useState(user.phone || '');
  const [txnId, setTxnId] = useState('');
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');

  if (!showDepositModal) return null;

  const selectedProvider = paymentNumbers.find((p) => p.id === parseInt(selectedProviderId));

  const handleCopyNumber = (num, id) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Veuillez entrer un montant valide.');
      return;
    }
    if (!senderNumber.trim()) {
      setError('Veuillez préciser le numéro avec lequel vous avez fait le dépôt.');
      return;
    }
    if (!txnId.trim()) {
      setError('Veuillez renseigner l\'ID de transaction (Référence du dépôt).');
      return;
    }

    const success = submitManualDeposit({
      amount,
      providerId: selectedProviderId,
      senderNumber,
      txnId,
      dateTime: dateTime.replace('T', ' '),
    });

    if (success) {
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1d2022] border border-[#d4af37]/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gold-gradient-bg/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40">
              <PhoneCall className="w-4 h-4 text-[#F2CA50]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e0e3e6]">Dépôt Manuel</h3>
              <p className="text-[11px] text-[#99907c]">Transfert direct vers numéro Admin</p>
            </div>
          </div>
          <button
            onClick={() => setShowDepositModal(false)}
            className="p-1.5 rounded-full bg-[#272a2d] hover:bg-[#323538] text-[#99907c] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Notice for Inactive Account */}
          {user.status === 'INACTIF' && (
            <div className="p-3.5 rounded-2xl bg-[#F2CA50]/10 border border-[#F2CA50]/30 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-[#F2CA50] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#F2CA50]">Activation du compte membre</p>
                <p className="text-[11px] text-[#d0c5af] mt-0.5">
                  Effectuez un dépôt de qualification d'au moins 25 000 FCFA pour débloquer votre compte et votre lien de parrainage.
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Select Admin Payment Number */}
          <div>
            <label className="block text-xs font-semibold text-[#d0c5af] mb-2">
              1. Choisissez le numéro récepteur de l'administrateur :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentNumbers.filter(p => p.active).map((p) => {
                const isSelected = selectedProviderId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProviderId(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#F2CA50]/15 border-[#F2CA50] shadow-[0_0_15px_rgba(242,202,80,0.15)]'
                        : 'bg-[#191c1e] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#272a2d] text-[#F2CA50]">
                        {p.provider}
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-white truncate">{p.number}</p>
                    <p className="text-[10px] text-[#99907c] truncate">{p.holder}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Number Details & Quick Copy Box */}
          {selectedProvider && (
            <div className="p-3.5 rounded-2xl bg-[#191c1e] border border-[#d4af37]/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#99907c] font-semibold">
                  Numéro à créditer ({selectedProvider.provider})
                </p>
                <p className="text-base font-mono font-bold text-[#F2CA50] mt-0.5">
                  {selectedProvider.number}
                </p>
                <p className="text-[11px] text-[#d0c5af]">Titulaire : {selectedProvider.holder}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyNumber(selectedProvider.number, selectedProvider.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  copiedId === selectedProvider.id
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#272a2d] hover:bg-[#323538] text-[#F2CA50] border border-[#d4af37]/30'
                }`}
              >
                {copiedId === selectedProvider.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Form to declaration */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 border-t border-white/10">
            <h4 className="text-xs font-semibold text-[#d0c5af]">
              2. Renseignez les informations de votre transfert :
            </h4>

            {error && (
              <div className="p-2.5 rounded-xl bg-[#E63946]/10 border border-[#E63946]/30 flex items-center space-x-2 text-xs text-[#E63946]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-[#99907c] font-medium mb-1">
                Montant transféré (FCFA) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ex: 50000"
                required
                className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F2CA50] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#99907c] font-medium mb-1">
                Votre numéro de téléphone d'expéditeur (Numéro de dépôt) *
              </label>
              <input
                type="text"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="ex: +225 07 12 34 56 78"
                required
                className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F2CA50] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#99907c] font-medium mb-1">
                ID du dépôt / Référence de transaction Mobile Money *
              </label>
              <input
                type="text"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="ex: OM-20260730-88190 ou WAVE-9920"
                required
                className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F2CA50] font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#99907c] font-medium mb-1">
                Date et heure du dépôt *
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
                className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F2CA50] font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl gold-gradient-bg text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all mt-4"
            >
              <Send className="w-4 h-4" />
              <span>Soumettre le Dépôt à l'Admin</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
