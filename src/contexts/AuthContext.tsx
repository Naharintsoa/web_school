/**
 * AuthContext — fournit la session, les fonctions login/logout
 * et la vérification de permissions à toute l'application.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthSession, Permission } from '../types/auth';
import {
  initializeAuth,
  loginUser,
  logoutUser,
  getSession,
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
    (async () => {
      // Initialiser les rôles par défaut + super admin si première utilisation
      await initializeAuth();
      // Restaurer la session courante (sessionStorage)
      const existing = getSession();
      setSession(existing);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const s = await loginUser(username, password);
    if (s) {
      setSession(s);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
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
