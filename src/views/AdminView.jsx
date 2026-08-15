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
  Copy,
  KeyRound,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
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
  const [deletingUser, setDeletingUser] = useState(null); // User object for deletion modal
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [resettingUser, setResettingUser] = useState(null); // User object for password reset modal
  const [tempPassword, setTempPassword] = useState('EcoFinance@2026');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState(null); // { type: 'success' | 'error', message: string }

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

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeletingUser(true);
    try {
      const res = await api.admin.deleteUser(deletingUser.id);
      setAdminFeedback({ type: 'success', message: res.message || 'Utilisateur supprimé avec succès.' });
      setDeletingUser(null);
      await fetchUsers();
    } catch (err) {
      setAdminFeedback({ type: 'error', message: err.message || 'Erreur lors de la suppression.' });
    } finally {
      setIsDeletingUser(false);
      setTimeout(() => setAdminFeedback(null), 4000);
    }
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    if (!resettingUser) return;
    setIsResettingPassword(true);
    try {
      const res = await api.admin.resetUserPassword(resettingUser.id, tempPassword);
      setAdminFeedback({
        type: 'success',
        message: `${res.message} Nouveau mot de passe temporaire : ${res.temporaryPassword || tempPassword}`,
      });
      setResettingUser(null);
      setTempPassword('EcoFinance@2026');
    } catch (err) {
      setAdminFeedback({ type: 'error', message: err.message || 'Erreur lors de la réinitialisation.' });
    } finally {
      setIsResettingPassword(false);
      setTimeout(() => setAdminFeedback(null), 6000);
    }
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
          <div className="space-y-4">
            {/* Admin Action Feedback Banner */}
            {adminFeedback && (
              <div
                className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border animate-in fade-in ${
                  adminFeedback.type === 'success'
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {adminFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{adminFeedback.message}</span>
                </div>
                <button
                  onClick={() => setAdminFeedback(null)}
                  className="p-1 hover:opacity-80 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-[#1d2022] border border-white/5 shadow-sm">
                <span className="text-[10px] text-[#99907c] block uppercase font-semibold">Total Membres</span>
                <p className="text-base font-extrabold text-white">{usersList.length}</p>
                <span className="text-[9px] text-[#d0c5af]">Inscrits</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1d2022] border border-white/5 shadow-sm">
                <span className="text-[10px] text-[#10B981] block uppercase font-semibold">Actifs</span>
                <p className="text-base font-extrabold text-[#10B981]">
                  {usersList.filter((u) => u.status === 'ACTIF').length}
                </p>
                <span className="text-[9px] text-[#d0c5af]">Activés</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1d2022] border border-white/5 shadow-sm">
                <span className="text-[10px] text-[#E63946] block uppercase font-semibold">Inactifs</span>
                <p className="text-base font-extrabold text-[#E63946]">
                  {usersList.filter((u) => u.status !== 'ACTIF').length}
                </p>
                <span className="text-[9px] text-[#d0c5af]">En attente</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1d2022] border border-white/5 shadow-sm">
                <span className="text-[10px] text-[#F2CA50] block uppercase font-semibold truncate">
                  Total MLM
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
            <div className="space-y-3.5">
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
                    className="p-4 rounded-3xl bg-[#1d2022] border border-white/10 space-y-3.5 shadow-xl hover:border-white/20 transition-all"
                  >
                    {/* User Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#272a2d] border border-white/10 flex items-center justify-center font-extrabold text-base text-[#F2CA50] shrink-0 shadow-inner">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
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
                          <p className="text-[10px] text-[#99907c] mt-0.5">
                            ID: <span className="font-mono">{u.id}</span> • Inscrit le {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30 shrink-0">
                        {u.rank || 'Apprenti'}
                      </span>
                    </div>

                    {/* IDENTIFIANTS DE CONNEXION (DÉDIÉ) */}
                    <div className="p-3.5 rounded-2xl bg-[#141719] border border-[#F2CA50]/20 space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2CA50] flex items-center space-x-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-[#F2CA50]" />
                          <span>Identifiants de Connexion</span>
                        </span>
                        <span className="text-[10px] text-[#99907c]">Authentification Membre</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Email */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#101416] border border-white/5">
                          <div className="flex items-center space-x-2 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-[#F2CA50] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] text-[#99907c] block">Email :</span>
                              <span className="font-mono text-white truncate block text-[11px] select-all">
                                {u.email}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(u.email, `email-${u.id}`)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d0c5af] hover:text-white transition-colors shrink-0 ml-2"
                            title="Copier l'email"
                          >
                            {copiedField === `email-${u.id}` ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Téléphone */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#101416] border border-white/5">
                          <div className="flex items-center space-x-2 min-w-0">
                            <Phone className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] text-[#99907c] block">Numéro Mobile :</span>
                              <span className="font-mono text-white truncate block text-[11px] select-all">
                                {u.phone || 'Non renseigné'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(u.phone, `phone-${u.id}`)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d0c5af] hover:text-white transition-colors shrink-0 ml-2"
                            title="Copier le numéro"
                          >
                            {copiedField === `phone-${u.id}` ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Code Parrainage Membre */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#101416] border border-white/5">
                          <div className="flex items-center space-x-2 min-w-0">
                            <Award className="w-3.5 h-3.5 text-[#F2CA50] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] text-[#99907c] block">Code Parrainage :</span>
                              <span className="font-mono font-bold text-[#F2CA50] text-[11px]">
                                {u.my_referral_code || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(u.my_referral_code, `code-${u.id}`)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d0c5af] hover:text-white transition-colors shrink-0 ml-2"
                            title="Copier le code"
                          >
                            {copiedField === `code-${u.id}` ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Parrain Référent */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#101416] border border-white/5">
                          <div className="flex items-center space-x-2 min-w-0">
                            <Share2 className="w-3.5 h-3.5 text-[#99907c] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] text-[#99907c] block">Parrain (Sponsor) :</span>
                              <span className="font-mono text-white text-[11px]">
                                {u.sponsor_code || 'Racine'}
                              </span>
                            </div>
                          </div>
                          {u.sponsor_code && (
                            <button
                              onClick={() => handleCopy(u.sponsor_code, `sponsor-${u.id}`)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d0c5af] hover:text-white transition-colors shrink-0 ml-2"
                              title="Copier le code parrain"
                            >
                              {copiedField === `sponsor-${u.id}` ? (
                                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
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

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2 flex-wrap">
                      <div className="flex items-center space-x-3 text-[11px] text-[#99907c]">
                        <span className="text-[#10B981] font-semibold">
                          👥 {u.direct_referrals_count || 0} filleuls
                        </span>
                        <span>
                          💳 {u.total_transactions || 0} txns
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Bouton Réinitialiser Mot de passe */}
                        <button
                          onClick={() => {
                            setResettingUser(u);
                            setTempPassword('EcoFinance@2026');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#272a2d] hover:bg-[#383c40] text-[#F2CA50] border border-[#F2CA50]/30 text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm"
                          title="Réinitialiser le mot de passe de l'utilisateur"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Réinitialiser MDP</span>
                        </button>

                        {/* Bouton Supprimer l'Utilisateur */}
                        {u.role === 'ADMIN' || u.id === user?.id ? (
                          <span className="px-3 py-1.5 rounded-xl bg-white/5 text-[#99907c] text-xs font-semibold border border-white/10 cursor-not-allowed">
                            Admin Protégé
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="px-3 py-1.5 rounded-xl bg-[#E63946]/15 hover:bg-[#E63946] text-[#E63946] hover:text-white border border-[#E63946]/30 hover:border-[#E63946] text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm"
                            title="Supprimer définitivement cet utilisateur"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        )}
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

        {/* Modal 4: Delete User Confirmation */}
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#191c1e] border border-[#E63946] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-[#E63946]/20 border border-[#E63946]/40 flex items-center justify-center text-[#E63946] mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">Supprimer Définitivement cet Utilisateur ?</h4>
                <p className="text-xs text-[#d0c5af]">
                  Êtes-vous sûr de vouloir supprimer le compte de <strong className="text-white">{deletingUser.name}</strong> ?
                </p>
                <div className="p-3 rounded-2xl bg-[#101416] border border-white/5 text-left text-xs font-mono space-y-1 mt-2">
                  <p className="text-[#99907c]">Email : <span className="text-white">{deletingUser.email}</span></p>
                  <p className="text-[#99907c]">Téléphone : <span className="text-white">{deletingUser.phone}</span></p>
                  <p className="text-[#99907c]">Code Parrainage : <span className="text-[#F2CA50]">{deletingUser.my_referral_code}</span></p>
                  <p className="text-[#99907c]">Solde Commission : <span className="text-[#10B981]">{(deletingUser.commission_balance || 0).toLocaleString()} F</span></p>
                </div>
                <p className="text-[11px] text-[#E63946] pt-1 font-sans">
                  ⚠️ Cette action est irréversible. Toutes ses transactions et notifications associées seront également supprimées.
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleConfirmDeleteUser}
                  disabled={isDeletingUser}
                  className="flex-1 py-3 rounded-xl bg-[#E63946] hover:brightness-110 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isDeletingUser ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirmer la suppression</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeletingUser(null)}
                  disabled={isDeletingUser}
                  className="px-4 py-3 rounded-xl bg-[#272a2d] text-[#99907c] hover:text-white font-bold text-xs transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 5: Reset User Password */}
        {resettingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#191c1e] border border-[#F2CA50]/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40 text-[#F2CA50]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">Réinitialiser Mot de Passe</h4>
                    <p className="text-[11px] text-[#99907c]">{resettingUser.name} ({resettingUser.email})</p>
                  </div>
                </div>
                <button
                  onClick={() => setResettingUser(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#99907c] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmResetPassword} className="space-y-3 text-xs text-left">
                <div>
                  <label className="block text-[#99907c] mb-1 font-semibold">Nouveau Mot de Passe Temporaire</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="ex: EcoFinance@2026"
                      required
                      minLength={8}
                      className="w-full bg-[#101416] border border-white/10 rounded-xl p-3 pr-20 text-white font-mono outline-none focus:border-[#F2CA50]"
                    />
                    <button
                      type="button"
                      onClick={() => setTempPassword(`Eco@${Math.floor(100000 + Math.random() * 900000)}`)}
                      className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-[#F2CA50] hover:bg-white/20"
                      title="Générer mot de passe aléatoire"
                    >
                      Aléatoire
                    </button>
                  </div>
                  <p className="text-[10px] text-[#99907c] mt-1">
                    Transmettez ce mot de passe à l'utilisateur afin qu'il puisse se reconnecter immédiatement.
                  </p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={isResettingPassword || !tempPassword}
                    className="flex-1 py-3 rounded-xl gold-gradient-bg text-black font-bold text-xs hover:brightness-110 shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {isResettingPassword ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Appliquer le Nouveau Mot de Passe</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResettingUser(null)}
                    disabled={isResettingPassword}
                    className="px-4 py-3 rounded-xl bg-[#272a2d] text-[#99907c] hover:text-white font-bold text-xs transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
