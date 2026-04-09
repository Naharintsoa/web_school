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
import { getGradeLevel } from '../../utils/grades';

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
  const abs = Math.abs(diff).toFixed(2);
  if (diff > 0.05)  return <span className="diapo-trend up"><TrendingUp size={14} /> +{abs}</span>;
  if (diff < -0.05) return <span className="diapo-trend down"><TrendingDown size={14} /> -{abs}</span>;
  return <span className="diapo-trend eq"><Minus size={14} /> stable</span>;
}

// Styles inline uniquement pour les valeurs dynamiques
const navBtn = (disabled: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '6px',
  borderRadius: '8px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 'bold',
  background: disabled ? '#1e3a5f' : '#2563eb',
  color: disabled ? '#64748b' : '#fff',
  transition: 'background 0.15s',
});

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
    <div className="diapo-overlay">
      <style>{`
        .diapo-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: #fff;
          display: flex; flex-direction: column;
          font-family: 'Times New Roman', Times, serif;
          overflow: hidden;
        }
        /* ── Barre supérieure ── */
        .diapo-topbar {
          background: #09438a; color: #fff;
          padding: 10px 24px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; gap: 8px; flex-wrap: wrap;
        }
        .diapo-title { font-size: 15px; font-weight: bold; letter-spacing: 0.5px; flex: 1; min-width: 0; }
        .diapo-topbtn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.15); border: none;
          color: #fff; padding: 6px 12px; border-radius: 8px;
          cursor: pointer; font-size: 13px; white-space: nowrap; flex-shrink: 0;
        }
        /* ── Corps ── */
        .diapo-body {
          flex: 1; display: flex; align-items: stretch; overflow: hidden;
        }
        /* Colonne gauche */
        .diapo-left {
          width: 240px; flex-shrink: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #f0f4f8; padding: 20px;
          border-right: 2px solid #e2e8f0; gap: 10px;
        }
        .diapo-rank { font-size: 48px; font-weight: 900; line-height: 1; }
        .diapo-photo {
          width: 140px; height: 140px; border-radius: 50%;
          object-fit: cover; border: 5px solid #2097bf;
        }
        .diapo-avatar {
          width: 140px; height: 140px; border-radius: 50%;
          background: #dbeafe; color: #1d4ed8;
          display: flex; align-items: center; justify-content: center;
          font-size: 54px; font-weight: bold; border: 5px solid #2097bf;
        }
        .diapo-place { font-size: 15px; color: #475569; text-align: center; }
        /* Colonne droite */
        .diapo-right {
          flex: 1; display: flex; flex-direction: column;
          padding: 20px 28px; overflow-y: auto; gap: 12px;
        }
        .diapo-name { font-size: 32px; font-weight: bold; color: #1e293b; line-height: 1.2; }
        /* Bloc moyenne */
        .diapo-avgblock {
          display: flex; flex-direction: column; gap: 6px;
          padding: 12px 16px; background: #f8fafc;
          border: 2px solid #e2e8f0; border-radius: 10px;
        }
        .diapo-avglabel { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .diapo-avgrow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .diapo-prevavg {
          font-size: 16px; color: #64748b;
          background: #e2e8f0; border-radius: 6px; padding: 2px 8px;
        }
        .diapo-curravg-ok  { font-size: 38px; font-weight: 900; color: #16a34a; line-height: 1; }
        .diapo-curravg-ko  { font-size: 38px; font-weight: 900; color: #dc2626; line-height: 1; }
        .diapo-avgunit { font-size: 20px; }
        /* Brevet */
        .diapo-brevblock {
          display: flex; flex-direction: column; gap: 5px;
          padding: 10px 14px; background: #eff6ff;
          border: 1.5px solid #bfdbfe; border-radius: 8px;
        }
        .diapo-brevtitle { font-size: 11px; color: #1d4ed8; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
        .diapo-brevline { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 15px; color: #334155; }
        /* Tendances */
        .diapo-trend {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 13px; font-weight: bold; border-radius: 5px; padding: 3px 8px;
        }
        .diapo-trend.up   { color: #15803d; background: #dcfce7; }
        .diapo-trend.down { color: #b91c1c; background: #fee2e2; }
        .diapo-trend.eq   { color: #64748b; background: #f1f5f9; }
        /* Tableau */
        .diapo-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .diapo-table { width: 100%; border-collapse: collapse; font-size: 10.5pt; margin-top: 4px; min-width: 480px; }
        .diapo-th { padding: 4px 5px; border: 1px solid #000; background: #d9d9d9; font-weight: bold; text-align: center; font-size: 8.5pt; }
        .diapo-td { padding: 4px 5px; border: 1px solid #000; vertical-align: middle; font-size: 9.5pt; }
        .diapo-tdc { padding: 4px 5px; border: 1px solid #000; text-align: center; vertical-align: middle; font-size: 9.5pt; }
        /* Barre navigation */
        .diapo-navbar {
          background: #09438a;
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 24px; flex-shrink: 0; gap: 12px;
        }
        .diapo-navcounter { color: #fff; font-size: 17px; font-weight: bold; }
        .diapo-navbtn { padding: 9px 22px; font-size: 14px; }

        /* ══ RESPONSIVE MOBILE ══ */
        @media (max-width: 640px) {
          .diapo-topbar { padding: 8px 12px; }
          .diapo-title { font-size: 12px; }
          .diapo-topbtn { padding: 5px 8px; font-size: 11px; }

          .diapo-body { flex-direction: column; overflow-y: auto; }

          .diapo-left {
            width: 100%; flex-direction: row; justify-content: center;
            padding: 12px 16px; border-right: none;
            border-bottom: 2px solid #e2e8f0; gap: 14px;
          }
          .diapo-rank { font-size: 32px; }
          .diapo-photo, .diapo-avatar { width: 72px; height: 72px; font-size: 26px; border-width: 3px; }
          .diapo-place { font-size: 12px; }

          .diapo-right { padding: 12px 14px; gap: 10px; overflow-y: visible; }
          .diapo-name { font-size: 20px; }

          .diapo-avgblock { padding: 8px 12px; }
          .diapo-curravg-ok, .diapo-curravg-ko { font-size: 28px; }
          .diapo-avgunit { font-size: 16px; }
          .diapo-prevavg { font-size: 13px; }

          .diapo-brevline { font-size: 12px; }

          .diapo-table { font-size: 9pt; min-width: 420px; }
          .diapo-th { font-size: 7.5pt; padding: 3px 4px; }
          .diapo-td, .diapo-tdc { font-size: 8.5pt; padding: 3px 4px; }

          .diapo-navbar { padding: 8px 12px; }
          .diapo-navbtn { padding: 8px 14px; font-size: 13px; }
          .diapo-navcounter { font-size: 14px; }
        }
      `}</style>

      {/* ── Barre supérieure ── */}
      <div className="diapo-topbar">
        <span className="diapo-title">
          Conseil — {grade} — T{term}
          {readOnly && <span style={{ marginLeft: 10, fontSize: '11px', opacity: 0.7 }}>● En direct</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {joinUrl && (
            <button
              className="diapo-topbtn"
              style={{ background: showQr ? '#fff' : 'rgba(255,255,255,0.15)', color: showQr ? '#09438a' : '#fff' }}
              onClick={() => setShowQr(v => !v)}
            >
              <QrCode size={14} /> QR
            </button>
          )}
          {!readOnly && (
            <button className="diapo-topbtn" onClick={onClose}>
              <X size={14} /> Quitter
            </button>
          )}
        </div>
      </div>

      {/* ── Panneau QR (absolu, en dessous de la barre) ── */}
      {showQr && joinUrl && (
        <div style={{
          position: 'absolute', top: 52, right: 16, zIndex: 10,
          background: '#fff', borderRadius: 12, padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <QRCodeSVG value={joinUrl} size={170} level="M" />
          <p style={{ fontSize: 10, color: '#64748b', textAlign: 'center', maxWidth: 170, wordBreak: 'break-all', margin: 0 }}>
            {joinUrl}
          </p>
          <p style={{ fontSize: 11, color: '#09438a', fontWeight: 'bold', margin: 0 }}>
            Scanner pour suivre le diaporama
          </p>
        </div>
      )}

      {/* ── Corps principal ── */}
      <div className="diapo-body">

        {/* Colonne gauche : rang + photo */}
        <div className="diapo-left">
          <div className="diapo-rank">{medalEmoji(rank)}</div>
          {student.photoUrl ? (
            <img src={student.photoUrl} alt="" className="diapo-photo" />
          ) : (
            <div className="diapo-avatar">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
          )}
          <div className="diapo-place">
            {rank === 1 ? '1ère place' : `${rank}ème place`}
          </div>
        </div>

        {/* Colonne droite : infos */}
        <div className="diapo-right">

          {/* Nom */}
          <div className="diapo-name">
            {student.lastName?.toUpperCase()}&nbsp;{student.firstName}
          </div>

          {/* Moyenne trimestrielle */}
          <div className="diapo-avgblock">
            <div className="diapo-avglabel">Moyenne trimestrielle</div>
            <div className="diapo-avgrow">
              {term >= 2 && avg1 > 0 && (
                <span className="diapo-prevavg">{termLabel(1)}&nbsp;: {avg1.toFixed(2)}</span>
              )}
              {term === 3 && avg2 > 0 && (
                <span className="diapo-prevavg">{termLabel(2)}&nbsp;: {avg2.toFixed(2)}</span>
              )}
              <span className={avg >= 10 ? 'diapo-curravg-ok' : 'diapo-curravg-ko'}>
                {avg > 0 ? avg.toFixed(2) : '—'}
                <span className="diapo-avgunit">/20</span>
              </span>
              {term === 2 && <TrendBadge prev={avg1} curr={avg} />}
              {term === 3 && <TrendBadge prev={avg2 > 0 ? avg2 : avg1} curr={avg} />}
            </div>
          </div>

          {/* Moyennes Brevet */}
          {isBrevet && avg > 0 && (brev.hasAnglais || brev.hasEspagnol || brev.hasAllemand) && (
            <div className="diapo-brevblock">
              <div className="diapo-brevtitle">Moyennes Brevet</div>
              {brev.hasAnglais && (
                <div className="diapo-brevline">
                  <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Anglais :</span>
                  {term >= 2 && brev1.anglais > 0 && <span className="diapo-prevavg" style={{ fontSize: '13px' }}>{termLabel(1)} : {brev1.anglais.toFixed(2)}</span>}
                  {term === 3 && brev2.anglais > 0 && <span className="diapo-prevavg" style={{ fontSize: '13px' }}>{termLabel(2)} : {brev2.anglais.toFixed(2)}</span>}
                  <strong>{termLabel(term)} : {brev.anglais.toFixed(2)}</strong>
                  <TrendBadge prev={term === 3 && brev2.anglais > 0 ? brev2.anglais : brev1.anglais} curr={brev.anglais} />
                </div>
              )}
              {brev.hasEspagnol && (
                <div className="diapo-brevline">
                  <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Espagnol :</span>
                  {term >= 2 && brev1.espagnol > 0 && <span className="diapo-prevavg" style={{ fontSize: '13px' }}>{termLabel(1)} : {brev1.espagnol.toFixed(2)}</span>}
                  {term === 3 && brev2.espagnol > 0 && <span className="diapo-prevavg" style={{ fontSize: '13px' }}>{termLabel(2)} : {brev2.espagnol.toFixed(2)}</span>}
                  <strong>{termLabel(term)} : {brev.espagnol.toFixed(2)}</strong>
                  <TrendBadge prev={term === 3 && brev2.espagnol > 0 ? brev2.espagnol : brev1.espagnol} curr={brev.espagnol} />
                </div>
              )}
              {brev.hasAllemand && (
                <div className="diapo-brevline">
                  <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Allemand :</span>
                  {term >= 2 && brev1.allemand > 0 && <span className="diapo-prevavg" style={{ fontSize: '13px' }}>{termLabel(1)} : {brev1.allemand.toFixed(2)}</span>}
                  {term === 3 && brev2.allemand > 0 && <span className="diapo-prevavg" style={{ fontSize: '13px' }}>{termLabel(2)} : {brev2.allemand.toFixed(2)}</span>}
                  <strong>{termLabel(term)} : {brev.allemand.toFixed(2)}</strong>
                  <TrendBadge prev={term === 3 && brev2.allemand > 0 ? brev2.allemand : brev1.allemand} curr={brev.allemand} />
                </div>
              )}
            </div>
          )}

          {/* Tableau des notes */}
          <div className="diapo-table-wrap">
            <table className="diapo-table">
              <thead>
                <tr>
                  <th className="diapo-th" style={{ textAlign: 'left', width: '28%' }}>
                    DISCIPLINE / Professeur
                  </th>
                  <th className="diapo-th">Élève</th>
                  <th className="diapo-th">Classe</th>
                  <th className="diapo-th">Coef</th>
                  <th className="diapo-th">min</th>
                  <th className="diapo-th">max</th>
                  <th className="diapo-th">Niveau</th>
                  <th className="diapo-th" style={{ width: '20%' }}>Appréciations</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map(({ subject, gradeRow }) => {
                  const cs = classStats[subject.id];
                  const score = gradeRow?.score;
                  const hasScore = score !== undefined && score !== null && !isNaN(score);
                  return (
                    <tr key={subject.id}>
                      <td className="diapo-td">
                        <div style={{ fontWeight: 'bold' }}>{subject.name}</div>
                        <div style={{ color: '#4f81be', fontSize: '8.5pt' }}>{subject.teacherName ?? ''}</div>
                      </td>
                      <td className="diapo-tdc">{hasScore ? score!.toFixed(2) : '—'}</td>
                      <td className="diapo-tdc">{cs?.avg > 0 ? cs.avg.toFixed(2) : '—'}</td>
                      <td className="diapo-tdc" style={{ color: subject.coefficient === 1 ? '#4f81be' : undefined }}>
                        {subject.coefficient}
                      </td>
                      <td className="diapo-tdc">{cs?.min > 0 ? cs.min.toFixed(2) : '—'}</td>
                      <td className="diapo-tdc">{cs?.max > 0 ? cs.max.toFixed(2) : '—'}</td>
                      <td className="diapo-tdc">{hasScore ? getGradeLevel(score!) : '—'}</td>
                      <td className="diapo-td">{gradeRow?.comments ?? ''}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f3f4f6' }}>
                  <td className="diapo-td" style={{ fontWeight: 'bold' }}>MOYENNE — {termLabel(term)}</td>
                  <td className="diapo-tdc" style={{ fontWeight: 'bold' }}>{avg > 0 ? avg.toFixed(2) : '—'}</td>
                  <td className="diapo-tdc" style={{ fontWeight: 'bold' }}>{classAvg > 0 ? classAvg.toFixed(2) : '—'}</td>
                  <td className="diapo-tdc" colSpan={5}></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ── Barre de navigation ── */}
      <div className="diapo-navbar">
        {!readOnly ? (
          <>
            <button className="diapo-navbtn" style={navBtn(idx === 0)} onClick={prev} disabled={idx === 0}>
              <ChevronLeft size={18} /> Précédent
            </button>
            <span className="diapo-navcounter">{idx + 1} / {slides.length}</span>
            <button className="diapo-navbtn" style={navBtn(idx === slides.length - 1)} onClick={next} disabled={idx === slides.length - 1}>
              Suivant <ChevronRight size={18} />
            </button>
          </>
        ) : (
          <span className="diapo-navcounter" style={{ width: '100%', textAlign: 'center' }}>
            {idx + 1} / {slides.length}
          </span>
        )}
      </div>
    </div>
  );
}
