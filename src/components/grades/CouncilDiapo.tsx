/**
 * Diaporama du Conseil de classe.
 * Plein écran, navigation manuelle, par ordre de mérite.
 * Conçu pour projection sur écran/projecteur — responsive mobile.
 */
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Minus, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Student } from '../../types/student';
import type { Subject } from '../../types/subject';
import type { Grade } from '../../types/grade';
import { getGradeLevel, formatScore } from '../../utils/grades';

export interface StudentSlide {
  student: Student;
  rank: number;
  avg: number;
  avg1: number;
  avg2: number;
  sg: Grade[];
  brev:  BrevetAvg;
  brev1: BrevetAvg;
  brev2: BrevetAvg;
}

export interface BrevetAvg {
  hasAnglais: boolean;
  hasEspagnol: boolean;
  hasAllemand: boolean;
  anglais: number;
  espagnol: number;
  allemand: number;
}

interface CouncilDiapoProps {
  slides: StudentSlide[];
  term: 1 | 2 | 3;
  grade: string;
  subjects: Subject[];
  classStats: Record<string, { avg: number; min: number; max: number }>;
  classAvg: number;
  isBrevet: boolean;
  onClose: () => void;
  /** Index contrôlé depuis l'extérieur (mode lecture seule prof) */
  externalIdx?: number;
  /** Si vrai, masque navigation et fermeture */
  readOnly?: boolean;
  /** Appelé quand l'admin change de slide */
  onNavigate?: (idx: number) => void;
  /** URL d'accès pour le QR code (affiché dans la barre du diapo) */
  joinUrl?: string;
}

const termLabel = (t: number) => `Trimestre ${t}`;
const medalEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

function TrendBadge({ prev, curr }: { prev: number; curr: number }) {
  if (prev <= 0 || curr <= 0) return null;
  const diff = curr - prev;
  const abs = formatScore(Math.abs(diff));
  if (diff > 0.05)  return <span style={tw.trendUp}><TrendingUp size={18} /> +{abs}</span>;
  if (diff < -0.05) return <span style={tw.trendDown}><TrendingDown size={18} /> -{abs}</span>;
  return <span style={tw.trendEq}><Minus size={18} /> stable</span>;
}

