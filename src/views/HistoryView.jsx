import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History, Search, Download, FileSpreadsheet, FileText, Image as ImageIcon, ReceiptText, ChevronRight } from 'lucide-react';
import { downloadHistoryStatementPDF, downloadHistoryStatementJPEG } from '../utils/receiptGenerator';

export const HistoryView = () => {
  const { transactions, user, openTransactionReceipt, showToastNotification } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      (t.label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.txnId && t.txnId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      filterType === 'ALL'
        ? true
        : filterType === 'DEPOT'
        ? (t.type || '').includes('DEPOT')
        : filterType === 'RETRAIT'
        ? (t.type || '').includes('RETRAIT')
        : filterType === 'COMMISSION'
        ? (t.type || '').includes('COMMISSION')
        : true;

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'VALIDÉ'
        ? t.status === 'VALIDÉ'
        : statusFilter === 'EN_ATTENTE'
        ? t.status === 'EN_ATTENTE'
        : statusFilter === 'REJETÉ'
        ? t.status === 'REJETÉ'
        : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getFilterLabel = () => {
    const typeLabel = filterType === 'ALL' ? 'Toutes' : filterType;
    const statusLabel = statusFilter === 'ALL' ? 'Tous statuts' : statusFilter;
    return `${typeLabel} (${statusLabel})`;
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) return;
    try {
      downloadHistoryStatementPDF(filtered, user, getFilterLabel());
      showToastNotification('Relevé PDF généré avec succès !', 'success');
    } catch (e) {
      showToastNotification('Erreur lors de la génération du PDF', 'error');
    }
  };

  const handleExportJPEG = () => {
    if (filtered.length === 0) return;
    try {
      downloadHistoryStatementJPEG(filtered, user, getFilterLabel());
      showToastNotification('Relevé JPEG généré avec succès !', 'success');
    } catch (e) {
      showToastNotification('Erreur lors de la génération du JPEG', 'error');
    }
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      <div className="p-4 rounded-3xl glass-card border border-[#d4af37]/30 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40">
              <History className="w-4 h-4 text-[#F2CA50]" />
            </div>
            <div>
              <h2 className="font-bold text-[#e0e3e6] text-sm">Journal & Historique</h2>
              <p className="text-[10px] text-[#99907c]">Reçus et relevés certifiés</p>
            </div>
          </div>

          {/* Export Buttons Group (PDF & JPEG) */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleExportPDF}
              disabled={filtered.length === 0}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#F2CA50] text-black hover:brightness-110 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
              title="Exporter le relevé officiel au format PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={handleExportJPEG}
              disabled={filtered.length === 0}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#272a2d] hover:bg-[#323538] text-[#F2CA50] border border-[#d4af37]/30 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
              title="Exporter le relevé au format Image JPEG"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Export JPEG</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#99907c] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par ID, référence ou libellé..."
            className="w-full bg-[#101416] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#F2CA50]"
          />
        </div>

        {/* Filter Pills (Types) */}
        <div className="flex space-x-1.5 text-[11px] overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'DEPOT', label: 'Dépôts' },
            { id: 'RETRAIT', label: 'Retraits' },
            { id: 'COMMISSION', label: 'Commissions' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'gold-gradient-bg text-black shadow-md'
                  : 'bg-[#191c1e] text-[#99907c] hover:text-white border border-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="flex space-x-1.5 text-[10px]">
          {[
            { id: 'ALL', label: 'Tous Statuts' },
            { id: 'VALIDÉ', label: 'Validés' },
            { id: 'EN_ATTENTE', label: 'En Attente' },
            { id: 'REJETÉ', label: 'Rejetés' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                statusFilter === s.id
                  ? 'bg-white/20 text-white'
                  : 'bg-[#101416] text-[#99907c] hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#99907c] bg-[#1d2022] rounded-2xl text-xs flex flex-col items-center space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-[#99907c]/50" />
            <p>Aucun enregistrement correspondant à vos critères.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => openTransactionReceipt(item)}
              className="p-3.5 rounded-2xl bg-[#1d2022] hover:bg-[#23272a] border border-white/5 hover:border-[#d4af37]/40 flex items-center justify-between transition-all cursor-pointer group shadow-sm"
            >
              <div className="space-y-0.5 max-w-[65%]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white group-hover:text-[#F2CA50] transition-colors truncate">
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono text-[#99907c] px-1.5 py-0.2 rounded bg-black/40">
                    {item.id}
                  </span>
                </div>
                <p className="text-[11px] text-[#d0c5af] truncate">
                  {item.dateTime || item.date_time} {item.provider ? `• ${item.provider}` : ''} {item.txnId || item.txn_id ? `(Ref: ${item.txnId || item.txn_id})` : ''}
                </p>
                {item.senderNumber && (
                  <p className="text-[10px] text-[#99907c]">Expéditeur : {item.senderNumber}</p>
                )}
                {item.note && <p className="text-[10px] text-[#99907c] italic truncate">{item.note}</p>}
              </div>

              <div className="text-right shrink-0 space-y-1">
                <span className="text-xs font-mono font-bold text-white block">
                  +{Number(item.amount || 0).toLocaleString()} FCFA
                </span>
                
                <div className="flex items-center justify-end space-x-1.5">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      item.status === 'VALIDÉ'
                        ? 'bg-[#10B981]/15 text-[#10B981]'
                        : item.status === 'EN_ATTENTE'
                        ? 'bg-[#F2CA50]/15 text-[#F2CA50]'
                        : 'bg-[#E63946]/15 text-[#E63946]'
                    }`}
                  >
                    {item.status}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTransactionReceipt(item);
                    }}
                    className="p-1 rounded-lg bg-[#272a2d] hover:bg-[#F2CA50] hover:text-black text-[#99907c] transition-all"
                    title="Voir et télécharger le reçu"
                  >
                    <ReceiptText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

