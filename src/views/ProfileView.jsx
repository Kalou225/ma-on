import React from 'react';
import { useApp } from '../context/AppContext';
import { User, Shield, Smartphone, Key, Share2, LogOut, Check, Copy, ChevronRight } from 'lucide-react';

export const ProfileView = () => {
  const { user, isAdminMode, setIsAdminMode, showToastNotification } = useApp();
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.myReferralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      {/* Profile Card */}
      <div className="p-5 rounded-3xl glass-card border border-[#d4af37]/30 text-center space-y-3 relative overflow-hidden shadow-xl">
        <div className="w-20 h-20 mx-auto rounded-3xl gold-gradient-bg p-[2px] shadow-2xl">
          <div className="w-full h-full bg-[#101416] rounded-[22px] flex items-center justify-center">
            <User className="w-9 h-9 text-[#F2CA50]" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">{user.name}</h2>
          <p className="text-xs text-[#d0c5af]">{user.email}</p>
          <p className="text-xs font-mono text-[#99907c] mt-0.5">{user.phone}</p>
        </div>

        <div className="flex items-center justify-center space-x-2 pt-1">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/40">
            Grade {user.rank}
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              user.status === 'ACTIF'
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/40'
            }`}
          >
            Compte {user.status}
          </span>
        </div>
      </div>

      {/* Referral Code Info Box */}
      <div className="p-4 rounded-3xl bg-[#1d2022] border border-white/5 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold">
            Mon Code de Parrainage
          </span>
          <p className="text-base font-mono font-bold text-[#F2CA50] mt-0.5">
            {user.myReferralCode}
          </p>
        </div>
        <button
          onClick={handleCopyCode}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
            copied
              ? 'bg-[#10B981] text-white'
              : 'bg-[#272a2d] text-[#F2CA50] border border-[#d4af37]/30 hover:bg-[#323538]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copié</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier Code</span>
            </>
          )}
        </button>
      </div>

      {/* Admin Test Mode Banner Toggle */}
      <div className="p-4 rounded-3xl bg-[#E63946]/10 border border-[#E63946]/30 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 text-[#E63946]">
            <Shield className="w-4 h-4" />
            <h3 className="text-xs font-bold">Simulateur Mode Administration</h3>
          </div>
          <p className="text-[11px] text-[#d0c5af]">
            Permet de valider ou rejeter vos dépôts manuels en direct pour le test.
          </p>
        </div>
        <button
          onClick={() => setIsAdminMode(!isAdminMode)}
          className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
            isAdminMode
              ? 'bg-[#E63946] text-white animate-pulse'
              : 'bg-[#1d2022] text-[#F2CA50] border border-[#d4af37]/30'
          }`}
        >
          {isAdminMode ? 'Mode Admin Actif' : 'Activer Admin'}
        </button>
      </div>

      {/* Account Settings List */}
      <div className="p-4 rounded-3xl bg-[#1d2022] border border-white/5 space-y-1 text-xs">
        <div
          onClick={() => showToastNotification('Modifications du profil enregistrées')}
          className="p-3 rounded-2xl hover:bg-[#272a2d] flex items-center justify-between text-white cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <User className="w-4 h-4 text-[#F2CA50]" />
            <span>Modifier mes informations personnelles</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#99907c]" />
        </div>

        <div
          onClick={() => showToastNotification('Authentification 2FA configurée')}
          className="p-3 rounded-2xl hover:bg-[#272a2d] flex items-center justify-between text-white cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Key className="w-4 h-4 text-[#F2CA50]" />
            <span>Sécurité & Mot de passe</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#99907c]" />
        </div>

        <div
          onClick={() => showToastNotification('Coordonnées Mobile Money enregistrées')}
          className="p-3 rounded-2xl hover:bg-[#272a2d] flex items-center justify-between text-white cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Smartphone className="w-4 h-4 text-[#F2CA50]" />
            <span>Mes Numéros de Retrait Par Défaut</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#99907c]" />
        </div>
      </div>
    </div>
  );
};
