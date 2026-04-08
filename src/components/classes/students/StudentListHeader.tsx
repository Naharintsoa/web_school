import { GraduationCap, Printer, X as XIcon } from 'lucide-react';
import { FR } from '../../../constants/translations';

interface StudentListHeaderProps {
  grade: string;
  onClose: () => void;
  onShowArchive: () => void;
  // Multi-certificats
  multiSelectMode: boolean;
  selectedCount: number;
  onToggleMultiSelect: () => void;
  onPrintSelected: () => void;
}

export function StudentListHeader({
  grade,
  onClose,
  onShowArchive,
  multiSelectMode,
  selectedCount,
  onToggleMultiSelect,
  onPrintSelected,
}: StudentListHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {FR.classes.studentsInGrade.replace('{grade}', grade)}
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onShowArchive}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {FR.archive.title}
          </button>

          {/* Bouton multi-certificats */}
          {multiSelectMode ? (
            <>
              <button
                onClick={onPrintSelected}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
              >
                <Printer size={15} />
                Imprimer ({selectedCount})
              </button>
              <button
                onClick={onToggleMultiSelect}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XIcon size={14} />
                Annuler
              </button>
            </>
          ) : (
            <button
              onClick={onToggleMultiSelect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Printer size={15} />
              Certificats multiples
            </button>
          )}

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
