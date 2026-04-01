import React from 'react';
import type { Cycle, Grade, Student } from '../../types/student';
import { CYCLES } from '../../utils/cycles';
import { mockTeachers } from '../../data/mockTeachers';
import { ClassCard } from './ClassCard';

interface CycleSectionProps {
  cycle: Cycle;
  students: Student[];
  selectedGrade?: Grade | null;
  onGradeSelect: (grade: Grade) => void;
}

export function CycleSection({ cycle, students, selectedGrade, onGradeSelect }: CycleSectionProps) {
  const cycleInfo = CYCLES[cycle];
  const getStudentCountByGrade = (grade: Grade) => {
    return students.filter(student => student.grade === grade).length;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">{cycleInfo.name}</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycleInfo.grades.map((grade) => (
            <ClassCard
              key={grade}
              grade={grade}
              totalStudents={getStudentCountByGrade(grade)}
              teachers={mockTeachers[grade]}
              isSelected={selectedGrade === grade}
              onSelect={() => onGradeSelect(grade)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}