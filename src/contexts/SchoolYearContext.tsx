import React, { createContext, useContext, useState } from 'react';

interface SchoolYearContextType {
  currentYear: string;
  setCurrentYear: (year: string) => void;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

export function SchoolYearProvider({ children }: { children: React.ReactNode }) {
  const [currentYear, setCurrentYear] = useState('2024-2025');

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