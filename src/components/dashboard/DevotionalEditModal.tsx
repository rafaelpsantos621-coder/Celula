import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Devotional } from '../../services/aiService';

interface DevotionalEditModalProps {
  isOpen: boolean;
  currentDevotional: Devotional;
  onClose: () => void;
  onSave: (customDevotional: Devotional) => void;
}

export const DevotionalEditModal: React.FC<DevotionalEditModalProps> = ({
  isOpen,
  currentDevotional,
  onClose,
  onSave,
}) => {
  const [verse, setVerse] = useState(currentDevotional.verse || '');
  const [reference, setReference] = useState(currentDevotional.reference || '');
  const [reflection, setReflection] = useState(currentDevotional.reflection || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verse.trim() || !reference.trim() || !reflection.trim()) {
      setError('Por favor preencha todos os campos do devocional.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const newDev: Devotional = {
      verse: verse.trim(),
      reference: reference.trim(),
      reflection: reflection.trim(),
      cachedAt: Date.now(),
      isCustom: true,
    };

    try {
      await fetch('/api/devotional/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDev),
      });
    } catch {
      // offline / fallback
    }

    onSave(newDev);
    setIsSubmitting(false);
    onClose();
  };

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
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Editar Devocional do Dia
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Palavra oficial da liderança para toda a célula
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

          {error && (
            <div className="mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Versículo */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Versículo Bíblico do Dia *
              </label>
              <textarea
                value={verse}
                onChange={(e) => setVerse(e.target.value)}
                rows={2}
                placeholder="Ex: Eu e a minha casa serviremos ao Senhor."
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Referência */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Livro e Capítulo / Versículo *
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Josué 24:15 ou Salmos 23:1"
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* Reflexão Pastoral */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Reflexão / Mensagem Pastoral para a Família *
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={5}
                placeholder="Escreva a meditação edificante para que todos os membros e visitantes leiam hoje..."
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 primary-gradient text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Salvar Devocional
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
