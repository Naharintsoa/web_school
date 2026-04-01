import React from 'react';
import type { Grade } from '../../types';
import { FR } from '../../constants/translations';

interface ClassSelectionModalProps {
  onSelect: (grade: Grade) => void;
  onClose: () => void;
}

const PRIMARY_GRADES: Grade[] = ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];
const COLLEGE_GRADES: Grade[] = ['6EME', '5EME', '4EME', '3EME'];

export function ClassSelectionModal({ onSelect, onClose }: ClassSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {FR.students.selectClass}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* École Primaire */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {FR.classes.primarySchool}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PRIMARY_GRADES.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => onSelect(grade)}
                    className="p-4 text-center border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <span className="text-lg font-medium text-gray-900">{grade}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Collège */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {FR.classes.college}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {COLLEGE_GRADES.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => onSelect(grade)}
                    className="p-4 text-center border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <span className="text-lg font-medium text-gray-900">{grade}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}