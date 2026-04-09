/**
 * Conseil de classe — classement des élèves par ordre de mérite (moyenne décroissante).
 * T2 : compare avec T1. T3 : compare avec T1 et T2.
 */
import { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Loader2, TrendingUp, TrendingDown, Minus, MonitorPlay } from 'lucide-react';
import { getSocket, disconnectSocket } from '../../services/councilSocket';
import type { Student } from '../../types/student';
import type { Subject } from '../../types/subject';
import type { Grade } from '../../types/grade';
import { gradesApi } from '../../services/api';
import { calculateAverage, calculateClassStats, getGradeLevel } from '../../utils/grades';
import { CouncilDiapo } from './CouncilDiapo';
import type { StudentSlide } from './CouncilDiapo';

interface ClassCouncilViewProps {
  grade: string;
  term: 1 | 2 | 3;
  students: Student[];
  subjects: Subject[];
  onClose: () => void;
}

const LANG_KEYWORDS = ['anglais', 'espagnol', 'allemand'];
const isLang = (name: string) => LANG_KEYWORDS.some(k => name.toLowerCase().includes(k));

const S = {
  table:  { width: '100%', borderCollapse: 'collapse' as const, fontSize: '8pt' },
  cell:   { padding: '3px', border: '1px solid #000', verticalAlign: 'middle' as const },
  cellC:  { padding: '3px', border: '1px solid #000', textAlign: 'center' as const, verticalAlign: 'middle' as const },
  header: { padding: '3px', border: '1px solid #000', background: '#d9d9d9', fontWeight: 'bold' as const, textAlign: 'center' as const, fontSize: '8pt', verticalAlign: 'bottom' as const },
};

/** Calcule les moyennes Brevet pour un ensemble de notes */
function brevets(sg: Grade[]) {
  return {
    hasAnglais:  sg.some(g => g.subjectName?.toLowerCase().includes('anglais')),
    hasEspagnol: sg.some(g => g.subjectName?.toLowerCase().includes('espagnol')),
    hasAllemand: sg.some(g => g.subjectName?.toLowerCase().includes('allemand')),
    anglais:  calculateAverage(sg.filter(g =>
      !g.subjectName?.toLowerCase().includes('espagnol') &&
      !g.subjectName?.toLowerCase().includes('allemand'))),
    espagnol: calculateAverage(sg.filter(g => !g.subjectName?.toLowerCase().includes('anglais'))),
    allemand: calculateAverage(sg.filter(g => !g.subjectName?.toLowerCase().includes('anglais'))),
  };
}

/** Flèche de tendance entre deux valeurs */
function Trend({ prev, curr }: { prev: number; curr: number }) {
  if (prev <= 0 || curr <= 0) return null;
  const diff = curr - prev;
  const abs  = Math.abs(diff).toFixed(2);
  if (diff > 0.05)  return <span className="trend up">   <TrendingUp  size={12} /> +{abs}</span>;
  if (diff < -0.05) return <span className="trend down"> <TrendingDown size={12} /> -{abs}</span>;
  return <span className="trend eq"><Minus size={12} /> ={abs}</span>;
}

