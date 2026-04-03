import { useState } from 'react';
import { Printer, Download, Edit, Loader } from 'lucide-react';
import { CertificateTemplate } from './CertificateTemplate';
import type { Student } from '../../../types';
import { FR } from '../../../constants/translations';

interface CertificatePreviewProps {
  type: 'scolarite' | 'radiation';
  student: Student;
  onClose: () => void;
}

export function CertificatePreview({ type, student, onClose }: CertificatePreviewProps) {
  const [customText, setCustomText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simuler un délai
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simuler un délai
      window.print(); // Pour l'instant, utilise l'impression en PDF
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 print:bg-white print:items-start overflow-y-auto py-4 px-2 sm:py-6 sm:items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none">
        {/* Barre d'outils - cachée à l'impression */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center print:hidden">
          <h3 className="text-lg font-medium text-gray-900">
            {type === 'scolarite' ? FR.certificates.schooling : FR.certificates.removal}
          </h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-gray-600 hover:text-gray-900"
              disabled={isPrinting || isDownloading}
            >
              <Edit size={20} />
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting || isDownloading}
              className={`text-gray-600 hover:text-gray-900 ${
                isPrinting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isPrinting ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Printer size={20} />
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={isPrinting || isDownloading}
              className={`text-gray-600 hover:text-gray-900 ${
                isDownloading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isDownloading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Download size={20} />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isPrinting || isDownloading}
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-auto p-2 sm:p-6 lg:p-8 print:p-0">
          {isEditing && (
            <div className="max-w-2xl mx-auto mb-4 print:hidden">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte personnalisé
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={6}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          )}
          {/* Aperçu A4 — scroll vertical uniquement, pas de scroll horizontal */}
          <div className="overflow-x-hidden print:overflow-visible">
            <CertificateTemplate
              type={type}
              student={student}
              customText={customText || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}