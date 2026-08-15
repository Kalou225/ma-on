import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Shield,
  Smartphone,
  Key,
  LogOut,
  Check,
  Copy,
  ChevronRight,
  Camera,
  Upload,
  Mail,
  Share2,
  Settings,
  Sliders,
  ShieldCheck,
  Award,
} from 'lucide-react';

import { compressProfileImage } from '../utils/imageHelper';

export const ProfileView = () => {
  const {
    user,
    isAdminMode,
    setIsAdminMode,
    showToastNotification,
    logout,
    updateAvatar,
    setShowShareModal,
    openSettings,
  } = useApp();
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.myReferralCode || 'ALEX-9912');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressedBase64 = await compressProfileImage(file, 400, 400, 0.85);
      await updateAvatar(compressedBase64);
    } catch (err) {
      showToastNotification(err.message || 'Erreur lors du traitement de la photo.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      {/* Screen Title Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#F2CA50]" />
            <span>Paramètres & Profil</span>
          </h1>
          <p className="text-xs text-[#99907c]">Gérez vos informations, sécurité et coordonnées de retrait</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30">
          Espace Membre
        </span>
      </div>

      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Card with Photo Upload */}
      <div className="p-5 rounded-3xl glass-card border border-[#d4af37]/30 text-center space-y-3 relative overflow-hidden shadow-xl">
        <div className="relative w-24 h-24 mx-auto group">
          <div className="w-full h-full rounded-full gold-gradient-bg p-[2px] shadow-2xl overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover rounded-full bg-[#101416]"
              />
            ) : (
              <div className="w-full h-full bg-[#101416] rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-[#F2CA50]" />
              </div>
            )}
          </div>

          {/* Upload overlay badge */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#F2CA50] text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-[#101416]"
            title="Changer ma photo de profil"
          >
            {isUploading ? (
              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">{user.name || 'Membre Eco-Finance'}</h2>
          <p className="text-xs text-[#d0c5af]">{user.email}</p>
          <p className="text-xs font-mono text-[#99907c] mt-0.5">{user.phone}</p>
        </div>

        <div className="flex items-center justify-center space-x-2 pt-1">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/40">
            Grade {user.rank || 'Apprenti'}
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              user.status === 'ACTIF'
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/40'
            }`}
          >
            Compte {user.status || 'INACTIF'}
          </span>
        </div>

        <div className="pt-2">
          <button
            onClick={() => openSettings('profile')}
            className="w-full py-2.5 rounded-2xl bg-[#272a2d] hover:bg-[#323538] text-[#F2CA50] font-bold text-xs flex items-center justify-center space-x-2 border border-[#d4af37]/30 transition-all shadow-md active:scale-98"
          >
            <Settings className="w-4 h-4" />
            <span>Ouvrir les Paramètres du Compte</span>
          </button>
        </div>
      </div>

      {/* Referral Code Info Box */}
      <div className="p-4 rounded-3xl bg-[#1d2022] border border-white/5 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold">
            Mon Code de Parrainage
          </span>
          <p className="text-base font-mono font-bold text-[#F2CA50] mt-0.5">
            {user.myReferralCode || 'ALEX-9912'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#F2CA50] text-black hover:brightness-110 flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Partager</span>
          </button>
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
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Official Support Email Banner */}
      <div className="p-4 rounded-3xl bg-[#191c1e] border border-[#F2CA50]/30 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 text-[#F2CA50]">
            <Mail className="w-4 h-4" />
            <h3 className="text-xs font-bold">Support Client Officiel</h3>
          </div>
          <p className="text-[11px] text-[#d0c5af]">
            Envoyez-nous vos requêtes directement par email :
          </p>
          <a
            href="mailto:ecoilluminati@gmail.com"
            className="text-xs font-mono font-bold text-[#F2CA50] hover:underline block pt-0.5"
          >
            ecoilluminati@gmail.com
          </a>
        </div>
        <a
          href="mailto:ecoilluminati@gmail.com"
          className="px-3 py-2 rounded-xl text-xs font-bold bg-[#F2CA50] text-black hover:brightness-110 shrink-0"
        >
          Écrire
        </a>
      </div>

      {/* Account Settings List & Logout */}
      <div className="p-4 rounded-3xl bg-[#1d2022] border border-white/5 space-y-1 text-xs">
        <div
          onClick={() => openSettings('profile')}
          className="p-3 rounded-2xl hover:bg-[#272a2d] flex items-center justify-between text-white cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <User className="w-4 h-4 text-[#F2CA50]" />
            <span>Modifier mes informations personnelles</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#99907c]" />
        </div>

        <div
          onClick={() => openSettings('mlm')}
          className="p-3 rounded-2xl hover:bg-[#272a2d] flex items-center justify-between text-white cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Award className="w-4 h-4 text-[#F2CA50]" />
            <span>Détails de mon réseau MLM & Parrainage</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#99907c]" />
        </div>

        <div
          onClick={() => openSettings('payment')}
          className="p-3 rounded-2xl hover:bg-[#272a2d] flex items-center justify-between text-white cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Smartphone className="w-4 h-4 text-[#F2CA50]" />
            <span>Mes Numéros de Retrait Mobile Money</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#99907c]" />
        </div>

        <div
          onClick={() => openSettings('security')}
          className="p-3 rounded-2xl hover:bg-[#272a2d] flex items-center justify-between text-white cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Key className="w-4 h-4 text-[#F2CA50]" />
            <span>Sécurité, Mot de Passe & Préférences OTP</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#99907c]" />
        </div>

        {/* Highlighted Logout Button */}
        <div
          onClick={logout}
          className="p-3.5 rounded-2xl bg-[#E63946]/10 hover:bg-[#E63946]/20 border border-[#E63946]/30 flex items-center justify-between text-[#E63946] cursor-pointer transition-all mt-3 font-bold"
        >
          <div className="flex items-center space-x-3">
            <LogOut className="w-4 h-4 text-[#E63946]" />
            <span>Se Déconnecter de mon compte</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#E63946]" />
        </div>
      </div>
    </div>
  );
};
