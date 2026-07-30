import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, Wallet, Award, History } from 'lucide-react';

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Bord', icon: LayoutDashboard },
    { id: 'network', label: 'Réseau', icon: Users },
    { id: 'finance', label: 'Finance', icon: Wallet },
    { id: 'ranks', label: 'Grades', icon: Award },
    { id: 'history', label: 'Historique', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav h-[72px] px-2 flex items-center justify-around">
      <div className="max-w-md w-full mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#F2CA50] scale-105 font-bold'
                  : 'text-[#99907c] hover:text-[#d0c5af]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#F2CA50]/15 shadow-[0_0_12px_rgba(242,202,80,0.3)]' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#F2CA50]' : 'text-[#99907c]'}`} />
              </div>
              <span className="text-[11px] mt-0.5 font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
