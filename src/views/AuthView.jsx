import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  LogIn,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Smartphone,
  Check,
  HelpCircle,
} from 'lucide-react';

export const AuthView = () => {
  const { login, signup, sendOtp, sendForgotPasswordOtp, resetPassword } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot_password'
  const [signupStep, setSignupStep] = useState(1); // 1: Info & Passwords, 2: OTP Phone Verification
  const [forgotStep, setForgotStep] = useState(1); // 1: Phone number, 2: OTP & New Password
  
  // Visibility toggles for passwords
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Login Form fields
  const [loginIdentifier, setLoginIdentifier] = useState('alex.kouassi@illuminati-mlm.com');
  const [loginPassword, setLoginPassword] = useState('Alex@2026Password');

  // Sign Up Form fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupSponsor, setSignupSponsor] = useState('ILL-88392');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isPrefilledFromRef, setIsPrefilledFromRef] = useState(false);
  
  // OTP Verification state (Signup)
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot Password Form fields
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  // Auto-detect referral code from URL parameter (?ref=CODE or ?sponsor=CODE)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref') || params.get('sponsor') || sessionStorage.getItem('eco_sponsor_ref');
      if (refCode && refCode.trim()) {
        const cleanRef = refCode.trim().toUpperCase();
        sessionStorage.setItem('eco_sponsor_ref', cleanRef);
        setSignupSponsor(cleanRef);
        setIsPrefilledFromRef(true);
        // Switch directly to signup mode so the invitee lands immediately on registration!
        setMode('signup');
        setSignupStep(1);
      }
    } catch (e) {}
  }, []);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Real-time password validation helpers (Signup)
  const isPasswordLongEnough = signupPassword.length >= 8;
  const doPasswordsMatch = signupPassword.length > 0 && signupPassword === signupConfirmPassword;
  const isConfirmPasswordTouched = signupConfirmPassword.length > 0;

  // Real-time password validation helpers (Forgot Password)
  const isForgotPassLongEnough = forgotNewPassword.length >= 8;
  const doForgotPassMatch = forgotNewPassword.length > 0 && forgotNewPassword === forgotConfirmPassword;
  const isForgotConfirmTouched = forgotConfirmPassword.length > 0;

  // 1. Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);
    const success = await login(loginIdentifier.trim(), loginPassword);
    if (!success) {
      setAuthError('Identifiants ou mot de passe incorrects. Vérifiez votre email ou numéro.');
    }
    setIsSubmitting(false);
  };

  // 2. Handle Step 1 of Signup (Validation & Requesting OTP SMS)
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (signupPassword.length < 8) {
      setAuthError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setAuthError('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    if (signupPhone.trim().length < 8) {
      setAuthError('Veuillez renseigner un numéro de téléphone valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendOtp(signupPhone.trim(), signupEmail.trim().toLowerCase());
      setSignupStep(2);
      setResendTimer(60); // 60 seconds cooldown
      setAuthSuccess(`Code SMS envoyé au ${signupPhone.trim()}`);
      if (result.simulatedCode) {
        setOtpCode(result.simulatedCode);
      }
    } catch (err) {
      setAuthError(err.message || 'Impossible d\'envoyer le code de validation SMS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Resend OTP SMS (Signup)
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);
    try {
      const result = await sendOtp(signupPhone.trim(), signupEmail.trim().toLowerCase());
      setResendTimer(60);
      setAuthSuccess('Un nouveau code de validation a été envoyé par SMS.');
      if (result.simulatedCode) {
        setOtpCode(result.simulatedCode);
      }
    } catch (err) {
      setAuthError(err.message || 'Erreur lors du renvoi du code SMS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Step 2 Final Signup (Verifying OTP & Account Creation)
  const handleStep2FinalSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!otpCode || otpCode.trim().length < 6) {
      setAuthError('Veuillez saisir le code à 6 chiffres reçu par SMS.');
      return;
    }

    setIsSubmitting(true);
    const success = await signup({
      name: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      phone: signupPhone.trim(),
      sponsorCode: signupSponsor.trim(),
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
      otpCode: otpCode.trim(),
    });

    if (!success) {
      setAuthError('Code de confirmation SMS invalide ou erreur lors de la création.');
    }
    setIsSubmitting(false);
  };

  // 5. Handle Forgot Password - Step 1: Send OTP
  const handleForgotStep1Submit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (forgotPhone.trim().length < 8) {
      setAuthError('Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendForgotPasswordOtp(forgotPhone.trim());
      setForgotStep(2);
      setResendTimer(60);
      setAuthSuccess(`Code de récupération envoyé au ${forgotPhone.trim()}`);
      if (res.simulatedCode) {
        setForgotOtp(res.simulatedCode);
      }
    } catch (err) {
      setAuthError(err.message || 'Numéro introuvable ou erreur d\'envoi SMS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Handle Forgot Password - Resend OTP
  const handleForgotResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);
    try {
      const res = await sendForgotPasswordOtp(forgotPhone.trim());
      setResendTimer(60);
      setAuthSuccess('Nouveau code de récupération envoyé par SMS.');
      if (res.simulatedCode) {
        setForgotOtp(res.simulatedCode);
      }
    } catch (err) {
      setAuthError(err.message || 'Erreur lors du renvoi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Handle Forgot Password - Step 2: Reset Password
  const handleForgotStep2Submit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!forgotOtp || forgotOtp.trim().length < 6) {
      setAuthError('Veuillez entrer le code à 6 chiffres reçu par SMS.');
      return;
    }

    if (forgotNewPassword.length < 8) {
      setAuthError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setAuthError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        phone: forgotPhone.trim(),
        otpCode: forgotOtp.trim(),
        newPassword: forgotNewPassword,
        confirmNewPassword: forgotConfirmPassword,
      });

      // Switch back to Login and fill identifier
      setMode('login');
      setLoginIdentifier(forgotPhone.trim());
      setLoginPassword('');
      setAuthSuccess('Mot de passe réinitialisé ! Vous pouvez maintenant vous connecter.');
    } catch (err) {
      setAuthError(err.message || 'Code invalide ou échec de réinitialisation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101416] text-[#e0e3e6] flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#F2CA50]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#B8860B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="pt-6 pb-2 text-center space-y-2.5 z-10">
        <div className="w-14 h-14 mx-auto rounded-2xl gold-gradient-bg p-[2px] shadow-2xl animate-in zoom-in duration-500">
          <div className="w-full h-full bg-[#101416] rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#F2CA50]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight gold-gradient-text">
            ECO-FINANCE
          </h1>
          <p className="text-xs text-[#d0c5af] font-medium">
            Plateforme Financière Privée & Réseau MLM Sécurisé
          </p>
        </div>

        {/* Tab Switcher (Connexion / Inscription) - Hidden in Forgot Password Mode */}
        {mode !== 'forgot_password' ? (
          <div className="flex bg-[#191c1e] p-1 rounded-2xl border border-white/10 max-w-xs mx-auto mt-3">
            <button
              onClick={() => {
                setMode('login');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'login'
                  ? 'gold-gradient-bg text-black shadow-lg'
                  : 'text-[#99907c] hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>

            <button
              onClick={() => {
                setMode('signup');
                setSignupStep(1);
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                mode === 'signup'
                  ? 'gold-gradient-bg text-black shadow-lg'
                  : 'text-[#99907c] hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Inscription</span>
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30 inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Récupération de Compte par SMS</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Form Body */}
      <div className="z-10 my-auto py-2">
        {/* Error Alert */}
        {authError && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{authError}</span>
          </div>
        )}

        {/* Success Alert */}
        {authSuccess && (
          <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 1: CONNEXION                                         */}
        {/* ========================================================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
                Email ou Numéro de Téléphone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="ex: alex.kouassi@illuminati-mlm.com ou +225 07..."
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-[#F2CA50] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#d0c5af]">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_password');
                    setForgotStep(1);
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="text-[11px] text-[#F2CA50] hover:underline font-semibold"
                >
                  Oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3.5" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-2xl pl-10 pr-10 py-3 text-xs text-white outline-none focus:border-[#F2CA50] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-3.5 text-[#99907c] hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all mt-5 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Connexion en cours...' : 'Se Connecter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Accounts */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <p className="text-[11px] text-center text-[#99907c]">Comptes de test pré-configurés :</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('alex.kouassi@illuminati-mlm.com');
                    setLoginPassword('Alex@2026Password');
                  }}
                  className="flex-1 py-2 px-3 bg-[#191c1e] hover:bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#F2CA50] flex items-center justify-center space-x-1"
                >
                  <User className="w-3 h-3" />
                  <span>Membre Alex</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier('admin@illuminati-mlm.com');
                    setLoginPassword('Admin@Illuminati2026');
                  }}
                  className="flex-1 py-2 px-3 bg-[#191c1e] hover:bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#E63946] flex items-center justify-center space-x-1"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Admin Général</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* MODE 2: INSCRIPTION — ÉTAPE 1 (INFOS & DOUBLE MOT DE PASSE) */}
        {/* ========================================================= */}
        {mode === 'signup' && signupStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px] font-bold text-[#F2CA50] uppercase tracking-wider">
                Étape 1 sur 2 : Informations
              </span>
              <span className="text-[10px] text-[#99907c]">SMS OTP à l'étape suivante</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">Nom complet</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#99907c] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="ex: Jean-Baptiste Kouamé"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">Adresse Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#99907c] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="jean@gmail.com"
                    required
                    className="w-full bg-[#191c1e] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#d0c5af] mb-1">N° Téléphone Mobile</label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 text-[#F2CA50] absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+225 07 00 11 22 33"
                    required
                    className="w-full bg-[#191c1e] border border-[#F2CA50]/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-[#d0c5af]">
                  Code de Parrainage (Parrain)
                </label>
                {isPrefilledFromRef && (
                  <span className="text-[10px] text-[#10B981] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    <span>Lien d'invitation appliqué</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={signupSponsor}
                  onChange={(e) => {
                    setSignupSponsor(e.target.value);
                    setIsPrefilledFromRef(false);
                  }}
                  placeholder="ex: ILL-88392"
                  required
                  className={`w-full bg-[#191c1e] border rounded-xl px-3.5 py-2.5 text-xs text-[#F2CA50] font-mono font-bold uppercase outline-none transition-colors ${
                    isPrefilledFromRef
                      ? 'border-[#10B981]/50 bg-[#10B981]/5 text-[#F2CA50]'
                      : 'border-white/10 focus:border-[#F2CA50]'
                  }`}
                />
                {isPrefilledFromRef && (
                  <span className="absolute right-3 top-2.5 text-[10px] text-[#10B981] font-bold bg-[#10B981]/15 px-2 py-0.5 rounded-md border border-[#10B981]/30">
                    Parrain Validé
                  </span>
                )}
              </div>
              {isPrefilledFromRef && (
                <p className="text-[10px] text-[#10B981] mt-1 flex items-center gap-1">
                  <span>✨ Vous rejoignez le réseau officiel via l'invitation de votre parrain.</span>
                </p>
              )}
            </div>

            {/* Mot de passe 1 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-[#d0c5af]">Mot de passe</label>
                <span className={`text-[10px] ${isPasswordLongEnough ? 'text-emerald-400 font-semibold' : 'text-[#99907c]'}`}>
                  {isPasswordLongEnough ? '✓ 8+ caractères' : 'Min. 8 caractères'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#99907c] absolute left-3.5 top-3" />
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3.5 top-3 text-[#99907c] hover:text-white"
                >
                  {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Mot de passe 2 : Confirmation */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-[#d0c5af]">Confirmer le mot de passe</label>
                {isConfirmPasswordTouched && (
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                    doPasswordsMatch ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {doPasswordsMatch ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Identique</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span>Non conforme</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-[#99907c] absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full bg-[#191c1e] border rounded-xl pl-9 pr-10 py-2.5 text-xs text-white outline-none transition-colors ${
                    isConfirmPasswordTouched
                      ? doPasswordsMatch
                        ? 'border-emerald-500/60 focus:border-emerald-400'
                        : 'border-red-500/60 focus:border-red-400'
                      : 'border-white/10 focus:border-[#F2CA50]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-[#99907c] hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isPasswordLongEnough || (isConfirmPasswordTouched && !doPasswordsMatch)}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all mt-3 disabled:opacity-40"
            >
              <span>{isSubmitting ? 'Génération du SMS...' : 'Continuer (Recevoir Code SMS)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* MODE 2: INSCRIPTION — ÉTAPE 2 (VALIDATION OTP PAR SMS)     */}
        {/* ========================================================= */}
        {mode === 'signup' && signupStep === 2 && (
          <form onSubmit={handleStep2FinalSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <button
                type="button"
                onClick={() => {
                  setSignupStep(1);
                  setAuthError('');
                }}
                className="text-xs text-[#d0c5af] hover:text-[#F2CA50] flex items-center space-x-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Modifier les infos</span>
              </button>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30">
                Étape 2 / 2
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#191c1e] border border-white/10 space-y-1 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#F2CA50]/10 flex items-center justify-center text-[#F2CA50] mb-1">
                <Smartphone className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#d0c5af]">
                Code de validation à 6 chiffres transmis par SMS à :
              </p>
              <p className="text-sm font-mono font-bold text-[#F2CA50]">
                {signupPhone}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-center text-[#d0c5af] mb-2">
                Saisissez le code SMS reçu :
              </label>
              <div className="relative max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  required
                  className="w-full bg-[#141719] border-2 border-[#F2CA50] rounded-2xl py-3 text-center text-2xl font-mono font-black tracking-widest text-[#F2CA50] outline-none shadow-inner focus:ring-2 focus:ring-[#F2CA50]/40"
                />
              </div>
            </div>

            <div className="text-center pt-1">
              {resendTimer > 0 ? (
                <p className="text-xs text-[#99907c] flex items-center justify-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Renvoyer le code SMS dans <strong className="text-[#F2CA50]">{resendTimer}s</strong></span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-[#F2CA50] hover:underline inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Renvoyer un nouveau code SMS</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpCode.length < 6}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all mt-4 disabled:opacity-40"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Vérification en cours...' : 'Valider & Créer mon Compte'}</span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* MODE 3: MOT DE PASSE OUBLIÉ — ÉTAPE 1 (SAISIE TÉLÉPHONE)   */}
        {/* ========================================================= */}
        {mode === 'forgot_password' && forgotStep === 1 && (
          <form onSubmit={handleForgotStep1Submit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-3 rounded-2xl bg-[#191c1e] border border-white/10 text-xs text-[#d0c5af] space-y-1">
              <p className="font-semibold text-white">Récupération sécurisée par SMS</p>
              <p>Entrez le numéro de téléphone associé à votre compte Eco-Finance pour recevoir un code OTP de réinitialisation.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
                Numéro de Téléphone
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-[#F2CA50] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  placeholder="ex: +225 07 12 34 56 78"
                  required
                  autoFocus
                  className="w-full bg-[#191c1e] border border-[#F2CA50]/40 rounded-2xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || forgotPhone.trim().length < 8}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-40"
            >
              <span>{isSubmitting ? 'Envoi du SMS...' : 'Envoyer le Code SMS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError('');
                setAuthSuccess('');
              }}
              className="w-full py-2 text-xs text-[#99907c] hover:text-white flex items-center justify-center space-x-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la connexion</span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* MODE 3: MOT DE PASSE OUBLIÉ — ÉTAPE 2 (OTP & NOUVEAU MDP) */}
        {/* ========================================================= */}
        {mode === 'forgot_password' && forgotStep === 2 && (
          <form onSubmit={handleForgotStep2Submit} className="space-y-3.5 animate-in fade-in slide-in-from-right-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <button
                type="button"
                onClick={() => {
                  setForgotStep(1);
                  setAuthError('');
                }}
                className="text-xs text-[#d0c5af] hover:text-[#F2CA50] flex items-center space-x-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Changer de numéro</span>
              </button>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30">
                Étape 2 / 2
              </span>
            </div>

            {/* OTP Code */}
            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5 text-center">
                Code de récupération reçu au <span className="text-[#F2CA50] font-mono">{forgotPhone}</span> :
              </label>
              <input
                type="text"
                maxLength={6}
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                required
                className="w-full bg-[#141719] border-2 border-[#F2CA50] rounded-2xl py-2.5 text-center text-xl font-mono font-black tracking-widest text-[#F2CA50] outline-none"
              />
            </div>

            {/* Resend OTP */}
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-[11px] text-[#99907c]">
                  Renvoyer dans <strong className="text-[#F2CA50]">{resendTimer}s</strong>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotResendOtp}
                  disabled={isSubmitting}
                  className="text-[11px] font-bold text-[#F2CA50] hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Renvoyer le code SMS</span>
                </button>
              )}
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-[#d0c5af]">Nouveau mot de passe</label>
                <span className={`text-[10px] ${isForgotPassLongEnough ? 'text-emerald-400 font-semibold' : 'text-[#99907c]'}`}>
                  {isForgotPassLongEnough ? '✓ 8+ caractères' : 'Min. 8 car.'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#99907c] absolute left-3.5 top-3" />
                <input
                  type={showForgotNewPassword ? 'text' : 'password'}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-xl pl-9 pr-10 py-2 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                  className="absolute right-3.5 top-3 text-[#99907c] hover:text-white"
                >
                  {showForgotNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirmer nouveau mot de passe */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-semibold text-[#d0c5af]">Confirmer le mot de passe</label>
                {isForgotConfirmTouched && (
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                    doForgotPassMatch ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {doForgotPassMatch ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Identique</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span>Non conforme</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-[#99907c] absolute left-3.5 top-3" />
                <input
                  type={showForgotConfirmPassword ? 'text' : 'password'}
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full bg-[#191c1e] border rounded-xl pl-9 pr-10 py-2 text-xs text-white outline-none transition-colors ${
                    isForgotConfirmTouched
                      ? doForgotPassMatch
                        ? 'border-emerald-500/60 focus:border-emerald-400'
                        : 'border-red-500/60 focus:border-red-400'
                      : 'border-white/10 focus:border-[#F2CA50]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                  className="absolute right-3.5 top-3 text-[#99907c] hover:text-white"
                >
                  {showForgotConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || forgotOtp.length < 6 || !isForgotPassLongEnough || (isForgotConfirmTouched && !doForgotPassMatch)}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all mt-3 disabled:opacity-40"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Mise à jour...' : 'Sauvegarder & Se Connecter'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Footer Security Notice */}
      <div className="py-3 text-center z-10 border-t border-white/5 space-y-1">
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#99907c]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Vérification SMS & Chiffrement Bcrypt • Écosystème Sécurisé</span>
        </div>
        <p className="text-[10px] text-[#99907c]">© 2026 Eco-Finance Platform</p>
      </div>
    </div>
  );
};
