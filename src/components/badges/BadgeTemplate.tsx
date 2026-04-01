import type { Student } from '../../types';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

interface BadgeTemplateProps {
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
 * Badge scolaire.
 * title-wrapper est en display:block (photo + titre école + infos élève empilés verticalement).
 * Correspond au modèle Twig badge multiple de l'établissement.
 */
export function BadgeTemplate({ student }: BadgeTemplateProps) {
  const { currentYear } = useSchoolYear();

  return (
    <div className="bdg-wrapper">
      <div className="bdg-container">
        {/* title-wrapper SANS flex : photo, titre école, infos élève en colonne */}
        <div className="bdg-title-wrapper">
          {/* Photo */}
          <div className="bdg-title-square">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="" className="bdg-photo-img" />
            ) : (
              <span className="bdg-photo-initials">
                {(student.firstName?.[0] ?? '')}{(student.lastName?.[0] ?? '')}
              </span>
            )}
          </div>

          {/* Titre établissement */}
          <div className="bdg-section-title">
            <strong>COLLÈGE PRIVÉ SULLY</strong>
            <br />
            <strong>CARTE D&apos;ÉLÈVE</strong>
            <br />
            <strong>Année scolaire {student.schoolYear || currentYear}</strong>
          </div>

          {/* Infos élève */}
          <table className="bdg-info-table">
            <tbody>
              <tr>
                <td className="bdg-info-label">Nom :</td>
                <td className="bdg-info-value bdg-blue">{student.lastName?.toUpperCase() || '—'}</td>
              </tr>
              <tr>
                <td className="bdg-info-label">Prénoms :</td>
                <td className="bdg-info-value bdg-blue">{student.firstName || '—'}</td>
              </tr>
              <tr>
                <td className="bdg-info-label">Né(e) le :</td>
                <td className="bdg-info-value bdg-blue">{formatDate(student.dateOfBirth)}</td>
              </tr>
              <tr>
                <td className="bdg-info-label">Classe :</td>
                <td className="bdg-info-value bdg-blue">{student.grade || '—'}</td>
              </tr>
              <tr>
                <td className="bdg-info-label">N° Matricule :</td>
                <td className="bdg-info-value bdg-blue">{student.matricule || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Vaccination */}
        <div className="bdg-vaccination">
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

        {/* Signatures */}
        <div className="bdg-signatures">
          <div>Signature et cachet</div>
          <div>Cachet I.S.S</div>
          <div>Signature de l&apos;élève</div>
        </div>
      </div>

      <style>{`
        .bdg-wrapper {
          width: 98mm;
          min-height: 135mm;
          padding: 3mm;
          box-sizing: border-box;
          font-family: 'Times New Roman', serif;
          font-size: 11px;
        }

        .bdg-container {
          width: 100%;
          border: 1.5mm double #2097bf;
          padding: 3.5mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 2.5mm;
          min-height: 128mm;
        }

        /* PAS de flex ici — tout en colonne (block) */
        .bdg-title-wrapper {
          display: block;
          text-align: center;
        }

        .bdg-title-square {
          width: 28mm;
          height: 35mm;
          border: 0.3mm solid #000;
          margin: 0 auto 2mm;
          background: #f9f9f9;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bdg-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bdg-photo-initials {
          font-size: 16px;
          font-weight: bold;
          color: #9ca3af;
        }

        .bdg-section-title {
          color: #09448a;
          font-size: 11.5px;
          line-height: 1.5;
          margin-bottom: 2mm;
          text-align: center;
        }

        .bdg-info-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .bdg-info-table td {
          padding: 0.5mm 1mm;
          vertical-align: top;
        }

        .bdg-info-label {
          font-weight: bold;
          white-space: nowrap;
          width: 40%;
          color: #222;
        }

        .bdg-info-value {
          font-weight: bold;
        }

        .bdg-blue { color: #2097bf; }
        .bdg-red  { color: #cc0000; }

        .bdg-vaccination {
          display: flex;
          align-items: flex-start;
          gap: 3mm;
          margin-top: 1mm;
        }

        .bdg-vacc-labels {
          width: 45%;
          font-weight: bold;
          line-height: 2;
          white-space: nowrap;
          font-size: 10.5px;
        }

        .bdg-vacc-table {
          border-collapse: collapse;
          flex: 1;
        }

        .bdg-vacc-table td {
          border: 0.3mm solid #000;
          width: 12mm;
          height: 6mm;
          padding: 0;
        }

        .bdg-signatures {
          display: flex;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 10mm;
          font-size: 10px;
        }

        .bdg-signatures div {
          flex: 1;
          text-align: center;
          font-style: italic;
          color: #444;
        }

        @media print {
          .bdg-wrapper { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
