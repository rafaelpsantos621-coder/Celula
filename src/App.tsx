/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, Calendar as CalendarIcon, MessageCircle, Trophy, BookOpen, User as UserIcon, PlusCircle, Settings, Star, Bell, Sun, Moon, Share2 } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { User, AppNotification, Event } from './types';
import { notificationService } from './lib/notificationService';

// Screens
import Dashboard from './screens/Dashboard';
import Calendar from './screens/Calendar';
import Blog from './screens/Blog';
import Games from './screens/Games';
import Chat from './screens/Chat';
import Profile from './screens/Profile';
import { ShareAppModal } from './components/ShareAppModal';
import { AuthModal } from './components/AuthModal';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    return notificationService.subscribe((notifications) => {
      setAppNotifications(notifications);
    });
  }, []);

  useEffect(() => {
    if (showNotifications) {
      notificationService.markAsRead();
    }
  }, [showNotifications]);

  const unreadCount = appNotifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // Check for upcoming events (today or tomorrow)
    const checkUpcomingEvents = () => {
      const savedEvents = localStorage.getItem('cell_events');
      if (!savedEvents) return;
      
      const events: Event[] = JSON.parse(savedEvents);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      events.forEach(e => {
        const eDate = new Date(e.date);
        const isToday = isSameDay(eDate, today);
        const isTomorrow = isSameDay(eDate, tomorrow);

        if (isToday || isTomorrow) {
          const key = `notified_event_${e.id}_${isToday ? 'today' : 'tomorrow'}`;
          if (!localStorage.getItem(key)) {
            const timePhrase = isToday ? 'hoje!' : 'amanhã!';
            notificationService.send(
              `Lembrete de Evento: ${e.title}`,
              `Não esqueça: este evento é ${timePhrase}`
            );
            localStorage.setItem(key, 'true');
          }
        }
      });
    };

    const timeoutId = setTimeout(checkUpcomingEvents, 2000); // Wait for load
    return () => clearTimeout(timeoutId);
  }, []);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cell_theme');
    return saved === 'dark';
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cell_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cell_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cell_theme', 'light');
    }
  }, [isDark]);

  const handleAuthSuccess = useCallback((newUser: User) => {
    setUser(newUser);
    localStorage.setItem('cell_user', JSON.stringify(newUser));
    if (newUser.role !== 'visitor') {
      fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'visitor') {
      fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }).catch(() => {});
    }
  }, [user]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'calendar', icon: CalendarIcon, label: 'Agenda' },
    { id: 'blog', icon: BookOpen, label: 'Blog' },
    { id: 'games', icon: Trophy, label: 'Games' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: UserIcon, label: 'Perfil' },
  ];

  const handleLogout = useCallback(() => {
    localStorage.removeItem('cell_user');
    setUser(null);
    setActiveTab('home');
  }, []);

  const handleOpenShareModal = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setShowShareModal(false);
  }, []);

  const handlePointsAdd = useCallback((p: number) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updated = { ...prevUser, points: prevUser.points + p };
      try {
        localStorage.setItem('cell_user', JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  const handleUpdateProfile = useCallback((updated: User) => {
    setUser(updated);
    try {
      localStorage.setItem('cell_user', JSON.stringify(updated));
      fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    } catch {
      // Ignore storage errors
    }
  }, []);

  if (!user) {
    return (
      <AuthModal
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto overflow-x-hidden relative transition-colors duration-300 w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-nav px-4 sm:px-6 py-3.5 sm:py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 primary-gradient rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Star className="text-white" size={18} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl text-primary leading-none">Despertar</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1-Click Fast PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Share & Invite App Modal Button */}
          <button 
            onClick={handleOpenShareModal}
            aria-label="Convidar Membros e Compartilhar Link"
            title="Convidar e Compartilhar Link"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <Share2 size={18} />
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            aria-label="Alternar modo escuro"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificações"
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all",
                showNotifications ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 z-[100]"
                >
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-display text-sm text-slate-900 dark:text-white">Notificações</h3>
                    {unreadCount > 0 && (
                      <span className="text-[9px] font-black uppercase text-primary">{unreadCount} Novas</span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {appNotifications.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-400">Nenhuma notificação</p>
                    ) : (
                      appNotifications.map(n => (
                        <div key={n.id} className={cn(
                          "p-4 rounded-2xl border transition-all",
                          n.isRead 
                            ? "bg-slate-50/50 dark:bg-slate-800/30 border-transparent" 
                            : "bg-white dark:bg-slate-800 border-primary/20 shadow-sm"
                        )}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                            {!n.isRead && <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1" />}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{n.body}</p>
                          <p className="text-[8px] text-slate-300 dark:text-slate-500 mt-2 uppercase font-bold">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 bg-slate-100/50 dark:bg-slate-800/50 p-1 sm:p-1.5 rounded-2xl sm:pr-4">
            <button 
              onClick={() => setActiveTab('profile')}
              aria-label="Abrir Perfil"
              className="w-8 h-8 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-primary font-display flex items-center justify-center text-sm border border-white dark:border-slate-600 overflow-hidden font-bold uppercase shrink-0"
            >
              {user.avatarUrl && !user.avatarUrl.includes('dicebear') ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </button>
            <div className="text-left hidden sm:block">
              <p className={cn(
                "text-[8px] font-black uppercase leading-none",
                user.role === 'visitor'
                  ? "text-emerald-500 font-bold"
                  : user.role === 'admin'
                  ? "text-amber-500 font-bold"
                  : "text-slate-400 dark:text-slate-500"
              )}>
                {user.role === 'visitor' ? 'Visitante' : user.role === 'admin' ? '🛡️ Admin' : 'Membro'}
              </p>
              <p className="text-[10px] font-display text-slate-900 dark:text-slate-100 leading-none mt-0.5">
                {user.role === 'visitor' ? 'Modo Leitura' : user.role === 'admin' ? 'Modo Edição' : `${user.points} XP`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-5 sm:py-6 font-sans">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="will-change-transform"
            >
              <Dashboard user={user} onOpenShare={handleOpenShareModal} />
            </motion.div>
          )}
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="will-change-transform"
            >
              <Calendar user={user} />
            </motion.div>
          )}
          {activeTab === 'blog' && (
            <motion.div
              key="blog"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="will-change-transform"
            >
              <Blog user={user} />
            </motion.div>
          )}
          {activeTab === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="will-change-transform"
            >
              <Games user={user} onPointsAdd={handlePointsAdd} />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="will-change-transform"
            >
              <Chat user={user} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="will-change-transform"
            >
              <Profile 
                user={user} 
                onUpdate={handleUpdateProfile} 
                onLogout={handleLogout}
                onOpenShare={handleOpenShareModal}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-3 sm:bottom-6 left-2.5 sm:left-6 right-2.5 sm:right-6 z-50">
        <div className="max-w-md md:max-w-lg mx-auto glass-nav rounded-3xl p-1.5 sm:p-2.5 flex justify-around items-center shadow-2xl border border-white/50 dark:border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl transition-all duration-300 min-w-[42px] min-h-[42px]",
                  isActive ? "text-primary scale-105 sm:scale-110" : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
                )}
              >
                <Icon size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-1 sm:-bottom-1.5 w-1.5 h-1.5 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Share & Invite App Modal */}
      <ShareAppModal 
        isOpen={showShareModal} 
        onClose={handleCloseShareModal} 
      />
    </div>
  );
}
