import React, { useState, useEffect, useCallback, memo } from 'react';
import { BookOpen, RefreshCw, Share2, Check, MessageCircle, Copy, Sparkles } from 'lucide-react';
import { BibleVerse, fetchDailyVerse, getRandomLocalVerse } from '../../services/verseService';

export const BibleVerseCard = memo(function BibleVerseCard() {
  const [verseData, setVerseData] = useState<BibleVerse>(() => getRandomLocalVerse());
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchDailyVerse()
      .then((data) => {
        if (mounted && data) {
          setVerseData(data);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const handleNextRandomVerse = useCallback(() => {
    setLoading(true);
    // Visual feedback for new verse
    setTimeout(() => {
      setVerseData((prev) => getRandomLocalVerse(prev.id));
      setLoading(false);
    }, 200);
  }, []);

  const formattedShareMessage = `📖 *Versículo do Dia - Célula Despertar*\n\n"${verseData.verse}"\n— *${verseData.reference}*${verseData.theme ? `\n🏷️ ${verseData.theme}` : ''}\n\n✨ Que esta palavra abençoe a sua vida e a sua família hoje!`;

  const handleCopy = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formattedShareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [formattedShareMessage]);

  const handleWhatsAppShare = useCallback(() => {
    const encoded = encodeURIComponent(formattedShareMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  }, [formattedShareMessage]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Versículo do Dia',
          text: formattedShareMessage,
        });
        return;
      } catch {
        // Fallback to menu
      }
    }
    setShowShareMenu((prev) => !prev);
  }, [formattedShareMessage]);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all">
      {/* Background soft decorative tint */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Versículo Bíblico do Dia
              </span>
              <Sparkles size={11} className="text-amber-500 shrink-0" />
            </div>
            {verseData.theme && (
              <span className="inline-block text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full mt-0.5">
                {verseData.theme}
              </span>
            )}
          </div>
        </div>

        {/* Change verse button */}
        <button
          type="button"
          onClick={handleNextRandomVerse}
          disabled={loading}
          title="Ver outro versículo bíblico"
          aria-label="Ver outro versículo bíblico"
          className="p-2 rounded-xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all active:scale-90 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin text-amber-500' : ''} />
        </button>
      </div>

      {/* Main Quote Verse */}
      <div className="relative py-1">
        <span className="absolute -top-3 -left-1 text-4xl text-amber-500/20 font-serif select-none pointer-events-none">
          “
        </span>
        <blockquote className="font-display text-base sm:text-lg text-slate-800 dark:text-slate-100 font-medium italic leading-relaxed pl-3 pr-2">
          {verseData.verse}
        </blockquote>
        <p className="mt-3 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pl-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          {verseData.reference}
        </p>
      </div>

      {/* Share Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Compartilhe a Palavra com sua família e célula
        </p>

        <div className="flex items-center gap-2">
          {/* WhatsApp Direct Share */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-emerald-200/60 dark:border-emerald-800/50"
            title="Enviar no WhatsApp"
          >
            <MessageCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Copiar versículo"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar</span>
              </>
            )}
          </button>

          {/* Native / More Share Button */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Mais opções de compartilhamento"
            aria-label="Mais opções de compartilhamento"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* Share Menu Dropdown Fallback */}
      {showShareMenu && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            Texto pronto para enviar nas suas redes sociais ou grupos.
          </span>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline shrink-0 ml-2"
          >
            Abrir WhatsApp
          </button>
        </div>
      )}
    </section>
  );
});
