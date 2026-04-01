import React from 'react';
import type { Grade } from '../../../types';
import './print.css'; // Importation des styles pour l'impression

interface GradesTableProps {
  grades: Grade[];
  classAverage: number;
  absences?: number;
  delays?: number;
}

export function GradesTable({ grades, classAverage, absences, delays }: GradesTableProps) {
  const studentAverage = calculateStudentAverage(grades);

  return (
    <div>
      {/* Bouton d'impression (non visible lors de l'impression) */}
      <button className="no-print" onClick={() => window.print()}>Imprimer</button>

      {/* Tableau des notes */}
      <table className="grades-table">
        <thead>
          <tr>
            <th rowSpan={2}>
              <strong>DISCIPLINE</strong><br />
              Nom du professeur
            </th>
            <th colSpan={2} className="text-center">Moyennes</th>
            <th></th>
            <th colSpan={2} className="text-center">Notes extrêmes</th>
            <th rowSpan={2} className="text-center">Niveaux</th>
            <th rowSpan={2} className="text-center">Appréciations générales</th>
          </tr>
          <tr>
            <th className="text-center">Elève</th>
            <th className="text-center">Classe</th>
            <th className="text-center">Coef</th>
            <th className="text-center">min</th>
            <th className="text-center">max</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <GradeRow key={grade.id} grade={grade} />
          ))}

          <tr className="average-row">
            <td><strong>MOYENNE TRIMESTRE</strong></td>
            <td className="text-center"><strong>{studentAverage.toFixed(2)}</strong></td>
            <td className="text-center"><strong>{classAverage.toFixed(2)}</strong></td>
            <td colSpan={5} className="text-center"></td>
          </tr>

          <tr>
            <td>Absences: (en demi-journée)</td>
            <td colSpan={2} className="text-center">{absences || '-'}</td>
            <td colSpan={5}></td>
          </tr>
          <tr>
            <td>Retards:</td>
            <td colSpan={2} className="text-center">{delays || '-'}</td>
            <td colSpan={5}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GradeRow({ grade }: { grade: Grade }) {
  const getLevel = (score: number) => {
    if (score >= 18) return 'A+';
    if (score >= 16) return 'A';
    if (score >= 14) return 'B+';
    if (score >= 12) return 'B';
    if (score >= 10) return 'C';
    return 'D';
  };

  return (
    <tr>
      <td>
        <strong>{grade.subjectName}</strong><br />
        {grade.teacherName}
      </td>
      <td className="text-center">{grade.score.toFixed(2)}</td>
      <td className="text-center">{grade.classAverage.toFixed(2)}</td>
      <td className="text-center">{grade.coefficient}</td>
      <td className="text-center">{grade.minScore.toFixed(1)}</td>
      <td className="text-center">{grade.maxScore.toFixed(1)}</td>
      <td className="text-center">{getLevel(grade.score)}</td>
      <td>{grade.comments}</td>
    </tr>
  );
}

function calculateStudentAverage(grades: Grade[]): number {
  const totalWeightedScore = grades.reduce((sum, grade) => 
    sum + (grade.score * grade.coefficient), 0
  );
  const totalCoefficients = grades.reduce((sum, grade) => 
    sum + grade.coefficient, 0
  );
  return totalWeightedScore / totalCoefficients;
}
