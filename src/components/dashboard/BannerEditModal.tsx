import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Palette, BookOpen } from 'lucide-react';
import { CellBannerConfig } from '../../types';
import { cn } from '../../lib/utils';

interface BannerEditModalProps {
  isOpen: boolean;
  currentBanner: CellBannerConfig;
  onClose: () => void;
  onSave: (updated: CellBannerConfig) => void;
}

const GRADIENT_THEMES = [
  { id: 'indigo', name: 'Índigo Real', class: 'from-indigo-900 via-primary to-indigo-700' },
  { id: 'purple', name: 'Púrpura Imperial', class: 'from-purple-950 via-purple-700 to-indigo-900' },
  { id: 'emerald', name: 'Verde Esperança', class: 'from-emerald-950 via-emerald-700 to-teal-900' },
  { id: 'amber', name: 'Dourado / Aliança', class: 'from-amber-950 via-amber-700 to-orange-800' },
  { id: 'rose', name: 'Amor & Graça', class: 'from-rose-950 via-rose-700 to-pink-900' },
];

export const BannerEditModal: React.FC<BannerEditModalProps> = ({
  isOpen,
  currentBanner,
  onClose,
  onSave,
}) => {
  const [tag, setTag] = useState(currentBanner.tag || '✨ Célula Despertar');
  const [title, setTitle] = useState(
    currentBanner.title || 'Edificando famílias, fortalecendo lares no amor de Cristo.'
  );
  const [verse, setVerse] = useState(currentBanner.verse || 'Eu e a minha casa serviremos ao Senhor.');
  const [reference, setReference] = useState(currentBanner.reference || 'Josué 24:15');
  const [gradientTheme, setGradientTheme] = useState<string>(
    currentBanner.gradientTheme || 'indigo'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: CellBannerConfig = {
      tag: tag.trim() || '✨ Célula Despertar',
      title: title.trim(),
      verse: verse.trim(),
      reference: reference.trim(),
      gradientTheme: gradientTheme as any,
    };

    onSave(updated);
    onClose();
  };

  const activeGradient =
    GRADIENT_THEMES.find((t) => t.id === gradientTheme)?.class || GRADIENT_THEMES[0].class;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 relative my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Editar Banner Principal
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Acesso Exclusivo do Administrador
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Real-time Preview */}
          <div className="mt-4 mb-5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 ml-1">
              Pré-visualização em tempo real:
            </label>
            <div
              className={cn(
                'bg-gradient-to-br text-white p-5 rounded-2xl shadow-lg relative overflow-hidden transition-all',
                activeGradient
              )}
            >
              <div className="relative z-10 space-y-1.5">
                <span className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white/90">
                  {tag || '✨ Célula Despertar'}
                </span>
                <h4 className="font-display text-lg font-bold leading-tight">
                  {title || 'Título do banner'}
                </h4>
                {verse && (
                  <p className="text-white/85 text-xs font-medium">
                    "{verse}" {reference && `— ${reference}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tag / Badge */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Etiqueta / Nome da Célula
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ex: ✨ Célula Despertar"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Title / Motto */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Lema Principal / Frase de Abertura *
              </label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={2}
                placeholder="Ex: Edificando famílias, fortalecendo lares no amor de Cristo."
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Verse and Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Versículo Bíblico do Banner
                </label>
                <input
                  type="text"
                  value={verse}
                  onChange={(e) => setVerse(e.target.value)}
                  placeholder="Ex: Eu e a minha casa serviremos ao Senhor."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Referência
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: Josué 24:15"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Gradient Theme Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1.5">
                <Palette size={12} /> Paleta de Cores do Banner
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GRADIENT_THEMES.map((theme) => {
                  const isSelected = gradientTheme === theme.id;
                  return (
                    <button
                      type="button"
                      key={theme.id}
                      onClick={() => setGradientTheme(theme.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer',
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn('w-4 h-4 rounded-full bg-gradient-to-r', theme.class)}
                        />
                        <span className="truncate">{theme.name}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Salvar Alterações
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