// Styles inline desktop — identiques à la version originale
const tw = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 9999,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: "'Times New Roman', Times, serif",
    overflow: 'hidden',
  },
  topBar: {
    background: '#09438a',
    color: '#fff',
    padding: '10px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  topTitle: { fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' },
  topClose: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,255,255,0.15)', border: 'none',
    color: '#fff', padding: '6px 14px', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px',
  },
  body: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  leftCol: {
    width: '260px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f4f8',
    padding: '20px',
    borderRight: '2px solid #e2e8f0',
    gap: '12px',
  },
  rankBadge: { fontSize: '52px', fontWeight: 900, lineHeight: 1 },
  photo: {
    width: '160px', height: '160px', borderRadius: '50%',
    objectFit: 'cover' as const, border: '5px solid #2097bf',
  },
  avatar: {
    width: '160px', height: '160px', borderRadius: '50%',
    background: '#dbeafe', color: '#1d4ed8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '60px', fontWeight: 'bold', border: '5px solid #2097bf',
  },
  rightCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px 32px',
    overflowY: 'auto' as const,
    gap: '14px',
  },
  name: { fontSize: '36px', fontWeight: 'bold', color: '#1e293b', lineHeight: 1.2 },
  avgBlock: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
    padding: '14px 18px', background: '#f8fafc',
    border: '2px solid #e2e8f0', borderRadius: '10px',
  },
  avgLabel: { fontSize: '13px', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  avgRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const },
  prevAvg: {
    fontSize: '18px', color: '#64748b',
    background: '#e2e8f0', borderRadius: '6px', padding: '3px 10px',
  },
  currAvg: (ok: boolean): React.CSSProperties => ({
    fontSize: '42px', fontWeight: 900,
    color: ok ? '#16a34a' : '#dc2626',
    lineHeight: 1,
  }),
  trendUp:   { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '18px', fontWeight: 'bold', color: '#15803d', background: '#dcfce7', borderRadius: '6px', padding: '4px 10px' },
  trendDown: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '18px', fontWeight: 'bold', color: '#b91c1c', background: '#fee2e2', borderRadius: '6px', padding: '4px 10px' },
  trendEq:   { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '18px', fontWeight: 'bold', color: '#64748b', background: '#f1f5f9', borderRadius: '6px', padding: '4px 10px' },
  brevBlock: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
    padding: '10px 14px', background: '#eff6ff',
    border: '1.5px solid #bfdbfe', borderRadius: '8px',
  },
  brevTitle: { fontSize: '12px', color: '#1d4ed8', fontWeight: 'bold', textTransform: 'uppercase' as const, marginBottom: '2px' },
  brevLine: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' as const, fontSize: '17px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '11pt', marginTop: '4px' },
  th: { padding: '4px 6px', border: '1px solid #000', background: '#d9d9d9', fontWeight: 'bold' as const, textAlign: 'center' as const, fontSize: '9pt' },
  td: { padding: '4px 6px', border: '1px solid #000', verticalAlign: 'middle' as const, fontSize: '10pt' },
  tdC: { padding: '4px 6px', border: '1px solid #000', textAlign: 'center' as const, verticalAlign: 'middle' as const, fontSize: '10pt' },
  navFloatBtn: (disabled: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '18px 13px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.18)',
    background: disabled ? 'rgba(15,23,42,0.12)' : 'rgba(15,23,42,0.58)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    color: disabled ? 'rgba(255,255,255,0.25)' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 20,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    userSelect: 'none' as const,
  }),
  navCounter: {
    position: 'absolute' as const,
    bottom: '18px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '7px 22px',
    borderRadius: '100px',
    background: 'rgba(15,23,42,0.60)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 20,
    whiteSpace: 'nowrap' as const,
  },
};

const LANG_KW = ['anglais', 'espagnol', 'allemand'];
const isLang = (n: string) => LANG_KW.some(k => n.toLowerCase().includes(k));

