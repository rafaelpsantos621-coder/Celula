import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { User, Event, CellMember } from '../types';
import { MOCK_EVENTS } from '../mockData';
import { generateDailyDevotional, Devotional } from '../services/aiService';
import { getSyncDevotionalFromCache, getTodayDateKey } from '../lib/devotionalStorage';
import { AddressCard } from '../components/dashboard/AddressCard';
import { DevotionalBanner } from '../components/dashboard/DevotionalBanner';
import { DevotionalModal } from '../components/dashboard/DevotionalModal';
import { BibleVerseCard } from '../components/dashboard/BibleVerseCard';
import { QuickStatsCard } from '../components/dashboard/QuickStatsCard';
import { MembersModal } from '../components/dashboard/MembersModal';
import { EventCard } from '../components/dashboard/EventCard';
import { EventEditModal } from '../components/dashboard/EventEditModal';
import { Eye, UserCheck, Sparkles } from 'lucide-react';

const DEFAULT_DEVOTIONAL: Devotional = {
  verse: "Eu e a minha casa serviremos ao Senhor.",
  reference: "Josué 24:15",
  reflection: "A família é o primeiro altar de Deus. Quando abrimos as portas do nosso lar e da nossa célula em amor e verdade, a presença do Senhor habita e transforma toda a nossa casa.",
  cachedAt: Date.now(),
};

// In-memory cache to prevent redundant recalculation across tab switches
let cachedDevotionalSession: { dateKey: string; content: Devotional } | null = null;
let isDevotionalFetching = false;

function getInitialDevotional(): Devotional {
  const todayKey = getTodayDateKey();
  if (cachedDevotionalSession && cachedDevotionalSession.dateKey === todayKey) {
    return cachedDevotionalSession.content;
  }
  
  // 1. Check local offline cache (IndexedDB/localStorage synchronous mirror)
  const cached = getSyncDevotionalFromCache(todayKey);
  if (cached) {
    const dev: Devotional = {
      verse: cached.verse,
      reference: cached.reference,
      reflection: cached.reflection,
      cachedAt: cached.cachedAt,
      isOffline: cached.isOffline,
    };
    cachedDevotionalSession = { dateKey: todayKey, content: dev };
    return dev;
  }

  return DEFAULT_DEVOTIONAL;
}

function getInitialEvents(): Event[] {
  try {
    const saved = localStorage.getItem('cell_events');
    return saved ? JSON.parse(saved) : MOCK_EVENTS;
  } catch {
    return MOCK_EVENTS;
  }
}

function getInitialAddress(): string {
  try {
    return localStorage.getItem('cell_address') || 'Rua da Fé, 123 - Centro';
  } catch {
    return 'Rua da Fé, 123 - Centro';
  }
}

interface DashboardProps {
  user: User;
  onOpenShare?: () => void;
}

