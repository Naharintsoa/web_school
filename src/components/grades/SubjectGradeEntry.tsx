/**
 * Saisie des notes par matière.
 * L'utilisateur choisit une matière, puis remplit la note de TOUS les élèves
 * de la classe pour le trimestre sélectionné.
 * Sauvegarde automatique au blur (quitter le champ).
 */
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { Student, Subject } from '../../types';
import type { Grade } from '../../types/grade';
import { gradesApi } from '../../services/api';
import { getDefaultAppreciation, calculateAverage } from '../../utils/grades';

interface SubjectGradeEntryProps {
  students: Student[];
  subjects: Subject[];
  term: 1 | 2 | 3;
  grade: string; // classe (ex. "6EME")
}

/* ── Ligne élève pour une matière ── */
function StudentGradeRow({
  student,
  subject,
  term,
  savedGrade,
  onSave,
  onDelete,
}: {
  student: Student;
  subject: Subject;
  term: 1 | 2 | 3;
  savedGrade: Grade | undefined;
  onSave: (studentId: string, score: number, comments?: string) => Promise<void>;
  onDelete: (studentId: string) => Promise<void>;
}) {
  const [localScore, setLocalScore]     = useState(savedGrade?.score !== undefined ? String(savedGrade.score) : '');
  const [localComment, setLocalComment] = useState(savedGrade?.comments ?? '');
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    setLocalScore(savedGrade?.score !== undefined ? String(savedGrade.score) : '');
    setLocalComment(savedGrade?.comments ?? '');
  }, [savedGrade?.score, savedGrade?.comments, student.id, term, subject.id]);

  const scoreNum  = localScore === '' ? undefined : parseFloat(localScore);
  const hasScore  = scoreNum !== undefined && !isNaN(scoreNum);

  const scoreBg = !hasScore
    ? 'border-gray-300 bg-white text-gray-400'
    : scoreNum >= 16 ? 'border-green-400 bg-green-50 text-green-800'
    : scoreNum >= 10 ? 'border-blue-400 bg-blue-50 text-blue-800'
    :                  'border-red-400 bg-red-50 text-red-800';

  const handleScoreBlur = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (localScore.trim() === '') {
        if (savedGrade !== undefined) {
          await onDelete(student.id);
          setLocalComment('');
        }
      } else {
        const val = Math.min(20, Math.max(0, parseFloat(localScore) || 0));
        setLocalScore(String(val));
        const auto = localComment.trim() === '' ? getDefaultAppreciation(val) : localComment;
        if (localComment.trim() === '') setLocalComment(auto);
        await onSave(student.id, val, auto || undefined);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCommentBlur = async () => {
    if (saving || !hasScore) return;
    setSaving(true);
    try {
      await onSave(student.id, scoreNum!, localComment || undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Nom élève */}
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
          )}
          <span className="text-sm font-medium text-gray-800">
            {student.lastName?.toUpperCase()} {student.firstName}
          </span>
        </div>
      </td>

      {/* Note /20 */}
      <td className="px-3 py-2 w-28">
        <div className="relative flex items-center">
          <input
            type="number"
            min="0" max="20" step="0.5"
            value={localScore}
            placeholder="—"
            onChange={e => setLocalScore(e.target.value)}
            onBlur={handleScoreBlur}
            className={`w-full rounded-lg border px-2 py-1.5 text-center text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${scoreBg}`}
          />
          {saving && <Loader2 size={12} className="absolute right-1 animate-spin text-indigo-400" />}
        </div>
      </td>

      {/* Appréciation */}
      <td className="px-3 py-2">
        <input
          type="text"
          value={localComment}
          placeholder={hasScore ? 'Appréciation…' : '—'}
          disabled={!hasScore}
          onChange={e => setLocalComment(e.target.value)}
          onBlur={handleCommentBlur}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        />
      </td>
    </tr>
  );
}

