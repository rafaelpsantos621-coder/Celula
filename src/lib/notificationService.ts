import { AppNotification } from '../types';

type NotificationCallback = (notifications: AppNotification[]) => void;

class NotificationService {
  private listeners: NotificationCallback[] = [];
  private notifications: AppNotification[] = [];

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications() {
    const saved = localStorage.getItem('cell_notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load notifications', e);
        this.notifications = [];
      }
    } else {
      // Default initial notifications if none exist
      this.notifications = [
        { id: '1', title: 'Bem-vindo!', body: 'Fique por dentro de tudo que acontece na Célula Despertar.', time: 'Agora', isRead: false },
      ];
      this.saveNotifications();
    }
  }

  private saveNotifications() {
    localStorage.setItem('cell_notifications', JSON.stringify(this.notifications));
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.notifications]));
  }

  subscribe(cb: NotificationCallback) {
    this.listeners.push(cb);
    cb([...this.notifications]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  async send(title: string, body: string) {
    const newNotification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      time: 'Agora',
      isRead: false
    };

    this.notifications = [newNotification, ...this.notifications].slice(0, 50); // Keep last 50
    this.saveNotifications();

    // Browser Push Notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      }
    }
  }

  markAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
    this.saveNotifications();
  }

  clear() {
    this.notifications = [];
    this.saveNotifications();
  }
}

export const notificationService = new NotificationService();