export function ClassCouncilView({ grade, term, students, subjects, onClose }: ClassCouncilViewProps) {
  // Toutes les notes de la classe, TOUS trimestres confondus
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDiapo, setShowDiapo] = useState(false);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    const studentIds = new Set(students.map(s => s.id));
    gradesApi.getAll().then(grades => {
      setAllGrades(grades.filter(g => studentIds.has(g.studentId)));
      setLoading(false);
    });
  }, [students]);

  const openDiapo = async () => {
    // Construire les données du diaporama
    const gradesByTerm = (t: 1 | 2 | 3) => allGrades.filter(g => g.term === t);
    const currentTermGrades = gradesByTerm(term);
    const csLocal: Record<string, { avg: number; min: number; max: number }> = {};
    for (const subject of subjects) {
      csLocal[subject.id] = calculateClassStats(currentTermGrades.filter(g => g.subjectId === subject.id));
    }
    const caLocal = calculateAverage(currentTermGrades);
    const isBrevet = /^[34]/.test(grade.trim());

    const ranked = students
      .map(s => ({ s, sg: currentTermGrades.filter(g => g.studentId === s.id), sg1: gradesByTerm(1).filter(g => g.studentId === s.id), sg2: gradesByTerm(2).filter(g => g.studentId === s.id) }))
      .map(r => ({ ...r, avg: calculateAverage(r.sg) }))
      .sort((a, b) => b.avg - a.avg);

    const slidesData: StudentSlide[] = ranked.map((r, i) => ({
      student: r.s,
      rank: i + 1,
      avg: r.avg,
      avg1: calculateAverage(r.sg1),
      avg2: calculateAverage(r.sg2),
      sg: r.sg,
      brev:  brevets(r.sg),
      brev1: brevets(r.sg1),
      brev2: brevets(r.sg2),
    }));

    try {
      const schoolYear = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);
      const res = await fetch('/api/council-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          grade, term, schoolYear,
          students: slidesData.map(sl => ({
            id: sl.student.id,
            firstName: sl.student.firstName,
            lastName: sl.student.lastName,
            matricule: sl.student.matricule ?? '',
            avg: sl.avg,
          })),
          diapoData: { slides: slidesData, subjects, classStats: csLocal, classAvg: caLocal, isBrevet },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Rejoindre la session socket en tant qu'admin
      const socket = getSocket();
      const joinAdmin = () => socket.emit('join-council', { sessionId: data.id, name: 'Organisateur', role: 'admin' });
      if (socket.connected) joinAdmin(); else socket.once('connect', joinAdmin);

      // Construire l'URL QR avec l'IP LAN réelle
      let base = window.location.origin;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          const info = await fetch('/api/council-sessions/server-info');
          const { ip } = await info.json();
          const port = window.location.port || '80';
          base = `${window.location.protocol}//${ip}:${port}`;
        } catch { /* fallback localhost */ }
      }
      setJoinUrl(`${base}/conseil/${data.id}`);
      setLiveSessionId(data.id);
    } catch (err: any) {
      alert('Impossible de démarrer le diaporama partagé : ' + err.message);
    }

    setShowDiapo(true);
  };

  const closeDiapo = () => {
    if (liveSessionId) {
      getSocket().emit('close-session', { sessionId: liveSessionId });
      disconnectSocket();
      setLiveSessionId(null);
      setJoinUrl('');
    }
    setShowDiapo(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3" />
        <span>Chargement des notes…</span>
      </div>
    );
  }

  // Notes filtrées par trimestre
  const gradesByTerm = (t: 1 | 2 | 3) => allGrades.filter(g => g.term === t);
  const currentTermGrades = gradesByTerm(term);

  // Stats de classe (trimestre courant) pour le mini-bulletin
  const classStats: Record<string, { avg: number; min: number; max: number }> = {};
  for (const subject of subjects) {
    classStats[subject.id] = calculateClassStats(
      currentTermGrades.filter(g => g.subjectId === subject.id)
    );
  }
  const classAvg = calculateAverage(currentTermGrades);

  const isBrevet = /^[34]/.test(grade.trim());
  const medalColor = (i: number) => ['#f59e0b', '#94a3b8', '#b45309'][i] ?? '#6366f1';

  // Classement par ordre de mérite (trimestre courant)
  const ranked = students
    .map(student => ({
      student,
      sg:  currentTermGrades.filter(g => g.studentId === student.id),
      sg1: gradesByTerm(1).filter(g => g.studentId === student.id),
      sg2: gradesByTerm(2).filter(g => g.studentId === student.id),
    }))
    .map(r => ({ ...r, avg: calculateAverage(r.sg) }))
    .sort((a, b) => b.avg - a.avg);

  const termLabel = (t: number) => `Trimestre ${t}`;

  // Slides pour le diaporama (ordre de mérite)
  const slides: StudentSlide[] = ranked.map((r, i) => ({
    student: r.student,
    rank: i + 1,
    avg: r.avg,
    avg1: calculateAverage(r.sg1),
    avg2: calculateAverage(r.sg2),
    sg: r.sg,
    brev:  brevets(r.sg),
    brev1: brevets(r.sg1),
    brev2: brevets(r.sg2),
  }));

  if (showDiapo) {
    return (
      <CouncilDiapo
        slides={slides}
        term={term}
        grade={grade}
        subjects={subjects}
        classStats={classStats}
        classAvg={classAvg}
        isBrevet={isBrevet}
        onClose={closeDiapo}
        onNavigate={idx => liveSessionId && getSocket().emit('set-student', { sessionId: liveSessionId, index: idx })}
        joinUrl={joinUrl || undefined}
      />
    );
  }

  return (
    <>
      {/* ── Barre d'actions ── */}
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
          onClick={openDiapo}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium"
        >
          <MonitorPlay size={16} />
          Diaporama
        </button>
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

        {ranked.map(({ student, sg, sg1, sg2, avg }, index) => {
          const avg1 = calculateAverage(sg1);
          const avg2 = calculateAverage(sg2);
          const brev  = brevets(sg);
          const brev1 = brevets(sg1);
          const brev2 = brevets(sg2);

          const displayRows = subjects
            .filter(s => isLang(s.name) ? sg.some(g => g.subjectId === s.id) : true)
            .map(s => ({ subject: s, gradeRow: sg.find(g => g.subjectId === s.id) ?? null }));

          return (
            <div key={student.id} className="student-card">
              {/* ── En-tête élève ── */}
              <div className="student-header">
                <div className="student-rank" style={{ color: medalColor(index) }}>#{index + 1}</div>

                {student.photoUrl ? (
                  <img src={student.photoUrl} alt="" className="student-photo" />
                ) : (
                  <div className="student-avatar">
                    {student.firstName?.[0]}{student.lastName?.[0]}
                  </div>
                )}

                <div className="student-info">
                  <div className="student-name">
                    {student.lastName?.toUpperCase()} {student.firstName}
                  </div>

                  {/* Moyenne trimestrielle + comparaison */}
                  <div className="avg-line">
                    {/* Trimestres précédents en gris */}
                    {term >= 2 && avg1 > 0 && (
                      <span className="prev-avg">{termLabel(1)}&nbsp;: {avg1.toFixed(2)}</span>
                    )}
                    {term === 3 && avg2 > 0 && (
                      <span className="prev-avg">{termLabel(2)}&nbsp;: {avg2.toFixed(2)}</span>
                    )}
                    {/* Trimestre courant */}
                    <span style={{ color: avg >= 10 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                      {termLabel(term)}&nbsp;: {avg > 0 ? avg.toFixed(2) : '—'}/20
                    </span>
                    {/* Flèches de tendance */}
                    {term === 2 && <Trend prev={avg1} curr={avg} />}
                    {term === 3 && avg2 > 0 && <Trend prev={avg2} curr={avg} />}
                    {term === 3 && avg2 <= 0 && avg1 > 0 && <Trend prev={avg1} curr={avg} />}
                  </div>

                  {/* Moyennes Brevet + comparaison */}
                  {isBrevet && avg > 0 && (
                    <div className="brevet-block">
                      {/* Anglais */}
                      {brev.hasAnglais && (
                        <div className="brevet-line">
                          <span className="brevet-label">Moyenne Brevet Anglais&nbsp;:</span>
                          {term >= 2 && brev1.hasAnglais && brev1.anglais > 0 && (
                            <span className="prev-avg">{termLabel(1)}&nbsp;:&nbsp;{brev1.anglais.toFixed(2)}</span>
                          )}
                          {term === 3 && brev2.hasAnglais && brev2.anglais > 0 && (
                            <span className="prev-avg">{termLabel(2)}&nbsp;:&nbsp;{brev2.anglais.toFixed(2)}</span>
                          )}
                          <strong>{termLabel(term)}&nbsp;:&nbsp;{brev.anglais.toFixed(2)}</strong>
                          {term === 2 && <Trend prev={brev1.anglais} curr={brev.anglais} />}
                          {term === 3 && brev2.anglais > 0 && <Trend prev={brev2.anglais} curr={brev.anglais} />}
                          {term === 3 && brev2.anglais <= 0 && <Trend prev={brev1.anglais} curr={brev.anglais} />}
                        </div>
                      )}
                      {/* Espagnol */}
                      {brev.hasEspagnol && (
                        <div className="brevet-line">
                          <span className="brevet-label">Moyenne Brevet Espagnol&nbsp;:</span>
                          {term >= 2 && brev1.hasEspagnol && brev1.espagnol > 0 && (
                            <span className="prev-avg">{termLabel(1)}&nbsp;:&nbsp;{brev1.espagnol.toFixed(2)}</span>
                          )}
                          {term === 3 && brev2.hasEspagnol && brev2.espagnol > 0 && (
                            <span className="prev-avg">{termLabel(2)}&nbsp;:&nbsp;{brev2.espagnol.toFixed(2)}</span>
                          )}
                          <strong>{termLabel(term)}&nbsp;:&nbsp;{brev.espagnol.toFixed(2)}</strong>
                          {term === 2 && <Trend prev={brev1.espagnol} curr={brev.espagnol} />}
                          {term === 3 && brev2.espagnol > 0 && <Trend prev={brev2.espagnol} curr={brev.espagnol} />}
                          {term === 3 && brev2.espagnol <= 0 && <Trend prev={brev1.espagnol} curr={brev.espagnol} />}
                        </div>
                      )}
                      {/* Allemand */}
                      {brev.hasAllemand && (
                        <div className="brevet-line">
                          <span className="brevet-label">Moyenne Brevet Allemand&nbsp;:</span>
                          {term >= 2 && brev1.hasAllemand && brev1.allemand > 0 && (
                            <span className="prev-avg">{termLabel(1)}&nbsp;:&nbsp;{brev1.allemand.toFixed(2)}</span>
                          )}
                          {term === 3 && brev2.hasAllemand && brev2.allemand > 0 && (
                            <span className="prev-avg">{termLabel(2)}&nbsp;:&nbsp;{brev2.allemand.toFixed(2)}</span>
                          )}
                          <strong>{termLabel(term)}&nbsp;:&nbsp;{brev.allemand.toFixed(2)}</strong>
                          {term === 2 && <Trend prev={brev1.allemand} curr={brev.allemand} />}
                          {term === 3 && brev2.allemand > 0 && <Trend prev={brev2.allemand} curr={brev.allemand} />}
                          {term === 3 && brev2.allemand <= 0 && <Trend prev={brev1.allemand} curr={brev.allemand} />}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Mini-bulletin ── */}
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

                  <tr style={{ background: '#f3f4f6' }}>
                    <td style={{ ...S.cell, fontWeight: 'bold' }}>MOYENNE — Trimestre {term}</td>
                    <td style={{ ...S.cellC, fontWeight: 'bold' }}>{avg > 0 ? avg.toFixed(2) : '—'}</td>
                    <td style={{ ...S.cellC, fontWeight: 'bold' }}>{classAvg > 0 ? classAvg.toFixed(2) : '—'}</td>
                    <td style={S.cellC} colSpan={5}></td>
                  </tr>
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
          align-items: flex-start;
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
          padding-top: 4px;
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
          margin-bottom: 4px;
        }
        /* Ligne moyenne trimestrielle avec comparaison */
        .avg-line {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          flex-wrap: wrap;
        }
        .prev-avg {
          color: #64748b;
          font-size: 12px;
          background: #e2e8f0;
          border-radius: 4px;
          padding: 1px 5px;
        }
        /* Tendance */
        .trend {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 11px;
          font-weight: bold;
          padding: 1px 5px;
          border-radius: 4px;
        }
        .trend.up   { color: #15803d; background: #dcfce7; }
        .trend.down { color: #b91c1c; background: #fee2e2; }
        .trend.eq   { color: #64748b; background: #f1f5f9; }
        /* Bloc Brevet */
        .brevet-block {
          margin-top: 5px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .brevet-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #334155;
          flex-wrap: wrap;
        }
        .brevet-label {
          font-style: italic;
          color: #475569;
        }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          .no-print { display: none !important; }
          .council-wrap { background: none; padding: 0; }
          .student-card {
            page-break-inside: avoid;
            box-shadow: none;
            border: 1px solid #ccc;
            border-radius: 0;
            margin-bottom: 14px;
          }
          .student-header, .prev-avg, .trend.up, .trend.down, .trend.eq {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}
