/**
 * Système d'authentification et de permissions — Collège Sully
 *
 * Permission : action atomique (ex. 'students:view')
 * AppRole    : rôle avec liste de permissions
 * AppUser    : compte utilisateur stocké
 * AuthSession: état de session en mémoire (après login)
 */

// ─── Permissions ──────────────────────────────────────────────────────────────

export type Permission =
  // Élèves
  | 'students:view'
  | 'students:create'
  | 'students:edit'
  | 'students:delete'
  // Classes
  | 'classes:view'
  | 'classes:manage'
  // Notes
  | 'grades:view'
  | 'grades:edit'
  // Professeurs
  | 'teachers:view'
  | 'teachers:manage'
  // Documents (badges, cartes, certificats)
  | 'documents:generate'
  // Import Excel/CSV
  | 'import:use'
  // Archives
  | 'archive:view'
  | 'archive:manage'
  // Paramètres
  | 'settings:view'
  | 'settings:edit'
  // Administration des comptes
  | 'admin:users'
  | 'admin:roles';

export const ALL_PERMISSIONS: Permission[] = [
  'students:view', 'students:create', 'students:edit', 'students:delete',
  'classes:view', 'classes:manage',
  'grades:view', 'grades:edit',
  'teachers:view', 'teachers:manage',
  'documents:generate',
  'import:use',
  'archive:view', 'archive:manage',
  'settings:view', 'settings:edit',
  'admin:users', 'admin:roles',
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  'students:view':    'Voir les élèves',
  'students:create':  'Créer des élèves',
  'students:edit':    'Modifier des élèves',
  'students:delete':  'Supprimer des élèves',
  'classes:view':     'Voir les classes',
  'classes:manage':   'Gérer les classes',
  'grades:view':      'Voir les notes',
  'grades:edit':      'Modifier les notes',
  'teachers:view':    'Voir les professeurs',
  'teachers:manage':  'Gérer les professeurs',
  'documents:generate': 'Générer des documents',
  'import:use':       "Importer des données",
  'archive:view':     'Voir les archives',
  'archive:manage':   'Gérer les archives',
  'settings:view':    'Voir les paramètres',
  'settings:edit':    'Modifier les paramètres',
  'admin:users':      'Gestion des utilisateurs',
  'admin:roles':      'Gestion des rôles',
};

/** Groupes de permissions pour l'UI */
export const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  {
    label: 'Élèves',
    perms: ['students:view', 'students:create', 'students:edit', 'students:delete'],
  },
  {
    label: 'Classes & Professeurs',
    perms: ['classes:view', 'classes:manage', 'teachers:view', 'teachers:manage'],
  },
  {
    label: 'Notes',
    perms: ['grades:view', 'grades:edit'],
  },
  {
    label: 'Documents & Import',
    perms: ['documents:generate', 'import:use'],
  },
  {
    label: 'Archives & Paramètres',
    perms: ['archive:view', 'archive:manage', 'settings:view', 'settings:edit'],
  },
  {
    label: 'Administration',
    perms: ['admin:users', 'admin:roles'],
  },
];

// ─── Rôles ────────────────────────────────────────────────────────────────────

export interface AppRole {
  id: string;
  name: string;
  label: string;
  permissions: Permission[];
  isSystem: boolean; // Les rôles système ne peuvent pas être supprimés
}

export const DEFAULT_ROLES: AppRole[] = [
  {
    id: 'super_admin',
    name: 'super_admin',
    label: 'Super Administrateur',
    permissions: [...ALL_PERMISSIONS],
    isSystem: true,
  },
  {
    id: 'gestionnaire',
    name: 'gestionnaire',
    label: 'Gestionnaire',
    permissions: [
      'students:view', 'students:create', 'students:edit', 'students:delete',
      'classes:view', 'classes:manage',
      'grades:view', 'grades:edit',
      'teachers:view', 'teachers:manage',
      'documents:generate',
      'import:use',
      'archive:view', 'archive:manage',
      'settings:view', 'settings:edit',
    ],
    isSystem: true,
  },
  {
    id: 'professeur',
    name: 'professeur',
    label: 'Professeur',
    permissions: [
      'students:view',
      'classes:view',
      'grades:view', 'grades:edit',
      'teachers:view',
      'documents:generate',
    ],
    isSystem: false,
  },
  {
    id: 'secretaire',
    name: 'secretaire',
    label: 'Secrétaire',
    permissions: [
      'students:view', 'students:create', 'students:edit',
      'classes:view',
      'grades:view',
      'teachers:view',
      'documents:generate',
      'import:use',
      'archive:view',
    ],
    isSystem: false,
  },
  {
    id: 'parent',
    name: 'parent',
    label: 'Parent',
    permissions: ['grades:view'],
    isSystem: false,
  },
];

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: string;
  isActive: boolean;
  isSuperAdmin: boolean; // protégé : ne peut être supprimé ni désactivé
  createdAt: string;
  lastLoginAt?: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface AuthSession {
  userId: string;
  username: string;
  fullName: string;
  roleId: string;
  roleLabel: string;
  permissions: Permission[];
  isSuperAdmin: boolean;
  loginAt: number;
}
