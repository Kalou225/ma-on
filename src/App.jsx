import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { ManualDepositModal } from './components/ManualDepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { AdminDrawer } from './components/AdminDrawer';
import { RankSuccessModal } from './components/RankSuccessModal';

import { DashboardView } from './views/DashboardView';
import { NetworkView } from './views/NetworkView';
import { FinanceView } from './views/FinanceView';
import { RanksView } from './views/RanksView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';

const MainApp = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-[#101416] text-[#e0e3e6] flex flex-col font-sans max-w-md mx-auto relative border-x border-white/5 shadow-2xl">
      {/* Top Header */}
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

      {/* Modals & Overlays */}
      <ManualDepositModal />
      <WithdrawModal />
      <AdminDrawer />
      <RankSuccessModal />
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
