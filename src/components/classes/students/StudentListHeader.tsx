import React from 'react';
import { GraduationCap } from 'lucide-react';
import { FR } from '../../../constants/translations';

interface StudentListHeaderProps {
  grade: string;
  onClose: () => void;
  onShowArchive: () => void;
}

export function StudentListHeader({ grade, onClose, onShowArchive }: StudentListHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            {FR.classes.studentsInGrade.replace('{grade}', grade)}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onShowArchive}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {FR.archive.title}
          </button>
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