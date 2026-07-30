import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History, Filter, Search, Calendar } from 'lucide-react';

export const HistoryView = () => {
  const { transactions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.txnId && t.txnId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'DEPOT') return matchesSearch && t.type.includes('DEPOT');
    if (filterType === 'RETRAIT') return matchesSearch && t.type.includes('RETRAIT');
    if (filterType === 'COMMISSION') return matchesSearch && t.type.includes('COMMISSION');
    return matchesSearch;
  });

  return (
    <div className="space-y-4 pb-6 animate-in fade-in">
      <div className="p-4 rounded-3xl glass-card border border-[#d4af37]/30 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-[#F2CA50]/20 flex items-center justify-center border border-[#F2CA50]/40">
            <History className="w-4 h-4 text-[#F2CA50]" />
          </div>
          <h2 className="font-bold text-[#e0e3e6] text-sm">Journal & Historique des Activités</h2>
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

        {/* Filter Pills */}
        <div className="flex space-x-1.5 text-[11px] overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'DEPOT', label: 'Dépôts Manuels' },
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
      </div>

      {/* History Items List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#99907c] bg-[#1d2022] rounded-2xl text-xs">
            Aucun enregistrement correspondant.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-[#1d2022] border border-white/5 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{item.label}</span>
                  <span className="text-[10px] font-mono text-[#99907c]">{item.id}</span>
                </div>
                <p className="text-[11px] text-[#d0c5af]">
                  {item.dateTime} • {item.provider ? `${item.provider}` : ''} {item.txnId ? `(Ref: ${item.txnId})` : ''}
                </p>
                {item.senderNumber && (
                  <p className="text-[10px] text-[#99907c]">Expéditeur : {item.senderNumber}</p>
                )}
                {item.note && <p className="text-[10px] text-[#99907c] italic">{item.note}</p>}
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-white block">
                  +{item.amount.toLocaleString()} FCFA
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded inline-block mt-1 ${
                    item.status === 'VALIDÉ'
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : item.status === 'EN_ATTENTE'
                      ? 'bg-[#F2CA50]/15 text-[#F2CA50]'
                      : 'bg-[#E63946]/15 text-[#E63946]'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
