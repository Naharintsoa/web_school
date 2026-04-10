/**
 * Bulletin scolaire — affichage + zone d'édition avant impression.
 * Observations, mention, absences et retards sont persistés en base.
 */
import { useState, useEffect } from 'react';
import { Printer, X, Save, Edit2, Check } from 'lucide-react';
import type { Student } from '../../../types/student';
import type { Grade } from '../../../types/grade';
import type { Subject } from '../../../types/subject';
import { calculateAverage, getMentionFromAverage } from '../../../utils/grades';
import { BulletinPrintContent } from './BulletinPrintContent';
import { bulletinRemarksApi } from '../../../services/api/bulletinRemarksApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassSubjectStats { avg: number; min: number; max: number; }
interface OtherTermAverage { term: 1 | 2 | 3; average: number; hasGrades: boolean; }

interface ReportCardProps {
  student: Student;
  grades: Grade[];
  allGrades: Grade[];
  subjects: Subject[];
  classStats: Record<string, ClassSubjectStats>;
  term: 1 | 2 | 3;
  schoolYear: string;
  classAverage: number;
  teacherName: string;
  otherTermsAverages: OtherTermAverage[];
  onClose: () => void;
}

type Mention = 'félicitations' | 'encouragements' | 'progresse' | 'insuffisant' | '';
type SaveState = 'idle' | 'saving' | 'saved';

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReportCard({
  student, grades, allGrades: _allGrades, subjects, classStats,
  term, schoolYear, classAverage, teacherName,
  otherTermsAverages, onClose,
}: ReportCardProps) {

  // ── Observation ───────────────────────────────────────────────────────────
  const [observation, setObservation] = useState('');
  const [obsEditing, setObsEditing] = useState(false);
  const [obsSaveState, setObsSaveState] = useState<SaveState>('idle');

  // ── Mention ───────────────────────────────────────────────────────────────
  const [mention, setMention] = useState<Mention>(() => getMentionFromAverage(calculateAverage(grades)));

  // ── Absences / Retards ────────────────────────────────────────────────────
  const [absences, setAbsences] = useState('');
  const [demiJournees, setDemiJournees] = useState('');
  const [retards, setRetards] = useState('');
  const [absEditing, setAbsEditing] = useState(false);
  const [absSaveState, setAbsSaveState] = useState<SaveState>('idle');

  const autoMention = getMentionFromAverage(calculateAverage(grades));

  // ── Chargement initial depuis la base ─────────────────────────────────────
  useEffect(() => {
    bulletinRemarksApi.get(student.id, term).then(data => {
      if (!data) return;
      setObservation(data.observation);
      setMention((data.mention as Mention) || getMentionFromAverage(calculateAverage(grades)));
      setAbsences(data.absences);
      setDemiJournees(data.demiJournees);
      setRetards(data.retards);
    });
  }, [student.id, term]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sauvegarde observation ────────────────────────────────────────────────
  const saveObservation = async () => {
    setObsSaveState('saving');
    await bulletinRemarksApi.save(student.id, term, { observation, mention, absences, demiJournees, retards });
    setObsSaveState('saved');
    setObsEditing(false);
    setTimeout(() => setObsSaveState('idle'), 2000);
  };

  // ── Sauvegarde absences / retards ─────────────────────────────────────────
  const saveAbsences = async () => {
    setAbsSaveState('saving');
    await bulletinRemarksApi.save(student.id, term, { observation, mention, absences, demiJournees, retards });
    setAbsSaveState('saved');
    setAbsEditing(false);
    setTimeout(() => setAbsSaveState('idle'), 2000);
  };

  // ── Sauvegarde mention (auto au changement) ───────────────────────────────
  const handleMentionChange = async (val: Mention) => {
    setMention(val);
    await bulletinRemarksApi.save(student.id, term, { observation, mention: val, absences, demiJournees, retards });
  };

  return (
    <>
      {/* ── Barre d'actions (masquée à l'impression) ── */}
      <div className="no-print bg-indigo-900 text-white px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-800 rounded-lg flex-shrink-0" title="Fermer">
            <X size={18} />
          </button>
          <span className="text-xs sm:text-sm font-medium truncate">
            Bulletin — {student.firstName} {student.lastName} — T{term}
          </span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-indigo-50 text-xs sm:text-sm flex-shrink-0"
        >
          <Printer size={15} />
          <span className="hidden sm:inline">Imprimer</span>
          <span className="sm:hidden">Print</span>
        </button>
      </div>

      {/* ── Zone édition avant impression (masquée à l'impression) ── */}
      <div className="no-print bg-gray-50 border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* ── Observation ── */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Observation du conseil de classe
              </label>
              {!obsEditing ? (
                <button
                  onClick={() => setObsEditing(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 border border-indigo-300 rounded hover:bg-indigo-50"
                >
                  <Edit2 size={11} /> Modifier
                </button>
              ) : (
                <button
                  onClick={saveObservation}
                  disabled={obsSaveState === 'saving'}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded border font-medium ${
                    obsSaveState === 'saved'
                      ? 'bg-green-50 text-green-700 border-green-300'
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {obsSaveState === 'saved'
                    ? <><Check size={11} /> Enregistré</>
                    : obsSaveState === 'saving'
                    ? 'Enregistrement…'
                    : <><Save size={11} /> Enregistrer</>
                  }
                </button>
              )}
            </div>
            <textarea
              value={observation}
              onChange={e => setObservation(e.target.value)}
              onFocus={() => setObsEditing(true)}
              placeholder="Saisissez les observations du conseil de classe…"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* ── Mention + Absences ── */}
          <div className="space-y-3">
            {/* Mention */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Mention</label>
                {autoMention && mention === autoMention && (
                  <span className="text-xs text-indigo-500 font-medium">● auto</span>
                )}
              </div>
              <select
                value={mention}
                onChange={e => handleMentionChange(e.target.value as Mention)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Choisir —</option>
                <option value="félicitations">Félicitations (≥ 16/20)</option>
                <option value="encouragements">Encouragements (14–16)</option>
                <option value="progresse">Doit progresser (10–14)</option>
                <option value="insuffisant">Manque de travail (&lt; 10)</option>
              </select>
            </div>

            {/* Absences / Retards */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Absences & Retards</label>
                {!absEditing ? (
                  <button
                    onClick={() => setAbsEditing(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 border border-indigo-300 rounded hover:bg-indigo-50"
                  >
                    <Edit2 size={11} /> Modifier
                  </button>
                ) : (
                  <button
                    onClick={saveAbsences}
                    disabled={absSaveState === 'saving'}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded border font-medium ${
                      absSaveState === 'saved'
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {absSaveState === 'saved'
                      ? <><Check size={11} /> Enregistré</>
                      : absSaveState === 'saving'
                      ? 'Enregistrement…'
                      : <><Save size={11} /> Enregistrer</>
                    }
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Absences</label>
                  <input
                    type="number" min="0"
                    value={absences}
                    onChange={e => { setAbsences(e.target.value); setAbsEditing(true); }}
                    className="w-full border rounded px-2 py-1 text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">½ journées</label>
                  <input
                    type="number" min="0"
                    value={demiJournees}
                    onChange={e => { setDemiJournees(e.target.value); setAbsEditing(true); }}
                    className="w-full border rounded px-2 py-1 text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Retards</label>
                  <input
                    type="number" min="0"
                    value={retards}
                    onChange={e => { setRetards(e.target.value); setAbsEditing(true); }}
                    className="w-full border rounded px-2 py-1 text-sm text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu imprimable ── */}
      <div id="bulletin-print" style={{ maxWidth: '210mm', margin: '0 auto' }}>
        <BulletinPrintContent
          student={student}
          grades={grades}
          subjects={subjects}
          classStats={classStats}
          term={term}
          schoolYear={schoolYear}
          classAverage={classAverage}
          teacherName={teacherName}
          otherTermsAverages={otherTermsAverages}
          observation={observation}
          mention={mention}
          absences={absences}
          demiJournees={demiJournees}
          retards={retards}
        />
      </div>

      {/* ── CSS d'impression ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          #bulletin-print, #bulletin-print * { visibility: visible; }
          #bulletin-print {
            position: absolute;
            left: 0; top: 0;
            width: 210mm;
            padding: 10mm !important;
            font-size: 9pt !important;
          }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>
    </>
  );
}
