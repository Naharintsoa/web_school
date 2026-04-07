/**
 * BilanPage — sélecteur de classe (CP→CM2) + liste des élèves + impression.
 * Accessible via /bilan.
 */
import React, { useEffect, useState, useRef } from 'react';
import { Printer, Users, ChevronRight, Eye } from 'lucide-react';
import { studentApi } from '../../services/api';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import type { Student } from '../../types';
import { BILAN_CLASSES } from './bilanData';
import { BilanCouverture } from './BilanCouverture';

type BilanClass = typeof BILAN_CLASSES[number];

export function BilanPage() {
  const { currentYear } = useSchoolYear();
  const [selectedClass, setSelectedClass] = useState<BilanClass>('CP');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  /* Charger les élèves de la classe sélectionnée */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedIds(new Set());
    setPreviewStudent(null);
    studentApi.getAll(currentYear).then((all) => {
      if (cancelled) return;
      setStudents(all.filter(s => s.grade === selectedClass));
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedClass, currentYear]);

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePrint = () => window.print();

  const selectedStudents = students.filter(s => selectedIds.has(s.id));

  return (
    <>
      {/* ── Zone écran (masquée à l'impression) ── */}
      <div className="no-print flex gap-6 p-6 h-full" style={{ minHeight: 0 }}>

        {/* Panneau gauche — sélection */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Bilan des Acquis</h1>
            <p className="text-slate-500 text-xs mt-0.5">Sélectionnez une classe et des élèves.</p>
          </div>

          {/* Sélecteur de classe */}
          <div className="flex flex-wrap gap-2">
            {BILAN_CLASSES.map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  selectedClass === cls
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Tableau des élèves */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
            {/* En-tête */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={students.length > 0 && selectedIds.size === students.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                  disabled={students.length === 0}
                />
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Users size={13} className="text-indigo-500" />
                  {loading ? 'Chargement…' : `${students.length} élève${students.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              <button
                onClick={handlePrint}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
              >
                <Printer size={13} />
                Imprimer ({selectedIds.size})
              </button>
            </div>

            {/* Liste */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="py-10 text-center text-slate-400 text-sm">Chargement…</div>
              ) : students.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  Aucun élève en {selectedClass} pour {currentYear}.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {students.map(s => (
                    <li
                      key={s.id}
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer flex-shrink-0"
                      />
                      <span
                        className="flex-1 min-w-0 text-xs font-medium text-slate-800 cursor-pointer"
                        onClick={() => toggleOne(s.id)}
                      >
                        {s.lastName} {s.firstName}
                        {s.matricule && <span className="ml-1 text-slate-400">{s.matricule}</span>}
                      </span>
                      <button
                        onClick={() => setPreviewStudent(s)}
                        title="Aperçu"
                        className="p-1 text-slate-400 hover:text-indigo-500 flex-shrink-0"
                      >
                        <Eye size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Panneau droit — aperçu A4 centré sans scrollbar */}
        <div
          className="flex-1 flex items-start justify-center overflow-hidden rounded-xl"
          style={{ background: '#374151', padding: '24px 16px' }}
        >
          {previewStudent ? (
            <div
              style={{
                transform: 'scale(0.68)',
                transformOrigin: 'top center',
                marginBottom: 'calc(-297mm * 0.32)',
                flexShrink: 0,
              }}
            >
              <BilanCouverture student={previewStudent} schoolYear={currentYear} />
            </div>
          ) : (
            <div className="text-slate-400 text-sm mt-20 text-center">
              <Eye size={32} className="mx-auto mb-3 opacity-40" />
              Cliquez sur <Eye size={13} className="inline" /> pour prévisualiser un bilan
            </div>
          )}
        </div>
      </div>

      {/* ── Zone impression uniquement ── */}
      <div ref={printRef} className="bilan-print-zone">
        {selectedStudents.map(s => (
          <BilanCouverture key={s.id} student={s} schoolYear={currentYear} />
        ))}
      </div>

      {/* Styles impression */}
      <style>{`
        .bilan-print-zone { display: none; }

        @media print {
          .no-print { display: none !important; }
          .bilan-print-zone { display: block !important; }
          body, html { margin: 0; padding: 0; background: white; overflow: hidden; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </>
  );
}
