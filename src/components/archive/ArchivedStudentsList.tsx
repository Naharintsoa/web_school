import React from 'react';
import { Search, RotateCcw, Clock } from 'lucide-react';
import type { ArchivedStudent } from '../../types/archive';

import { FR } from '../../constants/translations';

interface ArchivedStudentsListProps {
  archivedStudents: ArchivedStudent[];
  onRestore: (archivedStudent: ArchivedStudent) => void;
  onClose: () => void;
}

export function ArchivedStudentsList({ archivedStudents, onRestore, onClose }: ArchivedStudentsListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredStudents = archivedStudents.filter(({ student }) =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.matricule && student.matricule.includes(searchTerm))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {FR.archive.title}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={FR.archive.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((archived) => (
              <div key={archived.student.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">
                        N°{archived.student.studentNumber}
                      </span>
                      <span className="text-sm text-gray-500">
                        {archived.student.matricule ? archived.student.matricule : '-'}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mt-1">
                      {archived.student.firstName} {archived.student.lastName}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {new Date(archived.archivedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => onRestore(archived)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    <RotateCcw size={14} className="mr-1" />
                    {FR.archive.restore}
                  </button>
                </div>
                {archived.reason && (
                  <p className="mt-2 text-sm text-gray-500">
                    {FR.archive.reason}: {archived.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}