/* ── Composant principal ── */
export function SubjectGradeEntry({ students, subjects, term, grade }: SubjectGradeEntryProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(subjects[0] ?? null);
  const [allGrades, setAllGrades]             = useState<Grade[]>([]);
  const [loading, setLoading]                 = useState(false);

  // Charger toutes les notes de la classe pour le trimestre courant
  const reload = async () => {
    setLoading(true);
    try {
      const all = await gradesApi.getAll();
      const studentIds = new Set(students.map(s => s.id));
      setAllGrades(all.filter(g => studentIds.has(g.studentId) && g.term === term));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [students, term]);

  // Sélectionner la première matière quand la liste change
  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) setSelectedSubject(subjects[0]);
  }, [subjects]);

  const handleSave = async (studentId: string, score: number, comments?: string) => {
    if (!selectedSubject) return;
    const gradeRecord: Grade = {
      id: `${studentId}-${selectedSubject.id}-${term}`,
      studentId,
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      teacherName: selectedSubject.teacherName ?? '',
      term,
      score,
      comments,
      coefficient: selectedSubject.coefficient,
      classAverage: 0,
      minScore: 0,
      maxScore: 20,
    };
    await gradesApi.update(gradeRecord);
    await reload();
  };

  const handleDelete = async (studentId: string) => {
    if (!selectedSubject) return;
    await gradesApi.deleteByCompositeKey(studentId, selectedSubject.id, term);
    await reload();
  };

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Aucune matière disponible. Utilisez "Gérer les matières" pour en ajouter.
      </div>
    );
  }

  // Notes de la matière sélectionnée pour toutes les stats
  const subjectGrades = selectedSubject
    ? allGrades.filter(g => g.subjectId === selectedSubject.id)
    : [];
  const classAvg = calculateAverage(subjectGrades);
  const noted    = subjectGrades.filter(g => g.score !== null && g.score !== undefined).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* ── Colonne gauche : liste des matières ── */}
      <div className="bg-white rounded-xl shadow p-4 lg:col-span-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Matières ({subjects.length})
        </h3>
        <div className="space-y-1">
          {subjects.map(s => {
            const sg = allGrades.filter(g => g.subjectId === s.id);
            const notedCount = sg.filter(g => g.score !== null && g.score !== undefined).length;
            const isSel = selectedSubject?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  isSel ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50 text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    {s.teacherName && (
                      <div className={`text-xs truncate ${isSel ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {s.teacherName}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs ml-2 shrink-0 px-1.5 py-0.5 rounded-full ${
                    isSel ? 'bg-indigo-500 text-white' :
                    notedCount === students.length && students.length > 0
                      ? 'bg-green-100 text-green-700'
                      : notedCount > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {notedCount}/{students.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Colonne droite : saisie notes élèves ── */}
      <div className="bg-white rounded-xl shadow lg:col-span-3">
        {selectedSubject ? (
          <>
            {/* En-tête matière */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedSubject.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  {selectedSubject.teacherName && <span>{selectedSubject.teacherName}</span>}
                  <span>Coeff. {selectedSubject.coefficient}</span>
                  <span>Trimestre {term}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  <span className="font-semibold text-gray-800">{noted}</span>/{students.length} notés
                </span>
                {classAvg > 0 && (
                  <span className={`font-bold px-2 py-0.5 rounded-full text-sm ${
                    classAvg >= 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    Moy. classe : {classAvg.toFixed(2)}/20
                  </span>
                )}
                {loading && <Loader2 size={14} className="animate-spin text-indigo-400" />}
              </div>
            </div>

            {/* Tableau des élèves */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left">Élève</th>
                    <th className="px-3 py-2.5 text-center w-28">Note /20</th>
                    <th className="px-3 py-2.5 text-left">Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-10 text-gray-400 text-sm">
                        Aucun élève dans cette classe.
                      </td>
                    </tr>
                  ) : students.map(student => (
                    <StudentGradeRow
                      key={student.id}
                      student={student}
                      subject={selectedSubject}
                      term={term}
                      savedGrade={allGrades.find(
                        g => g.studentId === student.id && g.subjectId === selectedSubject.id
                      )}
                      onSave={handleSave}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Sélectionnez une matière
          </div>
        )}
      </div>
    </div>
  );
}
