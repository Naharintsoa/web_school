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

function chunk<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

export function CertificateMultiPrint({ students, type, onDone }: CertificateMultiPrintProps) {
  useEffect(() => {
    // Attendre que toutes les images du portal soient chargées avant d'imprimer
    // (le portal est off-screen, le navigateur peut retarder le chargement des <img>)
    const waitForImages = () => {
      const portal = document.querySelector('.cert-multi-portal');
      if (!portal) { window.print(); onDone(); return; }

      const imgs = Array.from(portal.querySelectorAll('img')) as HTMLImageElement[];
      const pending = imgs.filter(img => !img.complete);

      if (pending.length === 0) {
        window.print();
        onDone();
        return;
      }

      let resolved = 0;
      const tryPrint = () => {
        resolved++;
        if (resolved >= pending.length) { window.print(); onDone(); }
      };
      pending.forEach(img => {
        img.addEventListener('load',  tryPrint, { once: true });
        img.addEventListener('error', tryPrint, { once: true }); // imprimer même si erreur
      });

      // Sécurité : imprimer après 3 s max même si une image ne répond pas
      setTimeout(() => { window.print(); onDone(); }, 3000);
    };

    // Laisser React rendre le portal avant de chercher les images
    const timer = setTimeout(waitForImages, 100);
    return () => clearTimeout(timer);
  }, []);

  const pairs = chunk(students, 2);

  return createPortal(
    <div className="cert-multi-portal">
      {pairs.map((pair, pi) => (
        <div key={pi} className="cert-pair-page">
          {pair.map((s, si) => (
            <div key={s.id} className={`cert-slot${si === 0 && pair.length === 2 ? ' cert-slot--top' : ''}`}>
              <CertificateTemplate type={type} student={s} />
            </div>
          ))}
        </div>
      ))}

      <style>{`
        /* ── Invisible à l'écran ── */
        .cert-multi-portal {
          position: fixed;
          top: -99999px;
          left: 0;
          width: 0;
          overflow: hidden;
        }

        @media print {
          /* Masquer tout sauf le portal */
          body > *:not(.cert-multi-portal) { display: none !important; }

          .cert-multi-portal {
            position: static !important;
            width: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          /* Une page = une paire de certificats */
          .cert-pair-page {
            page-break-after: always;
            break-after: page;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-evenly;
            width: 210mm;
            height: 297mm;
            padding: 6mm 0 4mm;
            box-sizing: border-box;
            background: white;
          }
          .cert-pair-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Chaque slot : annuler le saut de page individuel */
          .cert-slot {
            width: 100%;
            display: flex;
            justify-content: center;
          }

          /* Ligne pointillée séparant les 2 certificats */
          .cert-slot--top {
            border-bottom: 1px dashed #b0b8c8;
            padding-bottom: 4mm;
            margin-bottom: 4mm;
          }

          /* ── Écraser les styles print de CertificateTemplate ── */

          /* Annuler le saut de page solo */
          .cert-slot .page {
            page-break-before: avoid !important;
            break-before: avoid !important;
          }

          .cert-slot .certificate-container {
            padding: 0 !important;
            background: white !important;
          }

          /* Dimensions pour tenir 2 par page A4 (297mm - ~20mm marges = 277mm / 2 ≈ 133mm) */
          .cert-slot .page {
            width: 190mm !important;
            height: 128mm !important;
            margin-top: 0 !important;
            border: 3px double #2097bf !important;
            outline: 1px solid #2097bf !important;
            border-radius: 8px !important;
            padding: 3px !important;
          }

          /* Forcer l'affichage des images (certains navigateurs les masquent en print) */
          .cert-slot img {
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body, html { margin: 0; padding: 0; background: white; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>,
    document.body
  );
}
