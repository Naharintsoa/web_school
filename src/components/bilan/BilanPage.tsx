/**
 * BilanPage — sélecteur de classe (CP→CM2) + liste des élèves + impression.
 * Accessible via /bilan.
 */
import React, { useEffect, useState, useRef } from 'react';
import { Printer, Users, ChevronRight } from 'lucide-react';
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
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedIds(new Set());
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
      {/* ── Zone écran ── */}
      <div className="p-6 max-w-2xl mx-auto no-print">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Bilan des Acquis Scolaires</h1>
          <p className="text-slate-500 text-sm mt-1">Sélectionnez une classe puis les élèves à imprimer.</p>
        </div>

        {/* Sélecteur de classe */}
        <div className="flex flex-wrap gap-2 mb-6">
          {BILAN_CLASSES.map(cls => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                selectedClass === cls
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* Liste des élèves */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={students.length > 0 && selectedIds.size === students.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                disabled={students.length === 0}
              />
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Users size={15} className="text-indigo-500" />
                {loading ? 'Chargement…' : `${students.length} élève${students.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <button
              onClick={handlePrint}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              <Printer size={15} />
              Imprimer ({selectedIds.size})
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Chargement…</div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Aucun élève en {selectedClass} pour {currentYear}.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {students.map(s => (
                <li
                  key={s.id}
                  onClick={() => toggleOne(s.id)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleOne(s.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-800">
                      {s.lastName} {s.firstName}
                    </span>
                    {s.matricule && (
                      <span className="ml-2 text-xs text-slate-400">{s.matricule}</span>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Zone impression uniquement ── */}
      <div ref={printRef} className="bilan-print-zone">
        {selectedStudents.map(s => (
          <BilanCouverture key={s.id} student={s} schoolYear={currentYear} />
        ))}
      </div>

      <style>{`
        .bilan-print-zone { display: none; }

        @media print {
          .no-print { display: none !important; }
          .bilan-print-zone { display: block !important; }
          body, html { margin: 0; padding: 0; background: white; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </>
  );
}
