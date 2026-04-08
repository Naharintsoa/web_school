import { Hash, FileCheck, FileX, Edit2, Trash2 } from 'lucide-react';
import type { Student } from '../../../types/student';

import { FR } from '../../../constants/translations';

interface StudentListTableProps {
  students: Student[];
  onSelect: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onCertificateClick: (student: Student, type: 'scolarite' | 'radiation') => void;
  // Multi-sélection (optionnel)
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function StudentListTable({
  students,
  onSelect,
  onEdit,
  onDelete,
  onCertificateClick,
  multiSelect = false,
  selectedIds = new Set(),
  onToggleSelect,
}: StudentListTableProps) {
  if (students.length === 0) {
    return <p className="text-center text-gray-500">{FR.common.noResults}</p>;
  }

  return (
    <div className="divide-y divide-gray-200">
      {students.map((student) => (
        <div
          key={student.id}
          className={`py-4 hover:bg-gray-50 ${multiSelect && selectedIds.has(student.id) ? 'bg-indigo-50' : ''}`}
        >
          <div className="flex justify-between items-start">
            {/* Case à cocher en mode multi-sélection */}
            {multiSelect && (
              <div className="flex items-center pr-3 pt-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(student.id)}
                  onChange={() => onToggleSelect?.(student.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                />
              </div>
            )}

            <div
              className="flex-1 cursor-pointer"
              onClick={() => multiSelect ? onToggleSelect?.(student.id) : onSelect(student)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">
                  N°{student.studentNumber}
                </span>
                <div className="flex items-center text-gray-600">
                  <Hash size={16} className="mr-1" />
                  <span className="text-sm font-medium">
                    {student.matricule ? student.matricule : '-'}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-1">
                {student.firstName} {student.lastName}
              </h3>
              <p className="text-sm text-gray-500">
                {FR.students.dateOfBirth}: {new Date(student.dateOfBirth).toLocaleDateString()}
              </p>
            </div>

            {/* Actions — masquées en mode multi-sélection */}
            {!multiSelect && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(student)}
                  className="p-1 text-gray-500 hover:text-indigo-600"
                  title={FR.common.edit}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => onDelete(student)}
                  className="p-1 text-gray-500 hover:text-red-600"
                  title={FR.common.delete}
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => onCertificateClick(student, 'scolarite')}
                  className="p-1 text-gray-500 hover:text-indigo-600"
                  title={FR.certificates.schooling}
                >
                  <FileCheck size={18} />
                </button>
                <button
                  onClick={() => onCertificateClick(student, 'radiation')}
                  className="p-1 text-gray-500 hover:text-red-600"
                  title={FR.certificates.removal}
                >
                  <FileX size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
