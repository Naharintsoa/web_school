/**
 * Barre de navigation latérale.
 * Les items visibles sont filtrés par les permissions de la session courante.
 */
import React from 'react';
import {
  Users, GraduationCap, ClipboardList, Settings,
  LogOut, BookOpen, Archive, Upload, KeyRound, Shield,
  SlidersHorizontal, ChevronDown, ChevronRight, LayoutTemplate,
} from 'lucide-react';
import { FR } from '../../constants/translations';
import { useAuthContext } from '../../contexts/AuthContext';
import type { Permission } from '../../types/auth';

interface SidebarProps {
  onNavigate: (path: string) => void;
  activePath: string;
  onLogout: () => void;
  // Conservés pour compatibilité avec Layout mais non utilisés pour le filtrage
  role?: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  permission: Permission;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: Users,         label: 'Élèves',       path: '/students', permission: 'students:view' },
  { icon: GraduationCap, label: 'Classes',       path: '/classes',  permission: 'classes:view' },
  { icon: BookOpen,      label: 'Professeurs',   path: '/teachers', permission: 'teachers:view' },
  { icon: ClipboardList, label: 'Notes',         path: '/grades',   permission: 'grades:view' },
  { icon: Upload,        label: 'Importer',      path: '/import',   permission: 'import:use' },
  { icon: Archive,       label: 'Archives',      path: '/archive',  permission: 'archive:view' },
  { icon: Settings,      label: FR.menu.settings, path: '/settings', permission: 'settings:view' },
];

export function Sidebar({ onNavigate, activePath, onLogout }: SidebarProps) {
  const { hasPermission, hasAnyPermission, session } = useAuthContext();
  const [optionsOpen, setOptionsOpen] = React.useState(
    activePath.startsWith('/options')
  );

  const visibleItems = MENU_ITEMS.filter(item => hasPermission(item.permission));
  const showAdmin = hasAnyPermission('admin:users', 'admin:roles');
  const showOptions = hasPermission('settings:view');

  return (
    <div className="h-screen w-64 bg-indigo-900 text-white flex flex-col">
      {/* Logo / Titre */}
      <div className="px-6 py-6 border-b border-indigo-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
            S
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">Collège Sully</h1>
            <p className="text-xs text-indigo-400">Gestion scolaire</p>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-indigo-400'} />
              <span>{item.label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </button>
          );
        })}

        {/* Séparateur + Options */}
        {showOptions && (
          <>
            <div className="my-2 border-t border-indigo-800" />
            {/* Menu Options (accordéon) */}
            <button
              onClick={() => setOptionsOpen((o) => !o)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activePath.startsWith('/options')
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={18} className={activePath.startsWith('/options') ? 'text-white' : 'text-indigo-400'} />
              <span>Options</span>
              <span className="ml-auto">
                {optionsOpen
                  ? <ChevronDown size={14} className="text-indigo-300" />
                  : <ChevronRight size={14} className="text-indigo-300" />
                }
              </span>
            </button>

            {optionsOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                <button
                  onClick={() => onNavigate('/options/templates')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activePath === '/options/templates'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'
                  }`}
                >
                  <LayoutTemplate size={15} className={activePath === '/options/templates' ? 'text-white' : 'text-indigo-400'} />
                  <span>Templates</span>
                  {activePath === '/options/templates' && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
              </div>
            )}
          </>
        )}

        {/* Séparateur + Administration */}
        {showAdmin && (
          <>
            <div className="my-2 border-t border-indigo-800" />
            <button
              onClick={() => onNavigate('/admin')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activePath === '/admin'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <KeyRound size={18} className={activePath === '/admin' ? 'text-white' : 'text-indigo-400'} />
              <span>Administration</span>
              {activePath === '/admin' && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
            </button>
          </>
        )}
      </nav>

      {/* Profil + déconnexion */}
      <div className="px-3 py-4 border-t border-indigo-800 space-y-1">
        {/* Info utilisateur connecté */}
        {session && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-800/40 mb-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${session.isSuperAdmin ? 'bg-violet-500' : 'bg-indigo-500'}`}>
              {session.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{session.fullName}</p>
              <div className="flex items-center gap-1">
                {session.isSuperAdmin && <Shield size={9} className="text-violet-300 flex-shrink-0" />}
                <p className="text-[10px] text-indigo-400 truncate">{session.roleLabel}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-300 hover:bg-indigo-800 hover:text-white transition-all"
        >
          <LogOut size={18} className="text-indigo-400" />
          <span>{FR.menu.logout}</span>
        </button>
      </div>
    </div>
  );
}
