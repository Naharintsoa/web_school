/**
 * Contexte de navigation global — basé sur React Router v6.
 * Permet à n'importe quel composant de naviguer via useNavigation().
 */
import { createContext, useContext } from 'react';
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

  const navigate = (path: string) => nav(path);

  const navigateToGrades = (grade: string) => {
    nav(`/grades?classe=${encodeURIComponent(grade)}`);
  };

  const preselectedGrade = searchParams.get('classe');

  const clearPreselectedGrade = () => {
    setSearchParams(prev => {
      prev.delete('classe');
      return prev;
    });
  };

  return {
    navigate,
    navigateToGrades,
    activePath: location.pathname,
    preselectedGrade,
    clearPreselectedGrade,
  };
}
