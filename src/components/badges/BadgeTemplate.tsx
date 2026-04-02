import type { Student } from '../../types';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

interface BadgeTemplateProps {
  student: Student;
}

/**
 * Badge scolaire – fidèle au template Twig single badge :
 *   height: 6.8cm | border: 2px double
 *   Gauche : logo + nom école + année + matricule + prénoms + classe
 *   Droite : photo (100px)
 */
export function BadgeTemplate({ student }: BadgeTemplateProps) {
  const { currentYear } = useSchoolYear();

  return (
    <div className="bdg-wrap">
      <div className="bdg-badge">
        <div className="bdg-header">

          {/* ── Gauche : infos ── */}
          <div className="bdg-content">
            {/* Logo placeholder */}
            <div className="bdg-logo">
              <span className="bdg-logo-text">C</span>
            </div>

            <div className="bdg-school-name">COLLÈGE PRIVÉ SULLY</div>
            <div className="bdg-year">{student.schoolYear || currentYear}</div>

            <div className="bdg-divider" />

            <div className="bdg-field">
              Matricule&nbsp;:&nbsp;<span className="bdg-blue">{student.matricule || '—'}</span>
            </div>
            <div className="bdg-field">
              Prénoms&nbsp;:&nbsp;<span className="bdg-blue">{student.firstName || '—'}</span>
            </div>
            <div className="bdg-field">
              Nom&nbsp;:&nbsp;<span className="bdg-blue">{student.lastName?.toUpperCase() || '—'}</span>
            </div>
            <div className="bdg-field">
              Classe&nbsp;:&nbsp;<span className="bdg-blue">{student.grade || '—'}</span>
            </div>
          </div>

          {/* ── Droite : photo ── */}
          <div className="bdg-photo">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="" className="bdg-photo-img" />
            ) : (
              <span className="bdg-initials">
                {(student.firstName?.[0] ?? '').toUpperCase()}
                {(student.lastName?.[0] ?? '').toUpperCase()}
              </span>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .bdg-wrap {
          width: 98mm;
          padding: 4px;
          box-sizing: border-box;
          font-family: 'Times New Roman', Times, serif;
          font-size: 11.5px;
          color: #111;
        }

        /* Badge principal — hauteur fixe 6.8cm comme Twig */
        .bdg-badge {
          height: 6.8cm;
          padding: 8px;
          border: 2px double #1a5fa8;
          border-radius: 3px;
          box-sizing: border-box;
          background: #fff;
          position: relative;
          overflow: hidden;
        }

        /* Ligne colorée en haut */
        .bdg-badge::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #1a5fa8 0%, #2097bf 100%);
        }

        /* Flex horizontal : contenu gauche + photo droite */
        .bdg-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          height: 100%;
          padding-top: 4px;
        }

        /* ── Gauche ── */
        .bdg-content {
          flex: 1;
          margin-right: 8px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .bdg-logo {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #1a5fa8, #2097bf);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 3px;
        }
        .bdg-logo-text {
          color: #fff;
          font-size: 15px;
          font-weight: bold;
        }

        .bdg-school-name {
          font-size: 10.5px;
          font-weight: bold;
          color: #1a5fa8;
          line-height: 1.3;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .bdg-year {
          font-size: 9.5px;
          color: #666;
          font-style: italic;
          margin-bottom: 2px;
        }

        .bdg-divider {
          height: 1px;
          background: linear-gradient(90deg, #2097bf55, transparent);
          margin: 3px 0;
        }

        .bdg-field {
          font-size: 10.5px;
          line-height: 1.55;
          color: #222;
        }

        .bdg-blue {
          color: #007BFF;
          font-weight: bold;
        }

        /* ── Droite : photo ── */
        .bdg-photo {
          width: 100px;
          flex-shrink: 0;
          border: 1px solid #bcd;
          border-radius: 4px;
          overflow: hidden;
          background: #f0f4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: stretch;
          box-shadow: 0 1px 4px rgba(26,95,168,0.12);
        }

        .bdg-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          image-rendering: auto;
        }

        .bdg-initials {
          font-size: 20px;
          font-weight: bold;
          color: #2097bf;
          letter-spacing: -0.03em;
        }

        @media print {
          .bdg-wrap { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
