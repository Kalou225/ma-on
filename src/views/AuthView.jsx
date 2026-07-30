import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Lock, Mail, Phone, User, Eye, EyeOff, ArrowRight, ShieldCheck, UserPlus, LogIn, ShieldAlert } from 'lucide-react';

export const AuthView = () => {
  const { login, signup } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form fields
  const [loginIdentifier, setLoginIdentifier] = useState('alex.kouassi@illuminati-mlm.com');
  const [loginPassword, setLoginPassword] = useState('Alex@2026Password');

  // Sign Up Form fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupSponsor, setSignupSponsor] = useState('ILL-88392');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(loginIdentifier, loginPassword);
    setIsSubmitting(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await signup({
      name: signupName,
      email: signupEmail,
      phone: signupPhone,
      sponsorCode: signupSponsor,
      password: signupPassword,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#101416] text-[#e0e3e6] flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#F2CA50]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#B8860B]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="pt-8 pb-4 text-center space-y-3 z-10">
        <div className="w-16 h-16 mx-auto rounded-3xl gold-gradient-bg p-[2px] shadow-2xl animate-in zoom-in duration-500">
          <div className="w-full h-full bg-[#101416] rounded-[22px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#F2CA50]" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight gold-gradient-text">
            ECO-FINANCE
          </h1>
          <p className="text-xs text-[#d0c5af] mt-1 font-medium">
            Plateforme Financière & Gestion MLM Eco-Finance
          </p>
        </div>

        {/* Tab Switcher (Connexion / Inscription) */}
        <div className="flex bg-[#191c1e] p-1 rounded-2xl border border-white/10 max-w-xs mx-auto mt-4">
          <button
            onClick={() => setMode('login')}
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
            onClick={() => setMode('signup')}
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
      </div>

      {/* Main Form Body */}
      <div className="z-10 my-auto py-4">
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
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
                  placeholder="ex: alex.kouassi@illuminati-mlm.com"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#d0c5af]">Mot de passe</label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] text-[#F2CA50] hover:underline">
                  Oublié ?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-2xl pl-10 pr-10 py-3 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#99907c] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all mt-6 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Connexion...' : 'Se Connecter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Logins */}
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
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1">Nom complet</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="ex: Jean-Baptiste Kouamé"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1">Adresse Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="ex: jean.kouame@gmail.com"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1">Numéro de Téléphone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="ex: +225 07 00 11 22 33"
                  required
                  className="w-full bg-[#191c1e] border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1">
                Code de Parrainage (Parrain)
              </label>
              <input
                type="text"
                value={signupSponsor}
                onChange={(e) => setSignupSponsor(e.target.value)}
                placeholder="ex: ILL-88392"
                required
                className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F2CA50] font-mono uppercase outline-none focus:border-[#F2CA50]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d0c5af] mb-1">Mot de passe</label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#191c1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#F2CA50]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl gold-gradient-bg text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all mt-4 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Inscription...' : 'Créer mon Compte Membre'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Footer Security Notice */}
      <div className="py-4 text-center z-10 border-t border-white/5 space-y-1">
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#99907c]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Plateforme Sécurisée • Dépôts Manuels Mobile Money</span>
        </div>
        <p className="text-[10px] text-[#99907c]">© 2026 Eco-Finance Ecosystem</p>
      </div>
    </div>
  );
};
