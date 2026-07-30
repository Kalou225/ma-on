import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />,
    error: <XCircle className="w-5 h-5 text-[#E63946]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F2CA50]" />,
    info: <Info className="w-5 h-5 text-[#F2CA50]" />,
  };

  const bgStyles = {
    success: 'bg-[#191c1e] border-[#10B981]/50 text-white',
    error: 'bg-[#191c1e] border-[#E63946]/50 text-white',
    warning: 'bg-[#191c1e] border-[#F2CA50]/50 text-white',
    info: 'bg-[#191c1e] border-[#F2CA50]/50 text-white',
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4 animate-in slide-in-from-top-4 duration-300">
      <div
        className={`p-3.5 rounded-2xl border shadow-2xl flex items-center space-x-3 backdrop-blur-xl ${
          bgStyles[toast.type] || bgStyles.info
        }`}
      >
        {icons[toast.type] || icons.info}
        <p className="text-xs font-medium tracking-tight leading-snug">{toast.message}</p>
      </div>
    </div>
  );
};
