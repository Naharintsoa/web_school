/**
 * Composant de saisie des notes par matière.
 *
 * Règles :
 * - Si le champ score est vide (non saisi) → la note n'est PAS enregistrée
 *   et n'est PAS comptée dans la moyenne.
 * - Si le champ est rempli puis vidé → la note existante est supprimée.
 * - La sauvegarde se fait au blur (quitter le champ), pas en temps réel.
 * - Quand une note est saisie, une appréciation est générée automatiquement
 *   si aucune n'a encore été écrite. Elle reste modifiable manuellement.
 */
import React, { useState, useEffect } from 'react';
import type { Subject, Grade } from '../../types';
import { getDefaultAppreciation } from '../../utils/grades';

interface GradeInputProps {
  studentId: string;
  subjects: Subject[];
  term: 1 | 2 | 3;
  grades: Grade[];
  onGradeChange: (subjectId: string, score: number, comments?: string) => Promise<void>;
  onGradeDelete: (subjectId: string) => Promise<void>;
}

/** Ligne de saisie pour une matière — gère son propre état local */
function SubjectGradeRow({
  subject, studentId, term, savedGrade, onSave, onDelete,
}: {
  subject: Subject;
  studentId: string;
  term: 1 | 2 | 3;
  savedGrade: Grade | undefined;
  onSave: (subjectId: string, score: number, comments?: string) => Promise<void>;
  onDelete: (subjectId: string) => Promise<void>;
}) {
  const [localScore, setLocalScore] = useState<string>(
    savedGrade?.score !== undefined ? String(savedGrade.score) : ''
  );
  const [localComments, setLocalComments] = useState<string>(savedGrade?.comments ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Resynchroniser si les données externes changent (changement d'élève ou de trimestre)
  useEffect(() => {
    setLocalScore(savedGrade?.score !== undefined ? String(savedGrade.score) : '');
    setLocalComments(savedGrade?.comments ?? '');
  }, [savedGrade?.score, savedGrade?.comments, studentId, term]);

  const scoreNum = localScore === '' ? undefined : parseFloat(localScore);
  const hasScore = scoreNum !== undefined && !isNaN(scoreNum);

  // Couleur indicatrice selon la note
  const scoreBg = !hasScore ? 'border-gray-300 bg-white' :
    scoreNum >= 16 ? 'border-green-400 bg-green-50 text-green-800' :
    scoreNum >= 10 ? 'border-blue-400 bg-blue-50 text-blue-800' :
                     'border-red-400 bg-red-50 text-red-800';

  /** Sauvegarde quand on quitte le champ score.
   *  Si aucune appréciation n'a été saisie, en génère une automatiquement. */
  const handleScoreBlur = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (localScore.trim() === '') {
        // Champ vidé → supprimer la note si elle existait
        if (savedGrade !== undefined) {
          await onDelete(subject.id);
          setLocalComments('');
        }
      } else {
        const val = Math.min(20, Math.max(0, parseFloat(localScore) || 0));
        setLocalScore(String(val));

        // Auto-appréciation si le champ est vide
        const autoComment = localComments.trim() === ''
          ? getDefaultAppreciation(val)
          : localComments;

        if (localComments.trim() === '') {
          setLocalComments(autoComment);
        }

        await onSave(subject.id, val, autoComment || undefined);
      }
    } finally {
      setIsSaving(false);
    }
  };

  /** Sauvegarde quand on quitte le champ appréciation */
  const handleCommentsBlur = async () => {
    if (isSaving || !hasScore) return;
    setIsSaving(true);
    try {
      await onSave(subject.id, scoreNum!, localComments || undefined);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`border rounded-xl p-4 transition-colors ${
      hasScore ? 'border-indigo-200 bg-white' : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Nom matière + coefficient */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-gray-800">{subject.name}</span>
          {subject.teacherName && (
            <span className="ml-2 text-xs text-gray-400">{subject.teacherName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-indigo-500">Enregistrement…</span>
          )}
          {!hasScore && (
            <span className="text-xs text-gray-400 italic">Non notée — exclue de la moyenne</span>
          )}
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Coeff. {subject.coefficient}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 items-start">
        {/* Champ note /20 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Note <span className="text-gray-400">/20</span>
          </label>
          <input
            type="number"
            min="0" max="20" step="0.5"
            value={localScore}
            placeholder="—"
            onChange={e => setLocalScore(e.target.value)}
            onBlur={handleScoreBlur}
            className={`block w-full rounded-lg border px-3 py-2 text-sm text-center font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${scoreBg}`}
          />
        </div>

        {/* Champ appréciation (auto-générée, modifiable) */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Appréciation du professeur
            {hasScore && localComments && (
              <span className="ml-1 text-indigo-400 font-normal">(modifiable)</span>
            )}
          </label>
          <input
            type="text"
            value={localComments}
            placeholder={hasScore ? "Appréciation générée automatiquement…" : "Saisissez d'abord une note"}
            disabled={!hasScore}
            onChange={e => setLocalComments(e.target.value)}
            onBlur={handleCommentsBlur}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

export function GradeInput({
  studentId, subjects, term, grades, onGradeChange, onGradeDelete,
}: GradeInputProps) {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-base">Aucune matière disponible.</p>
        <p className="text-sm mt-1">Utilisez "Gérer les matières" pour en ajouter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pb-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> ≥ 16 (Très bien)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> ≥ 10 (Passable)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> &lt; 10 (Insuffisant)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Non notée
        </span>
        <span className="text-indigo-400 ml-auto">✦ Appréciation auto-générée, modifiable</span>
      </div>

      {subjects.map(subject => {
        const savedGrade = grades.find(
          g => g.studentId === studentId && g.subjectId === subject.id && g.term === term
        );
        return (
          <SubjectGradeRow
            key={`${subject.id}-${studentId}-${term}`}
            subject={subject}
            studentId={studentId}
            term={term}
            savedGrade={savedGrade}
            onSave={onGradeChange}
            onDelete={onGradeDelete}
          />
        );
      })}
    </div>
  );
}
