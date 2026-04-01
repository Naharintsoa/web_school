/**
 * Hook de compatibilité — délègue à AuthContext.
 * Maintient l'interface { user, loading, login, logout } pour App.tsx.
 */
import { useAuthContext } from '../contexts/AuthContext';
import type { User } from '../types/user';

export function useAuth() {
  const { session, loading, login: ctxLogin, logout } = useAuthContext();

  // Mapper la session vers l'ancien type User pour les composants existants
  const user: User | null = session
    ? {
        id: session.userId,
        username: session.username,
        role: session.isSuperAdmin || session.roleId === 'gestionnaire' ? 'admin'
             : session.roleId === 'professeur' ? 'teacher'
             : session.roleId === 'parent'     ? 'parent'
             : 'teacher',
        name: session.fullName,
      }
    : null;

  const login = async (username: string, password: string): Promise<void> => {
    const ok = await ctxLogin(username, password);
    if (!ok) throw new Error('Identifiants incorrects ou compte désactivé.');
  };

  return { user, loading, login, logout };
}
