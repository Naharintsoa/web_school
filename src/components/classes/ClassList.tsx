import React from 'react';
import { GraduationCap } from 'lucide-react';
import type { Grade, Student, Cycle } from '../../types';
import { CYCLES } from '../../utils/cycles';
import { CycleSection } from './CycleSection';
import { studentApi } from '../../services/api';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { FR } from '../../constants/translations';

export function ClassList() {
  const { currentYear } = useSchoolYear();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = React.useState<Grade | null>(null);

  React.useEffect(() => {
    studentApi.getAll(currentYear).then(setStudents);
  }, [currentYear]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">{FR.classes.title}</h1>
        </div>
      </div>

      {/* Cycles Sections */}
      {(Object.keys(CYCLES) as Cycle[]).map((cycle) => (
        <CycleSection
          key={cycle}
          cycle={cycle}
          students={students}
          selectedGrade={selectedGrade}
          onGradeSelect={setSelectedGrade}
        />
      ))}
    </div>
  );
}