import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation & Auth State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Modals State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showRankSuccessModal, setShowRankSuccessModal] = useState(false);
  const [showUpgradeRankModal, setShowUpgradeRankModal] = useState(false);
  const [selectedTargetRank, setSelectedTargetRank] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptTxn, setSelectedReceiptTxn] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRankCelebration, setSelectedRankCelebration] = useState(null);

  // Core User State
  const [user, setUser] = useState({
    name: 'Membre Illuminati',
    email: '',
    phone: '',
    sponsorCode: '',
    myReferralCode: '',
    status: 'INACTIF',
    rank: 'Apprenti',
    balance: 0,
    networkEarnings: 0,
    personalVolume: 0,
    teamVolume: 0,
    activeDirectReferrals: 0,
    totalNetworkMembers: 0,
    role: 'MEMBRE',
  });

  // Admin Payment Reception Numbers Registry
  const [paymentNumbers, setPaymentNumbers] = useState([
    { id: 1, provider: 'Wave', number: '+225 07 00 11 22 33', holder: 'Illuminati Treasury Wave', active: true, icon: '🌊' },
    { id: 2, provider: 'Orange Money', number: '+225 07 88 77 66 55', holder: 'Illuminati Pay OM CI', active: true, icon: '🟠' },
    { id: 3, provider: 'MTN MoMo', number: '+225 05 44 33 22 11', holder: 'Illuminati MoMo CI', active: true, icon: '🟡' },
    { id: 4, provider: 'Moov Money', number: '+225 01 99 00 11 22', holder: 'Illuminati Treasury Moov', active: true, icon: '🟢' },
  ]);

  // Transactions Log
  const [transactions, setTransactions] = useState([]);

  // Pending items for Admin Drawer
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);

  // Network Tree & Stats
  const [networkData, setNetworkData] = useState({ stats: { totalDirectCount: 0, activeDirectCount: 0, totalTeamCount: 0 }, tree: [] });

  // Notifications Log
  const [notifications, setNotifications] = useState([]);

  // Toast message state
  const [toast, setToast] = useState(null);

  const showToastNotification = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to refresh user data, notifications & transactions from API
  const refreshUserData = useCallback(async () => {
    try {
      const meData = await api.auth.getMe();
      if (meData && meData.user) {
        setUser((prev) => {
          // Détection d'avancement de rang
          if (prev.rank && meData.user.rank && prev.rank !== meData.user.rank && prev.email) {
            setSelectedRankCelebration({
              title: `Félicitations pour le rang ${meData.user.rank} ! 🎉`,
              rankName: meData.user.rank,
              benefits: 'Commissions réseau maximales et déblocage de nouvelles récompenses d\'équipe.',
            });
            setShowRankSuccessModal(true);
          }
          const cachedAvatar = meData.user.id ? localStorage.getItem(`eco_avatar_${meData.user.id}`) : null;
          const resolvedAvatar = meData.user.avatarUrl || meData.user.avatar_url || cachedAvatar || prev.avatarUrl;
          if (resolvedAvatar && meData.user.id) {
            try { localStorage.setItem(`eco_avatar_${meData.user.id}`, resolvedAvatar); } catch (e) {}
          }

          return {
            ...prev,
            ...meData.user,
            avatarUrl: resolvedAvatar,
            myReferralCode: meData.user.myReferralCode || meData.user.my_referral_code,
            sponsorCode: meData.user.sponsorCode || meData.user.sponsor_code,
            networkEarnings: meData.user.networkEarnings ?? meData.user.network_earnings ?? 0,
          };
        });

        // Fetch User Transactions
        const txns = await api.deposits.getMyTransactions();
        if (Array.isArray(txns)) {
          setTransactions(txns);
        }

        // Fetch User Notifications from Backend
        const notifRes = await api.notifications.get().catch(() => null);
        if (notifRes && Array.isArray(notifRes.notifications)) {
          setNotifications(
            notifRes.notifications.map((n) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type === 'SUCCESS' ? 'success' : n.type === 'WARNING' ? 'warning' : 'info',
              read: n.read_status === 1,
              time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          );
        }

        // Fetch Network Tree
        const netTree = await api.network.getTree().catch(() => null);
        if (netTree) {
          setNetworkData(netTree);
          setUser((prev) => ({
            ...prev,
            activeDirectReferrals: netTree.stats?.activeDirectCount || 0,
            totalNetworkMembers: netTree.stats?.totalTeamCount || 0,
          }));
        }

        // If ADMIN, fetch pending deposits, withdrawals and all payment numbers
        if (meData.user.role === 'ADMIN') {
          const deps = await api.admin.getPendingDeposits().catch(() => []);
          const wths = await api.admin.getPendingWithdrawals().catch(() => []);
          const nums = await api.admin.getPaymentNumbers().catch(() => []);
          setPendingDeposits(deps);
          setPendingWithdrawals(wths);
          if (Array.isArray(nums) && nums.length > 0) setPaymentNumbers(nums);
        } else {
          const nums = await api.deposits.getPaymentNumbers().catch(() => []);
          if (Array.isArray(nums) && nums.length > 0) setPaymentNumbers(nums);
        }
      }
    } catch (err) {
      console.warn('Refresh user data error:', err.message);
    }
  }, []);

  // Check auth session on load & Setup periodic polling for real-time sync (Axe 2)
  useEffect(() => {
    let interval = null;

    const initAuth = async () => {
      try {
        const meData = await api.auth.getMe();
        if (meData && meData.user) {
          setIsAuthenticated(true);
          const cachedAvatar = meData.user.id ? localStorage.getItem(`eco_avatar_${meData.user.id}`) : null;
          const resolvedAvatar = meData.user.avatarUrl || meData.user.avatar_url || cachedAvatar || null;
          if (resolvedAvatar && meData.user.id) {
            try { localStorage.setItem(`eco_avatar_${meData.user.id}`, resolvedAvatar); } catch (e) {}
          }

          setUser((prev) => ({
            ...prev,
            ...meData.user,
            avatarUrl: resolvedAvatar,
            myReferralCode: meData.user.myReferralCode || meData.user.my_referral_code,
            sponsorCode: meData.user.sponsorCode || meData.user.sponsor_code,
            networkEarnings: meData.user.networkEarnings ?? meData.user.network_earnings ?? 0,
          }));
          await refreshUserData();
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    initAuth();

    // Polling toutes les 10 secondes si authentifié
    interval = setInterval(() => {
      if (isAuthenticated) {
        refreshUserData();
      }
    }, 10000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refreshUserData, isAuthenticated]);

  // 1. Submit Manual Deposit (User Action)
  const submitManualDeposit = async ({ amount, providerId, senderNumber, txnId, dateTime }) => {
    const selectedProvider = paymentNumbers.find((p) => p.id === parseInt(providerId)) || { provider: 'Wave', number: '+225 07 00 11 22 33' };

    try {
      await api.deposits.submit({
        amount: parseFloat(amount),
        provider: selectedProvider.provider,
        recipientNumber: selectedProvider.number,
        senderNumber,
        txnId,
        dateTime: dateTime || new Date().toISOString().slice(0, 16).replace('T', ' '),
      });

      showToastNotification('Dépôt transmis à l\'administrateur avec succès !', 'success');
      setShowDepositModal(false);
      await refreshUserData();
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors du dépôt', 'error');
      return false;
    }
  };

  // 2. Submit Withdrawal Request (User Action)
  const requestWithdrawal = async ({ amount, provider, phone }) => {
    try {
      const res = await api.withdrawals.request({
        amount: parseFloat(amount),
        provider,
        recipientNumber: phone,
      });

      showToastNotification(res.message || 'Demande de retrait transmise avec succès !', 'success');
      setShowWithdrawModal(false);
      await refreshUserData();
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Erreur de retrait', 'error');
      return false;
    }
  };

  // 2.bis Upgrade Rank (User Action via Solde Commission)
  const upgradeRank = async (targetRank) => {
    try {
      const res = await api.network.upgradeRank(targetRank);
      showToastNotification(res.message || `Félicitations ! Vous êtes passé au grade ${res.newRank} ! 🎉`, 'success');
      setShowUpgradeRankModal(false);

      setSelectedRankCelebration({
        title: `Grade ${res.newRank} Débloqué ! 🏆`,
        name: res.newRank,
        bonus: 0,
        rate: `${(res.newRate * 100).toFixed(0)}%`,
        levels: 3,
        benefits: `Taux de commission réseau de ${(res.newRate * 100).toFixed(0)}% activé sur l'ensemble de votre arbre MLM.`,
      });
      setShowRankSuccessModal(true);

      try {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}

      await refreshUserData();
      return { success: true, ...res };
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de la montée de grade', 'error');
      return { success: false, error: err.message };
    }
  };

  // 2.ter Open Transaction Receipt Modal
  const openTransactionReceipt = (transaction) => {
    setSelectedReceiptTxn(transaction);
    setShowReceiptModal(true);
  };

  // 3. Approve Deposit (Admin Action)
  const approveDeposit = async (id) => {
    try {
      const res = await api.admin.approveDeposit(id);
      showToastNotification(res.message || `Dépôt ${id} validé !`, 'success');
      
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      await refreshUserData();
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de la validation du dépôt', 'error');
    }
  };

  // 4. Reject Deposit (Admin Action)
  const rejectDeposit = async (id, reason = 'Transaction non valide') => {
    try {
      const res = await api.admin.rejectDeposit(id, reason);
      showToastNotification(res.message || `Dépôt ${id} rejeté.`, 'error');
      await refreshUserData();
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors du rejet', 'error');
    }
  };

  // 5. Approve Withdrawal (Admin Action)
  const approveWithdrawal = async (id) => {
    try {
      const res = await api.admin.approveWithdrawal(id);
      showToastNotification(res.message || `Retrait ${id} validé !`, 'success');
      await refreshUserData();
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de la validation du retrait', 'error');
    }
  };

  // 6. Reject Withdrawal (Admin Action)
  const rejectWithdrawal = async (id, reason = 'Solde ou données incorrectes') => {
    try {
      const res = await api.admin.rejectWithdrawal(id, reason);
      showToastNotification(res.message || `Retrait ${id} rejeté. Montant remboursé.`, 'warning');
      await refreshUserData();
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors du rejet du retrait', 'error');
    }
  };

  // 7. Payment Numbers CRUD Management (Admin)
  const addPaymentNumber = async (newNumber) => {
    try {
      const res = await api.admin.addPaymentNumber(newNumber);
      if (res.paymentNumber) {
        setPaymentNumbers((prev) => [res.paymentNumber, ...prev]);
      } else {
        await refreshUserData();
      }
      showToastNotification('Numéro de réception ajouté avec succès !', 'success');
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de l\'ajout du numéro', 'error');
      return false;
    }
  };

  const updatePaymentNumber = async (id, updatedData) => {
    try {
      const res = await api.admin.updatePaymentNumber(id, updatedData);
      setPaymentNumbers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...res.paymentNumber } : item))
      );
      showToastNotification('Numéro d\'encaissement mis à jour !', 'success');
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de la modification', 'error');
      return false;
    }
  };

  const togglePaymentNumber = async (id) => {
    try {
      const res = await api.admin.togglePaymentNumber(id);
      setPaymentNumbers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, active: res.active } : item))
      );
      showToastNotification(res.message || 'Statut mis à jour.', 'info');
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors du changement de statut', 'error');
    }
  };

  const deletePaymentNumber = async (id) => {
    try {
      await api.admin.deletePaymentNumber(id);
      setPaymentNumbers((prev) => prev.filter((item) => item.id !== id));
      showToastNotification('Numéro d\'encaissement supprimé avec succès !', 'success');
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de la suppression', 'error');
      return false;
    }
  };

  const markNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.notifications.markAllAsRead();
    } catch (e) {}
  };

  // Authentication Actions
  const login = async (email, password, mfaToken) => {
    try {
      const data = await api.auth.login(email, password, mfaToken);
      setIsAuthenticated(true);
      setUser((prev) => ({
        ...prev,
        ...data.user,
        myReferralCode: data.user.myReferralCode || data.user.my_referral_code,
        sponsorCode: data.user.sponsorCode || data.user.sponsor_code,
      }));
      setActiveTab('dashboard');
      showToastNotification('Connexion réussie ! Bienvenue sur Eco-Finance.', 'success');
      await refreshUserData();
      return { success: true };
    } catch (err) {
      const errMsg = err.message || 'Échec de la connexion';
      showToastNotification(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');

  const openSettings = (tab = 'profile') => {
    setSettingsTab(tab);
    setShowSettingsModal(true);
  };

  const updateAvatar = async (avatarUrl) => {
    try {
      if (user?.id) {
        try { localStorage.setItem(`eco_avatar_${user.id}`, avatarUrl); } catch (e) {}
      }
      await api.auth.updateAvatar(avatarUrl);
      setUser((prev) => ({ ...prev, avatarUrl }));
      showToastNotification('Photo de profil enregistrée définitivement !', 'success');
      await refreshUserData();
    } catch (err) {
      setUser((prev) => ({ ...prev, avatarUrl }));
      showToastNotification('Photo de profil mise à jour.', 'info');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.auth.updateProfile(profileData);
      setUser((prev) => ({
        ...prev,
        ...profileData,
      }));
      showToastNotification(res.message || 'Paramètres du compte enregistrés avec succès !', 'success');
      await refreshUserData();
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de la mise à jour des paramètres', 'error');
      return false;
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const res = await api.auth.changePassword(passwordData);
      showToastNotification(res.message || 'Mot de passe modifié avec succès !', 'success');
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors du changement de mot de passe', 'error');
      return false;
    }
  };

  const sendOtp = async (phone, email, channel = 'EMAIL') => {
    try {
      const data = await api.auth.sendOtp({ phone, email, channel });
      const targetLabel = channel === 'EMAIL' ? `l'email ${email}` : `le ${phone}`;
      if (data.simulatedCode) {
        showToastNotification(`Code OTP envoyé à ${targetLabel} : ${data.simulatedCode}`, 'info');
      } else {
        showToastNotification(`Code OTP envoyé avec succès à ${targetLabel}.`, 'info');
      }
      return data;
    } catch (err) {
      showToastNotification(err.message || 'Impossible d\'envoyer le code de confirmation', 'error');
      throw err;
    }
  };

  const sendForgotPasswordOtp = async (identifier, channel = 'EMAIL') => {
    try {
      const data = await api.auth.sendForgotPasswordOtp({ identifier, channel });
      if (data.simulatedCode) {
        showToastNotification(`Code de récupération envoyé : ${data.simulatedCode}`, 'info');
      } else {
        showToastNotification(data.message || 'Code de récupération envoyé avec succès.', 'info');
      }
      return data;
    } catch (err) {
      showToastNotification(err.message || 'Impossible d\'envoyer le code de récupération', 'error');
      throw err;
    }
  };

  const resetPassword = async ({ identifier, phone, email, otpCode, newPassword, confirmNewPassword }) => {
    try {
      const data = await api.auth.resetPassword({ identifier, phone, email, otpCode, newPassword, confirmNewPassword });
      showToastNotification(data.message || 'Mot de passe réinitialisé avec succès !', 'success');
      return data;
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de la réinitialisation du mot de passe', 'error');
      throw err;
    }
  };

  const signup = async ({ name, email, phone, sponsorCode, password, confirmPassword, otpCode, channel }) => {
    try {
      const data = await api.auth.signup({ name, email, phone, sponsorCode, password, confirmPassword, otpCode, channel });
      setIsAuthenticated(true);
      setUser((prev) => ({
        ...prev,
        ...data.user,
        myReferralCode: data.user.myReferralCode || data.user.my_referral_code,
      }));
      setActiveTab('dashboard');
      showToastNotification('Inscription et vérification réussies ! Bienvenue sur Eco-Finance.', 'success');
      await refreshUserData();
      return { success: true, user: data.user };
    } catch (err) {
      const errMsg = err.message || 'Échec de l\'inscription';
      showToastNotification(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {}
    setIsAuthenticated(false);
    setUser({
      name: '',
      email: '',
      phone: '',
      sponsorCode: '',
      myReferralCode: '',
      status: 'INACTIF',
      rank: 'Apprenti',
      balance: 0,
      networkEarnings: 0,
      personalVolume: 0,
      teamVolume: 0,
      activeDirectReferrals: 0,
      totalNetworkMembers: 0,
      role: 'MEMBRE',
    });
    showToastNotification('Vous êtes déconnecté.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAdminMode,
        setIsAdminMode,
        isAuthenticated,
        setIsAuthenticated,
        isLoadingAuth,
        login,
        signup,
        sendOtp,
        sendForgotPasswordOtp,
        resetPassword,
        logout,
        updateAvatar,
        showSettingsModal,
        setShowSettingsModal,
        settingsTab,
        setSettingsTab,
        openSettings,
        updateProfile,
        changePassword,
        showDepositModal,
        setShowDepositModal,
        showWithdrawModal,
        setShowWithdrawModal,
        showRankSuccessModal,
        setShowRankSuccessModal,
        showUpgradeRankModal,
        setShowUpgradeRankModal,
        selectedTargetRank,
        setSelectedTargetRank,
        upgradeRank,
        showReceiptModal,
        setShowReceiptModal,
        selectedReceiptTxn,
        setSelectedReceiptTxn,
        openTransactionReceipt,
        showShareModal,
        setShowShareModal,
        selectedRankCelebration,
        setSelectedRankCelebration,
        user,
        setUser,
        paymentNumbers,
        transactions,
        pendingDeposits,
        pendingWithdrawals,
        networkData,
        notifications,
        toast,
        submitManualDeposit,
        approveDeposit,
        rejectDeposit,
        approveWithdrawal,
        rejectWithdrawal,
        addPaymentNumber,
        updatePaymentNumber,
        deletePaymentNumber,
        togglePaymentNumber,
        requestWithdrawal,
        markNotificationsRead,
        showToastNotification,
        refreshUserData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
