/**
 * Contexte de navigation global — basé sur React Router v6.
 * Permet à n'importe quel composant de naviguer via useNavigation().
 */
import { createContext, useContext, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

interface NavigationContextType {
  navigate: (path: string) => void;
  navigateToGrades: (grade: string) => void;
  activePath: string;
  preselectedGrade: string | null;
  clearPreselectedGrade: () => void;
}

export const NavigationContext = createContext<NavigationContextType>({
  navigate: () => {},
  navigateToGrades: () => {},
  activePath: '/students',
  preselectedGrade: null,
  clearPreselectedGrade: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

/** Hook interne utilisé dans App pour construire la valeur du contexte */
export function useNavigationProvider() {
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useCallback((path: string) => nav(path), [nav]);

  const navigateToGrades = useCallback((grade: string) => {
    nav(`/grades?classe=${encodeURIComponent(grade)}`);
  }, [nav]);

  const preselectedGrade = searchParams.get('classe');

  const clearPreselectedGrade = useCallback(() => {
    setSearchParams(prev => {
      prev.delete('classe');
      return prev;
    });
  }, [setSearchParams]);

  return useMemo(() => ({
    navigate,
    navigateToGrades,
    activePath: location.pathname,
    preselectedGrade,
    clearPreselectedGrade,
  }), [navigate, navigateToGrades, location.pathname, preselectedGrade, clearPreselectedGrade]);
}
