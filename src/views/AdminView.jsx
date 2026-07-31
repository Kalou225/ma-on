import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Check, Plus, Clock, RefreshCw, ArrowUpRight, LogOut, ArrowDownRight, Smartphone, AlertCircle, Eye } from 'lucide-react';
import { api } from '../services/api';

export const AdminView = () => {
  const {
    user,
    logout,
    paymentNumbers,
    addPaymentNumber,
    togglePaymentNumber,
    transactions,
    pendingDeposits,
    pendingWithdrawals,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal,
    refreshUserData,
    setIsAdminMode,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState('deposits'); // 'deposits' | 'withdrawals' | 'numbers' | 'logs'
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // New Payment Number Form State
  const [provider, setProvider] = useState('Orange Money');
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [icon, setIcon] = useState('🟠');

  const fetchLogs = async () => {
    try {
      const logs = await api.admin.getAuditLogs();
      if (Array.isArray(logs)) setAuditLogs(logs);
    } catch (e) {}
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    await fetchLogs();
    setIsRefreshing(false);
  };

  const handleAddNumber = async (e) => {
    e.preventDefault();
    if (!number || !holder) return;
    await addPaymentNumber({ provider, number, holder, icon });
    setNumber('');
    setHolder('');
    setShowAddNumberModal(false);
  };

  const allPendingDeposits = pendingDeposits && pendingDeposits.length > 0
    ? pendingDeposits
    : transactions.filter((t) => (t.type === 'DEPOT_ACTIVATION' || t.type === 'DEPOT_FONDS') && t.status === 'EN_ATTENTE');

  const allPendingWithdrawals = pendingWithdrawals && pendingWithdrawals.length > 0
    ? pendingWithdrawals
    : transactions.filter((t) => t.type === 'RETRAIT_FONDS' && t.status === 'EN_ATTENTE');

  return (
    <div className="min-h-screen bg-[#101416] text-[#e0e3e6] flex flex-col font-sans max-w-2xl mx-auto relative border-x border-white/5 shadow-2xl animate-in fade-in pb-12">
      {/* Admin Dedicated Top Bar */}
      <header className="sticky top-0 z-40 bg-[#1d2022]/95 backdrop-blur-md px-5 py-4 border-b border-[#E63946]/40 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E63946]/20 flex items-center justify-center border border-[#E63946]/40 shadow-md">
              <Shield className="w-5 h-5 text-[#E63946]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base tracking-tight text-white">Portail Administrateur</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#E63946] text-white">
                  Back-Office
                </span>
              </div>
              <p className="text-xs text-[#99907c]">Gestion Globale • {user.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAdminMode(false)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#272a2d] text-[#F2CA50] hover:bg-[#323538] border border-[#d4af37]/30 flex items-center space-x-1"
              title="Aperçu de l'espace membre"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aperçu Membre</span>
            </button>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-[#191c1e] hover:bg-[#272a2d] text-[#F2CA50] border border-white/5"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-[#E63946]/10 hover:bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/30"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mt-4 pt-2 border-t border-white/10 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveAdminTab('deposits')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'deposits'
                ? 'bg-[#E63946] text-white shadow-md'
                : 'bg-[#191c1e] text-[#99907c] hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Dépôts ({allPendingDeposits.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('withdrawals')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'withdrawals'
                ? 'bg-[#E63946] text-white shadow-md'
                : 'bg-[#191c1e] text-[#99907c] hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Retraits ({allPendingWithdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('numbers')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'numbers'
                ? 'bg-[#E63946] text-white shadow-md'
                : 'bg-[#191c1e] text-[#99907c] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Encaissements ({paymentNumbers.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('logs')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'logs'
                ? 'bg-[#E63946] text-white shadow-md'
                : 'bg-[#191c1e] text-[#99907c] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>
        </div>
      </header>

      {/* Main Admin Screen Body */}
      <main className="p-4 space-y-4 flex-1">
        {/* TAB 1: PENDING DEPOSITS APPROVAL */}
        {activeAdminTab === 'deposits' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Demandes de Dépôts d'Activation en Attente
              </h2>
              <span className="text-xs font-mono font-bold text-[#E63946]">
                {allPendingDeposits.length} En attente
              </span>
            </div>

            {allPendingDeposits.length === 0 ? (
              <div className="p-8 text-center bg-[#1d2022] rounded-3xl border border-white/5 text-[#99907c] text-xs">
                <Check className="w-8 h-8 text-[#10B981] mx-auto mb-2 opacity-80" />
                <p className="font-bold text-white mb-1">Aucun dépôt en attente</p>
                <p>Toutes les demandes de dépôts d'activation ont été traitées.</p>
              </div>
            ) : (
              allPendingDeposits.map((dep) => (
                <div
                  key={dep.id}
                  className="p-4 rounded-3xl bg-[#1d2022] border border-white/10 space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{dep.user_name || dep.label}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#F2CA50]">
                          {dep.id}
                        </span>
                      </div>
                      <p className="text-xs text-[#d0c5af] mt-0.5">{dep.user_email || ''} • {dep.user_phone || ''}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold font-mono text-[#10B981] block">
                        +{dep.amount.toLocaleString()} FCFA
                      </span>
                      <span className="text-[10px] font-bold text-[#F2CA50] bg-[#F2CA50]/15 px-2 py-0.5 rounded inline-block mt-0.5">
                        {dep.provider || 'Mobile Money'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#101416] border border-white/5 text-xs space-y-1 font-mono">
                    <p className="text-[#d0c5af]">
                      <strong className="text-[#99907c]">Réf Txn Mobile Money :</strong> {dep.txn_id || dep.txnId || 'N/A'}
                    </p>
                    {dep.sender_number && (
                      <p className="text-[#d0c5af]">
                        <strong className="text-[#99907c]">N° Expéditeur :</strong> {dep.sender_number}
                      </p>
                    )}
                    <p className="text-[10px] text-[#99907c] font-sans">
                      Date soumission : {dep.date_time || dep.dateTime}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => approveDeposit(dep.id)}
                      className="py-2.5 rounded-xl bg-[#10B981] text-black font-bold text-xs flex items-center justify-center space-x-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>Valider & Créditer</span>
                    </button>

                    <button
                      onClick={() => {
                        const reason = prompt('Motif du rejet du dépôt :', 'Référence introuvable');
                        if (reason !== null) rejectDeposit(dep.id, reason);
                      }}
                      className="py-2.5 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/30 font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-[#E63946]/20 active:scale-95 transition-all"
                    >
                      <span>Rejeter</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: PENDING WITHDRAWALS APPROVAL */}
        {activeAdminTab === 'withdrawals' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Demandes de Retraits à Traiter
              </h2>
              <span className="text-xs font-mono font-bold text-[#E63946]">
                {allPendingWithdrawals.length} En attente
              </span>
            </div>

            {allPendingWithdrawals.length === 0 ? (
              <div className="p-8 text-center bg-[#1d2022] rounded-3xl border border-white/5 text-[#99907c] text-xs">
                <Check className="w-8 h-8 text-[#10B981] mx-auto mb-2 opacity-80" />
                <p className="font-bold text-white mb-1">Aucun retrait en attente</p>
                <p>Toutes les demandes de retrait ont été traitées.</p>
              </div>
            ) : (
              allPendingWithdrawals.map((wth) => (
                <div
                  key={wth.id}
                  className="p-4 rounded-3xl bg-[#1d2022] border border-white/10 space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{wth.user_name || wth.label}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#F2CA50]">
                          {wth.id}
                        </span>
                      </div>
                      <p className="text-xs text-[#d0c5af] mt-0.5">{wth.user_email || ''}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold font-mono text-[#F2CA50] block">
                        -{wth.amount.toLocaleString()} FCFA
                      </span>
                      <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded inline-block mt-0.5">
                        {wth.provider}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#101416] border border-white/5 text-xs space-y-1 font-mono">
                    <p className="text-[#d0c5af]">
                      <strong className="text-[#99907c]">N° Mobile Money Récepteur :</strong> {wth.recipient_number}
                    </p>
                    <p className="text-[10px] text-[#99907c] font-sans">
                      Date demande : {wth.date_time || wth.dateTime}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => approveWithdrawal(wth.id)}
                      className="py-2.5 rounded-xl bg-[#10B981] text-black font-bold text-xs flex items-center justify-center space-x-1.5 hover:brightness-110 active:scale-95 transition-all shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approuver & Transférer</span>
                    </button>

                    <button
                      onClick={() => {
                        const reason = prompt('Motif du rejet du retrait :', 'Solde ou données incorrectes');
                        if (reason !== null) rejectWithdrawal(wth.id, reason);
                      }}
                      className="py-2.5 rounded-xl bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/30 font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-[#E63946]/20 active:scale-95 transition-all"
                    >
                      <span>Rejeter & Rembourser</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: PAYMENT RECEPTION NUMBERS */}
        {activeAdminTab === 'numbers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Numéros d'Encaissement Mobile Money
              </h2>
              <button
                onClick={() => setShowAddNumberModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#E63946] text-white font-bold text-xs flex items-center space-x-1 hover:brightness-110"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter Numéro</span>
              </button>
            </div>

            <div className="space-y-2">
              {paymentNumbers.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{p.provider}</span>
                        <span className="text-[10px] font-mono text-[#F2CA50]">{p.number}</span>
                      </div>
                      <p className="text-[11px] text-[#99907c]">{p.holder}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => togglePaymentNumber(p.id)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                      p.active
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                        : 'bg-[#272a2d] text-[#99907c] border-white/10'
                    }`}
                  >
                    {p.active ? 'Actif' : 'Désactivé'}
                  </button>
                </div>
              ))}
            </div>

            {/* Modal Add Number */}
            {showAddNumberModal && (
              <div className="p-4 rounded-3xl bg-[#191c1e] border border-[#E63946]/40 space-y-3 mt-4">
                <h4 className="text-xs font-bold text-white">Nouveau Numéro Récepteur</h4>
                <form onSubmit={handleAddNumber} className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[#99907c] mb-1 font-semibold">Opérateur</label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full bg-[#101416] border border-white/10 rounded-xl p-2 text-white outline-none"
                    >
                      <option value="Orange Money">Orange Money 🟠</option>
                      <option value="Wave">Wave 🌊</option>
                      <option value="MTN MoMo">MTN MoMo 🟡</option>
                      <option value="Moov Money">Moov Money 🟢</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#99907c] mb-1 font-semibold">Numéro de Téléphone</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="+225 07 ..."
                      required
                      className="w-full bg-[#101416] border border-white/10 rounded-xl p-2 text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#99907c] mb-1 font-semibold">Nom du Titulaire</label>
                    <input
                      type="text"
                      value={holder}
                      onChange={(e) => setHolder(e.target.value)}
                      placeholder="Eco-Finance Treasury"
                      required
                      className="w-full bg-[#101416] border border-white/10 rounded-xl p-2 text-white outline-none"
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-[#E63946] text-white font-bold text-xs"
                    >
                      Enregistrer Numéro
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddNumberModal(false)}
                      className="px-4 py-2 rounded-xl bg-[#272a2d] text-[#99907c] font-bold text-xs"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeAdminTab === 'logs' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Journaux d'Audit & Événements de Sécurité
            </h2>

            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-[#99907c] bg-[#1d2022] rounded-2xl text-xs">
                  Aucun événement de sécurité récent.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-[#1d2022] border border-white/5 text-xs font-mono space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#E63946]">{log.event_type}</span>
                      <span className="text-[10px] text-[#99907c]">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-[#d0c5af] text-[11px] font-sans">{log.details}</p>
                    <span className="text-[9px] text-[#99907c]">IP: {log.ip_address} • Severité: {log.severity}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
