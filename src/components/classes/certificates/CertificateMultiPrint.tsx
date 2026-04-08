/**
 * CertificateMultiPrint — rend plusieurs CertificateTemplate dans un portal
 * puis déclenche window.print() pour imprimer tous les certificats d'un coup.
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

export function CertificateMultiPrint({ students, type, onDone }: CertificateMultiPrintProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      onDone();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <div className="cert-multi-portal">
      {students.map((s) => (
        <div key={s.id} className="cert-multi-page">
          <CertificateTemplate type={type} student={s} />
        </div>
      ))}
      <style>{`
        .cert-multi-portal {
          position: fixed;
          top: -99999px;
          left: 0;
        }
        @media print {
          body > *:not(.cert-multi-portal) { display: none !important; }
          .cert-multi-portal {
            position: static !important;
            display: block !important;
          }
          .cert-multi-page {
            page-break-after: always;
            break-after: page;
          }
          .cert-multi-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          body, html { margin: 0; padding: 0; background: white; }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>
    </div>,
    document.body
  );
}
