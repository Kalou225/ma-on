import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Shield,
  Smartphone,
  Key,
  Mail,
  Check,
  Camera,
  Copy,
  Share2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
  Layers,
  Award,
  DollarSign,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import { compressProfileImage } from '../utils/imageHelper';

export const AccountSettingsModal = () => {
  const {
    user,
    showSettingsModal,
    setShowSettingsModal,
    settingsTab,
    setSettingsTab,
    updateProfile,
    changePassword,
    updateAvatar,
    setShowShareModal,
    showToastNotification,
  } = useApp();

  const activeTab = settingsTab || 'profile';
  const setActiveTab = setSettingsTab;
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State: Profile & Payment
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultProvider, setDefaultProvider] = useState('Orange Money');
  const [defaultNumber, setDefaultNumber] = useState('');
  const [defaultHolder, setDefaultHolder] = useState('');
  const [preferredChannel, setPreferredChannel] = useState('EMAIL');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form State: Security & Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Sync state when modal opens or user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDefaultProvider(user.defaultPaymentProvider || 'Orange Money');
      setDefaultNumber(user.defaultPaymentNumber || user.phone || '');
      setDefaultHolder(user.defaultPaymentHolder || user.name || '');
      setPreferredChannel(user.preferredOtpChannel || 'EMAIL');
    }
  }, [user, showSettingsModal]);

  if (!showSettingsModal) return null;

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    await updateProfile({
      name,
      phone,
      defaultPaymentProvider: defaultProvider,
      defaultPaymentNumber: defaultNumber,
      defaultPaymentHolder: defaultHolder,
      preferredOtpChannel: preferredChannel,
    });
    setIsSavingProfile(false);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 8) {
      setPassError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPassError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setIsSavingPass(true);
    const success = await changePassword({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });

    if (success) {
      setPassSuccess('Mot de passe mis à jour avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
    setIsSavingPass(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#141719] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#191c1e]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F2CA50]/15 flex items-center justify-center text-[#F2CA50] border border-[#F2CA50]/30 shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Paramètres du Compte</h2>
              <p className="text-xs text-[#99907c]">Informations personnelles, réseau & sécurité</p>
            </div>
          </div>

          <button
            onClick={() => setShowSettingsModal(false)}
            className="p-2 rounded-xl text-[#99907c] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#101416] px-3 pt-2 overflow-x-auto space-x-1 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'bg-[#F2CA50] text-black shadow-md'
                : 'text-[#99907c] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Identité</span>
          </button>

          <button
            onClick={() => setActiveTab('mlm')}
            className={`px-3 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeTab === 'mlm'
                ? 'bg-[#F2CA50] text-black shadow-md'
                : 'text-[#99907c] hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Réseau & Rang</span>
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeTab === 'payment'
                ? 'bg-[#F2CA50] text-black shadow-md'
                : 'text-[#99907c] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Money</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
              activeTab === 'security'
                ? 'bg-[#F2CA50] text-black shadow-md'
                : 'text-[#99907c] hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sécurité & Mot de Passe</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* ========================================================= */}
          {/* TAB 1: IDENTITÉ & INFORMATIONS PERSONNELLES               */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in">
              {/* Photo Avatar Card */}
              <div className="p-4 rounded-2xl bg-[#191c1e] border border-white/5 flex items-center space-x-4">
                <div className="relative w-16 h-16 shrink-0">
                  <div className="w-full h-full rounded-2xl gold-gradient-bg p-[2px] shadow-lg overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-[14px] bg-[#101416]"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#101416] rounded-[14px] flex items-center justify-center">
                        <User className="w-8 h-8 text-[#F2CA50]" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F2CA50] text-black flex items-center justify-center shadow-lg hover:scale-110 border-2 border-[#141719]"
                    title="Changer la photo"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{user.name || 'Membre'}</h3>
                  <p className="text-xs text-[#99907c]">ID : <span className="font-mono text-white">{user.id}</span></p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-[#F2CA50] hover:underline inline-flex items-center space-x-1"
                  >
                    <span>{isUploading ? 'Téléchargement...' : 'Télécharger une photo'}</span>
                  </button>
                </div>
              </div>

              {/* Nom & Prénom */}
              <div>
                <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
                  Nom Complet & Prénom
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#191c1e] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-[#F2CA50]"
                  />
                </div>
              </div>

              {/* Adresse Email (Lecture Seule avec Badge) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#d0c5af]">Adresse Email Principale</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Vérifiée par OTP</span>
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full bg-[#101416] border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-xs text-[#99907c] cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Numéro de Téléphone */}
              <div>
                <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
                  Numéro de Téléphone Mobile
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-[#191c1e] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white font-mono outline-none focus:border-[#F2CA50]"
                  />
                </div>
              </div>

              {/* Date d'inscription */}
              <div className="p-3 rounded-2xl bg-[#191c1e] border border-white/5 flex items-center justify-between text-xs text-[#99907c]">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#F2CA50]" />
                  <span>Date d'adhésion :</span>
                </div>
                <span className="font-mono text-white">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Actif'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Enregistrement...' : 'Enregistrer les Modifications'}</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: RÉSEAU MLM & STATUT DU COMPTE                      */}
          {/* ========================================================= */}
          {activeTab === 'mlm' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Rank & Status Summary Card */}
              <div className="p-4 rounded-2xl bg-[#191c1e] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#99907c] uppercase font-semibold">Grade Réseau</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30">
                    👑 {user.rank || 'Apprenti'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <span className="text-xs text-[#99907c] uppercase font-semibold">Statut Financier</span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      user.status === 'ACTIF'
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                        : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30'
                    }`}
                  >
                    {user.status === 'ACTIF' ? '● COMPTE ACTIF' : '○ EN ATTENTE D\'ACTIVATION'}
                  </span>
                </div>
              </div>

              {/* Referral Code Box */}
              <div className="p-4 rounded-2xl bg-[#191c1e] border border-[#F2CA50]/30 space-y-2">
                <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold block">
                  Mon Code de Parrainage Officiel
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-black text-[#F2CA50]">
                    {user.myReferralCode || 'ALEX-9912'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#F2CA50] text-black text-xs font-bold flex items-center space-x-1 shadow-md hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Partager</span>
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-xl bg-[#272a2d] text-white text-xs font-bold flex items-center space-x-1 border border-white/10 hover:bg-[#323538] active:scale-95 transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sponsor & Network Statistics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-[#191c1e] border border-white/5 space-y-1">
                  <span className="text-[10px] text-[#99907c] uppercase font-semibold block">
                    Parrain Référent
                  </span>
                  <p className="text-sm font-mono font-bold text-white">
                    {user.sponsorCode || 'ILL-88392'}
                  </p>
                  <span className="text-[10px] text-[#10B981]">Lien Sponsor Validé</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#191c1e] border border-white/5 space-y-1">
                  <span className="text-[10px] text-[#99907c] uppercase font-semibold block">
                    Filleuls Directs
                  </span>
                  <p className="text-sm font-mono font-bold text-[#F2CA50]">
                    {user.directReferralsCount || user.activeDirectReferrals || 0} membres
                  </p>
                  <span className="text-[10px] text-[#d0c5af]">Niveau 1 Réseau</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#191c1e] border border-white/5 space-y-1">
                  <span className="text-[10px] text-[#99907c] uppercase font-semibold block">
                    Gains Réseau Cumulés
                  </span>
                  <p className="text-sm font-mono font-bold text-[#10B981]">
                    {(user.networkEarnings || 0).toLocaleString()} F
                  </p>
                  <span className="text-[10px] text-[#99907c]">Commissions perçues</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#191c1e] border border-white/5 space-y-1">
                  <span className="text-[10px] text-[#99907c] uppercase font-semibold block">
                    Volume d'Équipe
                  </span>
                  <p className="text-sm font-mono font-bold text-white">
                    {(user.teamVolume || 0).toLocaleString()} F
                  </p>
                  <span className="text-[10px] text-[#99907c]">Total groupe</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: COORDONNÉES DE RETRAIT MOBILE MONEY                */}
          {/* ========================================================= */}
          {activeTab === 'payment' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-2xl bg-[#191c1e] border border-white/10 text-xs text-[#d0c5af] space-y-1">
                <p className="font-semibold text-white">Coordonnées de Retrait Par Défaut</p>
                <p>Enregistrez vos informations Mobile Money pour pré-remplir automatiquement vos demandes de retraits de commissions.</p>
              </div>

              {/* Opérateur de paiement */}
              <div>
                <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
                  Opérateur Mobile Money Favori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Orange Money', icon: '🟠' },
                    { name: 'Wave', icon: '🌊' },
                    { name: 'MTN MoMo', icon: '🟡' },
                    { name: 'Moov Money', icon: '🟢' },
                  ].map((op) => (
                    <button
                      key={op.name}
                      type="button"
                      onClick={() => setDefaultProvider(op.name)}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                        defaultProvider === op.name
                          ? 'bg-[#F2CA50]/15 border-[#F2CA50] text-[#F2CA50] shadow-sm'
                          : 'bg-[#191c1e] border-white/10 text-[#99907c] hover:text-white'
                      }`}
                    >
                      <span>{op.icon}</span>
                      <span>{op.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Numéro de réception Mobile Money */}
              <div>
                <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
                  Numéro Mobile Money pour les Retraits
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#F2CA50] absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={defaultNumber}
                    onChange={(e) => setDefaultNumber(e.target.value)}
                    placeholder="ex: +225 07 12 34 56 78"
                    required
                    className="w-full bg-[#191c1e] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white font-mono outline-none focus:border-[#F2CA50]"
                  />
                </div>
              </div>

              {/* Nom du titulaire */}
              <div>
                <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
                  Nom Complet du Titulaire de la Ligne
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={defaultHolder}
                    onChange={(e) => setDefaultHolder(e.target.value)}
                    placeholder="ex: KOUASSI ALEXANDRE"
                    required
                    className="w-full bg-[#191c1e] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white uppercase outline-none focus:border-[#F2CA50]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Enregistrement...' : 'Enregistrer mes Coordonnées de Retrait'}</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 4: SÉCURITÉ & MOT DE PASSE                            */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Canal de confirmation OTP */}
              <div className="p-4 rounded-2xl bg-[#191c1e] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-white block">
                  Canal de Confirmation OTP Préféré
                </span>
                <p className="text-[11px] text-[#99907c]">
                  Choisissez par quel moyen prioritaire recevoir vos codes de vérification pour les actions sensibles :
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setPreferredChannel('EMAIL');
                      await updateProfile({ preferredOtpChannel: 'EMAIL' });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                      preferredChannel === 'EMAIL'
                        ? 'bg-[#F2CA50]/15 border-[#F2CA50] text-[#F2CA50] shadow-sm'
                        : 'bg-[#101416] border-white/5 text-[#99907c] hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email (Recommandé)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setPreferredChannel('SMS');
                      await updateProfile({ preferredOtpChannel: 'SMS' });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                      preferredChannel === 'SMS'
                        ? 'bg-[#F2CA50]/15 border-[#F2CA50] text-[#F2CA50] shadow-sm'
                        : 'bg-[#101416] border-white/5 text-[#99907c] hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>SMS Mobile</span>
                  </button>
                </div>
              </div>

              {/* Formulaire de Changement de Mot de Passe */}
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3 p-4 rounded-2xl bg-[#191c1e] border border-white/10">
                <span className="text-xs font-bold text-white block">
                  Modifier mon Mot de Passe
                </span>

                {passError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}

                {passSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                {/* Mot de passe actuel */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-[#99907c] absolute left-3 top-3" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#101416] border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-3 text-[#99907c] hover:text-white"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">
                    Nouveau mot de passe (min. 8 caractères)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#99907c] absolute left-3 top-3" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#101416] border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-[#99907c] hover:text-white"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmer nouveau mot de passe */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-[#99907c] absolute left-3 top-3" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#101416] border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-3 text-[#99907c] hover:text-white"
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingPass || newPassword.length < 8 || newPassword !== confirmNewPassword}
                  className="w-full py-3 rounded-xl gold-gradient-bg text-black font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md hover:brightness-110 active:scale-98 transition-all mt-2 disabled:opacity-40"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSavingPass ? 'Mise à jour...' : 'Mettre à Jour mon Mot de Passe'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
