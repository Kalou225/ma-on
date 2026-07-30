import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, ShieldCheck, ShieldAlert, Sparkles, User, Check, X, Smartphone } from 'lucide-react';

export const Header = () => {
  const { user, isAdminMode, setIsAdminMode, notifications, markNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 glass-header px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo & Rank */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl gold-gradient-bg p-[1px] flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-[#101416] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#F2CA50]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight gold-gradient-text">MA-ON</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#272a2d] text-[#d0c5af] gold-border">
                {user.rank}
              </span>
            </div>
            <p className="text-xs text-[#99907c] truncate max-w-[140px]">{user.name}</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Admin Toggle Simulator Button */}
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isAdminMode
                ? 'bg-[#E63946] text-white animate-pulse shadow-lg'
                : 'bg-[#1d2022] hover:bg-[#272a2d] text-[#F2CA50] border border-[#d4af37]/30'
            }`}
            title="Bculer en Mode Administrateur pour valider les dépôts"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isAdminMode ? 'Mode Admin' : 'Admin Test'}</span>
          </button>

          {/* Account Status Badge */}
          <div
            className={`flex items-center space-x-1 text-[11px] font-medium px-2 py-1 rounded-full border ${
              user.status === 'ACTIF'
                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                : 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/30'
            }`}
          >
            {user.status === 'ACTIF' ? (
              <>
                <ShieldCheck className="w-3 h-3" />
                <span>Actif</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3 h-3" />
                <span>Inactif</span>
              </>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markNotificationsRead();
              }}
              className="p-2 rounded-xl bg-[#1d2022] hover:bg-[#272a2d] text-[#e0e3e6] transition-colors relative border border-white/5"
            >
              <Bell className="w-4 h-4 text-[#d0c5af]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E63946] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#1d2022] border border-[#d4af37]/30 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <h4 className="text-xs font-bold text-[#e0e3e6]">Notifications</h4>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#99907c] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#99907c] py-4 text-center">Aucune notification</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl text-xs border ${
                          n.type === 'success'
                            ? 'bg-[#10B981]/5 border-[#10B981]/20 text-[#e0e3e6]'
                            : n.type === 'warning'
                            ? 'bg-[#F2CA50]/5 border-[#F2CA50]/20 text-[#e0e3e6]'
                            : 'bg-[#191c1e] border-white/5 text-[#e0e3e6]'
                        }`}
                      >
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-[#d0c5af] mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-[#99907c] block mt-1">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
