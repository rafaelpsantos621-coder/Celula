import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, BookOpen, Clock } from 'lucide-react';

export interface CellMottoData {
  title: string;
  verse: string;
  schedule?: string;
}

interface CellMottoModalProps {
  isOpen: boolean;
  initialData: CellMottoData;
  onClose: () => void;
  onSave: (data: CellMottoData) => void;
}

export const CellMottoModal: React.FC<CellMottoModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialData.title);
  const [verse, setVerse] = useState(initialData.verse);
  const [schedule, setSchedule] = useState(initialData.schedule || 'Todos os sábados às 19h30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      verse: verse.trim(),
      schedule: schedule.trim(),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm will-change-transform"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 my-auto"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">
                    Editar Lema da Célula
                  </h3>
                  <p className="text-xs text-slate-400">Exclusivo para Líderes & Administradores</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Frase de Boas-Vindas / Lema Principal *
                </label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Edificando famílias, fortalecendo lares no amor de Cristo."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary text-sm text-slate-900 dark:text-white font-medium resize-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Versículo Bíblico Base *
                </label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={verse}
                    onChange={(e) => setVerse(e.target.value)}
                    placeholder='Ex: "Eu e a minha casa serviremos ao Senhor." — Josué 24:15'
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary text-sm text-slate-900 dark:text-white font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                  Horário e Dia dos Encontros (Opcional)
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Ex: Todos os sábados às 19h30"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary text-sm text-slate-900 dark:text-white font-medium transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 primary-gradient text-white rounded-xl font-bold text-xs shadow-md shadow-primary/25 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Salvar Lema
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
