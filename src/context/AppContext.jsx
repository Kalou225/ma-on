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
          return {
            ...prev,
            ...meData.user,
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

        // If ADMIN, fetch pending deposits and withdrawals
        if (meData.user.role === 'ADMIN') {
          const deps = await api.admin.getPendingDeposits().catch(() => []);
          const wths = await api.admin.getPendingWithdrawals().catch(() => []);
          setPendingDeposits(deps);
          setPendingWithdrawals(wths);
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
          setUser((prev) => ({
            ...prev,
            ...meData.user,
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

  // 7. Add Admin Payment Number
  const addPaymentNumber = async (newNumber) => {
    try {
      await api.admin.addPaymentNumber(newNumber);
      setPaymentNumbers((prev) => [...prev, { id: Date.now(), ...newNumber, active: true }]);
      showToastNotification('Nouveau numéro de réception ajouté !', 'success');
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors de l\'ajout du numéro', 'error');
    }
  };

  const togglePaymentNumber = (id) => {
    setPaymentNumbers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
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
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Échec de la connexion', 'error');
      return false;
    }
  };

  const updateAvatar = async (avatarUrl) => {
    try {
      await api.auth.updateAvatar(avatarUrl);
      setUser((prev) => ({ ...prev, avatarUrl }));
      showToastNotification('Photo de profil mise à jour avec succès !', 'success');
    } catch (err) {
      setUser((prev) => ({ ...prev, avatarUrl }));
      showToastNotification('Photo de profil mise à jour localement.', 'info');
    }
  };

  const signup = async ({ name, email, phone, sponsorCode, password }) => {
    try {
      const data = await api.auth.signup({ name, email, phone, sponsorCode, password });
      setIsAuthenticated(true);
      setUser((prev) => ({
        ...prev,
        ...data.user,
        myReferralCode: data.user.myReferralCode || data.user.my_referral_code,
      }));
      setActiveTab('dashboard');
      showToastNotification('Inscription réussie ! Effectuez votre dépôt manuel d\'activation.', 'warning');
      await refreshUserData();
      return true;
    } catch (err) {
      showToastNotification(err.message || 'Échec de l\'inscription', 'error');
      return false;
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
        logout,
        updateAvatar,
        showDepositModal,
        setShowDepositModal,
        showWithdrawModal,
        setShowWithdrawModal,
        showRankSuccessModal,
        setShowRankSuccessModal,
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
