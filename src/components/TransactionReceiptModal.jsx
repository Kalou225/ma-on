import React from 'react';
import { useApp } from '../context/AppContext';
import { X, FileText, Image as ImageIcon, Share2, Check, ShieldCheck, Clock, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { downloadTransactionReceiptPDF, downloadTransactionReceiptJPEG } from '../utils/receiptGenerator';

export const TransactionReceiptModal = () => {
  const { selectedReceiptTxn, setSelectedReceiptTxn, showReceiptModal, setShowReceiptModal, user, showToastNotification } = useApp();

  if (!showReceiptModal || !selectedReceiptTxn) return null;

  const txn = selectedReceiptTxn;
  const isDeposit = (txn.type || '').includes('DEPOT');
  const isWithdrawal = (txn.type || '').includes('RETRAIT');
  const isCommission = (txn.type || '').includes('COMMISSION');
  const isUpgrade = (txn.type || '').includes('UPGRADE');

  const handleShare = async () => {
    const shareText = `Reçu de Transaction Ma-On Éco-Finance\n` +
      `• ID : ${txn.id || 'N/A'}\n` +
      `• Montant : ${Number(txn.amount || 0).toLocaleString()} FCFA\n` +
      `• Type : ${txn.label || txn.type}\n` +
      `• Statut : ${txn.status}\n` +
      `• Date : ${txn.dateTime || txn.date_time || ''}\n` +
      `• Réf : ${txn.txnId || txn.txn_id || 'N/A'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reçu ${txn.id} - Ma-On Éco-Finance`,
          text: shareText,
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(shareText);
      showToastNotification('Détails du reçu copiés dans le presse-papier !', 'success');
    }
  };

  const handleDownloadPDF = () => {
    try {
      downloadTransactionReceiptPDF(txn, user);
      showToastNotification('Reçu PDF généré avec succès !', 'success');
    } catch (err) {
      showToastNotification('Erreur lors de la génération du PDF', 'error');
    }
  };

  const handleDownloadJPEG = () => {
    try {
      downloadTransactionReceiptJPEG(txn, user);
      showToastNotification('Reçu JPEG généré avec succès !', 'success');
    } catch (err) {
      showToastNotification('Erreur lors de la génération du JPEG', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1d2022] border border-[#d4af37]/40 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gold-gradient-bg/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40">
              <FileText className="w-4 h-4 text-[#F2CA50]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e0e3e6]">Reçu de Transaction</h3>
              <p className="text-[10px] text-[#99907c]">Preuve de paiement officielle</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowReceiptModal(false);
              if (setSelectedReceiptTxn) setSelectedReceiptTxn(null);
            }}
            className="p-1.5 rounded-full bg-[#272a2d] hover:bg-[#323538] text-[#99907c] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Printable Card */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          <div className="p-4 rounded-2xl bg-[#101416] border border-white/10 space-y-3 relative overflow-hidden shadow-inner">
            {/* Top Brand & Status */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#F2CA50] font-extrabold block">
                  MA-ON ÉCO-FINANCE
                </span>
                <span className="text-[10px] font-mono text-[#99907c] block mt-0.5">
                  Ref: {txn.id || 'N/A'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  txn.status === 'VALIDÉ'
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    : txn.status === 'EN_ATTENTE'
                    ? 'bg-[#F2CA50]/15 text-[#F2CA50] border-[#F2CA50]/30'
                    : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30'
                }`}
              >
                {txn.status === 'VALIDÉ' ? '✓ VALIDÉ' : txn.status === 'EN_ATTENTE' ? '⏳ EN ATTENTE' : '✕ REJETÉ'}
              </span>
            </div>

            {/* Amount Box */}
            <div className="text-center py-2 bg-[#191c1e] rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[10px] text-[#99907c] uppercase tracking-wider font-semibold block">
                Montant Net
              </span>
              <p className="text-2xl font-black font-mono text-[#F2CA50] tracking-tight">
                {Number(txn.amount || 0).toLocaleString()} <span className="text-xs font-sans text-[#d0c5af]">FCFA</span>
              </p>
            </div>

            {/* Receipt Key-Value Rows */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between items-center text-[#99907c]">
                <span>Type d'opération :</span>
                <strong className="text-white text-right truncate max-w-[170px]">{txn.label || txn.type}</strong>
              </div>

              <div className="flex justify-between items-center text-[#99907c]">
                <span>Date & Heure :</span>
                <span className="font-mono text-white text-[11px]">{txn.dateTime || txn.date_time || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center text-[#99907c]">
                <span>Opérateur / Moyen :</span>
                <span className="font-bold text-[#F2CA50]">{txn.provider || 'Solde Interne'}</span>
              </div>

              {(txn.txnId || txn.txn_id) && (
                <div className="flex justify-between items-center text-[#99907c]">
                  <span>Réf. Transaction :</span>
                  <span className="font-mono font-bold text-white uppercase text-[11px]">{txn.txnId || txn.txn_id}</span>
                </div>
              )}

              {(txn.senderNumber || txn.sender_number) && (
                <div className="flex justify-between items-center text-[#99907c]">
                  <span>Numéro Expéditeur :</span>
                  <span className="font-mono text-white text-[11px]">{txn.senderNumber || txn.sender_number}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#99907c]">
                <span>Titulaire / Bénéficiaire :</span>
                <span className="text-white font-semibold">{user.name || 'Membre'}</span>
              </div>

              {txn.note && (
                <div className="pt-2 border-t border-white/5 text-[10px] text-[#99907c] italic">
                  Note : {txn.note}
                </div>
              )}
            </div>

            {/* Digital Stamp Certificate */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-[#99907c]">
              <div className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Certification Cryptographique</span>
              </div>
              <span className="font-mono text-[#F2CA50]">MA-ON-SECURE</span>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="py-2.5 px-3 rounded-xl gold-gradient-bg text-black font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJPEG}
                className="py-2.5 px-3 rounded-xl bg-[#272a2d] hover:bg-[#323538] text-white font-bold text-xs flex items-center justify-center space-x-1.5 border border-white/10 active:scale-95 transition-all"
              >
                <ImageIcon className="w-4 h-4 text-[#F2CA50]" />
                <span>Export JPEG</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="w-full py-2.5 rounded-xl bg-[#191c1e] hover:bg-[#222629] text-[#d0c5af] font-semibold text-xs flex items-center justify-center space-x-1.5 border border-white/10 active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-[#F2CA50]" />
              <span>Partager le Reçu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
