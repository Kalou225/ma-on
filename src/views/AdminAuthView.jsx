import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AdminAuthView = ({ onExitAdminPortal }) => {
  const { login } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      const success = await login(identifier.trim(), password);
      if (!success) {
        setAuthError('Identifiants d\'administration invalides ou accès non autorisé.');
      }
    } catch (err) {
      setAuthError(err.message || 'Erreur lors de la connexion administrative.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1012] text-[#e0e3e6] flex flex-col justify-center px-4 py-8 max-w-md mx-auto relative font-sans">
      {/* Background Red / Gold Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#E63946]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-[#F2CA50]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Security Badge */}
      <div className="z-10 text-center space-y-3 mb-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-[#E63946]/20 border-2 border-[#E63946]/50 flex items-center justify-center shadow-2xl">
          <Shield className="w-8 h-8 text-[#E63946]" />
        </div>

        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E63946]/15 border border-[#E63946]/40 text-[#E63946] text-[10px] font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3 h-3" />
            <span>Portail Administrateur Isolé</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            ECO-FINANCE BACK-OFFICE
          </h1>
          <p className="text-xs text-[#99907c] mt-1">
            Console de supervision et gestion centrale sécurisée
          </p>
        </div>
      </div>

      {/* Security Warning Notice */}
      <div className="z-10 mb-4 p-3.5 rounded-2xl bg-[#191c1e] border border-[#E63946]/30 text-xs space-y-1">
        <div className="flex items-center space-x-2 text-[#E63946] font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>Accès Hautement Restreint</span>
        </div>
        <p className="text-[11px] text-[#d0c5af]">
          Cet espace est strictement réservé à la direction générale. Toutes les connexions et adresses IP sont auditées et journalisées en continu.
        </p>
      </div>

      {/* Form Container */}
      <div className="z-10 bg-[#141719] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        {authError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
              Identifiant Administrateur (Email ou Téléphone)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#E63946] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@illuminati-mlm.com"
                required
                autoFocus
                className="w-full bg-[#1c1f22] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-[#E63946]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#d0c5af] mb-1.5">
              Clé d'Accès Sécurisée (Mot de passe)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#E63946] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#1c1f22] border border-white/10 rounded-2xl pl-10 pr-10 py-3 text-xs text-white outline-none focus:border-[#E63946]"
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
            className="w-full py-3.5 rounded-2xl bg-[#E63946] text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authentification en cours...' : 'Accéder au Back-Office'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Return to Public Member Space */}
      <div className="z-10 text-center mt-6">
        <button
          onClick={onExitAdminPortal}
          className="text-xs text-[#99907c] hover:text-[#F2CA50] flex items-center justify-center space-x-1.5 mx-auto font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retourner à l'Espace Public Membres</span>
        </button>
      </div>
    </div>
  );
};
