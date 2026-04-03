/**
 * Page de sélection de classe pour accéder aux notes.
 * Supporte une présélection de classe via la prop `initialGrade`
 * (utilisée lors de la navigation depuis ClassCard → "Voir les notes").
 */
import React, { useState, useEffect } from 'react';
import { GraduationCap, Users } from 'lucide-react';
import { CYCLES } from '../../utils/cycles';
import { ClassGradesList } from './ClassGradesList';
import { studentApi } from '../../services/api';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

interface GradesListProps {
  /** Classe à présélectionner automatiquement (optionnel) */
  initialGrade?: string | null;
  /** Appelé après l'utilisation du grade initial pour le réinitialiser */
  onGradeSelected?: () => void;
}

export function GradesList({ initialGrade, onGradeSelected }: GradesListProps) {
  const { currentYear } = useSchoolYear();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  // Nombre d'élèves par classe pour l'affichage
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  // Si une classe est présélectionnée depuis l'extérieur, l'activer immédiatement
  useEffect(() => {
    if (initialGrade) {
      setSelectedGrade(initialGrade);
      onGradeSelected?.();
    }
  }, [initialGrade]);

  // Charger les compteurs d'élèves par classe
  useEffect(() => {
    studentApi.getAll(currentYear).then(students => {
      const counts: Record<string, number> = {};
      students.forEach(s => {
        counts[s.grade] = (counts[s.grade] ?? 0) + 1;
      });
      setStudentCounts(counts);
    });
  }, [currentYear]);

  if (selectedGrade) {
    return (
      <ClassGradesList
        grade={selectedGrade}
        onBack={() => setSelectedGrade(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notes & Bulletins</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Sélectionnez une classe pour saisir ou consulter les notes
            </p>
          </div>
        </div>
      </div>

      {/* Cycles et classes */}
      {Object.entries(CYCLES).map(([cycle, { name, grades }]) => (
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
                    className="group relative flex flex-col items-center justify-center p-5 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                  >
                    <span className="text-xl font-bold text-gray-800 group-hover:text-indigo-700">
                      {grade}
                    </span>
                    <div className="flex items-center mt-1.5 text-xs text-gray-400 group-hover:text-indigo-500">
                      <Users size={12} className="mr-1" />
                      <span>{count} élève{count !== 1 ? 's' : ''}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
