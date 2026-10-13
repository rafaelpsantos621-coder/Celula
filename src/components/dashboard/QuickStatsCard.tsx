import React, { memo, useMemo } from 'react';
import { Users, Share2, ChevronRight, ShieldCheck } from 'lucide-react';

interface QuickStatsCardProps {
  memberCount?: number;
  onShare?: () => void;
  onViewMembers?: () => void;
}

export const QuickStatsCard = memo(function QuickStatsCard({
  memberCount = 1,
  onShare,
  onViewMembers,
}: QuickStatsCardProps) {
  const memberLabel = useMemo(() => {
    return `${memberCount} ${memberCount === 1 ? 'Membro' : 'Membros'}`;
  }, [memberCount]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 sm:gap-6 items-center px-5 sm:px-8 transition-all justify-between">
        <button
          type="button"
          onClick={onViewMembers}
          className="flex items-center gap-4 sm:gap-6 min-w-0 text-left cursor-pointer group flex-1"
          title="Clique para ver a lista de membros reais da célula"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 dark:bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="text-primary" size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
                Família da Célula
              </p>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full">
                <ShieldCheck size={10} /> Real
              </span>
            </div>
            <p className="font-display text-xl sm:text-2xl text-slate-900 dark:text-white mt-0.5 sm:mt-1 truncate flex items-center gap-1.5">
              <span>{memberLabel}</span>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition-colors inline sm:hidden" />
            </p>
            <p className="text-[11px] text-primary hidden sm:flex items-center gap-1 font-semibold mt-0.5 group-hover:underline">
              Ver lista de membros <ChevronRight size={12} />
            </p>
          </div>
        </button>

        {onShare && (
          <button
            onClick={onShare}
            className="py-2.5 sm:py-3 px-3.5 sm:px-4 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
            title="Convidar mais pessoas para a célula"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Convidar</span>
            <span className="sm:hidden">Link</span>
          </button>
        )}
      </div>
    </div>
  );
});

