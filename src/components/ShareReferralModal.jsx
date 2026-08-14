import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Smartphone,
  Sparkles,
  Link,
} from 'lucide-react';

export const ShareReferralModal = () => {
  const { showShareModal, setShowShareModal, user, showToastNotification } = useApp();
  const [copied, setCopied] = useState(false);

  if (!showShareModal) return null;

  const referralCode = user?.myReferralCode || 'ILL-88392';
  const referralUrl = `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`;
  const shareTitle = 'Invitation Eco-Finance';
  const shareText = `Rejoins-moi sur Eco-Finance pour faire fructifier tes investissements et toucher des commissions de réseau MLM ! Inscris-toi directement avec mon code parrain ${referralCode} via ce lien : ${referralUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    showToastNotification('Lien de parrainage copié dans le presse-papier !', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: referralUrl,
        });
        showToastNotification('Lien partagé avec succès !', 'success');
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(`Rejoins-moi sur Eco-Finance ! Code parrain : ${referralCode}`)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleShareSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;
    window.open(smsUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#191c1e] border-t sm:border border-[#F2CA50]/40 rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Partager mon Lien de Parrainage</h3>
              <p className="text-[11px] text-[#99907c]">Invitez vos proches en un clic</p>
            </div>
          </div>
          <button
            onClick={() => setShowShareModal(false)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#99907c] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sponsor Code Card */}
        <div className="p-3.5 rounded-2xl bg-[#101416] border border-[#F2CA50]/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold">
              Votre Code Parrain Officiel
            </span>
            <span className="text-[10px] font-bold text-[#F2CA50] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>3% Direct + Commissions Réseau</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-[#191c1e] p-2.5 rounded-xl border border-white/10">
            <span className="font-mono font-black text-[#F2CA50] text-base tracking-wider">
              {referralCode}
            </span>
            <span className="text-[11px] text-[#10B981] font-bold bg-[#10B981]/15 px-2 py-0.5 rounded-md">
              Actif & Validé
            </span>
          </div>
          <p className="text-[11px] text-[#d0c5af]">
            💡 <em>L'invité qui clique sur votre lien verra votre code automatiquement pré-rempli sur son formulaire d'inscription.</em>
          </p>
        </div>

        {/* Social Share Grid */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#99907c] block px-1">
            Partager directement via :
          </span>

          <div className="grid grid-cols-3 gap-2.5">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex flex-col items-center justify-center space-y-1.5 transition-all group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleShareTelegram}
              className="p-3 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 flex flex-col items-center justify-center space-y-1.5 transition-all group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">Telegram</span>
            </button>

            {/* SMS */}
            <button
              onClick={handleShareSMS}
              className="p-3 rounded-2xl bg-[#F2CA50]/10 hover:bg-[#F2CA50]/20 border border-[#F2CA50]/30 flex flex-col items-center justify-center space-y-1.5 transition-all group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#F2CA50] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">SMS</span>
            </button>
          </div>
        </div>

        {/* Copy Direct Link Box */}
        <div className="p-3 rounded-2xl bg-[#101416] border border-white/10 space-y-2">
          <div className="flex items-center space-x-2 text-[11px] text-[#99907c]">
            <Link className="w-3.5 h-3.5 text-[#F2CA50]" />
            <span>Lien direct complet :</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="flex-1 bg-[#191c1e] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#d0c5af] outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-all ${
                copied
                  ? 'bg-[#10B981] text-white'
                  : 'gold-gradient-bg text-black hover:brightness-110 shadow-md'
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

        {/* Native Mobile Share button */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={handleNativeShare}
            className="w-full py-3 rounded-2xl bg-[#272a2d] hover:bg-[#323538] border border-white/10 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-98"
          >
            <Share2 className="w-4 h-4 text-[#F2CA50]" />
            <span>Plus d'options de partage (Messenger, etc.)</span>
          </button>
        )}
      </div>
    </div>
  );
};
