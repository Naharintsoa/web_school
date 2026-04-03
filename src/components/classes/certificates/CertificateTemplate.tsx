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
      <div className="cert-wrap">
        <div className="page-border">

          {/* ══ En-tête gris ══ */}
          <table className="cert-header-table">
            <tbody>
              <tr>
                <td className="cert-header-cell">
                  <table style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td className="cert-logo-cell">
                          <img
                            src="/assets/logo-sully.png"
                            alt="Logo Sully"
                            className="cert-logo-img"
                          />
                        </td>
                        <td className="cert-school-text">
                          <em><strong>L'issue vers la réussite</strong></em><br />
                          <strong className="cert-school-name">COLLEGE PRIVE SULLY</strong><br />
                          <strong><em>Savoir être - Savoir - Savoir faire</em></strong><br />
                          <em>
                            Lot IV A 16 bis Ambodivonkely - Téléphone : 020 85 234 94 - sully.amb@moov.mg
                          </em><br />
                          <em>CISCO Antananarivo Ville - Code : 101 011 793 - ZAP VI</em><br />
                          <em>AO N° 036/2019 - DRENETP/ANALA/AO du 21/11/19</em>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ══ Titre ══ */}
          <div className="cert-title-block">
            <strong className="cert-title-text">
              {type === 'radiation' ? 'CERTIFICAT DE RADIATION' : 'CERTIFICAT DE SCOLARITÉ'} — {currentYear}
            </strong>
          </div>

          {/* ══ Corps ══ */}
          <div className="cert-body">
            <p className="cert-intro">
              &nbsp;&nbsp;Je soussignée, <strong>Norotahiana RAMANANIRAINY</strong>, Directrice nominale de
              COLLEGE PRIVE SULLY, certifie sur l'honneur que l'élève :
            </p>

            <ul className="cert-list">
              <li>Nom : <span className="value-blue">{student.lastName?.toUpperCase()}</span></li>
              <li>Prénoms : <span className="value-blue">{student.firstName}</span></li>
              <li>Né(e) le : <span className="value-blue">{fmtDate(student.dateOfBirth)}</span></li>
              <li>À : <span className="value-blue">{student.birthCity || 'Antananarivo'}</span></li>
              <li>Fils ou Fille de : <span className="value-blue">{student.parentInfo.fatherName}</span></li>
              <li>Et de : <span className="value-blue">{student.parentInfo.motherName}</span></li>
              <li>Est élève depuis le : <span className="value-blue">{fmtDate(student.enrollmentDate)}</span></li>
              <li>Classe actuelle : <span className="value-blue">{student.grade}</span></li>
              <li>Matricule : <span className="value-blue">{student.matricule}</span></li>
            </ul>

            <p className="cert-closing">
              Ce certificat lui est délivré pour servir et valoir ce que de droit.
            </p>
          </div>

          {/* ══ Signature ══ */}
          <div className="cert-signature">
            <p className="cert-sig-date">Antananarivo, le {today}</p>
            <div className="cert-sig-space" />
            <p className="cert-sig-name"><strong>Norotahiana RAMANANIRAINY</strong></p>
          </div>

        </div>
      </div>

      <style>{`
        /* ── Wrapper centré (preview) ── */
        .cert-wrap {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background: #f3f4f6;
          padding: 12px;
          min-height: 100%;
          box-sizing: border-box;
        }

        /* ── Bordure principale : double épaisse bleue ── */
        .page-border {
          width: 190mm;
          min-height: 277mm;
          margin: 10mm auto;
          padding: 10mm 12mm;
          border: 8px double #2097bf;
          box-sizing: border-box;
          background: #fff;
          font-family: 'Times New Roman', Times, serif;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* ── En-tête ── */
        .cert-header-table {
          width: 100%;
          margin-bottom: 6px;
          font-size: 11px;
        }

        .cert-header-cell {
          text-align: center;
          background-color: #d9d9d9;
          padding: 5px 8px;
        }

        .cert-logo-cell {
          width: 80px;
          vertical-align: middle;
        }

        .cert-logo-img {
          width: 70px;
          height: 70px;
          object-fit: contain;
        }

        .cert-school-text {
          text-align: center;
          vertical-align: middle;
          line-height: 1.4;
          padding-left: 6px;
        }

        .cert-school-name {
          color: #09448a;
          font-size: 15px;
        }

        /* ── Titre ── */
        .cert-title-block {
          text-align: center;
          margin: 10px 0;
        }

        .cert-title-text {
          color: #09448a;
          font-size: 14px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* ── Corps ── */
        .cert-body {
          flex: 1;
        }

        .cert-intro {
          font-size: 13px;
          line-height: 1.6;
          margin: 0 0 6px;
        }

        .cert-list {
          list-style-type: disc;
          padding-left: 40px;
          font-size: 14px;
          line-height: 1.75;
          margin: 0 0 10px;
        }

        .value-blue {
          color: #2097bf;
          font-weight: bold;
        }

        .cert-closing {
          font-size: 14px;
          margin: 0;
          line-height: 1.6;
        }

        /* ── Signature ── */
        .cert-signature {
          text-align: right;
          font-size: 12px;
          margin-top: 10mm;
        }

        .cert-sig-date {
          margin: 0 0 4px;
        }

        .cert-sig-space {
          height: 45px;
        }

        .cert-sig-name {
          margin: 0 30px 0 0;
          font-size: 13px;
        }

        /* ── Impression ── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
          }

          .cert-wrap {
            background: none;
            padding: 0;
          }

          .page-border {
            width: 190mm;
            min-height: 277mm;
            margin: 10mm auto;
            border: 8px double #2097bf;
          }
        }
      `}</style>
    </>
  );
}
