import type { Student } from '../../../types';
import { useSchoolYear } from '../../../contexts/SchoolYearContext';

interface IdentityCardTemplateProps {
  student: Student;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

/**
 * Carte d'identité scolaire — format 8,6 × 5,4 cm (CR80 / carte bancaire).
 * Photo : 2,8 × 3,5 cm.
 * Layout : photo à gauche | infos à droite | bande vaccination+signatures en bas.
 */
export function IdentityCardTemplate({ student }: IdentityCardTemplateProps) {
  const { currentYear } = useSchoolYear();

  return (
    <div className="card-wrapper">
      <div className="card-border">

        {/* ── Partie haute : photo | infos ── */}
        <div className="card-top">
          <div className="photo-box" />

          <div className="card-right">
            <div className="card-title">
              <strong>CARTE D'IDENTITÉ SCOLAIRE</strong><br />
              <strong>COLLÈGE PRIVÉ SULLY</strong><br />
              <strong>Année {student.schoolYear || currentYear}</strong>
            </div>

            <div className="divider" />

            <table className="info-table">
              <tbody>
                <tr>
                  <td className="info-label">Nom :</td>
                  <td className="info-value blue">{student.lastName?.toUpperCase() || '—'}</td>
                </tr>
                <tr>
                  <td className="info-label">Prénoms :</td>
                  <td className="info-value blue">{student.firstName || '—'}</td>
                </tr>
                <tr>
                  <td className="info-label">Né(e) le :</td>
                  <td className="info-value blue">{formatDate(student.dateOfBirth)}</td>
                </tr>
                <tr>
                  <td className="info-label">Matricule :</td>
                  <td className="info-value blue">{student.matricule || '—'}</td>
                </tr>
                <tr>
                  <td className="info-label">N° ISS :</td>
                  <td className="info-value red">{student.issNumber || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Séparateur ── */}
        <div className="divider-h" />

        {/* ── Bande basse : vaccination + signatures ── */}
        <div className="card-bottom">
          <div className="vacc-section">
            <div className="vacc-row">
              <span className="vacc-label">Primo vaccination</span>
              <div className="vacc-cells"><div className="vacc-cell" /><div className="vacc-cell" /></div>
            </div>
            <div className="vacc-row">
              <span className="vacc-label">Revaccination</span>
              <div className="vacc-cells"><div className="vacc-cell" /><div className="vacc-cell" /></div>
            </div>
          </div>

          <div className="signatures">
            <div>Signature et cachet</div>
            <div>Cachet I.S.S</div>
            <div>Signature élève</div>
          </div>
        </div>
      </div>

      <style>{`
        .card-wrapper {
          width: 86mm;
          height: 54mm;
          overflow: hidden;
          box-sizing: border-box;
          font-family: 'Times New Roman', serif;
          font-size: 7px;
        }

        .card-border {
          width: 100%;
          height: 100%;
          border: 0.8mm double #2097bf;
          padding: 1.5mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* ── Partie haute ── */
        .card-top {
          display: flex;
          align-items: flex-start;
          gap: 2mm;
          flex: 1;
          overflow: hidden;
        }

        .photo-box {
          width: 28mm;
          height: 35mm;
          border: 0.3mm solid #000;
          flex-shrink: 0;
          background: #f9f9f9;
        }

        .card-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5mm;
          overflow: hidden;
        }

        .card-title {
          text-align: center;
          line-height: 1.35;
          color: #09448a;
          font-size: 7px;
        }

        .divider {
          border-top: 0.2mm solid #2097bf;
          margin: 0.5mm 0;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
        }

        .info-table td {
          padding: 0.25mm 0.5mm;
          vertical-align: top;
          font-size: 6.5px;
          line-height: 1.3;
        }

        .info-label {
          font-weight: bold;
          white-space: nowrap;
          color: #222;
        }

        .info-value {
          font-weight: bold;
        }

        .blue { color: #2097bf; }
        .red  { color: #cc0000; }

        /* ── Séparateur horizontal ── */
        .divider-h {
          border-top: 0.2mm solid #2097bf;
          margin: 0.8mm 0;
          flex-shrink: 0;
        }

        /* ── Bande basse ── */
        .card-bottom {
          display: flex;
          align-items: flex-start;
          gap: 2mm;
          flex-shrink: 0;
        }

        .vacc-section {
          display: flex;
          flex-direction: column;
          gap: 1mm;
        }

        .vacc-row {
          display: flex;
          align-items: center;
          gap: 1mm;
        }

        .vacc-label {
          font-size: 6px;
          white-space: nowrap;
          width: 21mm;
          display: inline-block;
        }

        .vacc-cells {
          display: flex;
          gap: 0.5mm;
        }

        .vacc-cell {
          width: 6mm;
          height: 4mm;
          border: 0.3mm solid #000;
        }

        .signatures {
          flex: 1;
          display: flex;
          justify-content: space-between;
          font-size: 6px;
          font-style: italic;
          color: #444;
          padding-top: 0.5mm;
        }

        .signatures div {
          flex: 1;
          text-align: center;
        }

        @media print {
          .card-wrapper { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
