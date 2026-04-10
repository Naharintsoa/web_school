/**
 * BulletinPrintContent — contenu imprimable du bulletin scolaire.
 * Composant pur (pas de state), utilisé par ReportCard et BulletinMultiPrint.
 */
import type { Student } from '../../../types/student';
import type { Grade } from '../../../types/grade';
import type { Subject } from '../../../types/subject';
import { calculateAverage, getGradeLevel, formatScore } from '../../../utils/grades';

interface ClassSubjectStats { avg: number; min: number; max: number; }
interface OtherTermAverage { term: 1 | 2 | 3; average: number; }

export interface BulletinPrintContentProps {
  student: Student;
  /** Notes du trimestre courant (matières actives uniquement) */
  grades: Grade[];
  subjects: Subject[];
  classStats: Record<string, ClassSubjectStats>;
  term: 1 | 2 | 3;
  schoolYear: string;
  classAverage: number;
  teacherName: string;
  otherTermsAverages: OtherTermAverage[];
  observation?: string;
  mention?: string;
  absences?: string;
  demiJournees?: string;
  retards?: string;
}

const S = {
  table:  { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8pt' },
  cell:   { padding: '3px', border: '1px solid #000', verticalAlign: 'middle' as const },
  cellC:  { padding: '3px', border: '1px solid #000', textAlign: 'center' as const, verticalAlign: 'middle' as const },
  header: { padding: '3px', border: '1px solid #000', background: '#d9d9d9', fontWeight: 'bold' as const, textAlign: 'center' as const, fontSize: '8pt', verticalAlign: 'bottom' as const },
};

const OPTIONAL_KEYWORDS = ['anglais', 'espagnol', 'allemand', 'litter'];
const isOptional = (name: string) => OPTIONAL_KEYWORDS.some(k => name.toLowerCase().includes(k));

export function BulletinPrintContent({
  student, grades, subjects, classStats, term, schoolYear,
  classAverage, teacherName, otherTermsAverages,
  observation = '', mention = '', absences = '', demiJournees = '', retards = '',
}: BulletinPrintContentProps) {
  const displayRows = subjects
    .filter(s => {
      // Toujours masquer si pas de note élève ET pas de stats de classe (cours pas eu lieu)
      const hasStudentGrade = grades.some(g => g.subjectId === s.id);
      const stats = classStats[s.id];
      const hasClassGrade = stats && (stats.avg > 0 || stats.min > 0 || stats.max > 0);
      if (!hasStudentGrade && !hasClassGrade) return false;
      return true;
    })
    .map(s => ({ subject: s, grade: grades.find(g => g.subjectId === s.id) ?? null }));

  const studentAverage = calculateAverage(grades);
  const notedCount = grades.length;

  const isBrevet = /^[34]/.test(student.grade?.trim() ?? '');
  const hasAnglais  = grades.some(g => g.subjectName?.toLowerCase().includes('anglais'));
  const hasEspagnol = grades.some(g => g.subjectName?.toLowerCase().includes('espagnol'));
  const hasAllemand = grades.some(g => g.subjectName?.toLowerCase().includes('allemand'));

  const moyBrevAnglais  = calculateAverage(grades.filter(g =>
    !g.subjectName?.toLowerCase().includes('espagnol') && !g.subjectName?.toLowerCase().includes('allemand')
  ));
  const moyBrevEspagnol = calculateAverage(grades.filter(g => !g.subjectName?.toLowerCase().includes('anglais')));
  const moyBrevAllemand = calculateAverage(grades.filter(g => !g.subjectName?.toLowerCase().includes('anglais')));

  return (
    <div style={{ padding: '15px', fontFamily: 'Arial, sans-serif', fontSize: '9pt', background: '#fff', width: '210mm', boxSizing: 'border-box' }}>

      {/* ── 1. En-tête établissement ── */}
      <table style={{ width: '100%', marginBottom: '6px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '4px', backgroundColor: '#d9d9d9', border: '1px solid #999' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '14%', textAlign: 'center', verticalAlign: 'middle' }}>
                      <img
                        src="/assets/logo-sully.png"
                        alt="Logo Sully"
                        style={{ height: '70px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <em style={{ fontSize: '9pt' }}>L'issue vers la réussite</em>
                      <br />
                      <span style={{ color: '#4f81be', fontSize: '18pt', fontWeight: 'bold' }}>
                        COLLEGE PRIVE SULLY
                      </span>
                      <br />
                      <em style={{ fontSize: '8pt' }}>Savoir être — Savoir — Savoir faire</em>
                      <br />
                      <em style={{ fontSize: '8pt' }}>
                        Lot IV A 16 bis Ambodivonkely — Tél : 85 234 94 — sully.amb@moov.mg
                      </em>
                    </td>
                    <td style={{ width: '14%' }} />
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
            <td style={{ width: '45%', border: '1px solid #000', verticalAlign: 'top' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  {[
                    ['Nom', student.lastName?.toUpperCase()],
                    ['Prénom', student.firstName],
                    ['Né(e) le', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR') : '—'],
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
            <td style={{ width: '45%', border: '1px solid #000', verticalAlign: 'top' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr><td style={{ padding: '3px 6px', fontSize: '8pt', fontWeight: 'bold', borderBottom: '1px dotted #aaa' }}>Noms des parents</td></tr>
                  <tr><td style={{ padding: '3px 6px', fontSize: '8pt', borderBottom: '1px dotted #aaa' }}>{student.parentInfo?.fatherName}</td></tr>
                  <tr><td style={{ padding: '3px 6px', fontSize: '8pt', borderBottom: '1px dotted #aaa' }}>{student.parentInfo?.motherName}</td></tr>
                  <tr><td style={{ padding: '3px 6px', fontSize: '8pt', fontWeight: 'bold' }}>Adresse des parents</td></tr>
                  <tr><td style={{ padding: '3px 6px', fontSize: '8pt' }}>{student.parentInfo?.address}</td></tr>
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
            <td colSpan={2} style={S.header}>Moyennes</td>
            <td rowSpan={2} style={{ ...S.header, width: '6%' }}>Coef</td>
            <td colSpan={2} style={S.header}>Notes extrêmes</td>
            <td rowSpan={2} style={{ ...S.header, width: '7%' }}>Niveau</td>
            <td rowSpan={2} style={S.header}>Appréciations</td>
          </tr>
          <tr>
            <td style={{ ...S.header, width: '8%' }}>Élève</td>
            <td style={{ ...S.header, width: '8%' }}>Classe</td>
            <td style={{ ...S.header, width: '7%' }}>min</td>
            <td style={{ ...S.header, width: '7%' }}>max</td>
          </tr>
        </thead>
        <tbody>
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
                <td style={S.cellC}>{stats.avg > 0 ? formatScore(stats.avg) : '—'}</td>
                <td style={S.cellC}>{subject.coefficient}</td>
                <td style={S.cellC}>{stats.min > 0 ? formatScore(stats.min) : '—'}</td>
                <td style={S.cellC}>{stats.max > 0 ? formatScore(stats.max) : '—'}</td>
                <td style={{ ...S.cellC, fontWeight: 'bold' }}>{g ? getGradeLevel(g.score) : '—'}</td>
                <td style={{ ...S.cell, fontSize: '7pt' }}>{g?.comments ?? ''}</td>
              </tr>
            );
          })}

          {displayRows.length === 0 && (
            <tr>
              <td colSpan={8} style={{ ...S.cellC, fontSize: '8pt', color: '#888', fontStyle: 'italic', padding: '8px' }}>
                Aucune matière configurée pour ce trimestre
              </td>
            </tr>
          )}

          {/* Ligne moyenne trimestre */}
          <tr style={{ background: '#f0f0f0' }}>
            <td style={{ ...S.cell, fontWeight: 'bold', fontSize: '8pt' }}>MOYENNE — Trimestre {term}</td>
            <td style={{ ...S.cellC, fontWeight: 'bold', fontSize: '10pt' }}>
              {notedCount > 0 ? formatScore(studentAverage) : '—'}
            </td>
            <td style={S.cellC}>{classAverage > 0 ? formatScore(classAverage) : '—'}</td>
            <td colSpan={5} style={{ ...S.cellC, fontSize: '8pt' }}>
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

          {/* Absences */}
          <tr>
            <td style={{ ...S.cell, fontSize: '8pt' }}><strong>Absences :</strong></td>
            <td colSpan={2} style={S.cellC}>{absences || '—'}</td>
            <td colSpan={5} rowSpan={3} style={{ ...S.cellC, fontSize: '8pt', verticalAlign: 'middle' }}>
              {isBrevet && notedCount > 0 && (
                <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                  {hasAnglais  && <div><strong>Moyenne Brevet Anglais :</strong> {formatScore(moyBrevAnglais)}</div>}
                  {hasEspagnol && <div><strong>Moyenne Brevet Espagnol :</strong> {formatScore(moyBrevEspagnol)}</div>}
                  {hasAllemand && <div><strong>Moyenne Brevet Allemand :</strong> {formatScore(moyBrevAllemand)}</div>}
                </div>
              )}
            </td>
          </tr>
          <tr>
            <td style={{ ...S.cell, fontSize: '8pt' }}><strong>Absences (demi-journées) :</strong></td>
            <td colSpan={2} style={S.cellC}>{demiJournees || '—'}</td>
          </tr>
          <tr>
            <td style={{ ...S.cell, fontSize: '8pt' }}><strong>Retards :</strong></td>
            <td colSpan={2} style={S.cellC}>{retards || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* ── 5. Observations + mentions + signatures ── */}
      <table style={{ width: '100%', marginTop: '8px' }}>
        <tbody>
          <tr>
            <td style={{ width: '42%', verticalAlign: 'top', border: '1px solid #000', padding: '6px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '4px', textAlign: 'center' }}>
                Observation du conseil de classe
              </div>
              <div style={{ minHeight: '60px', fontSize: '8pt' }}>{observation}</div>
              <div style={{ marginTop: '8px', borderTop: '1px dotted #aaa', paddingTop: '4px', fontSize: '8pt' }}>
                <strong>Professeur Principal :</strong><br />{teacherName}
              </div>
            </td>
            <td style={{ width: '3%' }}>&nbsp;</td>
            <td style={{ width: '20%', verticalAlign: 'top', padding: '4px' }}>
              {[
                ['félicitations', 'Félicitations'],
                ['encouragements', 'Encouragements'],
                ['progresse', 'Doit progresser'],
                ['insuffisant', 'Manque de travail'],
              ].map(([val, label]) => (
                <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', fontSize: '8pt' }}>
                  <input type="checkbox" readOnly checked={mention === val} style={{ width: '12px', height: '12px' }} />
                  <span>{label}</span>
                </div>
              ))}
            </td>
            <td style={{ width: '3%' }}>&nbsp;</td>
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
  );
}
