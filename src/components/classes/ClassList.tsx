import React from 'react';
import { GraduationCap, Building2 } from 'lucide-react';
import type { Cycle, Student } from '../../types';
import type { ClassLevel } from '../../types/student';
import { CYCLES, ANNEXE_CYCLES } from '../../utils/cycles';
import { CycleSection } from './CycleSection';
import { studentApi } from '../../services/api';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { useSchool, SCHOOLS } from '../../contexts/SchoolContext';
import { FR } from '../../constants/translations';

export function ClassList() {
  const { currentYear } = useSchoolYear();
  const { currentSchool } = useSchool();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = React.useState<ClassLevel | null>(null);

  React.useEffect(() => {
    studentApi.getAll(currentYear, currentSchool).then(setStudents);
    setSelectedGrade(null); // reset sélection si on change d'établissement
  }, [currentYear, currentSchool]);

  const isAnnexe = currentSchool === 'sully-annexe';
  const cycles = isAnnexe ? ANNEXE_CYCLES : CYCLES;
  const school = SCHOOLS[currentSchool];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          {isAnnexe
            ? <Building2 className="h-8 w-8 text-violet-600" />
            : <GraduationCap className="h-8 w-8 text-indigo-600" />
          }
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{FR.classes.title}</h1>
            <p className={`text-sm font-medium mt-0.5 ${isAnnexe ? 'text-violet-600' : 'text-indigo-600'}`}>
              {school.name}
              {isAnnexe && ' — 2 sections parallèles par niveau'}
            </p>
          </div>
        </div>
      </div>

      {/* Cycles */}
      {(Object.keys(cycles) as Cycle[]).map((cycle) => (
        <CycleSection
          key={cycle}
          cycle={cycle}
          students={students}
          gradesList={cycles[cycle].grades as ClassLevel[]}
          selectedGrade={selectedGrade}
          onGradeSelect={setSelectedGrade}
        />
      ))}
    </div>
  );
}
