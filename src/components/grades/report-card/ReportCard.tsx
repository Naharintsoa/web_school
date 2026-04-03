/**
 * Bulletin scolaire — fidèle au template Twig fourni.
 *
 * Fonctionnalités :
 * - En-tête établissement (logo texte, slogan, adresse)
 * - Infos élève + infos parents côte à côte
 * - Tableau des notes avec : discipline, prof, note élève, moy classe, coeff, min, max, niveau, appréciation
 * - Ligne récapitulatif : moyenne élève, moyenne classe, moyennes autres trimestres
 * - Absences / retards
 * - Zone observations (éditable avant impression), mentions, signatures
 *
 * Mode édition (avant impression) :
 *   - Observation du conseil éditable
 *   - Sélection de la mention
 *   - Bouton Imprimer → window.print()
 */
import { useState } from 'react';
import { Printer, X } from 'lucide-react';
import type { Student } from '../../../types/student';
import type { Grade } from '../../../types/grade';
import type { Subject } from '../../../types/subject';
import { calculateAverage, getGradeLevel, formatScore, getMentionFromAverage } from '../../../utils/grades';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassSubjectStats { avg: number; min: number; max: number; }

interface OtherTermAverage { term: 1 | 2 | 3; average: number; hasGrades: boolean; }

interface ReportCardProps {
  student: Student;
  /** Notes du trimestre sélectionné pour cet élève (uniquement les notées) */
  grades: Grade[];
  /** Toutes les notes de l'élève (pour les autres trimestres) */
  allGrades: Grade[];
  /** Toutes les matières actives (pour afficher les matières sans note) */
  subjects: Subject[];
  /** Statistiques de classe par subjectId */
  classStats: Record<string, ClassSubjectStats>;
  term: 1 | 2 | 3;
  schoolYear: string;
  classAverage: number;
  teacherName: string;
  otherTermsAverages: OtherTermAverage[];
  onClose: () => void;
}

type Mention = 'félicitations' | 'encouragements' | 'progresse' | 'insuffisant' | '';

// ─── Styles inline pour l'impression ─────────────────────────────────────────

