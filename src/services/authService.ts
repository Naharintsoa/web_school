/**
 * Service d'authentification — Collège Sully
 *
 * - Hachage SHA-256 des mots de passe (Web Crypto API)
 * - Gestion des utilisateurs et rôles (localStorage)
 * - Session stockée en sessionStorage (expire à la fermeture du navigateur)
 * - Compte super_admin protégé : ne peut être supprimé ni désactivé
 */
import { STORAGE_KEYS } from './storage/constants';
import type { AppUser, AppRole, AuthSession, Permission } from '../types/auth';
import { DEFAULT_ROLES, ALL_PERMISSIONS } from '../types/auth';

// ─── Salt applicatif (côté client, pas de secret serveur) ─────────────────────
const APP_SALT = 'college-sully-2024-secure-salt';

// ─── Identifiants du super admin (par défaut) ─────────────────────────────────
const SUPER_ADMIN_USERNAME = 'admin';
const SUPER_ADMIN_DEFAULT_PASSWORD = 'Admin@Sully2024';
const SUPER_ADMIN_ID = 'super-admin-fixed-id';

// ─── Utilitaires cryptographiques ─────────────────────────────────────────────

/** SHA-256 du mot de passe + salt */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + APP_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Stockage ─────────────────────────────────────────────────────────────────

function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: AppUser[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function loadRoles(): AppRole[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROLES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRoles(roles: AppRole[]): void {
  localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
}

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * À appeler au démarrage de l'app.
 * Crée les rôles par défaut et le super admin s'ils n'existent pas.
 */
export async function initializeAuth(): Promise<void> {
  // Initialiser les rôles par défaut si absents
  const roles = loadRoles();
  if (roles.length === 0) {
    saveRoles(DEFAULT_ROLES);
  } else {
    // Synchroniser les rôles système (mettre à jour les permissions si nécessaire)
    const updated = roles.map(r => {
      const def = DEFAULT_ROLES.find(d => d.id === r.id);
      return def && def.isSystem ? { ...r, permissions: def.permissions, isSystem: true } : r;
    });
    // Ajouter les nouveaux rôles par défaut manquants
    DEFAULT_ROLES.forEach(def => {
      if (!updated.find(u => u.id === def.id)) {
        updated.push(def);
      }
    });
    saveRoles(updated);
  }

  // Créer le super admin si absent
  const users = loadUsers();
  if (!users.find(u => u.isSuperAdmin)) {
    const hash = await hashPassword(SUPER_ADMIN_DEFAULT_PASSWORD);
    const superAdmin: AppUser = {
      id: SUPER_ADMIN_ID,
      username: SUPER_ADMIN_USERNAME,
      fullName: 'Administrateur Principal',
      email: 'admin@college-sully.mg',
      passwordHash: hash,
      roleId: 'super_admin',
      isActive: true,
      isSuperAdmin: true,
      createdAt: new Date().toISOString(),
    };
    users.push(superAdmin);
    saveUsers(users);
  }
}

// ─── Session ──────────────────────────────────────────────────────────────────

function buildSession(user: AppUser, role: AppRole): AuthSession {
  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    roleId: role.id,
    roleLabel: role.label,
    permissions: role.permissions,
    isSuperAdmin: user.isSuperAdmin,
    loginAt: Date.now(),
  };
}

function saveSession(session: AuthSession): void {
  sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
}

// ─── Authentification ─────────────────────────────────────────────────────────

/** Retourne la session si login réussi, null sinon */
export async function loginUser(
  username: string,
  password: string
): Promise<AuthSession | null> {
  const users = loadUsers();
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.isActive
  );
  if (!user) return null;

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return null;

  const roles = loadRoles();
  const role = roles.find(r => r.id === user.roleId);
  if (!role) return null;

  // Mettre à jour lastLoginAt
  const updated = users.map(u =>
    u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u
  );
  saveUsers(updated);

  const session = buildSession(user, role);
  saveSession(session);
  return session;
}

export function logoutUser(): void {
  clearSession();
}

// ─── Gestion des utilisateurs (admin:users requis) ────────────────────────────

export function getUsers(): AppUser[] {
  return loadUsers();
}

