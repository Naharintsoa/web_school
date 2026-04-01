import React, { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import type { Student } from '../../../types';
import { FR } from '../../../constants/translations';
import { CertificatePreview } from './CertificatePreview';

interface CertificateModalProps {
  type: 'scolarite' | 'radiation';
  grade: string;
  students: Student[];
  onClose: () => void;
}

export function CertificateModal({ type, grade, students, onClose }: CertificateModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);

  useEffect(() => {
    setFilteredStudents(
      students.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, students]);

  const handleGenerateCertificate = async (student: Student) => {
    setIsLoading(true);
    try {
      // Simuler un délai de chargement pour une meilleure UX
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedStudent(student);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedStudent) {
    return (
      <CertificatePreview
        type={type}
        student={selectedStudent}
        onClose={() => {
          setSelectedStudent(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {type === 'scolarite' ? FR.certificates.schooling : FR.certificates.removal} - {grade}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={FR.students.searchStudents}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <div key={student.id} className="py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {FR.students.parent}: {student.parentInfo.fatherName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateCertificate(student)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isLoading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {FR.certificates.generate}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">{FR.common.noResults}</p>
          )}
        </div>
      </div>
    </div>
  );
}