const S = {
  table:  { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8pt' },
  cell:   { padding: '3px', border: '1px solid #000', verticalAlign: 'middle' as const },
  cellC:  { padding: '3px', border: '1px solid #000', textAlign: 'center' as const, verticalAlign: 'middle' as const },
  header: { padding: '3px', border: '1px solid #000', background: '#d9d9d9', fontWeight: 'bold' as const, textAlign: 'center' as const, fontSize: '8pt', verticalAlign: 'bottom' as const },
};

// ─── Composant principal ──────────────────────────────────────────────────────

// Matières langues étrangères : si pas de note → ne pas afficher sur le bulletin
const LANG_KEYWORDS = ['anglais', 'espagnol', 'allemand'];
const isLang = (name: string) => LANG_KEYWORDS.some(k => name.toLowerCase().includes(k));

export function ReportCard({
  student, grades, allGrades: _allGrades, subjects, classStats,
  term, schoolYear, classAverage, teacherName,
  otherTermsAverages, onClose,
}: ReportCardProps) {
  const [observation, setObservation] = useState('');
  const [mention, setMention] = useState<Mention>(() => getMentionFromAverage(calculateAverage(grades)));
  const [absences, setAbsences] = useState('');
  const [demiJournees, setDemiJournees] = useState('');
  const [retards, setRetards] = useState('');

  // Paramètres école (depuis localStorage si disponible)
  const settings = (() => {
    try { return JSON.parse(localStorage.getItem('college-sully-settings') ?? '{}'); }
    catch { return {}; }
  })();
  const schoolName = settings.schoolName ?? 'COLLÈGE SULLY';

  // Lignes à afficher dans le tableau :
  // - Langues (anglais/espagnol/allemand) : uniquement si une note existe
  // - Toutes les autres matières : toujours affichées
  const displayRows = subjects
    .filter(s => isLang(s.name) ? grades.some(g => g.subjectId === s.id) : true)
    .map(s => ({ subject: s, grade: grades.find(g => g.subjectId === s.id) ?? null }));

  // La moyenne ne compte que les matières effectivement notées
  const studentAverage = calculateAverage(grades);
  const notedCount = grades.length;

  // ── Moyennes Brevet (4ème et 3ème uniquement) ──────────────────────────────
  const isBrevet = /^[34]/.test(student.grade.trim());
  const hasAnglais  = grades.some(g => g.subjectName.toLowerCase().includes('anglais'));
  const hasEspagnol = grades.some(g => g.subjectName.toLowerCase().includes('espagnol'));
  const hasAllemand = grades.some(g => g.subjectName.toLowerCase().includes('allemand'));

  // Moy. Brevet Anglais = toutes matières sauf espagnol et allemand
  const moyBrevAnglais = calculateAverage(
    grades.filter(g => !g.subjectName.toLowerCase().includes('espagnol') && !g.subjectName.toLowerCase().includes('allemand'))
  );
  // Moy. Brevet Espagnol = toutes matières sauf anglais
  const moyBrevEspagnol = calculateAverage(grades.filter(g => !g.subjectName.toLowerCase().includes('anglais')));
  // Moy. Brevet Allemand = toutes matières sauf anglais
  const moyBrevAllemand = calculateAverage(grades.filter(g => !g.subjectName.toLowerCase().includes('anglais')));

  // Mention auto-calculée selon la moyenne (modifiable manuellement avant impression)
  const autoMention = getMentionFromAverage(studentAverage);

  const handlePrint = () => window.print();

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
          onClick={handlePrint}
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
          {/* Observation */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Observation du conseil de classe
            </label>
            <textarea
              value={observation}
              onChange={e => setObservation(e.target.value)}
              placeholder="Saisissez les observations du conseil de classe…"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          {/* Mention + absences */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Mention
                </label>
                {autoMention && mention === autoMention && (
                  <span className="text-xs text-indigo-500 font-medium">● auto</span>
                )}
              </div>
              <select
                value={mention}
                onChange={e => setMention(e.target.value as Mention)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Choisir —</option>
                <option value="félicitations">Félicitations (≥ 16/20)</option>
                <option value="encouragements">Encouragements (14–16)</option>
                <option value="progresse">Doit progresser (10–14)</option>
                <option value="insuffisant">Manque de travail (&lt; 10)</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Absences</label>
                <input type="number" min="0" value={absences} onChange={e => setAbsences(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm text-center" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">½ journées</label>
                <input type="number" min="0" value={demiJournees} onChange={e => setDemiJournees(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm text-center" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Retards</label>
                <input type="number" min="0" value={retards} onChange={e => setRetards(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm text-center" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
           CONTENU DU BULLETIN (imprimable)
         ════════════════════════════════════════════════════════════════════ */}
      <div
        id="bulletin-print"
        style={{ padding: '15px', fontFamily: 'Arial, sans-serif', fontSize: '9pt', background: '#fff', maxWidth: '210mm', margin: '0 auto' }}
      >
        {/* ── 1. En-tête établissement ── */}
        <table style={{ width: '100%', margin: '0 auto', marginBottom: '6px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px', textAlign: 'center', backgroundColor: '#d9d9d9', border: '1px solid #999' }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center' }}>
                        <em style={{ fontSize: '9pt' }}>L'issue vers la réussite</em>
                        <br />
                        <span style={{ color: '#4f81be', fontSize: '18pt', fontWeight: 'bold' }}>{schoolName}</span>
                        <br />
                        <em style={{ fontSize: '8pt' }}>Savoir être — Savoir — Savoir faire</em>
                        <br />
                        <em style={{ fontSize: '8pt' }}>Lot IV A 16 bis Ambodivonkely — Tél : 85 234 94 — sully@moov.mg</em>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 2. Titre ── */}
        <div style={{ textAlign: 'center', margin: '6px 0 10px' }}>
          <span style={{ fontSize: '14pt', fontWeight: 'bold' }}>
            BULLETIN — Trimestre {term} — {schoolYear}
          </span>
        </div>

        {/* ── 3. Infos élève + parents ── */}
        <table style={{ width: '100%', marginBottom: '8px' }}>
          <tbody>
            <tr>
              {/* Infos élève */}
              <td style={{ width: '45%', border: '1px solid #000', verticalAlign: 'top' }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    {[
                      ['Nom', student.lastName.toUpperCase()],
                      ['Prénom', student.firstName],
                      ['Né(e) le', new Date(student.dateOfBirth).toLocaleDateString('fr-FR')],
                      ['Classe', student.grade],
                      ['Année scolaire', schoolYear],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ padding: '3px 6px', fontSize: '8pt', width: '40%', color: '#555' }}>{label}</td>
                        <td style={{ padding: '3px 6px', fontSize: '8pt', borderBottom: '1px dotted #aaa', fontWeight: 'bold' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>

              <td style={{ width: '10%' }}>&nbsp;</td>

              {/* Infos parents */}
              <td style={{ width: '45%', border: '1px solid #000', verticalAlign: 'top' }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 6px', fontSize: '8pt', fontWeight: 'bold', borderBottom: '1px dotted #aaa' }}>
                        Noms des parents
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 6px', fontSize: '8pt', borderBottom: '1px dotted #aaa' }}>
                        {student.parentInfo.fatherName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 6px', fontSize: '8pt', borderBottom: '1px dotted #aaa' }}>
                        {student.parentInfo.motherName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 6px', fontSize: '8pt', fontWeight: 'bold' }}>Adresse des parents</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 6px', fontSize: '8pt' }}>{student.parentInfo.address}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 4. Tableau des notes ── */}
        <table style={{ ...S.table, marginBottom: '0' }}>
          <thead>
            <tr>
              <td rowSpan={2} style={{ ...S.header, textAlign: 'left', width: '22%' }}>
                DISCIPLINE<br /><span style={{ fontWeight: 'normal', fontSize: '7pt' }}>Nom du professeur</span>
              </td>
              <td colSpan={2} style={{ ...S.header }}>Moyennes</td>
              <td rowSpan={2} style={{ ...S.header, width: '6%' }}>Coef</td>
              <td colSpan={2} style={{ ...S.header }}>Notes extrêmes</td>
              <td rowSpan={2} style={{ ...S.header, width: '7%' }}>Niveau</td>
              <td rowSpan={2} style={{ ...S.header }}>Appréciations</td>
            </tr>
            <tr>
              <td style={{ ...S.header, width: '8%' }}>Élève</td>
              <td style={{ ...S.header, width: '8%' }}>Classe</td>
              <td style={{ ...S.header, width: '7%' }}>min</td>
              <td style={{ ...S.header, width: '7%' }}>max</td>
            </tr>
          </thead>
          <tbody>
            {/* Lignes par matière */}
            {displayRows.map(({ subject, grade: g }) => {
              const stats = classStats[subject.id] ?? { avg: 0, min: 0, max: 0 };
              return (
                <tr key={subject.id}>
                  <td style={{ ...S.cell, fontSize: '8pt' }}>
                    <strong>{subject.name}</strong>
                    {subject.teacherName && (
                      <div style={{ fontSize: '7pt', color: '#555', marginTop: '1px' }}>{subject.teacherName}</div>
                    )}
                  </td>
                  <td style={{ ...S.cellC, fontWeight: 'bold' }}>{g ? formatScore(g.score) : '—'}</td>
                  <td style={{ ...S.cellC }}>{stats.avg > 0 ? formatScore(stats.avg) : '—'}</td>
                  <td style={{ ...S.cellC }}>{subject.coefficient}</td>
                  <td style={{ ...S.cellC }}>{stats.min > 0 ? formatScore(stats.min) : '—'}</td>
                  <td style={{ ...S.cellC }}>{stats.max > 0 ? formatScore(stats.max) : '—'}</td>
                  <td style={{ ...S.cellC, fontWeight: 'bold' }}>{g ? getGradeLevel(g.score) : '—'}</td>
                  <td style={{ ...S.cell, fontSize: '7pt' }}>{g?.comments ?? ''}</td>
                </tr>
              );
            })}

            {/* Message si aucune matière */}
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...S.cellC, fontSize: '8pt', color: '#888', fontStyle: 'italic', padding: '8px' }}>
                  Aucune matière configurée pour ce trimestre
                </td>
              </tr>
            )}

            {/* ── Ligne moyenne trimestre ── */}
            <tr style={{ background: '#f0f0f0' }}>
              <td style={{ ...S.cell, fontWeight: 'bold', fontSize: '8pt' }}>
                MOYENNE — Trimestre {term}
              </td>
              <td style={{ ...S.cellC, fontWeight: 'bold', fontSize: '10pt' }}>
                {notedCount > 0 ? formatScore(studentAverage) : '—'}
              </td>
              <td style={{ ...S.cellC }}>
                {classAverage > 0 ? formatScore(classAverage) : '—'}
              </td>
              <td colSpan={5} style={{ ...S.cellC, fontSize: '8pt' }}>
                {/* Autres trimestres */}
                {otherTermsAverages.length > 0 && (
                  <span>
                    <strong>Autres trimestres : </strong>
                    {otherTermsAverages.map((t, i) => (
                      <span key={t.term}>
                        T{t.term} : {formatScore(t.average)}
                        {i < otherTermsAverages.length - 1 ? ' — ' : ''}
                      </span>
                    ))}
                  </span>
                )}
              </td>
            </tr>

            {/* ── Absences ── */}
            <tr>
              <td style={{ ...S.cell, fontSize: '8pt' }}><strong>Absences :</strong></td>
              <td colSpan={2} style={{ ...S.cellC }}>
                {absences !== '' ? absences : '—'}
              </td>
              <td colSpan={5} rowSpan={3} style={{ ...S.cellC, fontSize: '8pt', verticalAlign: 'middle' }}>
                {/* Moyennes Brevet — 4ème et 3ème uniquement */}
                {isBrevet && notedCount > 0 && (
                  <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                    {hasAnglais && (
                      <div><strong>Moy. Brevet Anglais :</strong> {formatScore(moyBrevAnglais)}</div>
                    )}
                    {hasEspagnol && (
                      <div><strong>Moy. Brevet Espagnol :</strong> {formatScore(moyBrevEspagnol)}</div>
                    )}
                    {hasAllemand && (
                      <div><strong>Moy. Brevet Allemand :</strong> {formatScore(moyBrevAllemand)}</div>
                    )}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ ...S.cell, fontSize: '8pt' }}><strong>Absences (demi-journées) :</strong></td>
              <td colSpan={2} style={{ ...S.cellC }}>{demiJournees !== '' ? demiJournees : '—'}</td>
            </tr>
            <tr>
              <td style={{ ...S.cell, fontSize: '8pt' }}><strong>Retards :</strong></td>
              <td colSpan={2} style={{ ...S.cellC }}>{retards !== '' ? retards : '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* ── 5. Pied de bulletin : observations + mentions + signatures ── */}
        <table style={{ width: '100%', marginTop: '8px' }}>
          <tbody>
            <tr>
              {/* Observation du conseil */}
              <td style={{ width: '42%', verticalAlign: 'top', border: '1px solid #000', padding: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '4px', textAlign: 'center' }}>
                  Observation du conseil de classe
                </div>
                <div style={{ minHeight: '60px', fontSize: '8pt' }}>
                  {observation || ''}
                </div>
                <div style={{ marginTop: '8px', borderTop: '1px dotted #aaa', paddingTop: '4px', fontSize: '8pt' }}>
                  <strong>Professeur Principal :</strong><br />
                  {teacherName}
                </div>
              </td>

              <td style={{ width: '3%' }}>&nbsp;</td>

              {/* Mentions */}
              <td style={{ width: '20%', verticalAlign: 'top', padding: '4px' }}>
                {[
                  ['félicitations', 'Félicitations'],
                  ['encouragements', 'Encouragements'],
                  ['progresse', 'Doit progresser'],
                  ['insuffisant', 'Manque de travail'],
                ].map(([val, label]) => (
                  <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '8pt' }}>
                    <input
                      type="checkbox"
                      readOnly
                      checked={mention === val}
                      style={{ width: '12px', height: '12px' }}
                    />
                    <span>{label}</span>
                  </div>
                ))}
              </td>

              <td style={{ width: '3%' }}>&nbsp;</td>

              {/* Signatures */}
              <td style={{ width: '32%', verticalAlign: 'top', border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '8pt' }}>
                <strong>Visa du chef d'établissement</strong>
                <br /><br /><br />
                <div style={{ borderBottom: '1px solid #aaa', marginBottom: '12px' }} />
                <strong>Signature des parents</strong>
                <br /><br /><br />
              </td>
            </tr>
          </tbody>
        </table>
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
