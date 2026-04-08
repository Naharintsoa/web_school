/**
 * useLoginNotifications — écoute les connexions utilisateurs via SSE.
 * Actif uniquement pour le superadmin.
 */
import { useEffect, useState, useCallback } from 'react';

export interface LoginNotification {
  id: string;
  fullName: string;
  username: string;
  roleLabel: string;
  ip: string;
  loginAt: string;
  read: boolean;
}

export function useLoginNotifications(isSuperAdmin: boolean) {
  const [notifications, setNotifications] = useState<LoginNotification[]>([]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const es = new EventSource('/api/notifications/stream', { withCredentials: true });

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const notif: LoginNotification = {
          id: `${Date.now()}-${Math.random()}`,
          fullName:  data.fullName,
          username:  data.username,
          roleLabel: data.roleLabel,
          ip:        data.ip,
          loginAt:   data.loginAt,
          read:      false,
        };
        setNotifications(prev => [notif, ...prev].slice(0, 50)); // garder 50 max
      } catch {
        // message malformé, ignorer
      }
    };

    es.onerror = () => {
      // La connexion se reconnecte automatiquement avec EventSource
    };

    return () => es.close();
  }, [isSuperAdmin]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, unreadCount, markAllRead, clearAll };
}