function DashboardComponent({ user, onOpenShare }: DashboardProps) {
  const [showDevotional, setShowDevotional] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [devotional, setDevotional] = useState<Devotional>(getInitialDevotional);
  const [events, setEvents] = useState<Event[]>(getInitialEvents);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [address, setAddress] = useState<string>(getInitialAddress);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState<CellMember[]>(() => {
    // Current user is always at least 1 real member
    return [
      {
        id: user.id,
        name: user.name,
        role: user.role,
        points: user.points || 0,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        joinedAt: user.joinedAt || Date.now(),
      },
    ];
  });

  // Synchronize address, events, and real cell members with server
  useEffect(() => {
    // 1. Register / sync current user with server members registry (members & admins only)
    if (user.role !== 'visitor') {
      fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          role: user.role,
          points: user.points,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          phone: user.phone,
          familyRole: user.familyRole,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => {});
    }

    // 2. Fetch all real members
    const fetchMembers = () => {
      fetch('/api/members')
        .then((res) => (res.ok ? res.json() : null))
        .then((serverMembers) => {
          if (Array.isArray(serverMembers) && serverMembers.length > 0) {
            // Keep members & admins
            const valid = serverMembers.filter((m) => m.role !== 'visitor');
            if (valid.length > 0) {
              setMembers(valid);
            }
          }
        })
        .catch(() => {});
    };

    fetchMembers();
    const membersInterval = setInterval(fetchMembers, 10000);

    // 3. Sync address and events
    fetch('/api/address')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.address) {
          setAddress(data.address);
          localStorage.setItem('cell_address', data.address);
        }
      })
      .catch(() => {});

    fetch('/api/events')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverEvents) => {
        if (Array.isArray(serverEvents) && serverEvents.length > 0) {
          setEvents((prev) => {
            const map = new Map<string, Event>();
            prev.forEach((e) => map.set(e.id, e));
            serverEvents.forEach((e) => map.set(e.id, e));
            const merged = Array.from(map.values());
            localStorage.setItem('cell_events', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});

    return () => {
      clearInterval(membersInterval);
    };
  }, [user]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // When network comes back online, fetch fresh AI devotional silently in background
      generateDailyDevotional()
        .then((content) => {
          if (content) {
            cachedDevotionalSession = { dateKey: getTodayDateKey(), content };
            setDevotional(content);
          }
        })
        .catch(() => {});
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    const todayKey = getTodayDateKey();

    // Fetch fresh or verify offline cache if not already in session
    if (!cachedDevotionalSession || cachedDevotionalSession.dateKey !== todayKey) {
      if (!isDevotionalFetching) {
        isDevotionalFetching = true;
        generateDailyDevotional()
          .then((content) => {
            if (content) {
              cachedDevotionalSession = { dateKey: todayKey, content };
              setDevotional(content);
            }
          })
          .catch((err) => {
            console.warn("Devocional offline ou padrão em uso:", err);
          })
          .finally(() => {
            isDevotionalFetching = false;
          });
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Filter events for the upcoming 7 days with optimized timestamp math
  const currentEvents = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const nextWeekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;

    return events
      .map((ev) => ({ event: ev, time: new Date(ev.date).getTime() }))
      .filter(({ time }) => time >= todayStart && time <= nextWeekEnd)
      .sort((a, b) => a.time - b.time)
      .map(({ event }) => event);
  }, [events]);

  const handleSaveAddress = useCallback((newAddress: string) => {
    try {
      localStorage.setItem('cell_address', newAddress);
      fetch('/api/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAddress }),
      }).catch(() => {});
    } catch {
      // Ignore storage errors
    }
    setAddress(newAddress);
  }, []);

  const handleOpenDevotional = useCallback(() => {
    setShowDevotional(true);
  }, []);

  const handleCloseDevotional = useCallback(() => {
    setShowDevotional(false);
  }, []);

  const handleStartEditEvent = useCallback((event: Event) => {
    setEditingEvent(event);
  }, []);

  const handleCloseEditEvent = useCallback(() => {
    setEditingEvent(null);
  }, []);

  const handleUpdateEvent = useCallback((updatedEvent: Event) => {
    setEvents((prevEvents) => {
      const updatedList = prevEvents.map((ev) =>
        ev.id === updatedEvent.id ? updatedEvent : ev
      );
      try {
        localStorage.setItem('cell_events', JSON.stringify(updatedList));
        fetch(`/api/events/${updatedEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEvent),
        }).catch(() => {});
      } catch {
        // Ignore storage errors
      }
      return updatedList;
    });
    setEditingEvent(null);
  }, []);

  const handleRemoveMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    fetch(`/api/members/${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const handleOpenMembersModal = useCallback(() => {
    setShowMembersModal(true);
  }, []);

  const handleCloseMembersModal = useCallback(() => {
    setShowMembersModal(false);
  }, []);

  const isAdmin = useMemo(() => user.role === 'admin', [user.role]);
  const memberCount = useMemo(() => members.length, [members.length]);

  return (
    <div className="space-y-8 relative">
      {/* Real Members Modal */}
      <MembersModal
        isOpen={showMembersModal}
        members={members}
        currentUser={user}
        onClose={handleCloseMembersModal}
        onShare={onOpenShare}
        onRemoveMember={handleRemoveMember}
      />

      {/* Devotional Modal */}
      <DevotionalModal
        isOpen={showDevotional}
        devotional={devotional}
        onClose={handleCloseDevotional}
        isOffline={isOffline}
      />

      {/* Event Edit Modal */}
      <EventEditModal
        event={editingEvent}
        onClose={handleCloseEditEvent}
        onSave={handleUpdateEvent}
      />

      {/* Hero Welcome Banner - Família no propósito */}
      <div className="bg-gradient-to-br from-indigo-900 via-primary to-indigo-700 text-white p-6 sm:p-7 rounded-[2.5rem] shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-100 border border-white/15">
              <span>✨</span> Célula Despertar
            </div>
            {user.role === 'visitor' && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-emerald-200 border border-emerald-400/30">
                <Eye size={11} /> Acesso Visitante
              </span>
            )}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight text-white tracking-tight">
            Edificando famílias, fortalecendo lares no amor de Cristo.
          </h2>
          <p className="text-white/85 text-xs sm:text-sm font-medium leading-relaxed max-w-lg">
            "Eu e a minha casa serviremos ao Senhor." — Josué 24:15
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {user.role === 'visitor' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Olá, {user.name}! Você está no modo visitante.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Aproveite para ler a meditação do dia, versículos bíblicos e a agenda da célula.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Address Card */}
      <AddressCard
        address={address}
        userRole={user.role}
        onSaveAddress={handleSaveAddress}
      />

      {/* Devotional Banner */}
      <DevotionalBanner
        devotional={devotional}
        onOpenModal={handleOpenDevotional}
        isOffline={isOffline}
      />

      {/* Versículo Bíblico do Dia com Compartilhamento */}
      <BibleVerseCard />

      {/* Quick Stats - 100% Real Members Dynamic Counter */}
      <QuickStatsCard
        memberCount={memberCount}
        onShare={onOpenShare}
        onViewMembers={handleOpenMembersModal}
      />

      {/* Upcoming Events Agenda */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">
            Agenda Próxima
          </h2>
          <span className="text-[10px] font-bold uppercase text-primary">
            Próximos 7 dias
          </span>
        </div>

        <div className="space-y-4">
          {currentEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] text-center border border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-400 font-medium">Nenhum evento agendado para os próximos dias.</p>
            </div>
          ) : (
            currentEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isAdmin={isAdmin}
                onEdit={handleStartEditEvent}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default memo(DashboardComponent);
