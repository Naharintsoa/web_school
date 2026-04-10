/**
 * BulletinMultiPrint — impression de tous les bulletins d'une classe.
 * 1 bulletin par page A4. Déclenche window.print() via un portal React.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BulletinPrintContent } from './report-card/BulletinPrintContent';
import { calculateAverage, getMentionFromAverage } from '../../utils/grades';
import type { Student } from '../../types/student';
import type { Grade } from '../../types/grade';
import type { Subject } from '../../types/subject';

interface BulletinMultiPrintProps {
  students: Student[];
  /** Toutes les notes de la classe (tous trimestres) */
  allGrades: Grade[];
  subjects: Subject[];
  term: 1 | 2 | 3;
  schoolYear: string;
  teacherName: string;
  /** Stats de classe par subjectId (trimestre courant) */
  classStats: Record<string, { avg: number; min: number; max: number }>;
  classAverage: number;
  onDone: () => void;
}

export function BulletinMultiPrint({
  students, allGrades, subjects, term, schoolYear,
  teacherName, classStats, classAverage, onDone,
}: BulletinMultiPrintProps) {

  useEffect(() => {
    // Attendre que les images (logo) soient chargées avant d'imprimer
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

        const mention = getMentionFromAverage(calculateAverage(termGrades));

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
            />
          </div>
        );
      })}

      <style>{`
        /* ── Invisible à l'écran ── */
        .bulletin-multi-portal {
          position: fixed;
          top: -99999px;
          left: 0;
          width: 0;
          overflow: hidden;
        }

        @media print {
          /* Masquer tout sauf le portal */
          body > *:not(.bulletin-multi-portal) { display: none !important; }

          .bulletin-multi-portal {
            position: static !important;
            width: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          /* Une page par bulletin */
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

          /* Forcer couleurs et images */
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
