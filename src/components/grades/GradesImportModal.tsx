import React, { useRef, useState } from 'react';
import { Upload, X, AlertTriangle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { parseImportFile, validateImport } from '../../utils/gradesExportImport';
import type { ImportRow, ImportResult } from '../../utils/gradesExportImport';
import { gradesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import type { Student, Subject } from '../../types';

interface Props {
  students: Student[];
  subjects: Subject[];
  term: 1 | 2 | 3;
  grade: string;
  onClose: () => void;
  onImported: () => void;
}

export function GradesImportModal({ students, subjects, term, grade, onClose, onImported }: Props) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const rows = await parseImportFile(file);
      setResult(validateImport(rows, students, subjects));
    } catch (err: any) {
      showToast(err.message ?? 'Erreur de lecture du fichier.', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    if (!result || result.valid.length === 0) return;
    setSaving(true);
    try {
      for (const row of result.valid) {
        await gradesApi.update({
          id: `${row.student.id}-${row.subjectId}-${term}`,
          studentId:   row.student.id,
          subjectId:   row.subjectId,
          term,
          score:       row.score,
          subjectName: row.subjectName,
          teacherName: row.teacherName,
          coefficient: row.coefficient,
          classAverage: 0,
          minScore:    0,
          maxScore:    20,
        });
      }
      showToast(`${result.valid.length} note(s) importée(s) avec succès.`, 'success');
      onImported();
      onClose();
    } catch {
      showToast('Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Grouper par élève pour la prévisualisation
  const byStudent = result?.valid.reduce<Record<string, { student: Student; notes: ImportRow[] }>>(
    (acc, row) => {
      if (!acc[row.student.id]) acc[row.student.id] = { student: row.student, notes: [] };
      acc[row.student.id].notes.push(row);
      return acc;
    },
    {},
  ) ?? {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">
            Importer les notes — Trimestre {term} — {grade}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Zone de dépôt */}
          {!result && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <FileSpreadsheet size={42} className="mx-auto mb-3 text-indigo-400" />
              <p className="text-sm font-medium text-gray-700">Glisser-déposer un fichier ici</p>
              <p className="text-xs text-gray-400 mt-1">ou cliquer pour choisir — formats acceptés : .xlsx, .csv</p>
              <p className="text-xs text-gray-400 mt-3 italic">
                Le fichier doit avoir le même format que celui exporté : colonnes Nom, Prénom, puis une colonne par matière.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          )}

          {result && (
            <>
              {/* Fichier sélectionné */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileSpreadsheet size={16} className="text-indigo-500 flex-shrink-0" />
                <span className="font-medium truncate">{fileName}</span>
                <button
                  onClick={() => { setResult(null); setFileName(''); }}
                  className="ml-auto text-xs text-gray-400 hover:text-gray-700 underline whitespace-nowrap"
                >
                  Changer de fichier
                </button>
              </div>

              {/* Erreurs bloquantes */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1.5">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Avertissements */}
              {result.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-800 mb-1">
                    {result.warnings.length} avertissement(s) :
                  </p>
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Prévisualisation */}
              {result.valid.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
                    <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">
                      {result.valid.length} note(s) prête(s) à importer pour{' '}
                      {Object.keys(byStudent).length} élève(s)
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {Object.values(byStudent).map(({ student, notes }) => (
                      <div key={student.id} className="px-4 py-2.5">
                        <p className="text-sm font-semibold text-gray-800">
                          {student.firstName} {student.lastName}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {notes.map(n => (
                            <span
                              key={n.subjectId}
                              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full"
                            >
                              {n.subjectName} : <strong>{n.score}/20</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.valid.length === 0 && result.errors.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune note valide trouvée dans le fichier.
                </p>
              )}
            </>
          )}
        </div>

        {/* Pied */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          {result && result.valid.length > 0 && result.errors.length === 0 && (
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              Importer {result.valid.length} note(s)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
