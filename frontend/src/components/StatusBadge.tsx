import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'ACTIVE' | 'EXPIRED' | 'TAMPERED' | 'VERIFIED' | 'FAILED' | 'PENDING';
  isTampered?: boolean;
  isExpired?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isTampered, isExpired }) => {
  if (isTampered || status === 'TAMPERED' || status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/70 border border-red-500/50 text-red-300">
        <XCircle className="w-3.5 h-3.5 text-red-400" />
        Integrity Failed
      </span>
    );
  }

  if (isExpired || status === 'EXPIRED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-600/50 text-slate-400">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        Expired
      </span>
    );
  }

  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-500/50 text-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Verified
      </span>
    );
  }

  // Active / Pending verification
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-300">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      Pending Verification
    </span>
  );
};
