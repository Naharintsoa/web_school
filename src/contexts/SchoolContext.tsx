/**
 * SchoolContext — établissement actif (Collège Sully ou Sully Annexe).
 * Persiste dans localStorage afin de survivre aux rechargements.
 */
import React, { createContext, useContext, useState } from 'react';
import type { SchoolId } from '../types/student';

export type { SchoolId };

export const SCHOOLS: Record<SchoolId, { id: SchoolId; name: string; shortName: string; color: string }> = {
  'sully': {
    id: 'sully',
    name: 'Collège Sully',
    shortName: 'Sully',
    color: 'indigo',
  },
  'sully-annexe': {
    id: 'sully-annexe',
    name: 'Sully Annexe',
    shortName: 'Annexe',
    color: 'violet',
  },
};

const SCHOOL_KEY = 'sully-current-school';

interface SchoolContextType {
  currentSchool: SchoolId;
  setCurrentSchool: (school: SchoolId) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [currentSchool, _setCurrentSchool] = useState<SchoolId>(() => {
    const stored = localStorage.getItem(SCHOOL_KEY);
    return stored === 'sully-annexe' ? 'sully-annexe' : 'sully';
  });

  const setCurrentSchool = (school: SchoolId) => {
    localStorage.setItem(SCHOOL_KEY, school);
    _setCurrentSchool(school);
  };

  return (
    <SchoolContext.Provider value={{ currentSchool, setCurrentSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used within a SchoolProvider');
  return ctx;
}
