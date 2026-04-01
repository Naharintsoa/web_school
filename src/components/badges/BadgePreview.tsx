import { Printer, X } from 'lucide-react';
import type { Student } from '../../types';
import { BadgeTemplate } from './BadgeTemplate';

interface BadgePreviewProps {
  students: Student[];
  onClose: () => void;
}

/**
 * Prévisualisation badges A4 portrait.
 * 2 badges par ligne, 4 badges par page.
 * Page-break après chaque groupe de 4.
 * Cellule vide si nombre impair sur la dernière ligne.
 */
export function BadgePreview({ students, onClose }: BadgePreviewProps) {
  const handlePrint = () => window.print();

  // Grouper par pages de 4
  const pages: Student[][] = [];
  for (let i = 0; i < students.length; i += 4) {
    pages.push(students.slice(i, i + 4));
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[60] overflow-y-auto py-6 print:bg-white print:p-0 print:block print:overflow-visible">
      {/* Barre outils — masquée à l'impression */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-10 px-6 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">Badges élèves</p>
          <p className="text-xs text-slate-500">{students.length} élève{students.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-sm active:scale-95 transition-all"
          >
            <Printer size={16} />
            Imprimer
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Pages A4 */}
      <div className="mt-16 print:mt-0 space-y-4 print:space-y-0">
        {pages.map((page, pi) => {
          // Construire les lignes de 2 badges
          const rows: [Student, Student | null][] = [];
          for (let i = 0; i < page.length; i += 2) {
            rows.push([page[i], page[i + 1] ?? null]);
          }

          return (
            <div
              key={pi}
              className="bg-white shadow-lg print:shadow-none"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '8mm',
                boxSizing: 'border-box',
                pageBreakAfter: pi < pages.length - 1 ? 'always' : 'auto',
              }}
            >
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                  {rows.map(([left, right], ri) => (
                    <tr key={ri}>
                      <td style={{ width: '50%', padding: '2mm', verticalAlign: 'top' }}>
                        <BadgeTemplate student={left} />
                      </td>
                      <td style={{ width: '50%', padding: '2mm', verticalAlign: 'top' }}>
                        {right
                          ? <BadgeTemplate student={right} />
                          : <div style={{ width: '98mm', minHeight: '135mm' }} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body > * { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
