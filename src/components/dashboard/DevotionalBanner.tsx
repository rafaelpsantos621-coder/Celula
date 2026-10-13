import React, { memo } from 'react';
import { Book, ArrowRight, WifiOff, CheckCircle2 } from 'lucide-react';
import { Devotional } from '../../services/aiService';

interface DevotionalBannerProps {
  devotional: Devotional;
  onOpenModal: () => void;
  isOffline?: boolean;
}

export const DevotionalBanner = memo(function DevotionalBanner({
  devotional,
  onOpenModal,
  isOffline,
}: DevotionalBannerProps) {
  const isCached = Boolean(devotional.cachedAt);
  const showOfflineBadge = isOffline || devotional.isOffline;

  return (
    <section>
      <div className="primary-gradient text-white p-6 rounded-[2rem] shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <p className="text-white/70 text-[9px] font-bold uppercase tracking-[0.2em]">
              Meditação do Dia
            </p>

            {/* Offline cache badge */}
            {showOfflineBadge ? (
              <span className="inline-flex items-center gap-1 bg-amber-400/25 border border-amber-300/40 text-amber-100 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                <WifiOff size={10} />
                <span>Offline • Salvo no aparelho</span>
              </span>
            ) : isCached ? (
              <span className="inline-flex items-center gap-1 bg-white/20 border border-white/20 text-white/90 text-[9px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                <CheckCircle2 size={10} className="text-emerald-300" />
                <span>Cache local ativo</span>
              </span>
            ) : null}
          </div>

          <h3 className="font-display text-xl mb-2 italic leading-tight">
            "{devotional.verse}"
          </h3>
          <p className="text-white/80 text-[10px] mb-4 font-medium">{devotional.reference}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenModal}
              className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 text-white font-bold uppercase text-[9px] tracking-widest hover:bg-white/30 transition-all border border-white/20 active:scale-95 cursor-pointer shadow-sm"
            >
              <span>Devocional Completo</span>
              <ArrowRight size={12} />
            </button>

            <span className="text-[10px] text-white/60 hidden sm:inline-block">
              Disponível sem conexão à internet
            </span>
          </div>
        </div>
        <Book className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12 pointer-events-none" />
      </div>
    </section>
  );
});
