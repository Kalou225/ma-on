import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, ShieldCheck, ShieldAlert, Sparkles, User, X, Smartphone, LogOut } from 'lucide-react';

export const Header = () => {
  const { user, isAdminMode, setIsAdminMode, notifications, markNotificationsRead, logout } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 glass-header px-4 py-3 border-b border-white/5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo & User Profile */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full gold-gradient-bg p-[2px] flex items-center justify-center shadow-lg relative overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover rounded-full bg-[#101416]"
              />
            ) : (
              <div className="w-full h-full bg-[#101416] rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#F2CA50]" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight gold-gradient-text">Eco-Finance</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#272a2d] text-[#d0c5af] gold-border">
                {user.rank}
              </span>
            </div>
            <p className="text-xs text-[#99907c] truncate max-w-[130px]">{user.name}</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Admin Switcher Button (uniquement si rôle ADMIN) */}
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setIsAdminMode(true)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#E63946] text-white flex items-center space-x-1 hover:brightness-110 shadow-md"
              title="Basculer vers la Console d'Administration"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* Account Status Badge */}
          <div
            className={`flex items-center space-x-1 text-[11px] font-medium px-2 py-1 rounded-full border ${
              user.status === 'ACTIF'
                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                : 'bg-[#F2CA50]/15 text-[#F2CA50] border-[#F2CA50]/40'
            }`}
          >
            {user.status === 'ACTIF' ? (
              <>
                <ShieldCheck className="w-3 h-3" />
                <span>Actif</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3 h-3 text-[#F2CA50]" />
                <span className="text-[#F2CA50] font-bold">Inactif</span>
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

          {/* Quick Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-[#E63946]/10 hover:bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/30 transition-all"
            title="Se Déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
