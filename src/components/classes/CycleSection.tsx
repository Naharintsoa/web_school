import React from 'react';
import type { Cycle, Student } from '../../types/student';
import type { ClassLevel } from '../../types/student';
import { CYCLES } from '../../utils/cycles';
import { mockTeachers } from '../../data/mockTeachers';
import { ClassCard } from './ClassCard';

interface CycleSectionProps {
  cycle: Cycle;
  students: Student[];
  /** Liste explicite des niveaux à afficher (Sully ou Annexe) */
  gradesList: ClassLevel[];
  selectedGrade?: ClassLevel | null;
  onGradeSelect: (grade: ClassLevel) => void;
}

export function CycleSection({ cycle, students, gradesList, selectedGrade, onGradeSelect }: CycleSectionProps) {
  const cycleInfo = CYCLES[cycle];

  const getStudentCountByGrade = (grade: ClassLevel) =>
    students.filter(s => s.grade === grade).length;

  // Pour les classes Annexe (ex: 'PS-A'), chercher le teacher du niveau de base ('PS')
  const getTeachers = (grade: ClassLevel): string | string[] => {
    const key = grade as keyof typeof mockTeachers;
    if (mockTeachers[key]) return mockTeachers[key];
    const base = grade.replace(/-[AB]$/, '') as keyof typeof mockTeachers;
    return mockTeachers[base] ?? [];
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">{cycleInfo.name}</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gradesList.map((grade) => (
            <ClassCard
              key={grade}
              grade={grade}
              totalStudents={getStudentCountByGrade(grade)}
              teachers={getTeachers(grade)}
              isSelected={selectedGrade === grade}
              onSelect={() => onGradeSelect(grade)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
