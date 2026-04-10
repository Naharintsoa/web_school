/**
 * BulletinMultiPrint — impression de tous les bulletins d'une classe.
 * 1 bulletin par page A4. Déclenche window.print() via un portal React.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BulletinPrintContent } from './report-card/BulletinPrintContent';
import { bulletinRemarksApi, type BulletinRemark } from '../../services/api/bulletinRemarksApi';
import { calculateAverage, getMentionFromAverage } from '../../utils/grades';
import type { Student } from '../../types/student';
import type { Grade } from '../../types/grade';
import type { Subject } from '../../types/subject';

interface BulletinMultiPrintProps {
  students: Student[];
  allGrades: Grade[];
  subjects: Subject[];
  term: 1 | 2 | 3;
  schoolYear: string;
  teacherName: string;
  classStats: Record<string, { avg: number; min: number; max: number }>;
  classAverage: number;
  onDone: () => void;
}

export function BulletinMultiPrint({
  students, allGrades, subjects, term, schoolYear,
  teacherName, classStats, classAverage, onDone,
}: BulletinMultiPrintProps) {

  const [remarks, setRemarks] = useState<Record<string, BulletinRemark> | null>(null);

  // 1. Charger les absences/retards/observations de tous les élèves
  useEffect(() => {
    bulletinRemarksApi
      .getBatch(students.map(s => s.id), term)
      .then(list => {
        const map: Record<string, BulletinRemark> = {};
        for (const r of list) map[r.studentId] = r;
        setRemarks(map);
      })
      .catch(() => setRemarks({})); // en cas d'erreur, on continue sans données
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Imprimer seulement quand les remarques sont chargées
  useEffect(() => {
    if (remarks === null) return; // pas encore chargé

    const waitForImages = () => {
      const portal = document.querySelector('.bulletin-multi-portal');
      if (!portal) { window.print(); onDone(); return; }

      const imgs = Array.from(portal.querySelectorAll('img')) as HTMLImageElement[];
      const pending = imgs.filter(img => !img.complete);

      if (pending.length === 0) { window.print(); onDone(); return; }

      let resolved = 0;
      const tryPrint = () => { if (++resolved >= pending.length) { window.print(); onDone(); } };
      pending.forEach(img => {
        img.addEventListener('load',  tryPrint, { once: true });
        img.addEventListener('error', tryPrint, { once: true });
      });
      setTimeout(() => { window.print(); onDone(); }, 4000);
    };

    const timer = setTimeout(waitForImages, 150);
    return () => clearTimeout(timer);
  }, [remarks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tant que les remarques ne sont pas chargées, ne pas rendre le portal
  if (remarks === null) return null;

  return createPortal(
    <div className="bulletin-multi-portal">
      {students.map(student => {
        const studentGrades    = allGrades.filter(g => g.studentId === student.id);
        const activeSubjectIds = new Set(subjects.map(s => s.id));
        const termGrades       = studentGrades.filter(g => g.term === term && activeSubjectIds.has(g.subjectId));

        const otherTermsAverages = ([1, 2, 3] as const)
          .filter(t => t !== term)
          .map(t => ({
            term: t,
            average: calculateAverage(studentGrades.filter(g => g.term === t)),
          }))
          .filter(t => t.average > 0);

        const r = remarks[student.id];
        const mention     = r?.mention     || getMentionFromAverage(calculateAverage(termGrades));
        const observation = r?.observation || '';
        const absences    = r?.absences    || '';
        const demiJournees = r?.demiJournees || '';
        const retards     = r?.retards     || '';

        return (
          <div key={student.id} className="bulletin-page">
            <BulletinPrintContent
              student={student}
              grades={termGrades}
              subjects={subjects}
              classStats={classStats}
              term={term}
              schoolYear={schoolYear}
              classAverage={classAverage}
              teacherName={teacherName}
              otherTermsAverages={otherTermsAverages}
              mention={mention}
              observation={observation}
              absences={absences}
              demiJournees={demiJournees}
              retards={retards}
            />
          </div>
        );
      })}

      <style>{`
        .bulletin-multi-portal {
          position: fixed;
          top: -99999px;
          left: 0;
          width: 0;
          overflow: hidden;
        }

        @media print {
          body > *:not(.bulletin-multi-portal) { display: none !important; }

          .bulletin-multi-portal {
            position: static !important;
            width: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          .bulletin-page {
            page-break-after: always;
            break-after: page;
            width: 210mm;
            box-sizing: border-box;
            background: white;
          }
          .bulletin-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          .bulletin-page img {
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body, html { margin: 0; padding: 0; background: white; }
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}</style>
    </div>,
    document.body
  );
}
