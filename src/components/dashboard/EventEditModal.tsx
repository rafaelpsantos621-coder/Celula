import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Event } from '../../types';

interface EventEditModalProps {
  event: Event | null;
  onClose: () => void;
  onSave: (updatedEvent: Event) => void;
}

export const EventEditModal = memo(function EventEditModal({
  event,
  onClose,
  onSave,
}: EventEditModalProps) {
  const [draftEvent, setDraftEvent] = useState<Event | null>(event);

  useEffect(() => {
    setDraftEvent(event);
  }, [event]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (draftEvent) {
      onSave(draftEvent);
    }
  }, [draftEvent, onSave]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftEvent((prev) => (prev ? { ...prev, title: e.target.value } : null));
  }, []);

  const handleSpeakerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftEvent((prev) => (prev ? { ...prev, speaker: e.target.value } : null));
  }, []);

  const handleWorshipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftEvent((prev) => (prev ? { ...prev, worship: e.target.value } : null));
  }, []);

  const handleDynamicsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftEvent((prev) => (prev ? { ...prev, dynamics: e.target.value } : null));
  }, []);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newIso = new Date(e.target.value).toISOString();
      setDraftEvent((prev) => (prev ? { ...prev, date: newIso } : null));
    }
  }, []);

  const formattedDraftDate = useMemo(() => {
    if (!draftEvent?.date) return '';
    try {
      const d = new Date(draftEvent.date);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch {
      return '';
    }
  }, [draftEvent?.date]);

  if (!event || !draftEvent) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm will-change-transform"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        >
          <h3 className="font-display text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <CalendarIcon className="text-primary" size={20} />
            Editar Evento
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                Título
              </label>
              <input
                type="text"
                value={draftEvent.title}
                onChange={handleTitleChange}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                Quem dará a Palavra?
              </label>
              <input
                type="text"
                value={draftEvent.speaker || ''}
                onChange={handleSpeakerChange}
                placeholder="Nome do preletor..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                Quem fará o Louvor?
              </label>
              <input
                type="text"
                value={draftEvent.worship || ''}
                onChange={handleWorshipChange}
                placeholder="Nome do responsável pelo louvor..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                Quem fará a Dinâmica?
              </label>
              <input
                type="text"
                value={draftEvent.dynamics || ''}
                onChange={handleDynamicsChange}
                placeholder="Nome do responsável pela dinâmica..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  value={formattedDraftDate}
                  onChange={handleDateChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 primary-gradient text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});
