/**
 * Conseil de classe — affiche les élèves par ordre de mérite (moyenne décroissante).
 * Pour chaque élève : photo, nom, moyenne trimestrielle, moyennes Brevet (3ème/4ème),
 * et le mini-bulletin (tableau des notes identique au bulletin officiel).
 */
import { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import type { Student } from '../../types/student';
import type { Subject } from '../../types/subject';
import type { Grade } from '../../types/grade';
import { gradesApi } from '../../services/api';
import { calculateAverage, calculateClassStats, getGradeLevel } from '../../utils/grades';

interface ClassCouncilViewProps {
  grade: string;
  term: 1 | 2 | 3;
  students: Student[];
  subjects: Subject[];
  onClose: () => void;
}

const LANG_KEYWORDS = ['anglais', 'espagnol', 'allemand'];
const isLang = (name: string) => LANG_KEYWORDS.some(k => name.toLowerCase().includes(k));

// Styles inline identiques au bulletin officiel
const S = {
  table:  { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8pt' },
  cell:   { padding: '3px', border: '1px solid #000', verticalAlign: 'middle' as const },
  cellC:  { padding: '3px', border: '1px solid #000', textAlign: 'center' as const, verticalAlign: 'middle' as const },
  header: { padding: '3px', border: '1px solid #000', background: '#d9d9d9', fontWeight: 'bold' as const, textAlign: 'center' as const, fontSize: '8pt', verticalAlign: 'bottom' as const },
};

export function ClassCouncilView({ grade, term, students, subjects, onClose }: ClassCouncilViewProps) {
  const [allTermGrades, setAllTermGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentIds = new Set(students.map(s => s.id));
    gradesApi.getAll().then(grades => {
      setAllTermGrades(grades.filter(g => studentIds.has(g.studentId) && g.term === term));
      setLoading(false);
    });
  }, [students, term]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" />
        <span>Chargement des notes…</span>
      </div>
    );
  }

  // Stats de classe par matière (pour colonne min/max/moy classe)
  const classStats: Record<string, { avg: number; min: number; max: number }> = {};
  for (const subject of subjects) {
    const sg = allTermGrades.filter(g => g.subjectId === subject.id);
    classStats[subject.id] = calculateClassStats(sg);
  }

  // Moyenne générale de la classe (tous élèves confondus)
  const classAvg = calculateAverage(allTermGrades);

  // Classement par ordre de mérite
  const isBrevet = /^[34]/.test(grade.trim());

  const ranked = students
    .map(student => {
      const sg = allTermGrades.filter(g => g.studentId === student.id);
      return { student, grades: sg, avg: calculateAverage(sg) };
    })
    .sort((a, b) => b.avg - a.avg);

  const medalColor = (i: number) => {
    if (i === 0) return '#f59e0b'; // or
    if (i === 1) return '#94a3b8'; // argent
    if (i === 2) return '#b45309'; // bronze
    return '#6366f1';
  };

  return (
    <>
      {/* ── Barre d'actions (masquée à l'impression) ── */}
      <div className="no-print bg-indigo-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-800 rounded-lg" title="Retour">
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="font-semibold">Conseil de classe — {grade}</span>
            <span className="text-indigo-300 text-sm ml-2">Trimestre {term}</span>
            <span className="text-indigo-400 text-xs ml-2">({ranked.length} élève{ranked.length > 1 ? 's' : ''})</span>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium"
        >
          <Printer size={16} />
          Imprimer
        </button>
      </div>

      {/* ── Contenu imprimable ── */}
      <div className="council-wrap">
        <h2 className="council-title">
          Conseil de classe — {grade} &mdash; Trimestre {term}
        </h2>

        {ranked.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
            Aucune note saisie pour ce trimestre.
          </p>
        )}

        {ranked.map(({ student, grades: sg, avg }, index) => {
          // Lignes à afficher : langues uniquement si notées
          const displayRows = subjects
            .filter(s => isLang(s.name) ? sg.some(g => g.subjectId === s.id) : true)
            .map(s => ({ subject: s, gradeRow: sg.find(g => g.subjectId === s.id) ?? null }));

          // Moyennes Brevet
          const hasAnglais  = sg.some(g => g.subjectName?.toLowerCase().includes('anglais'));
          const hasEspagnol = sg.some(g => g.subjectName?.toLowerCase().includes('espagnol'));
          const hasAllemand = sg.some(g => g.subjectName?.toLowerCase().includes('allemand'));

          const moyBrevAnglais  = calculateAverage(sg.filter(g =>
            !g.subjectName?.toLowerCase().includes('espagnol') &&
            !g.subjectName?.toLowerCase().includes('allemand')
          ));
          const moyBrevEspagnol = calculateAverage(sg.filter(g =>
            !g.subjectName?.toLowerCase().includes('anglais')
          ));
          const moyBrevAllemand = calculateAverage(sg.filter(g =>
            !g.subjectName?.toLowerCase().includes('anglais')
          ));

          return (
            <div key={student.id} className="student-card">
              {/* En-tête élève */}
              <div className="student-header">
                {/* Rang */}
                <div className="student-rank" style={{ color: medalColor(index) }}>
                  #{index + 1}
                </div>

                {/* Photo */}
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt="" className="student-photo" />
                ) : (
                  <div className="student-avatar">
                    {student.firstName?.[0]}{student.lastName?.[0]}
                  </div>
                )}

                {/* Infos */}
                <div className="student-info">
                  <div className="student-name">
                    {student.lastName?.toUpperCase()} {student.firstName}
                  </div>
                  <div className="student-avg" style={{ color: avg >= 10 ? '#16a34a' : '#dc2626' }}>
                    Moyenne trimestrielle&nbsp;:&nbsp;
                    <strong>{avg > 0 ? avg.toFixed(2) : '—'}/20</strong>
                  </div>
                  {isBrevet && avg > 0 && (
                    <div className="brevet-row">
                      {hasAnglais  && <span>Moyenne Brevet Anglais&nbsp;: <strong>{moyBrevAnglais.toFixed(2)}</strong></span>}
                      {hasEspagnol && <span>Moyenne Brevet Espagnol&nbsp;: <strong>{moyBrevEspagnol.toFixed(2)}</strong></span>}
                      {hasAllemand && <span>Moyenne Brevet Allemand&nbsp;: <strong>{moyBrevAllemand.toFixed(2)}</strong></span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Mini-bulletin */}
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={{ ...S.header, width: '22%', textAlign: 'left' as const }}>
                      DISCIPLINE<br />
                      <span style={{ fontWeight: 'normal', fontSize: '7pt' }}>Nom du professeur</span>
                    </th>
                    <th style={S.header} colSpan={2}>Moyennes</th>
                    <th style={{ ...S.header, width: '5%' }}></th>
                    <th style={S.header} colSpan={2}>Notes extrêmes</th>
                    <th style={{ ...S.header, width: '7%' }}>Niveau</th>
                    <th style={{ ...S.header, width: '26%' }}>Appréciations</th>
                  </tr>
                  <tr>
                    <th style={{ ...S.header, textAlign: 'left' as const }}></th>
                    <th style={{ ...S.header, width: '7%' }}>Élève</th>
                    <th style={{ ...S.header, width: '7%' }}>Classe</th>
                    <th style={{ ...S.header, width: '5%' }}>Coef</th>
                    <th style={{ ...S.header, width: '6%' }}>min</th>
                    <th style={{ ...S.header, width: '6%' }}>max</th>
                    <th style={S.header}></th>
                    <th style={S.header}></th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map(({ subject, gradeRow }) => {
                    const cs = classStats[subject.id];
                    const score = gradeRow?.score;
                    const hasScore = score !== undefined && score !== null && !isNaN(score);
                    return (
                      <tr key={subject.id}>
                        <td style={{ ...S.cell, fontSize: '7pt' }}>
                          <div style={{ fontWeight: 'bold' }}>{subject.name}</div>
                          <div style={{ color: '#4f81be', fontSize: '6.5pt' }}>{subject.teacherName ?? ''}</div>
                        </td>
                        <td style={S.cellC}>{hasScore ? score!.toFixed(2) : '—'}</td>
                        <td style={S.cellC}>{cs && cs.avg > 0 ? cs.avg.toFixed(2) : '—'}</td>
                        <td style={{ ...S.cellC, color: subject.coefficient === 1 ? '#4f81be' : undefined }}>
                          {subject.coefficient}
                        </td>
                        <td style={S.cellC}>{cs && cs.min > 0 ? cs.min.toFixed(2) : '—'}</td>
                        <td style={S.cellC}>{cs && cs.max > 0 ? cs.max.toFixed(2) : '—'}</td>
                        <td style={S.cellC}>{hasScore ? getGradeLevel(score!) : '—'}</td>
                        <td style={S.cell}>{gradeRow?.comments ?? ''}</td>
                      </tr>
                    );
                  })}

                  {/* Ligne MOYENNE */}
                  <tr style={{ background: '#f3f4f6' }}>
                    <td style={{ ...S.cell, fontWeight: 'bold' }}>
                      MOYENNE — Trimestre {term}
                    </td>
                    <td style={{ ...S.cellC, fontWeight: 'bold' }}>
                      {avg > 0 ? avg.toFixed(2) : '—'}
                    </td>
                    <td style={{ ...S.cellC, fontWeight: 'bold' }}>
                      {classAvg > 0 ? classAvg.toFixed(2) : '—'}
                    </td>
                    <td style={S.cellC} colSpan={5}></td>
                  </tr>

                  {/* Absences */}
                  <tr>
                    <td style={S.cell}>Absences&nbsp;:</td>
                    <td style={S.cellC}>—</td>
                    <td style={S.cell} colSpan={6}></td>
                  </tr>
                  <tr>
                    <td style={S.cell}>Absences (demi-journées)&nbsp;:</td>
                    <td style={S.cellC}>—</td>
                    <td style={S.cell} colSpan={6}></td>
                  </tr>
                  <tr>
                    <td style={S.cell}>Retards&nbsp;:</td>
                    <td style={S.cellC}>—</td>
                    <td style={S.cell} colSpan={6}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <style>{`
        .council-wrap {
          padding: 20px;
          font-family: 'Times New Roman', Times, serif;
          background: #f8fafc;
          min-height: 100vh;
        }
        .council-title {
          text-align: center;
          font-size: 17px;
          font-weight: bold;
          color: #09438a;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .student-card {
          margin-bottom: 28px;
          page-break-inside: avoid;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .student-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: #f1f5f9;
          border-bottom: 1px solid #e2e8f0;
        }
        .student-rank {
          font-size: 22px;
          font-weight: 900;
          min-width: 38px;
          text-align: center;
        }
        .student-photo {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #cbd5e1;
          flex-shrink: 0;
        }
        .student-avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #e0e7ff;
          color: #4338ca;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: bold;
          border: 2px solid #c7d2fe;
          flex-shrink: 0;
        }
        .student-info { flex: 1; }
        .student-name {
          font-size: 14px;
          font-weight: bold;
          color: #1e293b;
        }
        .student-avg {
          font-size: 13px;
          margin-top: 2px;
        }
        .brevet-row {
          font-size: 11px;
          color: #475569;
          margin-top: 3px;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          .no-print { display: none !important; }
          .council-wrap {
            background: none;
            padding: 0;
          }
          .student-card {
            page-break-inside: avoid;
            box-shadow: none;
            border: 1px solid #ccc;
            border-radius: 0;
            margin-bottom: 14px;
          }
          .student-header {
            background: #f1f5f9;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}
