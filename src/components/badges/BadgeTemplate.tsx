import type { Student } from '../../types';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

interface BadgeTemplateProps {
  student: Student;
}

function fmt(iso: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR'); } catch { return iso; }
}

/**
 * Badge scolaire – layout inspiré du template Twig :
 * - Bordure double bleue
 * - En-tête coloré avec titre + année scolaire
 * - Corps : photo à gauche | infos élève à droite
 * - Section vaccination
 * - Zone 3 signatures
 */
export function BadgeTemplate({ student }: BadgeTemplateProps) {
  const { currentYear } = useSchoolYear();

  return (
    <div className="bdg-outer">
      <div className="bdg-card">

        {/* ── En-tête ── */}
        <div className="bdg-header">
          <div className="bdg-header-title">CARTE D&apos;ÉLÈVE</div>
          <div className="bdg-header-school">COLLÈGE PRIVÉ SULLY</div>
          <div className="bdg-header-year">Année scolaire {student.schoolYear || currentYear}</div>
        </div>

        {/* ── Corps : photo + infos ── */}
        <div className="bdg-body">
          {/* Photo */}
          <div className="bdg-photo-frame">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="" className="bdg-photo-img" />
            ) : (
              <span className="bdg-initials">
                {(student.firstName?.[0] ?? '').toUpperCase()}
                {(student.lastName?.[0] ?? '').toUpperCase()}
              </span>
            )}
          </div>

          {/* Infos élève */}
          <div className="bdg-info">
            <Row label="Nom"         value={student.lastName?.toUpperCase() || '—'} blue />
            <Row label="Prénoms"     value={student.firstName || '—'} blue />
            <Row label="Né(e) le"    value={fmt(student.dateOfBirth)} blue />
            <Row label="Classe"      value={student.grade || '—'} blue />
            <Row label="Matricule"   value={student.matricule || '—'} blue />
            <Row label="N° ISS"      value={student.issNumber || '—'} red />
          </div>
        </div>

        {/* ── Vaccination ── */}
        <div className="bdg-vacc-block">
          <div className="bdg-vacc-labels">
            <div>Primo vaccination</div>
            <div>Revaccination</div>
          </div>
          <table className="bdg-vacc-table">
            <tbody>
              <tr><td /><td /></tr>
              <tr><td /><td /></tr>
            </tbody>
          </table>
        </div>

        {/* ── Signatures ── */}
        <div className="bdg-sigs">
          <div className="bdg-sig">
            <div className="bdg-sig-line" />
            <span>Signature et cachet</span>
          </div>
          <div className="bdg-sig">
            <div className="bdg-sig-line" />
            <span>Cachet I.S.S</span>
          </div>
          <div className="bdg-sig">
            <div className="bdg-sig-line" />
            <span>Signature de l&apos;élève</span>
          </div>
        </div>
      </div>

      <style>{`
        .bdg-outer {
          width: 96mm;
          padding: 2.5mm;
          box-sizing: border-box;
          font-family: 'Times New Roman', Times, serif;
          font-size: 11px;
          color: #111;
        }

        /* Carte principale – double border bleu */
        .bdg-card {
          width: 100%;
          border: 1.5mm double #2097bf;
          border-radius: 1.5mm;
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* ── En-tête ── */
        .bdg-header {
          background: linear-gradient(135deg, #09448a 0%, #1565c0 50%, #2097bf 100%);
          color: #fff;
          text-align: center;
          padding: 3mm 2mm 2.5mm;
          line-height: 1.35;
        }
        .bdg-header-title {
          font-size: 13px;
          font-weight: bold;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .bdg-header-school {
          font-size: 12px;
          font-weight: bold;
          margin-top: 0.5mm;
          opacity: 0.92;
        }
        .bdg-header-year {
          font-size: 10px;
          margin-top: 1mm;
          opacity: 0.80;
          font-style: italic;
        }

        /* ── Corps ── */
        .bdg-body {
          display: flex;
          gap: 3mm;
          padding: 3mm;
          background: #fafcff;
          border-bottom: 0.3mm solid #cce4f7;
        }

        /* Photo */
        .bdg-photo-frame {
          flex-shrink: 0;
          width: 28mm;
          height: 35mm;
          border: 0.4mm solid #b0c4de;
          border-radius: 1mm;
          overflow: hidden;
          background: #e8f0fe;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0.3mm 1mm rgba(32,151,191,0.15);
        }
        .bdg-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }
        .bdg-initials {
          font-size: 18px;
          font-weight: bold;
          color: #2097bf;
          letter-spacing: -0.02em;
        }

        /* Infos */
        .bdg-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.8mm;
          padding-top: 0.5mm;
        }
        .bdg-row {
          display: flex;
          gap: 1.5mm;
          align-items: baseline;
          font-size: 10.5px;
          line-height: 1.55;
        }
        .bdg-row-label {
          font-weight: bold;
          color: #333;
          white-space: nowrap;
          min-width: 18mm;
        }
        .bdg-row-sep {
          color: #999;
        }
        .bdg-row-val {
          font-weight: bold;
        }
        .bdg-blue { color: #2097bf; }
        .bdg-red  { color: #cc0000; }

        /* ── Vaccination ── */
        .bdg-vacc-block {
          display: flex;
          align-items: flex-start;
          gap: 3mm;
          padding: 2.5mm 3mm 2mm;
          background: #fafcff;
          border-bottom: 0.3mm solid #cce4f7;
        }
        .bdg-vacc-labels {
          display: flex;
          flex-direction: column;
          gap: 0.5mm;
          font-weight: bold;
          font-size: 10px;
          line-height: 1.8;
          white-space: nowrap;
          color: #333;
        }
        .bdg-vacc-table {
          border-collapse: collapse;
          margin-top: 0.5mm;
        }
        .bdg-vacc-table td {
          border: 0.3mm solid #555;
          width: 12mm;
          height: 6mm;
          padding: 0;
        }

        /* ── Signatures ── */
        .bdg-sigs {
          display: flex;
          padding: 3mm 2mm 2.5mm;
          background: #f5f9ff;
        }
        .bdg-sig {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5mm;
          padding: 0 1mm;
        }
        .bdg-sig-line {
          width: 80%;
          height: 0;
          border-bottom: 0.3mm solid #aaa;
          margin-top: 8mm;
        }
        .bdg-sig span {
          font-size: 9px;
          color: #555;
          text-align: center;
          font-style: italic;
        }

        @media print {
          .bdg-outer { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

/* ── Composant ligne infos élève ── */
function Row({ label, value, blue, red }: { label: string; value: string; blue?: boolean; red?: boolean }) {
  return (
    <div className="bdg-row">
      <span className="bdg-row-label">{label}</span>
      <span className="bdg-row-sep">:</span>
      <span className={`bdg-row-val ${blue ? 'bdg-blue' : red ? 'bdg-red' : ''}`}>{value}</span>
    </div>
  );
}