export async function createUser(data: {
  username: string;
  fullName: string;
  email: string;
  password: string;
  roleId: string;
}): Promise<AppUser> {
  const users = loadUsers();

  if (users.find(u => u.username.toLowerCase() === data.username.toLowerCase())) {
    throw new Error("Ce nom d'utilisateur est déjà utilisé.");
  }

  const hash = await hashPassword(data.password);
  const user: AppUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: data.username,
    fullName: data.fullName,
    email: data.email,
    passwordHash: hash,
    roleId: data.roleId,
    isActive: true,
    isSuperAdmin: false,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  return user;
}

export async function updateUser(
  id: string,
  data: {
    fullName?: string;
    email?: string;
    roleId?: string;
    isActive?: boolean;
    newPassword?: string;
  }
): Promise<AppUser> {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Utilisateur introuvable.');

  const user = users[idx];
  if (user.isSuperAdmin && data.isActive === false) {
    throw new Error('Le super administrateur ne peut pas être désactivé.');
  }
  if (user.isSuperAdmin && data.roleId && data.roleId !== 'super_admin') {
    throw new Error('Le rôle du super administrateur ne peut pas être modifié.');
  }

  const updated: AppUser = {
    ...user,
    fullName: data.fullName ?? user.fullName,
    email: data.email ?? user.email,
    roleId: data.roleId ?? user.roleId,
    isActive: data.isActive !== undefined ? data.isActive : user.isActive,
    passwordHash: data.newPassword
      ? await hashPassword(data.newPassword)
      : user.passwordHash,
  };

  users[idx] = updated;
  saveUsers(users);
  return updated;
}

export function deleteUser(id: string): void {
  const users = loadUsers();
  const user = users.find(u => u.id === id);
  if (!user) throw new Error('Utilisateur introuvable.');
  if (user.isSuperAdmin) throw new Error('Le super administrateur ne peut pas être supprimé.');
  saveUsers(users.filter(u => u.id !== id));
}

export function toggleUserActive(id: string): void {
  const users = loadUsers();
  const user = users.find(u => u.id === id);
  if (!user) throw new Error('Utilisateur introuvable.');
  if (user.isSuperAdmin) throw new Error('Le super administrateur ne peut pas être désactivé.');
  saveUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
}

// ─── Gestion des rôles (admin:roles requis) ───────────────────────────────────

export function getRoles(): AppRole[] {
  return loadRoles();
}

export function createRole(data: {
  name: string;
  label: string;
  permissions: Permission[];
}): AppRole {
  const roles = loadRoles();
  if (roles.find(r => r.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error('Un rôle avec ce nom existe déjà.');
  }
  const role: AppRole = {
    id: `role-${Date.now()}`,
    name: data.name.toLowerCase().replace(/\s+/g, '_'),
    label: data.label,
    permissions: data.permissions,
    isSystem: false,
  };
  saveRoles([...roles, role]);
  return role;
}

export function updateRole(
  id: string,
  data: { label?: string; permissions?: Permission[] }
): AppRole {
  const roles = loadRoles();
  const idx = roles.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Rôle introuvable.');

  const role = roles[idx];
  // Le rôle super_admin ne peut pas être modifié
  if (role.id === 'super_admin') {
    throw new Error('Le rôle super administrateur ne peut pas être modifié.');
  }

  const updated: AppRole = {
    ...role,
    label: data.label ?? role.label,
    permissions: data.permissions ?? role.permissions,
  };
  roles[idx] = updated;
  saveRoles(roles);
  return updated;
}

export function deleteRole(id: string): void {
  const roles = loadRoles();
  const role = roles.find(r => r.id === id);
  if (!role) throw new Error('Rôle introuvable.');
  if (role.isSystem) throw new Error('Les rôles système ne peuvent pas être supprimés.');

  const users = loadUsers();
  if (users.some(u => u.roleId === id)) {
    throw new Error('Ce rôle est utilisé par des utilisateurs. Veuillez les réassigner avant de supprimer.');
  }
  saveRoles(roles.filter(r => r.id !== id));
}

// ─── Vérification des permissions ────────────────────────────────────────────

export function hasPermission(session: AuthSession | null, permission: Permission): boolean {
  if (!session) return false;
  if (session.isSuperAdmin) return true;
  return session.permissions.includes(permission);
}

export function hasAnyPermission(session: AuthSession | null, ...permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(session, p));
}

export { ALL_PERMISSIONS };
