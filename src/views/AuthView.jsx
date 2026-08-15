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
  ClipboardPaste,
  Send,
  Zap,
} from 'lucide-react';

export const AuthView = () => {
  const { login, signup, sendOtp, sendForgotPasswordOtp, resetPassword, showToastNotification } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot_password'
  const [signupStep, setSignupStep] = useState(1); // 1: Info & Passwords, 2: OTP Verification
  const [forgotStep, setForgotStep] = useState(1); // 1: Identifier, 2: OTP & New Password
  
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
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupSponsor, setSignupSponsor] = useState('ILL-88392');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isPrefilledFromRef, setIsPrefilledFromRef] = useState(false);
  const [otpChannel, setOtpChannel] = useState('EMAIL'); // 'EMAIL' | 'SMS'
  
  // OTP Verification state (Signup)
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot Password Form fields
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotChannel, setForgotChannel] = useState('EMAIL'); // 'EMAIL' | 'SMS'

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

  // WebOTP API Integration (Mobile browsers automatic OTP detection)
  useEffect(() => {
    if (typeof window === 'undefined' || !('OTPCredential' in window)) return;
    if (signupStep !== 2 && forgotStep !== 2) return;

    const ac = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ['sms'] },
        signal: ac.signal,
      })
      .then((otp) => {
        if (otp && otp.code) {
          const clean = otp.code.trim();
          if (signupStep === 2) setOtpCode(clean);
          if (forgotStep === 2) setForgotOtp(clean);
          if (showToastNotification) {
            showToastNotification('Code de confirmation détecté automatiquement par WebOTP !', 'success');
          }
        }
      })
      .catch(() => {});

    return () => {
      ac.abort();
    };
  }, [signupStep, forgotStep, showToastNotification]);

  // 1-Click Clipboard Paste Helper
  const handlePasteClipboard = async (target) => {
    try {
      const text = await navigator.clipboard.readText();
      const match = text.match(/\b\d{6}\b/);
      if (match) {
        if (target === 'signup') setOtpCode(match[0]);
        if (target === 'forgot') setForgotOtp(match[0]);
        if (showToastNotification) {
          showToastNotification('Code collé depuis le presse-papier !', 'success');
        }
      } else {
        if (showToastNotification) {
          showToastNotification('Aucun code à 6 chiffres trouvé dans le presse-papier.', 'info');
        }
      }
    } catch (e) {
      if (showToastNotification) {
        showToastNotification('Accès presse-papier non autorisé.', 'error');
      }
    }
  };

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
    const res = await login(loginIdentifier.trim(), loginPassword);
    if (!res || !res.success) {
      setAuthError(res?.error || 'Identifiants ou mot de passe incorrects. Vérifiez votre email ou numéro.');
    }
    setIsSubmitting(false);
  };

  // 2. Handle Step 1 of Signup (Validation & Requesting OTP)
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

    if (!signupEmail.trim() && !signupPhone.trim()) {
      setAuthError('Veuillez renseigner une adresse email ou un numéro de téléphone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendOtp(signupPhone.trim(), signupEmail.trim().toLowerCase(), otpChannel);
      setSignupStep(2);
      setResendTimer(60); // 60 seconds cooldown
      setAuthSuccess(
        otpChannel === 'EMAIL'
          ? `Code de confirmation envoyé par Email à ${signupEmail.trim().toLowerCase()}`
          : `Code de confirmation envoyé par SMS au ${signupPhone.trim()}`
      );
      if (result.simulatedCode) {
        setOtpCode(result.simulatedCode);
      }
    } catch (err) {
      setAuthError(err.message || 'Impossible d\'envoyer le code de confirmation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Resend OTP (Signup)
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);
    try {
      const result = await sendOtp(signupPhone.trim(), signupEmail.trim().toLowerCase(), otpChannel);
      setResendTimer(60);
      setAuthSuccess(
        otpChannel === 'EMAIL'
          ? 'Un nouveau code de validation a été envoyé à votre adresse email.'
          : 'Un nouveau code de validation a été envoyé par SMS.'
      );
      if (result.simulatedCode) {
        setOtpCode(result.simulatedCode);
      }
    } catch (err) {
      setAuthError(err.message || 'Erreur lors du renvoi du code OTP.');
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
      setAuthError('Veuillez saisir le code à 6 chiffres reçu.');
      return;
    }

    setIsSubmitting(true);
    const res = await signup({
      name: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      phone: signupPhone.trim(),
      sponsorCode: signupSponsor.trim(),
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
      otpCode: otpCode.trim(),
      channel: otpChannel,
    });

    if (!res || !res.success) {
      setAuthError(res?.error || 'Code de confirmation invalide ou erreur lors de la création.');
    }
    setIsSubmitting(false);
  };

  // 5. Handle Forgot Password - Step 1: Send OTP
  const handleForgotStep1Submit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const rawId = (forgotIdentifier || forgotPhone || '').trim();
    if (!rawId || rawId.length < 4) {
      setAuthError('Veuillez entrer une adresse email ou un numéro de téléphone valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      const channel = rawId.includes('@') ? 'EMAIL' : 'SMS';
      setForgotChannel(channel);
      const res = await sendForgotPasswordOtp(rawId, channel);
      setForgotStep(2);
      setResendTimer(60);
      setAuthSuccess(
        channel === 'EMAIL'
          ? `Code de récupération envoyé par email à ${rawId}`
          : `Code de récupération envoyé par SMS au ${rawId}`
      );
      if (res.simulatedCode) {
        setForgotOtp(res.simulatedCode);
      }
    } catch (err) {
      setAuthError(err.message || 'Compte introuvable ou erreur d\'envoi.');
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
      const rawId = (forgotIdentifier || forgotPhone || '').trim();
      const res = await sendForgotPasswordOtp(rawId, forgotChannel);
      setResendTimer(60);
      setAuthSuccess('Nouveau code de récupération envoyé.');
      if (res.simulatedCode) {
        setForgotOtp(res.simulatedCode);
      }
    } catch (err) {
      setAuthError(err.message || 'Erreur lors du renvoi du code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Handle Forgot Password - Step 2: Reset Password
  const handleForgotStep2Submit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (forgotNewPassword.length < 8) {
      setAuthError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setAuthError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (!forgotOtp || forgotOtp.trim().length < 6) {
      setAuthError('Veuillez saisir le code de récupération à 6 chiffres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const rawId = (forgotIdentifier || forgotPhone || '').trim();
      await resetPassword({
        identifier: rawId,
        phone: rawId.includes('@') ? '' : rawId,
        email: rawId.includes('@') ? rawId : '',
        otpCode: forgotOtp.trim(),
        newPassword: forgotNewPassword,
        confirmNewPassword: forgotConfirmPassword,
      });

      setAuthSuccess('Mot de passe réinitialisé avec succès ! Connectez-vous avec vos nouveaux identifiants.');
      setLoginIdentifier(rawId);
      setLoginPassword(forgotNewPassword);
      setMode('login');
      setForgotStep(1);
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err) {
      setAuthError(err.message || 'Code de confirmation invalide ou expiré.');
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

            {/* Choix du canal de réception OTP */}
            <div className="pt-1">
              <label className="text-[11px] font-semibold text-[#d0c5af] block mb-1.5">
                Mode de réception du code de vérification :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOtpChannel('EMAIL')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                    otpChannel === 'EMAIL'
                      ? 'bg-[#F2CA50]/15 border-[#F2CA50] text-[#F2CA50] shadow-sm'
                      : 'bg-[#191c1e] border-white/10 text-[#99907c] hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email (Recommandé)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOtpChannel('SMS')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                    otpChannel === 'SMS'
                      ? 'bg-[#F2CA50]/15 border-[#F2CA50] text-[#F2CA50] shadow-sm'
                      : 'bg-[#191c1e] border-white/10 text-[#99907c] hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SMS Mobile</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isPasswordLongEnough || (isConfirmPasswordTouched && !doPasswordsMatch)}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all mt-3 disabled:opacity-40"
            >
              <span>
                {isSubmitting
                  ? 'Envoi en cours...'
                  : otpChannel === 'EMAIL'
                  ? 'Continuer (Recevoir Code par Email)'
                  : 'Continuer (Recevoir Code par SMS)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* MODE 2: INSCRIPTION — ÉTAPE 2 (VALIDATION OTP EMAIL & SMS) */}
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

            <div className="p-3.5 rounded-2xl bg-[#191c1e] border border-white/10 space-y-1.5 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#F2CA50]/10 flex items-center justify-center text-[#F2CA50] mb-1">
                {otpChannel === 'EMAIL' ? <Mail className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <p className="text-xs text-[#d0c5af]">
                Code de validation à 6 chiffres transmis par{' '}
                <strong className="text-white">{otpChannel === 'EMAIL' ? 'Email' : 'SMS'}</strong> à :
              </p>
              <p className="text-sm font-mono font-bold text-[#F2CA50]">
                {otpChannel === 'EMAIL' ? signupEmail : signupPhone}
              </p>

              {/* WebOTP Notification Banner */}
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-center space-x-1.5 text-[10px] text-[#10B981]">
                <Zap className="w-3 h-3 text-[#10B981]" />
                <span>Détection automatique WebOTP active sur navigateurs mobiles</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-semibold text-[#d0c5af]">
                  Saisissez le code à 6 chiffres :
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteClipboard('signup')}
                  className="text-[11px] font-bold text-[#F2CA50] hover:text-white flex items-center space-x-1 bg-[#191c1e] px-2 py-1 rounded-lg border border-white/10 active:scale-95 transition-all"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Coller le code</span>
                </button>
              </div>

              <div className="relative max-w-xs mx-auto">
                <input
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
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
                  <span>Renvoyer le code dans <strong className="text-[#F2CA50]">{resendTimer}s</strong></span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-[#F2CA50] hover:underline inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Renvoyer un nouveau code</span>
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
        {/* MODE 3: MOT DE PASSE OUBLIÉ — ÉTAPE 1 (EMAIL / TÉLÉPHONE)  */}
        {/* ========================================================= */}
        {mode === 'forgot_password' && forgotStep === 1 && (
          <form onSubmit={handleForgotStep1Submit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-3 rounded-2xl bg-[#191c1e] border border-white/10 text-xs text-[#d0c5af] space-y-1">
              <p className="font-semibold text-white">Récupération sécurisée par Code OTP</p>
              <p>Entrez l'adresse email ou le numéro de téléphone associé à votre compte Eco-Finance pour recevoir votre code de vérification.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
                Adresse Email ou Téléphone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#F2CA50] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="ex: alex@exemple.com ou +225 07 12 34 56 78"
                  required
                  autoFocus
                  className="w-full bg-[#191c1e] border border-[#F2CA50]/40 rounded-2xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || forgotIdentifier.trim().length < 4}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-40"
            >
              <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer le Code de Confirmation'}</span>
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
                <span>Changer d'identifiant</span>
              </button>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F2CA50]/15 text-[#F2CA50] border border-[#F2CA50]/30">
                Étape 2 / 2
              </span>
            </div>

            {/* OTP Code */}
            <div>
              <div className="flex justify-between items-center mb-1.5 px-1">
                <label className="text-xs font-semibold text-[#d0c5af]">
                  Code reçu à <span className="text-[#F2CA50] font-mono">{forgotIdentifier}</span> :
                </label>
                <button
                  type="button"
                  onClick={() => handlePasteClipboard('forgot')}
                  className="text-[11px] font-bold text-[#F2CA50] hover:text-white flex items-center space-x-1 bg-[#191c1e] px-2 py-1 rounded-lg border border-white/10 active:scale-95 transition-all"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Coller</span>
                </button>
              </div>
              <input
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                required
                className="w-full bg-[#141719] border-2 border-[#F2CA50] rounded-2xl py-2.5 text-center text-xl font-mono font-black tracking-widest text-[#F2CA50] outline-none shadow-inner focus:ring-2 focus:ring-[#F2CA50]/40"
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
                  <span>Renvoyer le code</span>
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
              disabled={isSubmitting || !isForgotPassLongEnough || !doForgotPassMatch || forgotOtp.length < 6}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all mt-3 disabled:opacity-40"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Mise à jour...' : 'Réinitialiser mon Mot de Passe'}</span>
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
