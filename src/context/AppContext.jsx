import React, { createContext, useContext, useState } from 'react';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showRankSuccessModal, setShowRankSuccessModal] = useState(false);
  const [selectedRankCelebration, setSelectedRankCelebration] = useState(null);

  // User State
  const [user, setUser] = useState({
    name: 'Alexandre Kouassi',
    email: 'alex.kouassi@illuminati-mlm.com',
    phone: '+225 07 12 34 56 78',
    sponsorCode: 'ILL-88392',
    myReferralCode: 'ALEX-9912',
    status: 'ACTIF', // 'ACTIF' | 'INACTIF'
    rank: 'Compagnon', // 'Apprenti' | 'Compagnon' | 'Maître' | 'Grand Maître'
    balance: 485000,
    networkEarnings: 310000,
    personalVolume: 120000,
    teamVolume: 1850000,
    activeDirectReferrals: 5,
    totalNetworkMembers: 24,
  });

  // Admin Payment Reception Numbers Registry (Managed by Admin)
  const [paymentNumbers, setPaymentNumbers] = useState([
    { id: 1, provider: 'Wave', number: '+225 07 00 11 22 33', holder: 'Illuminati Treasury Wave', active: true, icon: '🌊' },
    { id: 2, provider: 'Orange Money', number: '+225 07 88 77 66 55', holder: 'Illuminati Pay OM CI', active: true, icon: '🟠' },
    { id: 3, provider: 'MTN MoMo', number: '+225 05 44 33 22 11', holder: 'Illuminati MoMo CI', active: true, icon: '🟡' },
    { id: 4, provider: 'Moov Money', number: '+225 01 99 00 11 22', holder: 'Illuminati Treasury Moov', active: true, icon: '🟢' },
  ]);

  // Transactions & Deposit Requests Log
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN-9088',
      type: 'DEPOT_FONDS',
      label: 'Dépôt Manuel MTN MoMo',
      amount: 50000,
      provider: 'MTN MoMo',
      recipientNumber: '+225 05 44 33 22 11',
      senderNumber: '+225 07 12 34 56 78',
      txnId: 'MOMO-771239',
      dateTime: '2026-07-30 11:40',
      status: 'EN_ATTENTE',
      note: 'Vérification administrateur en cours',
    },
    {
      id: 'TXN-9044',
      type: 'DEPOT_FONDS',
      label: 'Dépôt Manuel Wave',
      amount: 100000,
      provider: 'Wave',
      recipientNumber: '+225 07 00 11 22 33',
      senderNumber: '+225 07 12 34 56 78',
      txnId: 'WAVE-8839210',
      dateTime: '2026-07-30 09:15',
      status: 'VALIDÉ',
      note: 'Crédité sur le solde disponible',
    },
    {
      id: 'TXN-9021',
      type: 'DEPOT_ACTIVATION',
      label: 'Frais d\'Activation de Compte',
      amount: 25000,
      provider: 'Orange Money',
      recipientNumber: '+225 07 88 77 66 55',
      senderNumber: '+225 07 12 34 56 78',
      txnId: 'OM-20260729-99',
      dateTime: '2026-07-29 18:30',
      status: 'VALIDÉ',
      note: 'Compte membre activé avec succès',
    },
    {
      id: 'TXN-8890',
      type: 'COMMISSION_RESEAU',
      label: 'Bonus Parrainage NIVEAU 1',
      amount: 45000,
      dateTime: '2026-07-28 14:10',
      status: 'VALIDÉ',
      note: 'Commission membre K. Jean-Marc',
    },
  ]);

  // Notifications Log
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: '⏳ Dépôt soumis',
      message: 'Votre dépôt de 50 000 FCFA par MTN MoMo est en cours de vérification par l\'administration.',
      time: 'Il y a 1 heure',
      read: false,
      type: 'warning',
    },
    {
      id: 2,
      title: '✅ Dépôt validé',
      message: 'Votre dépôt de 100 000 FCFA par Wave a été approuvé. Solde crédité.',
      time: 'Il y a 3 heures',
      read: true,
      type: 'success',
    },
    {
      id: 3,
      title: '🎉 Grade Compagnon Débloqué',
      message: 'Félicitations ! Vous avez atteint le rang de Compagnon.',
      time: 'Hier',
      read: true,
      type: 'info',
    },
  ]);

  // Toast message state
  const [toast, setToast] = useState(null);

  const showToastNotification = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Submit Manual Deposit (User Action)
  const submitManualDeposit = ({ amount, providerId, senderNumber, txnId, dateTime }) => {
    const selectedProvider = paymentNumbers.find((p) => p.id === parseInt(providerId));
    if (!selectedProvider) return false;

    const newTxnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
    const isActivation = user.status === 'INACTIF';

    const newTxn = {
      id: newTxnId,
      type: isActivation ? 'DEPOT_ACTIVATION' : 'DEPOT_FONDS',
      label: isActivation ? 'Dépôt Activation de Compte' : `Dépôt Manuel ${selectedProvider.provider}`,
      amount: parseFloat(amount),
      provider: selectedProvider.provider,
      recipientNumber: selectedProvider.number,
      senderNumber,
      txnId,
      dateTime: dateTime || new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'EN_ATTENTE',
      note: 'Soumis pour vérification manuelle par l\'administrateur',
    };

    setTransactions((prev) => [newTxn, ...prev]);

    // Add Notification
    const newNotif = {
      id: Date.now(),
      title: '⏳ Dépôt envoyé à l\'admin',
      message: `Votre dépôt de ${parseFloat(amount).toLocaleString()} FCFA (ID: ${txnId}) à été transmis à l'administrateur pour vérification.`,
      time: 'À l\'instant',
      read: false,
      type: 'warning',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToastNotification('Dépôt transmis à l\'administrateur avec succès !', 'success');
    setShowDepositModal(false);
    return true;
  };

  // Approve Deposit (Admin Action)
  const approveDeposit = (id) => {
    const targetTxn = transactions.find((t) => t.id === id);
    if (!targetTxn || targetTxn.status !== 'EN_ATTENTE') return;

    // Update Transaction
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: 'VALIDÉ', note: 'Approuvé et crédité par l\'administrateur' }
          : t
      )
    );

    // Update User Balance & Status
    setUser((prev) => {
      const isActivation = targetTxn.type === 'DEPOT_ACTIVATION';
      return {
        ...prev,
        balance: prev.balance + targetTxn.amount,
        status: isActivation ? 'ACTIF' : prev.status,
      };
    });

    // Add Notification
    const newNotif = {
      id: Date.now(),
      title: '🎉 Dépôt Validé par l\'Admin !',
      message: `Votre dépôt de ${targetTxn.amount.toLocaleString()} FCFA a été vérifié et crédité sur votre solde.`,
      time: 'À l\'instant',
      read: false,
      type: 'success',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Trigger Confetti
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      console.log('Confetti effect triggered');
    }

    showToastNotification(`Dépôt ${targetTxn.id} validé ! Solde crédité de ${targetTxn.amount.toLocaleString()} FCFA.`, 'success');
  };

  // Reject Deposit (Admin Action)
  const rejectDeposit = (id, reason = 'Identifiant ou transaction non trouvée') => {
    const targetTxn = transactions.find((t) => t.id === id);
    if (!targetTxn) return;

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: 'REJETÉ', note: `Rejeté par l'admin: ${reason}` }
          : t
      )
    );

    const newNotif = {
      id: Date.now(),
      title: '❌ Dépôt non validé',
      message: `Votre demande de dépôt (ID: ${targetTxn.txnId}) a été rejetée. Motif: ${reason}`,
      time: 'À l\'instant',
      read: false,
      type: 'error',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToastNotification(`Demande ${targetTxn.id} rejetée par l'admin.`, 'error');
  };

  // Add Admin Payment Number (Admin Action)
  const addPaymentNumber = (newNumber) => {
    const item = {
      id: Date.now(),
      ...newNumber,
      active: true,
    };
    setPaymentNumbers((prev) => [...prev, item]);
    showToastNotification('Nouveau numéro de réception ajouté !', 'success');
  };

  // Toggle Admin Payment Number (Admin Action)
  const togglePaymentNumber = (id) => {
    setPaymentNumbers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
  };

  // Submit Withdrawal Request
  const requestWithdrawal = ({ amount, provider, phone }) => {
    const amt = parseFloat(amount);
    if (amt > user.balance) {
      showToastNotification('Solde insuffisant pour effectuer ce retrait.', 'error');
      return false;
    }

    const newTxn = {
      id: `RET-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'RETRAIT_FONDS',
      label: `Retrait vers ${provider}`,
      amount: amt,
      provider,
      recipientNumber: phone,
      dateTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'EN_ATTENTE',
      note: 'Demande de retrait en cours de traitement',
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setUser((prev) => ({ ...prev, balance: prev.balance - amt }));

    showToastNotification('Demande de retrait transmise avec succès !', 'success');
    setShowWithdrawModal(false);
    return true;
  };

  // Mark all notifications as read
  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAdminMode,
        setIsAdminMode,
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
        notifications,
        toast,
        submitManualDeposit,
        approveDeposit,
        rejectDeposit,
        addPaymentNumber,
        togglePaymentNumber,
        requestWithdrawal,
        markNotificationsRead,
        showToastNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
