import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, X, Check, Plus, Smartphone, Clock, RefreshCw, ArrowUpRight, Pencil, Trash2, AlertTriangle } from 'lucide-react';

export const AdminDrawer = () => {
  const {
    isAdminMode,
    setIsAdminMode,
    paymentNumbers,
    addPaymentNumber,
    updatePaymentNumber,
    deletePaymentNumber,
    togglePaymentNumber,
    transactions,
    pendingDeposits,
    pendingWithdrawals,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    refreshUserData,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState('deposits'); // 'deposits' | 'withdrawals' | 'numbers' | 'all'
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);
  const [editingNumber, setEditingNumber] = useState(null);
  const [deletingNumber, setDeletingNumber] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Number Form State
  const [provider, setProvider] = useState('Orange Money');
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [icon, setIcon] = useState('🟠');

  // Edit Form State
  const [editProvider, setEditProvider] = useState('Orange Money');
  const [editNumber, setEditNumber] = useState('');
  const [editHolder, setEditHolder] = useState('');
  const [editActive, setEditActive] = useState(true);

  if (!isAdminMode) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    setIsRefreshing(false);
  };

  const getProviderIcon = (prov) => {
    if (prov.includes('Wave')) return '🌊';
    if (prov.includes('Orange')) return '🟠';
    if (prov.includes('MTN')) return '🟡';
    if (prov.includes('Moov')) return '🟢';
    return '📱';
  };

  const handleAddNumber = async (e) => {
    e.preventDefault();
    if (!number || !holder) return;
    const assignedIcon = getProviderIcon(provider);
    const success = await addPaymentNumber({ provider, number, holder, icon: assignedIcon });
    if (success) {
      setNumber('');
      setHolder('');
      setShowAddNumberModal(false);
    }
  };

  const openEditModal = (item) => {
    setEditingNumber(item);
    setEditProvider(item.provider);
    setEditNumber(item.number);
    setEditHolder(item.holder);
    setEditActive(item.active === 1 || item.active === true);
  };

  const handleUpdateNumber = async (e) => {
    e.preventDefault();
    if (!editingNumber || !editNumber || !editHolder) return;
    const assignedIcon = getProviderIcon(editProvider);
    const success = await updatePaymentNumber(editingNumber.id, {
      provider: editProvider,
      number: editNumber,
      holder: editHolder,
      icon: assignedIcon,
      active: editActive,
    });
    if (success) {
      setEditingNumber(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingNumber) return;
    await deletePaymentNumber(deletingNumber.id);
    setDeletingNumber(null);
  };

  const allPendingDeposits = pendingDeposits && pendingDeposits.length > 0
    ? pendingDeposits
    : transactions.filter((t) => (t.type === 'DEPOT_ACTIVATION' || t.type === 'DEPOT_FONDS') && t.status === 'EN_ATTENTE');

  const allPendingWithdrawals = pendingWithdrawals && pendingWithdrawals.length > 0
    ? pendingWithdrawals
    : transactions.filter((t) => t.type === 'RETRAIT_FONDS' && t.status === 'EN_ATTENTE');

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
                <h3 className="font-bold text-sm text-white">Portail Administration</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#E63946] text-white">
                  Back-Office
                </span>
              </div>
              <p className="text-[11px] text-[#99907c]">Validation Dépôts, Retraits & Commissions MLM</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full bg-[#191c1e] hover:bg-[#272a2d] text-[#F2CA50]"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAdminMode(false)}
              className="p-2 rounded-full bg-[#191c1e] hover:bg-[#272a2d] text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#191c1e] px-2 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('deposits')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'deposits'
                ? 'border-[#E63946] text-[#E63946]'
                : 'border-transparent text-[#99907c] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dépôts ({allPendingDeposits.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('withdrawals')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'withdrawals'
                ? 'border-[#E63946] text-[#E63946]'
                : 'border-transparent text-[#99907c] hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Retraits ({allPendingWithdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('numbers')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'numbers'
                ? 'border-[#E63946] text-[#E63946]'
                : 'border-transparent text-[#99907c] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Numéros ({paymentNumbers.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('all')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'all'
                ? 'border-[#E63946] text-[#E63946]'
                : 'border-transparent text-[#99907c] hover:text-white'
            }`}
          >
            <span>Historique</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: PENDING DEPOSITS */}
          {activeAdminTab === 'deposits' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#F2CA50]/10 border border-[#F2CA50]/20 text-xs text-[#d0c5af]">
                💡 <strong>Validation Dépôt :</strong> En validant un dépôt d'activation, le compte membre est activé et une <strong>commission de 10%</strong> est versée au parrain.
              </div>

              {allPendingDeposits.length === 0 ? (
                <div className="text-center py-12 text-[#99907c]">
                  <Check className="w-10 h-10 mx-auto text-[#10B981] mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Aucun dépôt en attente</p>
                </div>
              ) : (
                allPendingDeposits.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-[#191c1e] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F2CA50]/20 text-[#F2CA50]">
                          {item.type === 'DEPOT_ACTIVATION' ? '⚡ ACTIVATION COMPTE' : '💰 DÉPÔT FONDS'}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{item.user_name || item.label}</h4>
                      </div>
                      <span className="text-lg font-mono font-bold text-[#F2CA50]">
                        +{item.amount.toLocaleString()} FCFA
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Expéditeur</span>
                        <span className="font-mono font-semibold text-white">{item.senderNumber || item.sender_number || 'N/A'}</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Réf Transaction / TxnID</span>
                        <span className="font-mono font-bold text-[#F2CA50]">{item.txnId || item.txn_id}</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Opérateur & Récepteur</span>
                        <span className="font-medium text-white">{item.provider} ({item.recipientNumber || item.recipient_number})</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Date</span>
                        <span className="font-mono text-white">{item.dateTime || item.date_time}</span>
                      </div>
                    </div>

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

          {/* TAB 2: PENDING WITHDRAWALS */}
          {activeAdminTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#E63946]/10 border border-[#E63946]/20 text-xs text-[#d0c5af]">
                ⚠️ <strong>Demandes de Retrait :</strong> Vérifiez le solde et effectuez le transfert Mobile Money vers le numéro du membre avant de cliquer sur <strong>"Approuver Retrait"</strong>.
              </div>

              {allPendingWithdrawals.length === 0 ? (
                <div className="text-center py-12 text-[#99907c]">
                  <Check className="w-10 h-10 mx-auto text-[#10B981] mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Aucun retrait en attente</p>
                </div>
              ) : (
                allPendingWithdrawals.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-[#191c1e] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E63946]/20 text-[#E63946]">
                          💸 RETRAIT MEMBRE
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{item.user_name || item.label}</h4>
                      </div>
                      <span className="text-lg font-mono font-bold text-[#E63946]">
                        -{item.amount.toLocaleString()} FCFA
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Numéro de Réception</span>
                        <span className="font-mono font-semibold text-[#F2CA50]">{item.recipientNumber || item.recipient_number}</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Moyen de Paiement</span>
                        <span className="font-medium text-white">{item.provider}</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">ID de Retrait</span>
                        <span className="font-mono text-white">{item.id}</span>
                      </div>

                      <div className="bg-[#101416] p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-[#99907c] block">Date de la demande</span>
                        <span className="font-mono text-white">{item.dateTime || item.date_time}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => approveWithdrawal(item.id)}
                        className="flex-1 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approuver Retrait</span>
                      </button>

                      <button
                        onClick={() => rejectWithdrawal(item.id)}
                        className="px-4 py-2.5 rounded-xl bg-[#E63946]/20 hover:bg-[#E63946]/30 text-[#E63946] border border-[#E63946]/40 font-bold text-xs flex items-center justify-center space-x-1 active:scale-95 transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Rejeter & Rembourser</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ADMIN PAYMENT NUMBERS */}
          {activeAdminTab === 'numbers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#e0e3e6]">Numéros d'encaissement Mobile Money</h4>
                  <p className="text-[10px] text-[#99907c]">Comptes de réception pour les dépôts</p>
                </div>
                <button
                  onClick={() => setShowAddNumberModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#E63946] text-white text-xs font-bold flex items-center space-x-1 hover:brightness-110 shadow active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter Numéro</span>
                </button>
              </div>

              <div className="space-y-2">
                {paymentNumbers.map((p) => (
                  <div key={p.id} className="p-3 rounded-2xl bg-[#191c1e] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{p.icon || getProviderIcon(p.provider)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{p.provider}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                            p.active === 1 || p.active === true
                              ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                              : 'bg-[#99907c]/20 text-[#99907c] border-[#99907c]/40'
                          }`}>
                            {p.active === 1 || p.active === true ? '● Actif' : '○ Inactif'}
                          </span>
                        </div>
                        <p className="text-sm font-mono font-bold text-[#F2CA50]">{p.number}</p>
                        <p className="text-[10px] text-[#99907c]">Titulaire : {p.holder}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 self-end sm:self-center">
                      <button
                        onClick={() => togglePaymentNumber(p.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                          p.active === 1 || p.active === true
                            ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                            : 'bg-[#272a2d] text-[#99907c] border-white/10'
                        }`}
                      >
                        {p.active === 1 || p.active === true ? 'Désactiver' : 'Activer'}
                      </button>

                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-xl bg-[#272a2d] text-white hover:bg-[#323538] border border-white/10"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#F2CA50]" />
                      </button>

                      <button
                        onClick={() => setDeletingNumber(p)}
                        className="p-1.5 rounded-xl bg-[#E63946]/10 hover:bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/30"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ALL TRANSACTIONS */}
          {activeAdminTab === 'all' && (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="p-3 rounded-2xl bg-[#191c1e] border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{t.label}</span>
                      <span className="font-mono text-[10px] text-[#99907c]">{t.id}</span>
                    </div>
                    <p className="text-[11px] text-[#d0c5af] mt-0.5">{t.dateTime || t.date_time} • Ref: {t.txnId || t.txn_id || 'N/A'}</p>
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

        {/* Modal 1: Add New Payment Number */}
        {showAddNumberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1d2022] border border-[#E63946] rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
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
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="Orange Money">Orange Money 🟠</option>
                    <option value="MTN MoMo">MTN MoMo 🟡</option>
                    <option value="Wave">Wave 🌊</option>
                    <option value="Moov Money">Moov Money 🟢</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Numéro de Téléphone Récepteur</label>
                  <input
                    type="tel"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="ex: +225 07 99 88 77 66"
                    required
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Nom du Titulaire du compte</label>
                  <input
                    type="text"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="ex: Eco-Finance Trésorerie"
                    required
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#E63946] text-white font-bold text-xs hover:brightness-110 shadow active:scale-95 transition-all"
                  >
                    Enregistrer le numéro
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddNumberModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#272a2d] text-[#99907c] hover:text-white font-bold text-xs"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Edit Payment Number */}
        {editingNumber && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1d2022] border border-[#F2CA50] rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="font-bold text-sm text-white">Modifier le numéro</h4>
                <button onClick={() => setEditingNumber(null)} className="text-[#99907c] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateNumber} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Opérateur Mobile</label>
                  <select
                    value={editProvider}
                    onChange={(e) => setEditProvider(e.target.value)}
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="Orange Money">Orange Money 🟠</option>
                    <option value="MTN MoMo">MTN MoMo 🟡</option>
                    <option value="Wave">Wave 🌊</option>
                    <option value="Moov Money">Moov Money 🟢</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Numéro de Téléphone</label>
                  <input
                    type="tel"
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    placeholder="ex: +225 07 99 88 77 66"
                    required
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Nom du Titulaire</label>
                  <input
                    type="text"
                    value={editHolder}
                    onChange={(e) => setEditHolder(e.target.value)}
                    placeholder="ex: Eco-Finance Trésorerie"
                    required
                    className="w-full bg-[#101416] border border-white/10 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="editDrawerActive"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 accent-[#10B981] rounded"
                  />
                  <label htmlFor="editDrawerActive" className="text-xs text-white">
                    Numéro actif pour les dépôts
                  </label>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl gold-gradient-bg text-black font-bold text-xs hover:brightness-110 shadow active:scale-95 transition-all"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNumber(null)}
                    className="px-4 py-2.5 rounded-xl bg-[#272a2d] text-[#99907c] hover:text-white font-bold text-xs"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Delete Confirmation */}
        {deletingNumber && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="bg-[#1d2022] border border-[#E63946] rounded-2xl p-5 w-full max-w-sm space-y-3 text-center shadow-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#E63946]/20 border border-[#E63946]/40 flex items-center justify-center text-[#E63946] mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Supprimer ce numéro ?</h4>
              <p className="text-xs text-[#d0c5af]">
                Voulez-vous supprimer <strong>{deletingNumber.provider} ({deletingNumber.number})</strong> ?
              </p>
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-[#E63946] text-white font-bold text-xs hover:brightness-110 shadow active:scale-95 transition-all"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => setDeletingNumber(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#272a2d] text-[#99907c] hover:text-white font-bold text-xs"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
