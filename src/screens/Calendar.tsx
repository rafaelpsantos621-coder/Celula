import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isThursday, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, Utensils, Edit2, Check, X, Book, Zap, Music } from 'lucide-react';
import { User, Event } from '../types';
import { MOCK_EVENTS } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { notificationService } from '../lib/notificationService';

export default function Calendar({ user }: { user: User }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('cell_deleted_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('cell_events');
    let loadedEvents: Event[] = saved ? JSON.parse(saved) : MOCK_EVENTS;
    
    // Auto-generate Cell meetings for Thursdays if not present
    const today = new Date();
    const futureLimit = addMonths(today, 6);
    const interval = eachDayOfInterval({ start: today, end: futureLimit });
    
    const thursdays = interval.filter(d => isThursday(d));
    const newThursdays: Event[] = [];
    
    const savedDeleted = localStorage.getItem('cell_deleted_events');
    const deletedList: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];

    thursdays.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const id = `cell-thurs-${dateStr}`;
      const exists = loadedEvents.some(e => e.date.startsWith(dateStr));
      const wasDeleted = deletedList.includes(id);
      
      if (!exists && !wasDeleted) {
        newThursdays.push({
          id,
          title: '⛪ Célula Despertar',
          description: 'Encontro semanal da nossa célula',
          date: date.toISOString(),
          type: 'cell',
          snackScale: 'A definir'
        });
      }
    });

    if (newThursdays.length > 0) {
      const finalEvents = [...loadedEvents, ...newThursdays];
      return finalEvents;
    }
    
    return loadedEvents;
  });

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingSnackId, setEditingSnackId] = useState<string | null>(null);
  const [tempSnack, setTempSnack] = useState('');
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [tempSpeaker, setTempSpeaker] = useState('');
  const [editingDynamicsId, setEditingDynamicsId] = useState<string | null>(null);
  const [tempDynamics, setTempDynamics] = useState('');
  const [editingWorshipId, setEditingWorshipId] = useState<string | null>(null);
  const [tempWorship, setTempWorship] = useState('');

  const selectedDayEvents = selectedDay ? events.filter(e => isSameDay(new Date(e.date), selectedDay)) : [];

  // Sync with shared server so all cell members see updated scales and meetings
  useEffect(() => {
    let isMounted = true;
    fetch('/api/events')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverEvents) => {
        if (isMounted && Array.isArray(serverEvents) && serverEvents.length > 0) {
          setEvents((prev) => {
            const map = new Map<string, Event>();
            prev.forEach((e) => map.set(e.id, e));
            serverEvents.forEach((e) => map.set(e.id, e));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cell_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('cell_deleted_events', JSON.stringify(deletedIds));
  }, [deletedIds]);

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      description: '',
      date: new Date(newDate).toISOString(),
      type: 'church',
      snackScale: 'Nenhum'
    };
    setEvents([...events, event]);
    
    // Broadcast to server
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {});

    if (user.role === 'admin') {
      const eventDate = format(new Date(newDate), "dd/MM", { locale: ptBR });
      notificationService.send('Novo evento agendado!', `${newTitle} para o dia ${eventDate}`);
    }

    setShowAddEvent(false);
    setNewTitle('');
  };

  const handleDeleteEvent = (id: string) => {
    if (!window.confirm('Excluir este evento?')) return;
    setEvents(events.filter(e => e.id !== id));
    if (id.startsWith('cell-thurs-')) {
      setDeletedIds(prev => [...new Set([...prev, id])]);
    }
    fetch(`/api/events/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleUpdateSnack = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, snackScale: tempSnack } : e);
    setEvents(updated);
    setEditingSnackId(null);
    const ev = updated.find(e => e.id === id);
    if (ev) {
      fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev),
      }).catch(() => {});
    }
  };

  const handleUpdateSpeaker = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, speaker: tempSpeaker } : e);
    setEvents(updated);
    setEditingSpeakerId(null);
    const ev = updated.find(e => e.id === id);
    if (ev) {
      fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev),
      }).catch(() => {});
    }
  };

  const handleUpdateDynamics = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, dynamics: tempDynamics } : e);
    setEvents(updated);
    setEditingDynamicsId(null);
    const ev = updated.find(e => e.id === id);
    if (ev) {
      fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev),
      }).catch(() => {});
    }
  };

  const handleUpdateWorship = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, worship: tempWorship } : e);
    setEvents(updated);
    setEditingWorshipId(null);
    const ev = updated.find(e => e.id === id);
    if (ev) {
      fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev),
      }).catch(() => {});
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-4xl text-slate-900 dark:text-white tracking-tight">Agenda</h2>
          <p className="text-primary font-bold text-[10px] uppercase tracking-widest mt-1">Sincronize sua fé</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-slate-400 dark:text-slate-500" />
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronRight size={20} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Edição de Agenda: Você pode criar eventos oficiais, definir escalas de lanche/louvor/palavra e excluir encontros.</span>
          </div>
          <button
            onClick={() => setShowAddEvent(true)}
            className="py-1 px-3 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shrink-0 cursor-pointer"
          >
            + Novo Evento
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="font-display text-xl sm:text-2xl text-slate-900 dark:text-white italic">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
          {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(d => (
            <div key={d} className="text-center text-[8px] font-black uppercase text-slate-300 dark:text-slate-600 tracking-[0.12em] sm:tracking-[0.2em]">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 relative">
          {days.map((day, i) => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            
            return (
              <div 
                key={i} 
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center text-xs sm:text-sm font-bold relative rounded-xl transition-all cursor-pointer",
                  !isSameMonth(day, monthStart) && "text-slate-200 dark:text-slate-800 opacity-30",
                  isSelected ? "bg-primary/20 text-primary border-2 border-primary" : 
                  isToday ? "primary-gradient text-white shadow-lg shadow-primary/30" : "bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {format(day, 'd')}
                {dayEvents.length > 0 && !isToday && !isSelected && (
                  <div className="absolute bottom-1.5 sm:bottom-2 w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                )}
              </div>
            );
          })}

          {/* Interactive Popover (Balão) */}
          <AnimatePresence>
            {selectedDay && selectedDayEvents.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute top-full left-0 right-0 mt-4 z-[60] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-primary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-display text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                    Eventos de {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
                  </h4>
                  <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={16} /></button>
                </div>

                <div className="space-y-4">
                  {selectedDayEvents.map(e => (
                    <div key={e.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{e.title}</span>
                        {user.role !== 'visitor' && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingSnackId(e.id);
                                setTempSnack(e.snackScale || '');
                              }}
                              className="text-primary p-1 hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                              title="Editar Lanche"
                            >
                              <Utensils size={12} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingSpeakerId(e.id);
                                setTempSpeaker(e.speaker || '');
                              }}
                              className="text-primary p-1 hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                              title="Editar Palavra"
                            >
                              <Book size={12} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingDynamicsId(e.id);
                                setTempDynamics(e.dynamics || '');
                              }}
                              className="text-primary p-1 hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                              title="Editar Dinâmica"
                            >
                              <Zap size={12} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingWorshipId(e.id);
                                setTempWorship(e.worship || '');
                              }}
                              className="text-primary p-1 hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                              title="Editar Louvor"
                            >
                              <Music size={12} />
                            </button>
                            {user.role === 'admin' && (
                              <Trash2 size={12} className="text-slate-300 hover:text-red-500 cursor-pointer ml-1" onClick={() => handleDeleteEvent(e.id)} />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Utensils size={12} className="text-primary shrink-0" />
                          {editingSnackId === e.id ? (
                            <input 
                              autoFocus
                              value={tempSnack}
                              onChange={e => setTempSnack(e.target.value)}
                              onBlur={() => handleUpdateSnack(e.id)}
                              onKeyDown={evt => evt.key === 'Enter' && handleUpdateSnack(e.id)}
                              className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white px-2 py-1 rounded border border-primary focus:outline-none w-full"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">{e.snackScale || 'Lanche a definir...'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Book size={12} className="text-primary shrink-0" />
                          {editingSpeakerId === e.id ? (
                            <input 
                              autoFocus
                              value={tempSpeaker}
                              onChange={e => setTempSpeaker(e.target.value)}
                              onBlur={() => handleUpdateSpeaker(e.id)}
                              onKeyDown={evt => evt.key === 'Enter' && handleUpdateSpeaker(e.id)}
                              placeholder="Quem dará a palavra..."
                              className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white px-2 py-1 rounded border border-primary focus:outline-none w-full"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">{e.speaker || 'Dar a Palavra...'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Zap size={12} className="text-primary shrink-0" />
                          {editingDynamicsId === e.id ? (
                            <input 
                              autoFocus
                              value={tempDynamics}
                              onChange={e => setTempDynamics(e.target.value)}
                              onBlur={() => handleUpdateDynamics(e.id)}
                              onKeyDown={evt => evt.key === 'Enter' && handleUpdateDynamics(e.id)}
                              placeholder="Quem fará a dinâmica..."
                              className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white px-2 py-1 rounded border border-primary focus:outline-none w-full"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">{e.dynamics || 'Fazer a Dinâmica...'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Music size={12} className="text-primary shrink-0" />
                          {editingWorshipId === e.id ? (
                            <input 
                              autoFocus
                              value={tempWorship}
                              onChange={e => setTempWorship(e.target.value)}
                              onBlur={() => handleUpdateWorship(e.id)}
                              onKeyDown={evt => evt.key === 'Enter' && handleUpdateWorship(e.id)}
                              placeholder="Quem fará o louvor..."
                              className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white px-2 py-1 rounded border border-primary focus:outline-none w-full"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">{e.worship || 'Fazer o Louvor...'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => { setShowAddEvent(true); setNewDate(format(selectedDay, 'yyyy-MM-dd')); }}
                    className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Adicionar Evento
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 px-2">Escala de Lanche (Quintas)</h3>
        <div className="space-y-4">
          {events
            .filter(e => isSameMonth(new Date(e.date), currentDate) && isThursday(new Date(e.date)))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(e => (
              <div key={e.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-5 relative group transition-all">
                <div className="shrink-0 w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-primary font-display border border-transparent dark:border-slate-700">
                  <span className="text-[10px] leading-none mb-0.5 uppercase">{format(new Date(e.date), 'MMM', { locale: ptBR })}</span>
                  <span className="text-xl leading-none">{format(new Date(e.date), 'dd')}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{e.title}</h4>
                    <button 
                      onClick={() => handleDeleteEvent(e.id)}
                      className="p-1 text-slate-200 dark:text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{format(new Date(e.date), 'EEEE', { locale: ptBR })}</p>
                  
                  {/* Snack Scale Section */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                          <Music size={10} />
                          Louvor
                        </div>
                        {user.role === 'admin' && (
                          <button 
                            onClick={() => {
                              setEditingWorshipId(e.id);
                              setTempWorship(e.worship || '');
                            }}
                            className="text-primary hover:scale-110 transition-transform"
                          >
                            {editingWorshipId === e.id ? <Check size={12} onClick={() => handleUpdateWorship(e.id)} /> : <Edit2 size={10} />}
                          </button>
                        )}
                      </div>
                      
                      {editingWorshipId === e.id ? (
                        <input 
                          autoFocus
                          value={tempWorship}
                          onChange={e => setTempWorship(e.target.value)}
                          onBlur={() => handleUpdateWorship(e.id)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateWorship(e.id)}
                          className="w-full bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-900 dark:text-white px-2 py-1 rounded border border-primary focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                          {e.worship || 'A definir'}
                        </p>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                          <Utensils size={10} />
                          Lanche
                        </div>
                        {user.role === 'admin' && (
                          <button 
                            onClick={() => {
                              setEditingSnackId(e.id);
                              setTempSnack(e.snackScale || '');
                            }}
                            className="text-primary hover:scale-110 transition-transform"
                          >
                            {editingSnackId === e.id ? <Check size={12} onClick={() => handleUpdateSnack(e.id)} /> : <Edit2 size={10} />}
                          </button>
                        )}
                      </div>
                      
                      {editingSnackId === e.id ? (
                        <input 
                          autoFocus
                          value={tempSnack}
                          onChange={e => setTempSnack(e.target.value)}
                          onBlur={() => handleUpdateSnack(e.id)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateSnack(e.id)}
                          className="w-full bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-900 dark:text-white px-2 py-1 rounded border border-primary focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                          {e.snackScale || 'A definir'}
                        </p>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                          <Book size={10} />
                          Palavra
                        </div>
                        {user.role === 'admin' && (
                          <button 
                            onClick={() => {
                              setEditingSpeakerId(e.id);
                              setTempSpeaker(e.speaker || '');
                            }}
                            className="text-primary hover:scale-110 transition-transform"
                          >
                            {editingSpeakerId === e.id ? <Check size={12} onClick={() => handleUpdateSpeaker(e.id)} /> : <Edit2 size={10} />}
                          </button>
                        )}
                      </div>
                      
                      {editingSpeakerId === e.id ? (
                        <input 
                          autoFocus
                          value={tempSpeaker}
                          onChange={e => setTempSpeaker(e.target.value)}
                          onBlur={() => handleUpdateSpeaker(e.id)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateSpeaker(e.id)}
                          className="w-full bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-900 dark:text-white px-2 py-1 rounded border border-primary focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                          {e.speaker || 'A definir'}
                        </p>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                          <Zap size={10} />
                          Dinâmica
                        </div>
                        {user.role === 'admin' && (
                          <button 
                            onClick={() => {
                              setEditingDynamicsId(e.id);
                              setTempDynamics(e.dynamics || '');
                            }}
                            className="text-primary hover:scale-110 transition-transform"
                          >
                            {editingDynamicsId === e.id ? <Check size={12} onClick={() => handleUpdateDynamics(e.id)} /> : <Edit2 size={10} />}
                          </button>
                        )}
                      </div>
                      
                      {editingDynamicsId === e.id ? (
                        <input 
                          autoFocus
                          value={tempDynamics}
                          onChange={e => setTempDynamics(e.target.value)}
                          onBlur={() => handleUpdateDynamics(e.id)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateDynamics(e.id)}
                          className="w-full bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-900 dark:text-white px-2 py-1 rounded border border-primary focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                          {e.dynamics || 'A definir'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

        {user.role !== 'visitor' && (
          <button 
            onClick={() => setShowAddEvent(true)}
            className="fixed bottom-32 right-8 w-16 h-16 primary-gradient text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 z-50 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Criar novo evento"
          >
            <Plus size={32} />
          </button>
        )}

      <AnimatePresence>
        {showAddEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl w-full max-w-sm border dark:border-slate-800"
            >
              <h3 className="font-display text-3xl text-slate-900 dark:text-white mb-8 tracking-tight italic">Criar Evento</h3>
              <form onSubmit={handleAddEvent} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">O que vai ter?</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:outline-none focus:border-primary transition-all font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Quando?</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:outline-none focus:border-primary transition-all font-bold text-slate-600 dark:text-slate-300"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddEvent(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Fechar</button>
                  <button type="submit" className="flex-1 py-4 primary-gradient text-white rounded-2xl font-display text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Criar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
