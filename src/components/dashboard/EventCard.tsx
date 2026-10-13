import React, { memo, useMemo, useCallback } from 'react';
import { Book, Clock, Edit2, ArrowRight, Zap, Music, Utensils } from 'lucide-react';
import { Event } from '../../types';
import { formatWeekdayShort, formatMonthShort, formatTimeShort, getDayOfMonth } from '../../lib/dateUtils';

interface EventCardProps {
  event: Event;
  isAdmin: boolean;
  onEdit: (event: Event) => void;
}

export const EventCard = memo(function EventCard({
  event,
  isAdmin,
  onEdit,
}: EventCardProps) {
  const weekday = useMemo(() => formatWeekdayShort(event.date), [event.date]);
  const day = useMemo(() => getDayOfMonth(event.date), [event.date]);
  const month = useMemo(() => formatMonthShort(event.date), [event.date]);
  const time = useMemo(() => formatTimeShort(event.date), [event.date]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(event);
  }, [event, onEdit]);

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex gap-8 items-center hover:scale-[1.01] transition-transform duration-200 cursor-pointer group">
      {/* Date badge */}
      <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-2xl border border-slate-100 dark:border-slate-700 shrink-0 select-none">
        <span className="text-[10px] font-black uppercase text-primary leading-none mb-1">
          {weekday}
        </span>
        <span className="font-display text-3xl text-slate-900 dark:text-white leading-none">
          {day}
        </span>
        <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mt-1 leading-none">
          {month}
        </span>
      </div>

      {/* Event Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-display text-lg text-slate-900 dark:text-slate-100 mb-2 truncate">
          {event.title}
        </h4>
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight flex items-center gap-1">
            {event.type === 'cell' ? '⛪ Célula Local' : '🏛️ Evento Igreja'}
          </p>
          <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-tight flex items-center gap-1">
            <Clock size={12} className="text-slate-300 dark:text-slate-600" />
            {time}
          </p>
        </div>

        {event.type === 'cell' && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-full flex items-center gap-2">
              <Book size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                Palavra: {event.speaker || 'A definir'}
              </span>
            </div>
            <div className="px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-full flex items-center gap-2">
              <Zap size={12} className="text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                Dinâmica: {event.dynamics || 'A definir'}
              </span>
            </div>
            <div className="px-4 py-2 bg-rose-500/5 border border-rose-500/10 rounded-full flex items-center gap-2">
              <Music size={12} className="text-rose-500" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                Louvor: {event.worship || 'A definir'}
              </span>
            </div>
            {event.snackScale && (
              <div className="px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-full flex items-center gap-2">
                <Utensils size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  Lanche: {event.snackScale}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action / Arrow */}
      {isAdmin ? (
        <button
          type="button"
          onClick={handleEditClick}
          className="p-4 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
          title="Editar evento"
        >
          <Edit2 size={20} />
        </button>
      ) : (
        <ArrowRight size={20} className="text-slate-200 dark:text-slate-700 shrink-0" />
      )}
    </div>
  );
});
