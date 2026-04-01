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
 * Carte d'identité scolaire A4 portrait.
 * Chaque feuille contient 2 cartes côte à côte (gauche + droite).
 * Format inspiré du modèle Twig officiel de l'établissement.
 */
export function IdentityCardTemplate({ student }: IdentityCardTemplateProps) {
  const { currentYear } = useSchoolYear();

  return (
    <div className="card-wrapper">
      <div className="card-border">
        {/* ── En-tête : photo + titre ── */}
        <div className="card-header">
          <div className="photo-box" />
          <div className="card-title">
            <strong>CARTE D'IDENTITÉ SCOLAIRE</strong>
            <br />
            <strong>COLLÈGE PRIVÉ SULLY</strong>
            <br />
            <strong>Année scolaire {student.schoolYear || currentYear}</strong>
          </div>
        </div>

        <div className="divider" />

        {/* ── Corps : infos élève ── */}
        <div className="card-body">
          <p className="certif-intro">
            Je, <strong>RAMANANIRAINY Norotahiana</strong>, certifie que
          </p>

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
                <td className="info-label">N° Matricule :</td>
                <td className="info-value blue">{student.matricule || '—'}</td>
              </tr>
            </tbody>
          </table>

          <p className="certif-middle">
            {student.lastName?.toUpperCase()} {student.firstName} est élève dans mon établissement.
          </p>

          <div className="iss-row">
            <span className="info-label">N° Matricule ISS :</span>
            <span className="info-value red">{student.issNumber || '—'}</span>
          </div>
        </div>

        {/* ── Vaccination ── */}
        <div className="vaccination">
          <div className="vacc-labels">
            <div>Primo vaccination</div>
            <div>Revaccination</div>
          </div>
          <table className="vacc-table">
            <tbody>
              <tr>
                <td /><td />
              </tr>
              <tr>
                <td /><td />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Signatures ── */}
        <div className="signatures">
          <div>Signature et cachet</div>
          <div>Cachet I.S.S</div>
          <div>Signature de l'élève</div>
        </div>
      </div>

      <style>{`
        .card-wrapper {
          width: 98mm;
          min-height: 135mm;
          padding: 3mm;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          font-family: 'Times New Roman', serif;
          font-size: 11px;
        }

        .card-border {
          width: 100%;
          border: 1.5mm double #2097bf;
          padding: 3.5mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 2.5mm;
          min-height: 128mm;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 3mm;
        }

        .photo-box {
          width: 28mm;
          height: 35mm;
          border: 0.3mm solid #000;
          flex-shrink: 0;
          background: #f9f9f9;
        }

        .card-title {
          flex: 1;
          text-align: center;
          padding-top: 2mm;
          line-height: 1.5;
          color: #09448a;
          font-size: 11.5px;
        }

        .divider {
          border-top: 0.2mm solid #2097bf;
          margin: 1mm 0;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 1.5mm;
        }

        .certif-intro {
          margin: 0;
          line-height: 1.4;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
        }

        .info-table td {
          padding: 0.5mm 1mm;
          vertical-align: top;
        }

        .info-label {
          font-weight: bold;
          white-space: nowrap;
          width: 30%;
          color: #222;
        }

        .info-value {
          font-weight: bold;
        }

        .blue { color: #2097bf; }
        .red  { color: #cc0000; }

        .certif-middle {
          margin: 1mm 0 0;
          line-height: 1.4;
        }

        .iss-row {
          display: flex;
          gap: 2mm;
          margin-top: 1mm;
        }

        .vaccination {
          display: flex;
          align-items: flex-start;
          gap: 3mm;
          margin-top: 1mm;
        }

        .vacc-labels {
          width: 45%;
          font-weight: bold;
          line-height: 2;
          white-space: nowrap;
          font-size: 10.5px;
        }

        .vacc-table {
          border-collapse: collapse;
          flex: 1;
        }

        .vacc-table td {
          border: 0.3mm solid #000;
          width: 12mm;
          height: 6mm;
          padding: 0;
        }

        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 10mm;
          font-size: 10px;
          text-align: center;
        }

        .signatures div {
          flex: 1;
          text-align: center;
          font-style: italic;
          color: #444;
        }

        @media print {
          .card-wrapper { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
