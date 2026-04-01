import React from 'react';
import type { Grade } from '../../../../types';
import { getTeacherForSubject } from '../../../../utils/teachers';
import { calculateAverage } from '../../../../utils/grades';

interface GradesTableProps {
  grades: Grade[];
  classAverage: number;
  term: number;
}

export function GradesTable({ grades, classAverage, term }: GradesTableProps) {
  const getLevel = (score: number): 'A' | 'B' | 'C' => {
    if (score >= 16) return 'A';
    if (score >= 14) return 'B';
    return 'C';
  };

  const studentAverage = calculateAverage(grades);

  return (
    <table className="grades-table">
      <thead>
        <tr>
          <th>Matière & Professeur</th>
          <th className="text-center">Note</th>
          <th className="text-center">Coef</th>
          <th className="text-center">Moyenne classe</th>
          <th className="text-center">Niveau</th>
          <th>Appréciation</th>
        </tr>
      </thead>
      <tbody>
        {grades.map((grade) => {
          const level = getLevel(grade.score);
          const teacher = getTeacherForSubject(grade.subjectId);
          
          return (
            <tr key={grade.id}>
              <td>
                <div className="font-medium">{grade.subjectName}</div>
                <div className="text-sm text-gray-500">{teacher?.name || 'Non assigné'}</div>
              </td>
              <td className="text-center font-medium">{grade.score.toFixed(2)}</td>
              <td className="text-center">{grade.coefficient}</td>
              <td className="text-center">{grade.classAverage.toFixed(2)}</td>
              <td className="text-center">
                <span className={`level-badge level-${level}`}>{level}</span>
              </td>
              <td>{grade.comments}</td>
            </tr>
          );
        })}
        <tr className="font-medium bg-gray-50">
          <td>MOYENNE TRIMESTRE {term}</td>
          <td className="text-center">{studentAverage.toFixed(2)}</td>
          <td></td>
          <td className="text-center">{classAverage.toFixed(2)}</td>
          <td colSpan={2}></td>
        </tr>
      </tbody>
    </table>
  );
}