/**
 * Page de sélection de classe pour accéder aux notes.
 * Affiche les classes Sully ou Sully Annexe selon l'établissement actif.
 */
import React, { useState, useEffect } from 'react';
import { GraduationCap, Building2, Users } from 'lucide-react';
import { CYCLES, ANNEXE_CYCLES } from '../../utils/cycles';
import type { Cycle } from '../../types/student';
import { ClassGradesList } from './ClassGradesList';
import { studentApi } from '../../services/api';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { useSchool, SCHOOLS } from '../../contexts/SchoolContext';

interface GradesListProps {
  initialGrade?: string | null;
  onGradeSelected?: () => void;
}

export function GradesList({ initialGrade, onGradeSelected }: GradesListProps) {
  const { currentYear } = useSchoolYear();
  const { currentSchool } = useSchool();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialGrade) {
      setSelectedGrade(initialGrade);
      onGradeSelected?.();
    }
  }, [initialGrade]);

  // Recharger les compteurs si l'établissement ou l'année change
  useEffect(() => {
    studentApi.getAll(currentYear, currentSchool).then(students => {
      const counts: Record<string, number> = {};
      students.forEach(s => { counts[s.grade] = (counts[s.grade] ?? 0) + 1; });
      setStudentCounts(counts);
    });
    // Désélectionner si on change d'établissement
    setSelectedGrade(null);
  }, [currentYear, currentSchool]);

  if (selectedGrade) {
    return (
      <ClassGradesList
        grade={selectedGrade}
        onBack={() => setSelectedGrade(null)}
      />
    );
  }

  const isAnnexe = currentSchool === 'sully-annexe';
  const cycles = isAnnexe ? ANNEXE_CYCLES : CYCLES;
  const school = SCHOOLS[currentSchool];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          {isAnnexe
            ? <Building2 className="h-8 w-8 text-violet-600" />
            : <GraduationCap className="h-8 w-8 text-indigo-600" />
          }
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notes & Bulletins</h1>
            <p className={`text-sm font-medium mt-0.5 ${isAnnexe ? 'text-violet-600' : 'text-indigo-600'}`}>
              {school.name} — Sélectionnez une classe
            </p>
          </div>
        </div>
      </div>

      {/* Cycles et classes */}
      {(Object.keys(cycles) as Cycle[]).map((cycle) => {
        const { name, grades } = cycles[cycle];
        return (
          <div key={cycle} className="bg-white rounded-lg shadow">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-700">{name}</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {grades.map((grade) => {
                  const count = studentCounts[grade] ?? 0;
                  return (
                    <button
                      key={grade}
                      onClick={() => setSelectedGrade(grade)}
                      className={`group relative flex flex-col items-center justify-center p-5 border-2 rounded-xl transition-all ${
                        isAnnexe
                          ? 'border-gray-200 hover:border-violet-400 hover:bg-violet-50'
                          : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      <span className={`text-xl font-bold text-gray-800 ${
                        isAnnexe ? 'group-hover:text-violet-700' : 'group-hover:text-indigo-700'
                      }`}>
                        {grade}
                      </span>
                      <div className={`flex items-center mt-1.5 text-xs text-gray-400 ${
                        isAnnexe ? 'group-hover:text-violet-500' : 'group-hover:text-indigo-500'
                      }`}>
                        <Users size={12} className="mr-1" />
                        <span>{count} élève{count !== 1 ? 's' : ''}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
