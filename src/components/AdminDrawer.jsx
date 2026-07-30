import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, X, Check, AlertCircle, Plus, PhoneCall, ArrowUpRight, Smartphone, Clock, RefreshCw } from 'lucide-react';

export const AdminDrawer = () => {
  const {
    isAdminMode,
    setIsAdminMode,
    paymentNumbers,
    addPaymentNumber,
    togglePaymentNumber,
    transactions,
    approveDeposit,
    rejectDeposit,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState('pending'); // 'pending' | 'numbers' | 'all'
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);

  // New Number Form State
  const [provider, setProvider] = useState('Orange Money');
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [icon, setIcon] = useState('🟠');

  if (!isAdminMode) return null;

  const pendingDeposits = transactions.filter((t) => t.status === 'EN_ATTENTE');

  const handleAddNumber = (e) => {
    e.preventDefault();
    if (!number || !holder) return;
    addPaymentNumber({ provider, number, holder, icon });
    setNumber('');
    setHolder('');
    setShowAddNumberModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-lg animate-in fade-in">
      <div className="bg-[#101416] border border-[#E63946]/40 sm:rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl h-[92vh] sm:h-[85vh] flex flex-col">
        {/* Admin Header */}
        <div className="px-5 py-4 bg-[#E63946]/10 border-b border-[#E63946]/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E63946]/20 flex items-center justify-center border border-[#E63946]/40">
              <Shield className="w-5 h-5 text-[#E63946]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white">Portail Administration (Test)</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#E63946] text-white">
                  Back-Office
                </span>
              </div>
              <p className="text-[11px] text-[#99907c]">Supervision et Validation des Dépôts Manuels</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdminMode(false)}
            className="p-2 rounded-full bg-[#191c1e] hover:bg-[#272a2d] text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="flex border-b border-white/10 bg-[#191c1e] px-4 pt-2">
          <button
            onClick={() => setActiveAdminTab('pending')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
              activeAdminTab === 'pending'
                ? 'border-[#E63946] text-[#E63946]'
                : 'border-transparent text-[#99907c] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dépôts en Attente ({pendingDeposits.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('numbers')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
              activeAdminTab === 'numbers'
                ? 'border-[#E63946] text-[#E63946]'
                : 'border-transparent text-[#99907c] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Numéros de Réception ({paymentNumbers.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('all')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
              activeAdminTab === 'all'
                ? 'border-[#E63946] text-[#E63946]'
                : 'border-transparent text-[#99907c] hover:text-white'
            }`}
          >
            <span>Toutes les Transactions</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: PENDING DEPOSITS FOR ADMIN VALIDATION */}
          {activeAdminTab === 'pending' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#F2CA50]/10 border border-[#F2CA50]/20 text-xs text-[#d0c5af]">
                💡 <strong>Instructions pour l'Admin :</strong> Vérifiez sur votre téléphone récepteur si la transaction existe. Si oui, cliquez sur <strong>"Valider le Dépôt"</strong>. Le compte du membre sera automatiquement crédité et activé !
              </div>

              {pendingDeposits.length === 0 ? (
                <div className="text-center py-12 text-[#99907c]">
                  <Check className="w-10 h-10 mx-auto text-[#10B981] mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Aucun dépôt en attente</p>
                  <p className="text-xs mt-1">
                    Faites une demande de dépôt depuis l'application membre pour tester la validation.
                  </p>
                </div>
              ) : (
                pendingDeposits.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#191c1e] border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F2CA50]/20 text-[#F2CA50]">
                          {item.type === 'DEPOT_ACTIVATION' ? '⚡ ACTIVATION COMPTE' : '💰 DÉPÔT FONDS'}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{item.label}</h4>
                      </div>
                      <span className="text-lg font-mono font-bold text-[#F2CA50]">
                        +{item.amount.toLocaleString()} FCFA
                      </span>
                    </div>

                    {/* Deposit Details grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Numéro d'Expéditeur</span>
                        <span className="font-mono font-semibold text-white">{item.senderNumber}</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">ID du Dépôt / Ref</span>
                        <span className="font-mono font-bold text-[#F2CA50]">{item.txnId}</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Opérateur & Récepteur</span>
                        <span className="font-medium text-white">{item.provider} ({item.recipientNumber})</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Date et Heure du dépôt</span>
                        <span className="font-mono text-white">{item.dateTime}</span>
                      </div>
                    </div>

                    {/* Actions: Approve / Reject */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => approveDeposit(item.id)}
                        className="flex-1 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Valider & Créditer</span>
                      </button>

                      <button
                        onClick={() => rejectDeposit(item.id)}
                        className="px-4 py-2.5 rounded-xl bg-[#E63946]/20 hover:bg-[#E63946]/30 text-[#E63946] border border-[#E63946]/40 font-bold text-xs flex items-center justify-center space-x-1 active:scale-95 transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Rejeter</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: MANAGING ADMIN RECEPTION NUMBERS */}
          {activeAdminTab === 'numbers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#e0e3e6]">Numéros d'encaissement actifs</h4>
                <button
                  onClick={() => setShowAddNumberModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#E63946] text-white text-xs font-bold flex items-center space-x-1 hover:brightness-110"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un numéro</span>
                </button>
              </div>

              <div className="space-y-2">
                {paymentNumbers.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-[#191c1e] border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{p.provider}</span>
                          <span className="text-[10px] text-[#99907c]">{p.holder}</span>
                        </div>
                        <p className="text-sm font-mono font-bold text-[#F2CA50]">{p.number}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => togglePaymentNumber(p.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                        p.active
                          ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                          : 'bg-[#99907c]/20 text-[#99907c] border-[#99907c]/40'
                      }`}
                    >
                      {p.active ? 'Actif' : 'Désactivé'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ALL TRANSACTIONS LOG */}
          {activeAdminTab === 'all' && (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-[#191c1e] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{t.label}</span>
                      <span className="font-mono text-[10px] text-[#99907c]">{t.id}</span>
                    </div>
                    <p className="text-[11px] text-[#d0c5af] mt-0.5">{t.dateTime} • Ref: {t.txnId || 'N/A'}</p>
                    <p className="text-[10px] text-[#99907c]">{t.note}</p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-xs">
                      {t.amount.toLocaleString()} FCFA
                    </span>
                    <span
                      className={`block text-[10px] font-bold mt-0.5 ${
                        t.status === 'VALIDÉ'
                          ? 'text-[#10B981]'
                          : t.status === 'EN_ATTENTE'
                          ? 'text-[#F2CA50]'
                          : 'text-[#E63946]'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal inside Admin for Adding New Payment Number */}
        {showAddNumberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1d2022] border border-[#E63946] rounded-2xl p-5 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="font-bold text-sm text-white">Nouveau numéro d'encaissement</h4>
                <button onClick={() => setShowAddNumberModal(false)} className="text-[#99907c] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNumber} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Opérateur Mobile</label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      if (e.target.value.includes('Orange')) setIcon('🟠');
                      else if (e.target.value.includes('MTN')) setIcon('🟡');
                      else if (e.target.value.includes('Wave')) setIcon('🌊');
                      else setIcon('🟢');
                    }}
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Orange Money">Orange Money</option>
                    <option value="MTN MoMo">MTN MoMo</option>
                    <option value="Wave">Wave</option>
                    <option value="Moov Money">Moov Money</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Numéro de Téléphone Récepteur</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="ex: +225 07 99 88 77 66"
                    required
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Nom du Titulaire du compte</label>
                  <input
                    type="text"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="ex: Illuminati Treasury OM"
                    required
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#E63946] text-white font-bold text-xs hover:brightness-110"
                >
                  Enregistrer le numéro
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
