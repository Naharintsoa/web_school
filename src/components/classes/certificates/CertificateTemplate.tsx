import type { Student } from '../../../types';
import type { SchoolId } from '../../../types/student';
import { useSchoolYear } from '../../../contexts/SchoolYearContext';

// ─── En-têtes selon l'établissement ──────────────────────────────────────────

function CertificateHeader({ school }: { school: SchoolId }) {
  const isAnnexe = school === 'sully-annexe';

  return (
    <div className="flex items-center mb-2">
      {/* Logo */}
      <div className="w-28 h-20 flex-shrink-0 ml-4">
        <img
          src="/assets/logo-sully.png"
          alt="Logo Sully"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Texte centré */}
      <div className="ml-2 text-center flex-grow">
        <p className="text-[10px] italic text-gray-700 leading-tight">L'issue vers la réussite</p>
        <h1 className="text-[16px] font-bold text-[#2097bf] uppercase leading-tight">
          {isAnnexe ? 'SULLY ANNEXE' : 'COLLEGE PRIVE SULLY'}
        </h1>
        <p className="text-[10px] italic text-gray-700 leading-tight mb-1">Savoir être-Savoir · Savoir faire</p>
        <p className="text-[9px] leading-[1.35] text-gray-800">
          Lot IV A 16 bis Ambodivonkely - Téléphone: <strong>020 85 234 94</strong> · Email:{' '}
          <a href="mailto:sully.amb@moov.mg" className="text-[#2097bf]">sully.amb@moov.mg</a><br />
          CISCO Antananarivo Ville - Code : <strong>101 011 793</strong> · ZAP VI<br />
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
  const school: SchoolId = student.school ?? 'sully';

  return (
    <div className="certificate-container">
      <div className="page">
        <div className="subpage">
          {/* En-tête */}
          <div className="content">
            <CertificateHeader school={school} />

            {/* Titre */}
            <p className="text-center font-bold text-xs text-[#2097bf] mt-2 head2">
              {type === 'radiation' ? 'CERTIFICAT DE RADIATION' : 'CERTIFICAT DE SCOLARITE'} — {school === 'sully-annexe' ? 'SULLY ANNEXE' : 'COLLEGE PRIVE SULLY'} — {currentYear}
            </p>

            {/* Introduction (Directrice) */}
            <div className="intro mt-4 ml-[50px]">
              <p className="font-serif text-[12px] font-tahoma">
                Je soussignée, <strong>RAMANANIRAINY Norotahiana</strong>, Directrice nominale de{' '}
                {school === 'sully-annexe' ? 'SULLY ANNEXE' : 'COLLEGE PRIVE SULLY'}, certifie sur l'honneur<br />que l'élève :
              </p>
            </div>

            {/* Corps du certificat */}
            <div className="content mt-4 ml-[50px]">
              <ul className="list-disc pl-6 text-[12px] font-tahoma">
                <li><strong>Nom :</strong> <span className="val">{student.lastName}</span></li>
                <li><strong>Prénoms :</strong> <span className="val">{student.firstName}</span></li>
                <li><strong>Né(e) le :</strong> <span className="val">{new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</span></li>
                <li><strong>À :</strong> <span className="val">{student.birthCity || 'Antananarivo'}</span></li>
                <li><strong>Fils ou Fille de :</strong> <span className="val">{student.parentInfo.fatherName}</span></li>
                <li><strong>Et de :</strong> <span className="val">{student.parentInfo.motherName}</span></li>
              </ul>

              {/* Lignes sans balise <li> */}
              <p className="text-[12px] font-tahoma">
                <strong>Est élève depuis le :</strong> <span className="val">{new Date(student.enrollmentDate).toLocaleDateString('fr-FR')}</span>
              </p>
              <p className="text-[12px] font-tahoma">
                <strong>Classe actuelle :</strong> <span className="val">{student.grade}</span>
              </p>
              <p className="text-[12px] font-tahoma">
                <strong>Matricule :</strong> <span className="val">{student.matricule}</span>
              </p>

              <p className="text-center mt-4 text-[12px] font-serif font-tahoma">
                Ce certificat lui est délivré pour servir et valoir ce que de droit.
              </p>
            </div>

            {/* Signature */}
            <div className="text-right mr-[20px]">
              <p className="text-[10px] font-tahoma">Antananarivo, le {today}</p>
              <img
                src="/assets/signature-directrice.png"
                alt="Signature"
                style={{ height: '50px', marginLeft: 'auto', marginRight: '2cm', display: 'block', marginTop: '4px' }}
              />
              <p className="text-[12px] font-semibold font-tahoma">RAMANANIRAINY Norotahiana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suppression des flèches de défilement en mode impression */}
      <style>
        {`
          @media print {
            body, html { overflow: hidden; }

            /* Mode impression solo (CertificatePreview) */
            .certificate-container {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 10px;
              background-color: white;
            }

            /* En mode solo chaque .page commence sur une nouvelle page.
               CertificateMultiPrint écrase cette règle via .cert-slot .page */
            .page {
              page-break-before: always;
              break-before: page;
              width: 20cm;
              height: 14cm;
              margin-top: 25px;
              padding: 4px;
              box-sizing: border-box;
              border: 3px double #2097bf;
              outline: 1px solid #2097bf;
              border-radius: 10px;
              background: #ffffff;
            }

            .subpage {
              width: 100%;
              height: 100%;
              padding: 0;
              margin: 0;
              box-sizing: border-box;
            }

            .content {
              font-size: 10px;
              line-height: 1.4;
              position: relative;
              top: 0;
            }
          }

          .certificate-container {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 20px;
            background-color: #f3f4f6;
          }

          .page {
            width: 20cm;
            height: 12cm;
            border: 3px double #2097bf;
            outline: 1px solid #2097bf;
            border-radius: 10px;
            background: #ffffff;
            padding: 4px;
            box-sizing: border-box;
            margin: 0;
          }

          .subpage {
            padding: 0;
            height: 100%;
            position: relative;
          }

          .head2 h1 {
            font-size: 12px;
            font-family: "Times New Roman", serif;
            color: #2097bf;
          }

          .date {
            position: relative;
            top: 20px;
            text-align: right;
          }

          ul {
            margin: 0;
            padding-left: 1cm;
            font-size: 12px;
            line-height: 1.3;
          }

          .list-disc {
            margin-top: 5px;
          }

          .text-center {
            text-align: center;
          }

          strong {
            color: #000;
          }

          /* Valeurs des données élève en #2097bf */
          .val {
            color: #2097bf;
            font-weight: bold;
          }
        `}
      </style>
    </div>
  );
}
