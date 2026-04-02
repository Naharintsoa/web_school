import type { Student } from '../../types';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

interface BadgeTemplateProps {
  student: Student;
}

/**
 * Badge scolaire – identique à la capture d'écran :
 *   logo (80px) en haut à gauche
 *   nom école + année
 *   matricule / prénoms / classe en bleu
 *   photo à droite, alignée en haut
 *   height: 6.8cm | border: 2px double
 */
export function BadgeTemplate({ student }: BadgeTemplateProps) {
  const { currentYear } = useSchoolYear();

  return (
    <div className="bdg-wrap">
      <div className="bdg-badge">
        <div className="bdg-inner">

          {/* ── Gauche ── */}
          <div className="bdg-left">
            {/* Logo circulaire (placeholder) */}
            <div className="bdg-logo">
              <span className="bdg-logo-letter">C</span>
            </div>

            <div className="bdg-school">{`COLLÈGE PRIVÉ SULLY`}</div>
            <div className="bdg-year">{student.schoolYear || currentYear}</div>

            <div className="bdg-gap" />

            <div className="bdg-field">
              {'Matricule : '}
              <span className="bdg-val">{student.matricule || '—'}</span>
            </div>
            <div className="bdg-field">
              {'Prénoms : '}
              <span className="bdg-val">{student.firstName || '—'}</span>
            </div>
            <div className="bdg-field">
              {'Classe : '}
              <span className="bdg-val">{student.grade || '—'}</span>
            </div>
          </div>

          {/* ── Droite : photo ── */}
          <div className="bdg-photo-frame">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt=""
                className="bdg-photo-img"
              />
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
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #111;
        }

        .bdg-badge {
          height: 6.8cm;
          padding: 8px;
          border: 2px double #000;
          box-sizing: border-box;
          background: #fff;
        }

        /* Flex horizontal identique au Twig */
        .bdg-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          height: 100%;
        }

        /* ── Gauche ── */
        .bdg-left {
          flex: 1;
          margin-right: 10px;
        }

        /* Logo circulaire */
        .bdg-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a5fa8 0%, #2097bf 100%);
          border: 2px solid #c8d8ea;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .bdg-logo-letter {
          color: #fff;
          font-size: 32px;
          font-weight: bold;
          font-family: serif;
        }

        .bdg-school {
          font-size: 11px;
          font-weight: normal;
          color: #111;
          line-height: 1.4;
        }

        .bdg-year {
          font-size: 11px;
          color: #111;
          margin-bottom: 2px;
          line-height: 1.4;
        }

        /* Espace vide entre année et infos élève (équivalent <br><br> Twig) */
        .bdg-gap {
          height: 10px;
        }

        .bdg-field {
          font-size: 11px;
          line-height: 1.7;
          color: #111;
        }

        .bdg-val {
          color: #007BFF;
          font-weight: bold;
        }

        /* ── Droite : photo ── */
        .bdg-photo-frame {
          width: 100px;
          flex-shrink: 0;
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          /* hauteur auto — s'adapte au contenu comme Twig (height commenté) */
          min-height: 60px;
          max-height: calc(6.8cm - 16px);
        }

        .bdg-photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          image-rendering: auto;
        }

        .bdg-initials {
          font-size: 18px;
          font-weight: bold;
          color: #888;
        }

        @media print {
          .bdg-wrap { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
