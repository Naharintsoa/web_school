/**
 * NotificationBell — cloche de notification pour le superadmin.
 * Affiche le nombre de connexions non lues + un panel détaillé au clic.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Trash2, User, Clock, Monitor } from 'lucide-react';
import type { LoginNotification } from '../../hooks/useLoginNotifications';

interface NotificationBellProps {
  notifications: LoginNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAllRead,
  onClearAll,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fermer le panel si clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open && unreadCount > 0) onMarkAllRead();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        title="Connexions récentes"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel déroulant */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* En-tête du panel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-indigo-600" />
              <span className="text-sm font-semibold text-gray-800">Connexions</span>
              {notifications.length > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="Tout effacer"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                Aucune connexion récente
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map(n => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 transition-colors ${!n.read ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar initiale */}
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {n.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{n.fullName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <User size={11} />
                          {n.username}
                          <span className="mx-1 text-gray-300">·</span>
                          {n.roleLabel}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(n.loginAt)} {formatTime(n.loginAt)}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Monitor size={11} />
                            {n.ip}
                          </span>
                        </div>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
