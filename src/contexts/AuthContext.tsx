/**
 * AuthContext — fournit la session, les fonctions login/logout
 * et la vérification de permissions à toute l'application.
 * La session est restaurée depuis le cookie JWT via GET /api/auth/me.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthSession, Permission } from '../types/auth';
import { apiFetch } from '../services/api/client';
import {
  loginUser,
  logoutUser,
  hasPermission as checkPerm,
  hasAnyPermission as checkAnyPerm,
} from '../services/authService';

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (...permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurer la session depuis le cookie httpOnly via GET /api/auth/me
    apiFetch<AuthSession>('/auth/me')
      .then(s => setSession(s))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const s = await loginUser(username, password);
    if (s) {
      setSession(s);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setSession(null);
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => checkPerm(session, permission),
    [session]
  );

  const hasAnyPermission = useCallback(
    (...permissions: Permission[]) => checkAnyPerm(session, ...permissions),
    [session]
  );

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook principal — accès au contexte d'auth */
export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext doit être utilisé dans <AuthProvider>');
  return ctx;
}
