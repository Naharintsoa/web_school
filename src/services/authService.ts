/**
 * Service d'authentification — Collège Sully
 *
 * Toutes les opérations passent par l'API Express.
 * La session est gérée via cookie httpOnly (JWT).
 */
import { apiFetch } from './api/client';
import type { AppUser, AppRole, AuthSession, Permission } from '../types/auth';
import { ALL_PERMISSIONS } from '../types/auth';

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * À appeler au démarrage de l'app.
 * Tente de récupérer la session courante depuis le cookie.
 * Retourne la session ou null si non connecté.
 */
export async function initializeAuth(): Promise<AuthSession | null> {
  try {
    return await apiFetch<AuthSession>('/auth/me');
  } catch {
    return null;
  }
}

// ─── Session ──────────────────────────────────────────────────────────────────

/** La session est gérée côté serveur via cookie. Retourne toujours null. */
export function getSession(): AuthSession | null {
  return null;
}

// ─── Authentification ─────────────────────────────────────────────────────────

/** Retourne la session si login réussi, null sinon */
export async function loginUser(
  username: string,
  password: string
): Promise<AuthSession | null> {
  try {
    return await apiFetch<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' });
  } catch {
    // Ignorer l'erreur — le cookie sera quand même effacé côté serveur
  }
}

// ─── Gestion des utilisateurs (admin:users requis) ────────────────────────────

export async function getUsers(): Promise<AppUser[]> {
  return apiFetch<AppUser[]>('/users');
}

export async function createUser(data: {
  username: string;
  fullName: string;
  email: string;
  password: string;
  roleId: string;
}): Promise<AppUser> {
  return apiFetch<AppUser>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
  return apiFetch<AppUser>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/users/${id}`, { method: 'DELETE' });
}

export async function toggleUserActive(id: string): Promise<AppUser> {
  return apiFetch<AppUser>(`/users/${id}/toggle`, { method: 'PATCH' });
}

// ─── Gestion des rôles (admin:roles requis) ───────────────────────────────────

export async function getRoles(): Promise<AppRole[]> {
  return apiFetch<AppRole[]>('/roles');
}

export async function createRole(data: {
  name: string;
  label: string;
  permissions: Permission[];
}): Promise<AppRole> {
  return apiFetch<AppRole>('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(
  id: string,
  data: { label?: string; permissions?: Permission[] }
): Promise<AppRole> {
  return apiFetch<AppRole>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRole(id: string): Promise<void> {
  return apiFetch<void>(`/roles/${id}`, { method: 'DELETE' });
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