export function CouncilDiapo({
  slides, term, grade, subjects, classStats, classAvg, isBrevet, onClose,
  externalIdx, readOnly = false, onNavigate, joinUrl,
}: CouncilDiapoProps) {
  const [localIdx, setLocalIdx] = useState(0);
  const [showQr, setShowQr] = useState(false);

  const idx = externalIdx !== undefined ? externalIdx : localIdx;

  const prev = useCallback(() => {
    if (readOnly) return;
    const n = Math.max(0, localIdx - 1);
    setLocalIdx(n);
    onNavigate?.(n);
  }, [readOnly, localIdx, onNavigate]);

  const next = useCallback(() => {
    if (readOnly) return;
    const n = Math.min(slides.length - 1, localIdx + 1);
    setLocalIdx(n);
    onNavigate?.(n);
  }, [readOnly, localIdx, slides.length, onNavigate]);

  useEffect(() => {
    if (readOnly) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose, readOnly]);

  if (slides.length === 0) return null;

  const { student, rank, avg, avg1, avg2, sg, brev, brev1, brev2 } = slides[idx];

  const displayRows = subjects
    .filter(s => isLang(s.name) ? sg.some(g => g.subjectId === s.id) : true)
    .map(s => ({ subject: s, gradeRow: sg.find(g => g.subjectId === s.id) ?? null }));

  return (
    <div style={tw.overlay}>

      {/* ── CSS responsive mobile uniquement ── */}
      <style>{`
        @media (max-width: 640px) {
          .diapo-topbar   { padding: 8px 10px !important; }
          .diapo-title    { font-size: 12px !important; }
          .diapo-topbtn   { padding: 5px 8px !important; font-size: 11px !important; }

          .diapo-body     { flex-direction: column !important; overflow-y: auto !important; }

          .diapo-left {
            width: 100% !important;
            flex-direction: row !important;
            justify-content: center !important;
            padding: 10px 14px !important;
            border-right: none !important;
            border-bottom: 2px solid #e2e8f0 !important;
            gap: 12px !important;
          }
          .diapo-rank   { font-size: 30px !important; }
          .diapo-photo,
          .diapo-avatar { width: 68px !important; height: 68px !important; font-size: 24px !important; border-width: 3px !important; }
          .diapo-place  { font-size: 11px !important; }

          .diapo-right  { padding: 10px 12px !important; gap: 10px !important; overflow-y: visible !important; }
          .diapo-name   { font-size: 18px !important; }

          .diapo-avgblock { padding: 8px 10px !important; }
          .diapo-curravg  { font-size: 26px !important; }
          .diapo-avgunit  { font-size: 14px !important; }
          .diapo-prevavg  { font-size: 12px !important; padding: 2px 6px !important; }
          .diapo-trend    { font-size: 11px !important; padding: 2px 6px !important; }

          .diapo-brevline { font-size: 12px !important; gap: 4px !important; }

          .diapo-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .diapo-table    { font-size: 8.5pt !important; min-width: 420px; }
          .diapo-th       { font-size: 7pt !important; padding: 3px 3px !important; }
          .diapo-td,
          .diapo-tdc      { font-size: 7.5pt !important; padding: 3px 3px !important; }

          .diapo-nav-prev { left: 8px !important; padding: 12px 9px !important; }
          .diapo-nav-next { right: 8px !important; padding: 12px 9px !important; }
          .diapo-nav-prev span,
          .diapo-nav-next span { display: none !important; }
          .diapo-navcnt   { font-size: 12px !important; padding: 5px 14px !important; bottom: 10px !important; }
        }

        .diapo-nav-prev:not(:disabled):hover,
        .diapo-nav-next:not(:disabled):hover {
          background: rgba(15,23,42,0.82) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15) !important;
          transform: translateY(-50%) scale(1.06) !important;
        }
        .diapo-nav-prev:not(:disabled):active,
        .diapo-nav-next:not(:disabled):active {
          transform: translateY(-50%) scale(0.97) !important;
        }
      `}</style>

      {/* ── Barre supérieure ── */}
      <div className="diapo-topbar" style={tw.topBar}>
        <span className="diapo-title" style={tw.topTitle}>
          Conseil de classe — {grade} — {termLabel(term)}
          {readOnly && <span style={{ marginLeft: 12, fontSize: '12px', opacity: 0.7 }}>● En direct</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {joinUrl && (
            <button
              className="diapo-topbtn"
              style={{ ...tw.topClose, background: showQr ? '#fff' : 'rgba(255,255,255,0.15)', color: showQr ? '#09438a' : '#fff' }}
              onClick={() => setShowQr(v => !v)}
            >
              <QrCode size={16} /> QR Code
            </button>
          )}
          {!readOnly && (
            <button className="diapo-topbtn" style={tw.topClose} onClick={onClose}>
              <X size={16} /> Quitter le diaporama
            </button>
          )}
        </div>
      </div>

      {/* ── Panneau QR ── */}
      {showQr && joinUrl && (
        <div style={{
          position: 'absolute', top: 52, right: 16, zIndex: 10,
          background: '#fff', borderRadius: 12, padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <QRCodeSVG value={joinUrl} size={180} level="M" />
          <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', maxWidth: 180, wordBreak: 'break-all', margin: 0 }}>
            {joinUrl}
          </p>
          <p style={{ fontSize: 12, color: '#09438a', fontWeight: 'bold', margin: 0 }}>
            Scanner pour suivre le diaporama
          </p>
        </div>
      )}

      {/* ── Corps principal ── */}
      <div className="diapo-body" style={tw.body}>

        {/* Colonne gauche : rang + photo */}
        <div className="diapo-left" style={tw.leftCol}>
          <div className="diapo-rank" style={tw.rankBadge}>{medalEmoji(rank)}</div>
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="diapo-photo" style={tw.photo} />
          ) : (
            <div className="diapo-avatar" style={tw.avatar}>
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
          )}
          <div className="diapo-place" style={{ fontSize: '16px', color: '#475569', textAlign: 'center' }}>
            {rank === 1 ? '1ère place' : `${rank}ème place`}
          </div>
        </div>

        {/* Colonne droite : infos */}
        <div className="diapo-right" style={tw.rightCol}>

          {/* Nom */}
          <div className="diapo-name" style={tw.name}>
            {student.lastName?.toUpperCase()}&nbsp;{student.firstName}
          </div>

          {/* Moyenne trimestrielle */}
          <div style={tw.avgBlock}>
            <div style={tw.avgLabel}>Moyenne trimestrielle</div>
            <div style={tw.avgRow}>
              {term >= 2 && avg1 > 0 && (
                <span className="diapo-prevavg" style={tw.prevAvg}>{termLabel(1)}&nbsp;: {formatScore(avg1)}</span>
              )}
              {term === 3 && avg2 > 0 && (
                <span className="diapo-prevavg" style={tw.prevAvg}>{termLabel(2)}&nbsp;: {formatScore(avg2)}</span>
              )}
              <span className="diapo-curravg" style={tw.currAvg(avg >= 10)}>
                {avg > 0 ? formatScore(avg) : '—'}<span className="diapo-avgunit" style={{ fontSize: '22px' }}>/20</span>
              </span>
              {term === 2 && <TrendBadge prev={avg1} curr={avg} />}
              {term === 3 && <TrendBadge prev={avg2 > 0 ? avg2 : avg1} curr={avg} />}
            </div>
          </div>

          {/* Moyennes Brevet */}
          {isBrevet && avg > 0 && (brev.hasAnglais || brev.hasEspagnol || brev.hasAllemand) && (
            <div style={tw.brevBlock}>
              <div style={tw.brevTitle}>Moyennes Brevet</div>
              {brev.hasAnglais && (
                <div className="diapo-brevline" style={tw.brevLine}>
                  <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Anglais :</span>
                  {term >= 2 && brev1.anglais > 0 && <span className="diapo-prevavg" style={{ ...tw.prevAvg, fontSize: '15px' }}>{termLabel(1)} : {formatScore(brev1.anglais)}</span>}
                  {term === 3 && brev2.anglais > 0 && <span className="diapo-prevavg" style={{ ...tw.prevAvg, fontSize: '15px' }}>{termLabel(2)} : {formatScore(brev2.anglais)}</span>}
                  <strong>{termLabel(term)} : {formatScore(brev.anglais)}</strong>
                  <TrendBadge prev={term === 3 && brev2.anglais > 0 ? brev2.anglais : brev1.anglais} curr={brev.anglais} />
                </div>
              )}
              {brev.hasEspagnol && (
                <div className="diapo-brevline" style={tw.brevLine}>
                  <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Espagnol :</span>
                  {term >= 2 && brev1.espagnol > 0 && <span className="diapo-prevavg" style={{ ...tw.prevAvg, fontSize: '15px' }}>{termLabel(1)} : {formatScore(brev1.espagnol)}</span>}
                  {term === 3 && brev2.espagnol > 0 && <span className="diapo-prevavg" style={{ ...tw.prevAvg, fontSize: '15px' }}>{termLabel(2)} : {formatScore(brev2.espagnol)}</span>}
                  <strong>{termLabel(term)} : {formatScore(brev.espagnol)}</strong>
                  <TrendBadge prev={term === 3 && brev2.espagnol > 0 ? brev2.espagnol : brev1.espagnol} curr={brev.espagnol} />
                </div>
              )}
              {brev.hasAllemand && (
                <div className="diapo-brevline" style={tw.brevLine}>
                  <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Allemand :</span>
                  {term >= 2 && brev1.allemand > 0 && <span className="diapo-prevavg" style={{ ...tw.prevAvg, fontSize: '15px' }}>{termLabel(1)} : {formatScore(brev1.allemand)}</span>}
                  {term === 3 && brev2.allemand > 0 && <span className="diapo-prevavg" style={{ ...tw.prevAvg, fontSize: '15px' }}>{termLabel(2)} : {formatScore(brev2.allemand)}</span>}
                  <strong>{termLabel(term)} : {formatScore(brev.allemand)}</strong>
                  <TrendBadge prev={term === 3 && brev2.allemand > 0 ? brev2.allemand : brev1.allemand} curr={brev.allemand} />
                </div>
              )}
            </div>
          )}

          {/* Tableau des notes */}
          <div className="diapo-table-wrap">
            <table className="diapo-table" style={tw.table}>
              <thead>
                <tr>
                  <th className="diapo-th" style={{ ...tw.th, textAlign: 'left', width: '28%' }}>
                    DISCIPLINE / Professeur
                  </th>
                  <th className="diapo-th" style={tw.th}>Élève</th>
                  <th className="diapo-th" style={tw.th}>Classe</th>
                  <th className="diapo-th" style={tw.th}>Coef</th>
                  <th className="diapo-th" style={tw.th}>min</th>
                  <th className="diapo-th" style={tw.th}>max</th>
                  <th className="diapo-th" style={tw.th}>Niveau</th>
                  <th className="diapo-th" style={{ ...tw.th, width: '20%' }}>Appréciations</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map(({ subject, gradeRow }) => {
                  const cs = classStats[subject.id];
                  const score = gradeRow?.score;
                  const hasScore = score !== undefined && score !== null && !isNaN(score);
                  return (
                    <tr key={subject.id}>
                      <td className="diapo-td" style={tw.td}>
                        <div style={{ fontWeight: 'bold' }}>{subject.name}</div>
                        <div style={{ color: '#4f81be', fontSize: '9pt' }}>{subject.teacherName ?? ''}</div>
                      </td>
                      <td className="diapo-tdc" style={tw.tdC}>{hasScore ? formatScore(score!) : '—'}</td>
                      <td className="diapo-tdc" style={tw.tdC}>{cs?.avg > 0 ? formatScore(cs.avg) : '—'}</td>
                      <td className="diapo-tdc" style={tw.tdC}>{subject.coefficient}</td>
                      <td className="diapo-tdc" style={tw.tdC}>{cs?.min > 0 ? formatScore(cs.min) : '—'}</td>
                      <td className="diapo-tdc" style={tw.tdC}>{cs?.max > 0 ? formatScore(cs.max) : '—'}</td>
                      <td className="diapo-tdc" style={tw.tdC}>{hasScore ? getGradeLevel(score!) : '—'}</td>
                      <td className="diapo-td" style={tw.td}>{gradeRow?.comments ?? ''}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f3f4f6' }}>
                  <td className="diapo-td" style={{ ...tw.td, fontWeight: 'bold' }}>MOYENNE — {termLabel(term)}</td>
                  <td className="diapo-tdc" style={{ ...tw.tdC, fontWeight: 'bold' }}>{avg > 0 ? formatScore(avg) : '—'}</td>
                  <td className="diapo-tdc" style={{ ...tw.tdC, fontWeight: 'bold' }}>{classAvg > 0 ? formatScore(classAvg) : '—'}</td>
                  <td className="diapo-tdc" style={tw.tdC} colSpan={5}></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ── Navigation flottante ── */}
      {!readOnly && (
        <>
          {/* Bouton Précédent — flottant gauche */}
          <button
            className="diapo-nav-prev"
            style={{ ...tw.navFloatBtn(idx === 0), left: '16px' }}
            onClick={prev}
            disabled={idx === 0}
          >
            <ChevronLeft size={26} />
            <span>Préc.</span>
          </button>

          {/* Bouton Suivant — flottant droite */}
          <button
            className="diapo-nav-next"
            style={{ ...tw.navFloatBtn(idx === slides.length - 1), right: '16px' }}
            onClick={next}
            disabled={idx === slides.length - 1}
          >
            <ChevronRight size={26} />
            <span>Suiv.</span>
          </button>
        </>
      )}

    </div>
  );
}
