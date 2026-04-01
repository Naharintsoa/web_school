/**
 * Contexte de navigation global
 * Permet à n'importe quel composant de naviguer vers une autre page
 * sans avoir à passer des callbacks par les props (prop drilling).
 */
import React, { createContext, useContext } from 'react';

interface NavigationContextType {
  /** Naviguer vers un chemin (ex: '/students', '/grades') */
  navigate: (path: string) => void;
  /** Naviguer vers la page des notes en présélectionnant une classe */
  navigateToGrades: (grade: string) => void;
  /** Chemin actif courant */
  activePath: string;
  /** Classe présélectionnée pour la page des notes (peut être null) */
  preselectedGrade: string | null;
  /** Efface la classe présélectionnée après utilisation */
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
