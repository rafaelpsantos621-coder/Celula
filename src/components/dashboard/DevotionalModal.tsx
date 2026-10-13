import React, { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Book,
  X,
  WifiOff,
  CheckCircle2,
  Copy,
  Check,
  Star,
  History,
  ArrowLeft,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { Devotional } from '../../services/aiService';
import {
  CachedDevotional,
  getAllCachedDevotionals,
  toggleDevotionalFavorite,
  getTodayDateKey,
} from '../../lib/devotionalStorage';
import { cn } from '../../lib/utils';

interface DevotionalModalProps {
  isOpen: boolean;
  devotional: Devotional;
  onClose: () => void;
  isOffline?: boolean;
}

export const DevotionalModal = memo(function DevotionalModal({
  isOpen,
  devotional,
  onClose,
  isOffline,
}: DevotionalModalProps) {
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);
  const [cachedHistory, setCachedHistory] = useState<CachedDevotional[]>([]);
  const [selectedHistoricDevotional, setSelectedHistoricDevotional] =
    useState<CachedDevotional | null>(null);

  const activeDevotional = selectedHistoricDevotional || devotional;
  const isViewingPast = Boolean(selectedHistoricDevotional);

  // Load history of cached devotionals when modal opens
  useEffect(() => {
    if (isOpen) {
      getAllCachedDevotionals()
        .then((items) => {
          setCachedHistory(items);
          const todayKey = getTodayDateKey();
          const currentItem = items.find((i) => i.dateKey === todayKey);
          if (currentItem) {
            setIsFavorite(Boolean(currentItem.isFavorite));
          }
        })
        .catch(() => {});
    } else {
      setViewHistory(false);
      setSelectedHistoricDevotional(null);
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = useCallback(() => {
    const textToCopy = `📖 *Devocional Diário - Célula Despertar*\n\n"${activeDevotional.verse}"\n— *${activeDevotional.reference}*\n\n🕊️ *Reflexão:*\n${activeDevotional.reflection}\n\n✨ *Célula Despertar: Edificando famílias no propósito de Deus.*`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }, [activeDevotional]);

  const handleToggleFavorite = useCallback(async () => {
    const todayKey = selectedHistoricDevotional?.dateKey || getTodayDateKey();
    const id = `dev-${todayKey}`;
    try {
      const nextStatus = await toggleDevotionalFavorite(id);
      setIsFavorite(nextStatus);
      // Update local history array
      setCachedHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isFavorite: nextStatus } : item
        )
      );
    } catch {
      // Ignore
    }
  }, [selectedHistoricDevotional]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm will-change-transform"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 my-auto max-h-[90vh] flex flex-col"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={20} />
            </button>

            {/* Offline Status Pill / Banner */}
            <div className="mb-4 pr-10">
              {isOffline || devotional.isOffline ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/40 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <WifiOff size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="leading-snug">
                    <p className="font-bold">Modo Offline Ativo</p>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                      Lendo do cache local (IndexedDB). Acessível mesmo sem internet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-bold">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>Salvo no cache local para leitura offline</span>
                </div>
              )}
            </div>

            {/* View Switching Header */}
            {viewHistory ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewHistory(false)}
                    className="text-primary text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Voltar ao Devocional
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {cachedHistory.length} salvos no dispositivo
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-xl text-slate-900 dark:text-white">
                    Histórico Salvo no Cache Local
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Estes devocionais estão guardados no seu aparelho (IndexedDB) e podem ser lidos a qualquer momento sem internet.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {cachedHistory.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      Nenhum devocional anterior em cache ainda. Conforme você acessar o app, os devocionais ficarão salvos aqui automaticamente!
                    </div>
                  ) : (
                    cachedHistory.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedHistoricDevotional(item);
                          setViewHistory(false);
                        }}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-primary/40 bg-slate-50/60 dark:bg-slate-800/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <Calendar size={11} />
                            {item.dateLabel || item.dateKey}
                          </span>
                          {item.isFavorite && (
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star size={10} fill="currentColor" /> Favorito
                            </span>
                          )}
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white italic line-clamp-1 group-hover:text-primary transition-colors">
                          "{item.verse}"
                        </h4>
                        <p className="text-xs text-primary font-medium mt-0.5">{item.reference}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.reflection}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {/* Back to today's if reading past */}
                {isViewingPast && (
                  <div className="flex items-center justify-between bg-primary/10 text-primary p-2.5 rounded-xl text-xs font-bold">
                    <span>Lendo devocional salvo de {selectedHistoricDevotional?.dateLabel}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedHistoricDevotional(null)}
                      className="underline hover:opacity-80 cursor-pointer"
                    >
                      Voltar ao de hoje
                    </button>
                  </div>
                )}

                <div>
                  <span className="text-primary font-black uppercase text-[10px] tracking-[0.3em] mb-2 block">
                    {isViewingPast ? 'Devocional em Cache' : 'Devocional do Dia'}
                  </span>
                  <h2 className="font-display text-2xl text-slate-900 dark:text-white italic leading-tight">
                    "{activeDevotional.verse}"
                  </h2>
                  <p className="text-primary font-bold text-sm mt-2">{activeDevotional.reference}</p>
                </div>

                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Book className="text-primary" size={16} />
                    Reflexão para a Família & Célula
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {activeDevotional.reflection}
                  </p>
                </div>

                {/* Storage & Offline Guarantee Pill */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <HardDrive size={14} className="text-primary" />
                    <span>Cache local ativo (IndexedDB + Storage)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewHistory(true)}
                    className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <History size={12} />
                    <span>Ver {cachedHistory.length > 0 ? `${cachedHistory.length} salvos` : 'histórico'}</span>
                  </button>
                </div>

                {/* Action Buttons: Copy, Favorite, Close */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                      'py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border',
                      copied
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={cn(
                      'py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border',
                      isFavorite
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                    <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full primary-gradient text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  Amém
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
