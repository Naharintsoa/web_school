import type { Student } from '../../../types';
import { useSchoolYear } from '../../../contexts/SchoolYearContext';

interface CertificateTemplateProps {
  type: 'scolarite' | 'radiation';
  student: Student;
  customText?: string;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

function fmtDateLong(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function CertificateTemplate({ type, student }: CertificateTemplateProps) {
  const { currentYear } = useSchoolYear();
  const today = fmtDateLong(new Date());

  return (
    <>
      <div className="cert-page">
        {/* ══ En-tête ══ */}
        <div className="cert-header">
          <div className="cert-logo">
            <img src="/assets/logo-sully.png" alt="Logo Sully" />
          </div>
          <div className="cert-school-info">
            <p className="school-motto-top">L'issue vers la réussite</p>
            <p className="school-name">COLLEGE PRIVE SULLY</p>
            <p className="school-motto-bottom">Savoir être-Savoir - Savoir faire</p>
            <p className="school-address">
              Lot IV A 16 bis Ambodivonkely - Téléphone: 020 85 234 94 - sully.amb@moov.mg
            </p>
            <p className="school-address">CISCO Antananarivo Ville - Code : 101 011 793 - ZAP VI</p>
            <p className="school-address">AO N° 036/2019 - DRENETP/ANALA/AO du 21/11/19</p>
          </div>
        </div>

        {/* ══ Séparateur ══ */}
        <div className="cert-divider" />

        {/* ══ Titre ══ */}
        <p className="cert-title">
          {type === 'radiation' ? 'CERTIFICAT DE RADIATION' : 'CERTIFICAT DE SCOLARITÉ'} — {currentYear}
        </p>

        {/* ══ Introduction ══ */}
        <p className="cert-intro">
          Je soussignée, <strong>Norotahiana RAMANANIRAINY</strong>, Directrice nominale de{' '}
          COLLEGE PRIVE SULLY, certifie sur l'honneur que l'élève :
        </p>

        {/* ══ Données élève ══ */}
        <ul className="cert-list">
          <li><span className="cert-label">Nom :</span> <strong>{student.lastName?.toUpperCase()}</strong></li>
          <li><span className="cert-label">Prénoms :</span> <strong>{student.firstName}</strong></li>
          <li><span className="cert-label">Né(e) le :</span> <strong>{fmtDate(student.dateOfBirth)}</strong></li>
          <li><span className="cert-label">À :</span> <strong>{student.birthCity || 'Antananarivo'}</strong></li>
          <li><span className="cert-label">Fils ou Fille de :</span> <strong>{student.parentInfo.fatherName}</strong></li>
          <li><span className="cert-label">Et de :</span> <strong>{student.parentInfo.motherName}</strong></li>
          <li><span className="cert-label">Est élève depuis le :</span> <strong>{fmtDate(student.enrollmentDate)}</strong></li>
          <li><span className="cert-label">Classe actuelle :</span> <strong>{student.grade}</strong></li>
          <li><span className="cert-label">Matricule :</span> <strong>{student.matricule}</strong></li>
        </ul>

        {/* ══ Formule de clôture ══ */}
        <p className="cert-closing">
          Ce certificat lui est délivré pour servir et valoir ce que de droit.
        </p>

        {/* ══ Signature ══ */}
        <div className="cert-signature">
          <p>Antananarivo, le {today}</p>
          <div className="cert-sig-space" />
          <p className="cert-sig-name">Norotahiana RAMANANIRAINY</p>
        </div>
      </div>

      <style>{`
        /* ── Conteneur A4 ── */
        .cert-page {
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          padding: 10mm 12mm;
          background: #fff;
          border: 1.5px solid #2897bf;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12px;
          color: #111;
          display: flex;
          flex-direction: column;
        }

        /* ── En-tête ── */
        .cert-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .cert-logo {
          width: 70px;
          height: 70px;
          flex-shrink: 0;
        }

        .cert-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .cert-school-info {
          flex: 1;
          text-align: center;
          line-height: 1.4;
        }

        .school-motto-top {
          font-style: italic;
          font-size: 10px;
          margin: 0;
        }

        .school-name {
          font-size: 16px;
          font-weight: bold;
          color: #09438a;
          margin: 1px 0;
          text-transform: uppercase;
        }

        .school-motto-bottom {
          font-style: italic;
          font-size: 10px;
          font-weight: bold;
          margin: 0 0 2px;
        }

        .school-address {
          font-size: 9px;
          margin: 0;
          color: #333;
        }

        /* ── Séparateur ── */
        .cert-divider {
          border: none;
          border-top: 1.5px solid #2897bf;
          margin: 6px 0;
        }

        /* ── Titre ── */
        .cert-title {
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          color: #09438a;
          margin: 10px 0 18px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Introduction ── */
        .cert-intro {
          font-size: 12px;
          line-height: 1.6;
          margin: 0 0 12px 30px;
        }

        /* ── Liste élève ── */
        .cert-list {
          list-style: disc;
          padding-left: 50px;
          margin: 0 0 16px;
          font-size: 12px;
          line-height: 1.7;
        }

        .cert-list li {
          margin: 0;
        }

        .cert-label {
          color: #111;
        }

        .cert-list strong {
          color: #09438a;
        }

        /* ── Formule de clôture ── */
        .cert-closing {
          font-size: 12px;
          margin: 0 0 0 0;
          line-height: 1.6;
        }

        /* ── Signature ── */
        .cert-signature {
          margin-top: auto;
          text-align: right;
          padding-top: 16mm;
          font-size: 11px;
        }

        .cert-sig-space {
          height: 40px;
        }

        .cert-sig-name {
          font-weight: bold;
          font-size: 12px;
          margin: 0;
        }

        /* ── Impression ── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          .cert-page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm 12mm;
          }
        }
      `}</style>
    </>
  );
}
