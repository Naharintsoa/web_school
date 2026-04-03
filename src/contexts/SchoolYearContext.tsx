import React, { createContext, useContext, useState } from 'react';

const YEAR_KEY = 'sully-school-year';
/** Clé de migration : si la version change, le localStorage est réinitialisé */
const MIGRATION_KEY = 'sully-year-migration-v2';
const DEFAULT_YEAR = '2024-2025';

function resolveInitialYear(): string {
  // Forcer la réinitialisation si la migration v2 n'a pas encore tourné
  if (!localStorage.getItem(MIGRATION_KEY)) {
    localStorage.removeItem(YEAR_KEY);
    localStorage.setItem(MIGRATION_KEY, '1');
    return DEFAULT_YEAR;
  }
  return localStorage.getItem(YEAR_KEY) ?? DEFAULT_YEAR;
}

interface SchoolYearContextType {
  currentYear: string;
  setCurrentYear: (year: string) => void;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

export function SchoolYearProvider({ children }: { children: React.ReactNode }) {
  const [currentYear, _setCurrentYear] = useState<string>(resolveInitialYear);

  const setCurrentYear = (year: string) => {
    localStorage.setItem(YEAR_KEY, year);
    _setCurrentYear(year);
  };

  return (
    <SchoolYearContext.Provider value={{ currentYear, setCurrentYear }}>
      {children}
    </SchoolYearContext.Provider>
  );
}

export function useSchoolYear() {
  const context = useContext(SchoolYearContext);
  if (context === undefined) {
    throw new Error('useSchoolYear must be used within a SchoolYearProvider');
  }
  return context;
}
