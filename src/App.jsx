import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { ManualDepositModal } from './components/ManualDepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { RankSuccessModal } from './components/RankSuccessModal';
import { ShareReferralModal } from './components/ShareReferralModal';
import { InactivityTimer } from './components/InactivityTimer';
import { ChatbotWidget } from './components/ChatbotWidget';
import { InstallPWAPrompt } from './components/InstallPWAPrompt';

import { DashboardView } from './views/DashboardView';
import { NetworkView } from './views/NetworkView';
import { FinanceView } from './views/FinanceView';
import { RanksView } from './views/RanksView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';
import { AuthView } from './views/AuthView';
import { AdminView } from './views/AdminView';
import { AdminAuthView } from './views/AdminAuthView';
import { AccountSettingsModal } from './components/AccountSettingsModal';

const MainApp = () => {
  const { activeTab, isAuthenticated, isAdminMode, user } = useApp();
  const [isAdminPortalRoute, setIsAdminPortalRoute] = useState(false);

  // Détection discrète de l'accès au portail administrateur privé (?portal=admin, ?admin=1, #/admin)
  useEffect(() => {
    try {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const isPortal = search.includes('portal=admin') || search.includes('admin=1') || search.includes('admin=portal') || hash.includes('/admin') || hash.includes('#admin');
      if (isPortal) {
        setIsAdminPortalRoute(true);
      }
    } catch (e) {}
  }, []);

  const handleExitAdminPortal = () => {
    try {
      // Nettoyer l'URL en restant sur l'application publique
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
    setIsAdminPortalRoute(false);
  };

  // 1. ESPACE NON AUTHENTIFIÉ
  if (!isAuthenticated) {
    // Si l'accès provient de l'URL secrète d'administration, afficher le portail d'authentification Back-Office isolé
    if (isAdminPortalRoute) {
      return (
        <>
          <AdminAuthView onExitAdminPortal={handleExitAdminPortal} />
          <InstallPWAPrompt />
          <Toast />
        </>
      );
    }

    // Sinon, page d'accueil et connexion publique 100% dédiée aux MEMBRES (0 référence admin)
    return (
      <>
        <AuthView />
        <InstallPWAPrompt />
        <Toast />
      </>
    );
  }

  // 2. ESPACE AUTHENTIFIÉ : GESTION DES PROFILS STRICTEMENT SCINDÉS
  // Si l'utilisateur a le rôle ADMIN (ou a demandé la console admin)
  if (user.role === 'ADMIN' && (isAdminMode || isAdminPortalRoute || !activeTab)) {
    return (
      <>
        <AdminView />
        <InstallPWAPrompt />
        <Toast />
      </>
    );
  }

  // 3. ESPACE PUBLIC MEMBRES (UTILISATEURS STANDARDS)
  return (
    <div className="min-h-screen bg-[#101416] text-[#e0e3e6] flex flex-col font-sans max-w-md mx-auto relative border-x border-white/5 shadow-2xl">
      {/* Top Header public */}
      <Header />

      {/* Main Screen Body */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'network' && <NetworkView />}
        {activeTab === 'finance' && <FinanceView />}
        {activeTab === 'ranks' && <RanksView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Glassmorphic Bottom Bar */}
      <BottomNav />

      {/* Chatbot Assistant (Uniquement réservé aux membres connectés) */}
      <ChatbotWidget />

      {/* Mobile App Install Prompt */}
      <InstallPWAPrompt />

      {/* Modals & Overlays */}
      <ManualDepositModal />
      <WithdrawModal />
      <RankSuccessModal />
      <ShareReferralModal />
      <AccountSettingsModal />
      <InactivityTimer />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
