/**
 * CertificateMultiPrint — 2 certificats par page A4, empilés verticalement.
 * Déclenche window.print() via un portal React.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CertificateTemplate } from './CertificateTemplate';
import type { Student } from '../../../types';

interface CertificateMultiPrintProps {
  students: Student[];
  type: 'scolarite' | 'radiation';
  onDone: () => void;
}

/** Découpe un tableau en sous-tableaux de taille n */
function chunk<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

export function CertificateMultiPrint({ students, type, onDone }: CertificateMultiPrintProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      onDone();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const pairs = chunk(students, 2);

  return createPortal(
    <div className="cert-multi-portal">
      {pairs.map((pair, pi) => (
        <div key={pi} className="cert-pair-page">
          {pair.map((s) => (
            <div key={s.id} className="cert-slot">
              <CertificateTemplate type={type} student={s} />
            </div>
          ))}
        </div>
      ))}

      <style>{`
        /* ── Masqué à l'écran, rendu dans le DOM mais invisible ── */
        .cert-multi-portal {
          position: fixed;
          top: -99999px;
          left: 0;
          width: 0;
          overflow: hidden;
        }

        @media print {
          /* Cacher tout sauf le portal */
          body > *:not(.cert-multi-portal) { display: none !important; }

          .cert-multi-portal {
            position: static !important;
            width: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          /* Page = 1 paire de certificats */
          .cert-pair-page {
            page-break-after: always;
            break-after: page;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-evenly;
            width: 210mm;
            height: 297mm;
            padding: 5mm 0;
            box-sizing: border-box;
            background: white;
          }
          .cert-pair-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Chaque slot occupe la moitié de la page */
          .cert-slot {
            width: 100%;
            display: flex;
            justify-content: center;
          }

          /* Séparateur pointillé entre les 2 certificats */
          .cert-slot:not(:last-child)::after {
            content: '';
            display: block;
            width: 18cm;
            border-bottom: 1px dashed #bbb;
            margin: 3mm auto 0;
          }

          /* Réduire le .certificate-container et .page pour tenir 2 par page */
          .cert-slot .certificate-container {
            padding: 2px !important;
            background: white !important;
          }
          .cert-slot .page {
            width: 19cm !important;
            height: 13.5cm !important;
            margin-top: 3mm !important;
            border: 3px double #2097bf !important;
            border-radius: 8px !important;
          }

          body, html { margin: 0; padding: 0; background: white; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>,
    document.body
  );
}
