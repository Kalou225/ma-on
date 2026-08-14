import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Check,
  Plus,
  Clock,
  RefreshCw,
  ArrowUpRight,
  LogOut,
  ArrowDownRight,
  Smartphone,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Users,
  Search,
  Award,
  DollarSign,
  UserCheck,
  UserX,
  Calendar,
  Share2,
} from 'lucide-react';
import { api } from '../services/api';

export const AdminView = () => {
  const {
    user,
    logout,
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
    setIsAdminMode,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState('deposits'); // 'deposits' | 'withdrawals' | 'users' | 'numbers' | 'logs'
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);
  const [editingNumber, setEditingNumber] = useState(null); // { id, provider, number, holder, icon, active }
  const [deletingNumber, setDeletingNumber] = useState(null); // { id, provider, number, holder }
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Users Directory State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIF' | 'INACTIF'

  // New Payment Number Form State
  const [provider, setProvider] = useState('Orange Money');
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [icon, setIcon] = useState('🟠');

  // Edit Payment Number Form State
  const [editProvider, setEditProvider] = useState('Orange Money');
  const [editNumber, setEditNumber] = useState('');
  const [editHolder, setEditHolder] = useState('');
  const [editActive, setEditActive] = useState(true);

  const fetchLogs = async () => {
    try {
      const logs = await api.admin.getAuditLogs();
      if (Array.isArray(logs)) setAuditLogs(logs);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const data = await api.admin.getUsers();
      if (Array.isArray(data)) setUsersList(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserData();
    await fetchLogs();
    await fetchUsers();
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
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeAdminTab === 'users'
                ? 'bg-[#E63946] text-white shadow-md'
                : 'bg-[#191c1e] text-[#99907c] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Utilisateurs ({usersList.length})</span>
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

        {/* TAB 3: USERS & MEMBERS DIRECTORY */}
        {activeAdminTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold block">
                  Total Inscrits
                </span>
                <p className="text-lg font-mono font-bold text-white">{usersList.length}</p>
                <span className="text-[9px] text-[#F2CA50]">Membres & Admins</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold block">
                  Comptes Actifs
                </span>
                <p className="text-lg font-mono font-bold text-[#10B981]">
                  {usersList.filter((u) => u.status === 'ACTIF').length}
                </p>
                <span className="text-[9px] text-[#99907c]">
                  {usersList.filter((u) => u.status !== 'ACTIF').length} inactifs
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold block">
                  Total Activation
                </span>
                <p className="text-sm font-mono font-bold text-white truncate">
                  {usersList.reduce((acc, u) => acc + (u.activation_balance || 0), 0).toLocaleString()} <span className="text-[9px]">F</span>
                </p>
                <span className="text-[9px] text-[#10B981]">Fonds injectés</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold block">
                  Gains Réseau Total
                </span>
                <p className="text-sm font-mono font-bold text-[#F2CA50] truncate">
                  {usersList.reduce((acc, u) => acc + (u.network_earnings || 0), 0).toLocaleString()} <span className="text-[9px]">F</span>
                </p>
                <span className="text-[9px] text-[#d0c5af]">Distribué MLM</span>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="p-3 rounded-2xl bg-[#191c1e] border border-white/10 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#99907c] absolute left-3 top-3" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Rechercher par nom, email, téléphone, code parrain..."
                  className="w-full bg-[#101416] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#E63946]"
                />
              </div>

              <div className="flex space-x-1 shrink-0">
                {['ALL', 'ACTIF', 'INACTIF'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setUserStatusFilter(st)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      userStatusFilter === st
                        ? 'bg-[#E63946] text-white shadow'
                        : 'bg-[#101416] text-[#99907c] hover:text-white border border-white/5'
                    }`}
                  >
                    {st === 'ALL' ? 'Tous' : st === 'ACTIF' ? 'Actifs' : 'Inactifs'}
                  </button>
                ))}
              </div>
            </div>

            {/* Users List Cards */}
            <div className="space-y-3">
              {usersList
                .filter((u) => {
                  const q = userSearch.toLowerCase().trim();
                  const matchQ =
                    !q ||
                    u.name?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q) ||
                    u.phone?.toLowerCase().includes(q) ||
                    u.my_referral_code?.toLowerCase().includes(q) ||
                    u.sponsor_code?.toLowerCase().includes(q);

                  const matchSt =
                    userStatusFilter === 'ALL' ||
                    (userStatusFilter === 'ACTIF' && u.status === 'ACTIF') ||
                    (userStatusFilter === 'INACTIF' && u.status === 'INACTIF');

                  return matchQ && matchSt;
                })
                .map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-3xl bg-[#1d2022] border border-white/10 space-y-3 shadow-lg hover:border-white/20 transition-all"
                  >
                    {/* User Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#272a2d] border border-white/10 flex items-center justify-center font-bold text-sm text-[#F2CA50] shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-sm text-white">{u.name}</h3>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                u.role === 'ADMIN'
                                  ? 'bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/40'
                                  : 'bg-white/10 text-[#d0c5af]'
                              }`}
                            >
                              {u.role}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                u.status === 'ACTIF'
                                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                                  : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30'
                              }`}
                            >
                              {u.status === 'ACTIF' ? '● ACTIF' : '○ INACTIF'}
                            </span>
                          </div>
                          <p className="text-xs text-[#d0c5af] mt-0.5">{u.email}</p>
                          <p className="text-[11px] font-mono text-[#99907c]">{u.phone}</p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30 shrink-0">
                        {u.rank || 'Apprenti'}
                      </span>
                    </div>

                    {/* Financial Balances Breakdown */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#101416] border border-white/5 text-center">
                      <div>
                        <span className="text-[9px] text-[#99907c] block uppercase font-semibold">
                          Solde Activation
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {(u.activation_balance || 0).toLocaleString()} F
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#F2CA50] block uppercase font-semibold">
                          Solde Commission
                        </span>
                        <span className="text-xs font-mono font-bold text-[#F2CA50]">
                          {(u.commission_balance || 0).toLocaleString()} F
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#10B981] block uppercase font-semibold">
                          Gains Réseau
                        </span>
                        <span className="text-xs font-mono font-bold text-[#10B981]">
                          {(u.network_earnings || 0).toLocaleString()} F
                        </span>
                      </div>
                    </div>

                    {/* Referral Details Footer */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-[#99907c] pt-1 border-t border-white/5 gap-2">
                      <div className="flex items-center space-x-3">
                        <span>
                          Code : <strong className="font-mono text-[#F2CA50]">{u.my_referral_code || 'N/A'}</strong>
                        </span>
                        <span>
                          Parrain : <strong className="font-mono text-white">{u.sponsor_code || 'Aucun (Racine)'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[#10B981] font-semibold">
                          👥 {u.direct_referrals_count || 0} filleuls
                        </span>
                        <span className="text-[10px]">
                          📅 {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENT RECEPTION NUMBERS */}
        {activeAdminTab === 'numbers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Numéros d'Encaissement Mobile Money
                </h2>
                <p className="text-[11px] text-[#99907c]">Comptes de réception pour les dépôts manuels</p>
              </div>
              <button
                onClick={() => setShowAddNumberModal(true)}
                className="px-3 py-2 rounded-xl bg-[#E63946] text-white font-bold text-xs flex items-center space-x-1.5 hover:brightness-110 shadow-lg active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter Numéro</span>
              </button>
            </div>

            {/* List of payment numbers */}
            <div className="space-y-2.5">
              {paymentNumbers.length === 0 ? (
                <div className="p-8 text-center text-[#99907c] bg-[#1d2022] rounded-3xl border border-white/5 text-xs">
                  Aucun numéro d'encaissement configuré. Cliquez sur "Ajouter Numéro" pour en créer un.
                </div>
              ) : (
                paymentNumbers.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-3xl bg-[#1d2022] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#101416] border border-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
                        {p.icon || getProviderIcon(p.provider)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white">{p.provider}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              p.active === 1 || p.active === true
                                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                                : 'bg-[#272a2d] text-[#99907c] border-white/10'
                            }`}
                          >
                            {p.active === 1 || p.active === true ? '● Actif' : '○ Inactif'}
                          </span>
                        </div>
                        <p className="text-sm font-mono font-bold text-[#F2CA50]">{p.number}</p>
                        <p className="text-[11px] text-[#99907c]">Titulaire : <span className="text-[#d0c5af]">{p.holder}</span></p>
                      </div>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex items-center space-x-2 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => togglePaymentNumber(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          p.active === 1 || p.active === true
                            ? 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 border-[#10B981]/30'
                            : 'bg-[#272a2d] text-[#99907c] hover:text-white border-white/10'
                        }`}
                        title={p.active === 1 || p.active === true ? 'Désactiver ce numéro' : 'Activer ce numéro'}
                      >
                        {p.active === 1 || p.active === true ? 'Désactiver' : 'Activer'}
                      </button>

                      <button
                        onClick={() => openEditModal(p)}
                        className="px-3 py-1.5 rounded-xl bg-[#272a2d] hover:bg-[#323538] text-white border border-white/10 text-xs font-bold flex items-center space-x-1 transition-all active:scale-95"
                        title="Modifier ce numéro"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#F2CA50]" />
                        <span>Modifier</span>
                      </button>

                      <button
                        onClick={() => setDeletingNumber(p)}
                        className="p-1.5 rounded-xl bg-[#E63946]/10 hover:bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/30 transition-all active:scale-95"
                        title="Supprimer ce numéro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal 1: Add Payment Number */}
            {showAddNumberModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-[#191c1e] border border-[#E63946]/50 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-[#E63946]/20 flex items-center justify-center border border-[#E63946]/40 text-[#E63946]">
                        <Plus className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Nouveau Numéro d'Encaissement</h4>
                    </div>
                    <button
                      onClick={() => setShowAddNumberModal(false)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#99907c] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddNumber} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[#99907c] mb-1 font-semibold">Opérateur Mobile Money</label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full bg-[#101416] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#E63946]"
                      >
                        <option value="Orange Money">Orange Money 🟠</option>
                        <option value="Wave">Wave 🌊</option>
                        <option value="MTN MoMo">MTN MoMo 🟡</option>
                        <option value="Moov Money">Moov Money 🟢</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#99907c] mb-1 font-semibold">Numéro de Téléphone Récepteur</label>
                      <input
                        type="tel"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="+225 07 12 34 56 78"
                        required
                        className="w-full bg-[#101416] border border-white/10 rounded-xl p-3 text-white outline-none font-mono focus:border-[#E63946]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#99907c] mb-1 font-semibold">Nom du Titulaire / Compte</label>
                      <input
                        type="text"
                        value={holder}
                        onChange={(e) => setHolder(e.target.value)}
                        placeholder="ex: Eco-Finance Trésorerie CI"
                        required
                        className="w-full bg-[#101416] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#E63946]"
                      />
                    </div>

                    <div className="flex space-x-2 pt-3">
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-[#E63946] text-white font-bold text-xs hover:brightness-110 shadow-lg active:scale-95 transition-all"
                      >
                        Enregistrer le Numéro
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddNumberModal(false)}
                        className="px-5 py-3 rounded-xl bg-[#272a2d] text-[#99907c] hover:text-white font-bold text-xs transition-colors"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-[#191c1e] border border-[#F2CA50]/50 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40 text-[#F2CA50]">
                        <Pencil className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Modifier le Numéro d'Encaissement</h4>
                    </div>
                    <button
                      onClick={() => setEditingNumber(null)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#99907c] hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateNumber} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[#99907c] mb-1 font-semibold">Opérateur Mobile Money</label>
                      <select
                        value={editProvider}
                        onChange={(e) => setEditProvider(e.target.value)}
                        className="w-full bg-[#101416] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#F2CA50]"
                      >
                        <option value="Orange Money">Orange Money 🟠</option>
                        <option value="Wave">Wave 🌊</option>
                        <option value="MTN MoMo">MTN MoMo 🟡</option>
                        <option value="Moov Money">Moov Money 🟢</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#99907c] mb-1 font-semibold">Numéro de Téléphone Récepteur</label>
                      <input
                        type="tel"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        placeholder="+225 07 12 34 56 78"
                        required
                        className="w-full bg-[#101416] border border-white/10 rounded-xl p-3 text-white outline-none font-mono focus:border-[#F2CA50]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#99907c] mb-1 font-semibold">Nom du Titulaire / Compte</label>
                      <input
                        type="text"
                        value={editHolder}
                        onChange={(e) => setEditHolder(e.target.value)}
                        placeholder="ex: Eco-Finance Trésorerie CI"
                        required
                        className="w-full bg-[#101416] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#F2CA50]"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="editActive"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="w-4 h-4 accent-[#10B981] rounded cursor-pointer"
                      />
                      <label htmlFor="editActive" className="text-xs text-white font-medium cursor-pointer">
                        Numéro actif (visible par les membres pour les dépôts)
                      </label>
                    </div>

                    <div className="flex space-x-2 pt-3">
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl gold-gradient-bg text-black font-bold text-xs hover:brightness-110 shadow-lg active:scale-95 transition-all"
                      >
                        Enregistrer les Modifications
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNumber(null)}
                        className="px-5 py-3 rounded-xl bg-[#272a2d] text-[#99907c] hover:text-white font-bold text-xs transition-colors"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
                <div className="bg-[#191c1e] border border-[#E63946] rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-2xl bg-[#E63946]/20 border border-[#E63946]/40 flex items-center justify-center text-[#E63946] mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">Supprimer ce Numéro d'Encaissement ?</h4>
                    <p className="text-xs text-[#d0c5af] mt-2">
                      Êtes-vous sûr de vouloir supprimer définitivement le numéro <strong className="text-white">{deletingNumber.provider} ({deletingNumber.number})</strong> ?
                    </p>
                    <p className="text-[11px] text-[#99907c] mt-1">
                      Titulaire : {deletingNumber.holder}
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleConfirmDelete}
                      className="flex-1 py-3 rounded-xl bg-[#E63946] text-white font-bold text-xs hover:brightness-110 shadow-lg active:scale-95 transition-all"
                    >
                      Supprimer définitivement
                    </button>
                    <button
                      onClick={() => setDeletingNumber(null)}
                      className="px-4 py-3 rounded-xl bg-[#272a2d] text-[#99907c] hover:text-white font-bold text-xs transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
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
