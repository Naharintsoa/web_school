/**
 * Barre d'en-tête de l'application.
 * Affiche le titre de la page, le profil utilisateur,
 * et la cloche de notification (superadmin uniquement).
 */
import React from 'react';
import { Menu } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useLoginNotifications } from '../../hooks/useLoginNotifications';
import { NotificationBell } from './NotificationBell';

const PAGE_TITLES: Record<string, string> = {
  '/students': 'Gestion des élèves',
  '/classes':  'Gestion des classes',
  '/teachers': 'Professeurs',
  '/grades':   'Notes & Bulletins',
  '/archive':  'Archives',
  '/settings': 'Paramètres',
};

const ROLE_LABELS: Record<string, string> = {
  admin:   'Administrateur',
  teacher: 'Professeur',
  parent:  'Parent',
};

interface HeaderProps {
  userName: string;
  role: string;
  activePath: string;
  onMenuClick: () => void;
}

export function Header({ userName, role, activePath, onMenuClick }: HeaderProps) {
  const { session } = useAuthContext();
  const isSuperAdmin = session?.isSuperAdmin ?? false;

  const { notifications, unreadCount, markAllRead, clearAll } =
    useLoginNotifications(isSuperAdmin);

  const pageTitle = PAGE_TITLES[activePath] ?? 'Collège Sully';
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Gauche : hamburger (mobile) + titre de page */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">{pageTitle}</h2>
        </div>

        {/* Droite : cloche (superadmin) + profil */}
        <div className="flex items-center space-x-2">
          {isSuperAdmin && (
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={markAllRead}
              onClearAll={clearAll}
            />
          )}

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{userName}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
