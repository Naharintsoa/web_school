import React, { createContext, useContext, useState } from 'react';

const YEAR_KEY = 'sully-school-year';

interface SchoolYearContextType {
  currentYear: string;
  setCurrentYear: (year: string) => void;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

export function SchoolYearProvider({ children }: { children: React.ReactNode }) {
  const [currentYear, _setCurrentYear] = useState<string>(
    () => localStorage.getItem(YEAR_KEY) ?? '2025-2026'
  );

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