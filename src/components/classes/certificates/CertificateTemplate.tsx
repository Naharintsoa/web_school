import type { Student } from '../../../types';
import { useSchoolYear } from '../../../contexts/SchoolYearContext';


// Composant pour l'entête
function CertificateHeader() {
  return (
    <div className="flex items-center mb-2">
      {/* Logo avec marge à gauche */}
      <div className="w-30 h-20 flex-shrink-0 ml-5">
        <img
          src="/assets/logo-sully.png" // Assurez-vous que l'image est présente dans votre dossier 'assets'
          alt="Logo Sully"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Texte à droite */}
      <div className="ml-2 text-center flex-grow">
        <h1 className="text-[20px] font-bold text-[#09438a] uppercase">
          COLLEGE PRIVE SULLY
        </h1>

        <p className="text-[10px] leading-4 text-gray-800">
          Lot IV A 16 bis Ambodivonkely Ambohimanarina<br />
          Tel: <strong>020 85 234 94</strong> - <strong>034 16 351 52</strong> | Email: <strong>sully@moov.mg</strong><br />
          CISCO Antananarivo Ville Code: <strong>101 011 793 ZAP VI</strong><br />
          AO N° 036/2019 - DRENETP/ANALA/AO du 21/11/19
        </p>
      </div>
    </div>
  );
}

// Composant principal du certificat
interface CertificateTemplateProps {
  type: 'scolarite' | 'radiation';
  student: Student;
  customText?: string;
}

export function CertificateTemplate({ type, student }: CertificateTemplateProps) {
  const { currentYear } = useSchoolYear();
  const today = new Date().toLocaleDateString('fr-FR');

  return (
    <div className="certificate-container">
      <div className="page">
        <div className="page-inner">
          {/* En-tête */}
          <CertificateHeader />

          {/* Ligne de séparation */}
          <hr className="border-[#09438a] border-t-2 my-3" />

          {/* Titre */}
          <p className="text-center font-bold text-[14px] text-[#09438a] mt-4 mb-6 tracking-wide uppercase">
            {type === 'radiation' ? 'Certificat de Radiation' : 'Certificat de Scolarité'} — {currentYear}
          </p>

          {/* Introduction (Directrice) */}
          <div className="intro mt-2 px-[40px]">
            <p className="font-serif text-[12px]">
              Je soussignée, <strong>RAMANANIRAINY Norotahiana</strong>, Directrice nominale de l'école SULLY,
              certifie sur l'honneur que l'élève :
            </p>
          </div>

          {/* Corps du certificat */}
          <div className="mt-5 px-[60px]">
            <ul className="list-disc pl-6 text-[12px] space-y-1">
              <li><strong>Nom :</strong> {student.lastName}</li>
              <li><strong>Prénoms :</strong> {student.firstName}</li>
              <li><strong>Né(e) le :</strong> {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</li>
              <li><strong>À :</strong> Antananarivo</li>
              <li><strong>Fils/Fille de :</strong> {student.parentInfo.fatherName}</li>
              <li><strong>Et de :</strong> {student.parentInfo.motherName}</li>
            </ul>

            <div className="mt-5 space-y-2 text-[12px]">
              <p><strong>Est élève dans mon établissement</strong></p>
              <p><strong>Depuis le :</strong> {new Date(student.enrollmentDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Classe actuelle :</strong> {student.grade}</p>
              <p><strong>Numéro matricule :</strong> {student.matricule}</p>
            </div>

            <p className="text-center mt-8 text-[12px] font-serif italic">
              Ce certificat lui est délivré pour servir et valoir ce que de droit.
            </p>
          </div>

          {/* Signature — poussée vers le bas */}
          <div className="signature-block">
            <p className="text-[11px]">Antananarivo, le {today}</p>
            <p className="mt-[50px] text-[12px] font-semibold">RAMANANIRAINY Norotahiana</p>
            <p className="text-[10px] italic text-gray-600">Directrice</p>
          </div>
        </div>
      </div>

      <style>{`
        .certificate-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background: #e5e7eb;
          padding: 16px;
          min-height: 100%;
          box-sizing: border-box;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          border: 4px solid #09438a;
          border-radius: 8px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .page-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 12mm 15mm 10mm;
          box-sizing: border-box;
          min-height: 297mm;
        }

        .signature-block {
          margin-top: auto;
          text-align: right;
          padding-top: 20mm;
        }

        strong {
          color: #09438a;
        }

        .content ul li strong {
          color: #09438a;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          body, html {
            overflow: hidden !important;
          }

          .certificate-container {
            background: none;
            padding: 0;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            border: 4px solid #09438a;
            border-radius: 8px;
            page-break-after: always;
          }

          .page-inner {
            min-height: 297mm;
          }
        }
      `}</style>
    </div>
  );
}
