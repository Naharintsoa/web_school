/**
 * Liste des professeurs — dynamique, synchronisée avec subjectsApi.
 *
 * Fonctionnalités :
 * - Affiche toutes les matières avec leur professeur et coefficient
 * - Ajout d'une nouvelle matière directement depuis cette page
 * - Édition en ligne : nom du professeur + coefficient + classes (cases à cocher)
 * - S'abonne à subjectsApi → mise à jour automatique sans navigation
 * - Clic sur une matière → affichage SubjectExams
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, ChevronRight, Edit2, Save, X,
  BookOpen, Plus, Trash2,
} from 'lucide-react';
import { subjectsApi } from '../../services/api/subjectsApi';
import { SubjectExams } from '../subjects/SubjectExams';
import { useToast } from '../../contexts/ToastContext';
import { useSchool, SCHOOLS } from '../../contexts/SchoolContext';
import { FR } from '../../constants/translations';
import type { Subject } from '../../types';

function toExamSubject(s: Subject) {
  return { id: s.id, name: s.name, teacherId: '', coefficient: s.coefficient };
}

const ALL_GRADES = ['CP','CE1','CE2','CM1','CM2','6EME','5EME','4EME','3EME'];

function gradeLabel(grade: string | null | undefined): string {
  if (!grade) return 'Toutes classes';
  return grade.replace('EME', 'ème');
}

// ─── Cases à cocher des classes ───────────────────────────────────────────────

interface GradeCheckboxesProps {
  selected: string[];
  onChange: (g: string) => void;
}

function GradeCheckboxes({ selected, onChange }: GradeCheckboxesProps) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {ALL_GRADES.map(g => (
        <label key={g} className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={selected.includes(g)}
            onChange={() => onChange(g)}
            className="accent-indigo-600 w-3.5 h-3.5 cursor-pointer"
          />
          <span className="text-xs text-gray-700">{gradeLabel(g)}</span>
        </label>
      ))}
      <p className="w-full text-xs text-gray-400 mt-0.5 italic">
        {selected.length === 0
          ? 'Aucune sélection = toutes les classes'
          : `${selected.length} classe(s) sélectionnée(s)`}
      </p>
    </div>
  );
}

// ─── Formulaire d'ajout ───────────────────────────────────────────────────────

interface AddRowProps {
  onAdd: (name: string, coeff: number, teacher: string, grades: string[]) => void;
  onCancel: () => void;
}

function AddRow({ onAdd, onCancel }: AddRowProps) {
  const [name, setName] = useState('');
  const [coeff, setCoeff] = useState(1);
  const [teacher, setTeacher] = useState('');
  const [grades, setGrades] = useState<string[]>([]);

  const toggle = (g: string) =>
    setGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim().toUpperCase(), Math.max(1, Math.min(10, coeff)), teacher.trim(), grades);
  };

  return (
    <tr className="bg-indigo-50">
      <td className="px-6 py-3 text-xs text-indigo-400">—</td>
      {/* Nom matière */}
      <td className="px-4 py-3">
        <input
          autoFocus type="text" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
          placeholder="Ex : MATHÉMATIQUES"
          className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 w-44 uppercase"
        />
      </td>
      {/* Coefficient */}
      <td className="px-4 py-3">
        <input
          type="number" min="1" max="10" value={coeff}
          onChange={e => setCoeff(Number(e.target.value))}
          className="border border-indigo-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-indigo-500 w-20"
        />
      </td>
      {/* Professeur */}
      <td className="px-4 py-3">
        <input
          type="text" value={teacher}
          onChange={e => setTeacher(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
          placeholder="Nom du professeur"
          className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 w-44"
        />
      </td>
      {/* Classes */}
      <td className="px-4 py-3">
        <GradeCheckboxes selected={grades} onChange={toggle} />
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={submit} disabled={!name.trim()}
            className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-40" title="Ajouter">
            <Save size={14} />
          </button>
          <button onClick={onCancel}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md" title="Annuler">
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TeacherList() {
  const { showToast } = useToast();
  const { currentSchool } = useSchool();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);

  // Édition en ligne
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editCoeff, setEditCoeff] = useState(1);
  const [editGrades, setEditGrades] = useState<string[]>([]);

  const loadSubjects = useCallback(async () => {
    const data = await subjectsApi.getAll(currentSchool);
    setSubjects(data);
    setLoading(false);
  }, [currentSchool]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  useEffect(() => {
    const unsubscribe = subjectsApi.subscribe(() => {
      subjectsApi.getAll(currentSchool).then(data => {
        setSubjects(data);
        setSelectedSubject(prev => prev ? (data.find(s => s.id === prev.id) ?? null) : null);
      });
    });
    return unsubscribe;
  }, [currentSchool]);

  // ── Ajout ─────────────────────────────────────────────────────────────────

  const handleAdd = async (name: string, coeff: number, teacher: string, grades: string[]) => {
    const normalized = name.trim().toUpperCase();

    if (grades.length === 0) {
      // Toutes classes
      const duplicate = subjects.find(
        s => s.name.toUpperCase() === normalized && (s.grade ?? null) === null
      );
      if (duplicate) {
        showToast(`"${normalized}" existe déjà pour toutes les classes.`, 'error');
        return;
      }
      try {
        await subjectsApi.create({ name: normalized, coefficient: coeff, teacherName: teacher, school: currentSchool, grade: null });
        setShowAddRow(false);
        showToast(`Matière "${normalized}" ajoutée`, 'success');
      } catch (err: any) {
        showToast(err?.message ?? 'Erreur lors de l\'ajout.', 'error');
      }
    } else {
      let created = 0;
      for (const grade of grades) {
        const duplicate = subjects.find(
          s => s.name.toUpperCase() === normalized && s.grade === grade
        );
        if (duplicate) {
          showToast(`"${normalized}" existe déjà pour ${gradeLabel(grade)}.`, 'error');
          continue;
        }
        try {
          await subjectsApi.create({ name: normalized, coefficient: coeff, teacherName: teacher, school: currentSchool, grade });
          created++;
        } catch (err: any) {
          showToast(err?.message ?? `Erreur pour ${gradeLabel(grade)}.`, 'error');
        }
      }
      if (created > 0) {
        setShowAddRow(false);
        showToast(`"${normalized}" ajouté pour ${created} classe(s)`, 'success');
      }
    }
  };

  // ── Édition ───────────────────────────────────────────────────────────────

  const toggleEditGrade = (g: string) =>
    setEditGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const startEdit = (subject: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(subject.id);
    setEditTeacherName(subject.teacherName ?? '');
    setEditCoeff(subject.coefficient);

    // Pré-cocher toutes les classes des entrées ayant le même nom + même prof
    const siblings = subjects.filter(
      s => s.name === subject.name &&
           (s.teacherName ?? '').trim().toLowerCase() === (subject.teacherName ?? '').trim().toLowerCase()
    );
    const grades = siblings.map(s => s.grade).filter(Boolean) as string[];
    setEditGrades(grades);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveEdit = async (subject: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    const trimmedTeacher = editTeacherName.trim();
    const coeff = Math.max(1, Math.min(10, editCoeff));

    // Frères : même matière + même prof original
    const siblings = subjects.filter(
      s => s.name === subject.name &&
           (s.teacherName ?? '').trim().toLowerCase() === (subject.teacherName ?? '').trim().toLowerCase()
    );

    try {
      if (editGrades.length === 0) {
        // Aucune classe cochée → une seule entrée "Toutes classes"
        await subjectsApi.update(subject.id, {
          name: subject.name, coefficient: coeff, teacherName: trimmedTeacher, grade: null,
        });
        for (const sib of siblings) {
          if (sib.id !== subject.id) await subjectsApi.delete(sib.id);
        }
      } else {
        const sibByGrade = new Map(siblings.map(s => [s.grade ?? '', s]));

        // Créer ou mettre à jour chaque classe cochée
        for (const grade of editGrades) {
          const existing = sibByGrade.get(grade);
          if (existing) {
            await subjectsApi.update(existing.id, {
              name: subject.name, coefficient: coeff, teacherName: trimmedTeacher, grade,
            });
          } else {
            await subjectsApi.create({
              name: subject.name, coefficient: coeff, teacherName: trimmedTeacher,
              school: currentSchool, grade,
            });
          }
        }

        // Supprimer les entrées décochées ou l'ancienne entrée "Toutes classes"
        for (const sib of siblings) {
          const g = sib.grade ?? '';
          if (!g || !editGrades.includes(g)) {
            await subjectsApi.delete(sib.id);
          }
        }
      }

      setEditingId(null);
      showToast(`"${subject.name}" mis à jour`, 'success');
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur lors de la mise à jour.', 'error');
    }
  };

  // ── Suppression ───────────────────────────────────────────────────────────

  const handleDelete = async (subject: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer la matière "${subject.name}" ?\nLes notes déjà saisies ne seront plus affichées.`)) return;
    await subjectsApi.delete(subject.id);
    showToast(`"${subject.name}" supprimée`, 'success');
  };

  // ── Vue détail matière ────────────────────────────────────────────────────

  if (selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-7 w-7 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{selectedSubject.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedSubject.teacherName ? `Prof : ${selectedSubject.teacherName}` : 'Aucun professeur assigné'}
                  {' · '}Coeff. {selectedSubject.coefficient}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedSubject(null)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X size={15} />
              Retour à la liste
            </button>
          </div>
        </div>
        <SubjectExams subject={toExamSubject(selectedSubject)} grade="6EME" />
      </div>
    );
  }

  // ── Vue liste ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-7 w-7 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{FR.teachers.list}</h1>
              <p className="text-xs mt-0.5">
                <span className={currentSchool === 'sully-annexe' ? 'text-violet-600 font-medium' : 'text-indigo-600 font-medium'}>
                  {SCHOOLS[currentSchool].name}
                </span>
                <span className="text-gray-400 ml-1">— {subjects.length} matière{subjects.length !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddRow(true); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={15} />
            Nouvelle matière
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3" />
            Chargement…
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">N°</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Matière</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Coefficient</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{FR.teachers.teacher}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Classes</th>
                <th className="px-6 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {subjects.length === 0 && !showAddRow && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Aucune matière. Cliquez sur <strong>Nouvelle matière</strong> pour commencer.</p>
                  </td>
                </tr>
              )}

              {subjects.map((subject, index) => (
                <tr
                  key={subject.id}
                  onClick={() => editingId !== subject.id && setSelectedSubject(subject)}
                  className={`transition-colors ${
                    editingId === subject.id
                      ? 'bg-indigo-50'
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  {/* N° */}
                  <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>

                  {/* Matière */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-indigo-700">{subject.name}</span>
                      {editingId !== subject.id && <ChevronRight size={15} className="text-gray-300" />}
                    </div>
                  </td>

                  {/* Coefficient — éditable */}
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    {editingId === subject.id ? (
                      <input
                        type="number" min="1" max="10"
                        value={editCoeff}
                        onChange={e => setEditCoeff(Number(e.target.value))}
                        className="border border-indigo-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-indigo-500 w-20"
                      />
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        Coeff. {subject.coefficient}
                      </span>
                    )}
                  </td>

                  {/* Professeur — éditable */}
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    {editingId === subject.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editTeacherName}
                        onChange={e => setEditTeacherName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        placeholder="Nom du professeur"
                        className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 w-48"
                      />
                    ) : (
                      <span className={`text-sm ${subject.teacherName ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {subject.teacherName || 'Non assigné'}
                      </span>
                    )}
                  </td>

                  {/* Classes — cases à cocher en mode édition */}
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    {editingId === subject.id ? (
                      <GradeCheckboxes selected={editGrades} onChange={toggleEditGrade} />
                    ) : (
                      subject.grade
                        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {gradeLabel(subject.grade)}
                          </span>
                        : <span className="text-sm text-gray-400 italic">Toutes classes</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    {editingId === subject.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => saveEdit(subject, e)}
                          className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                          title="Enregistrer"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
                          title="Annuler"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => startEdit(subject, e)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                          title="Modifier"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={e => handleDelete(subject, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {showAddRow && (
                <AddRow
                  onAdd={handleAdd}
                  onCancel={() => setShowAddRow(false)}
                />
              )}
            </tbody>

            {!showAddRow && (
              <tfoot>
                <tr>
                  <td colSpan={6} className="px-6 py-3 border-t border-gray-100">
                    <button
                      onClick={() => { setShowAddRow(true); setEditingId(null); }}
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={15} />
                      Ajouter une matière
                    </button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}
