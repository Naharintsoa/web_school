import React, { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import type { Student } from '../../types';
import { BadgePreview } from './BadgePreview';
import { FR } from '../../constants/translations';

interface BadgeGenerationModalProps {
  students: Student[];
  onClose: () => void;
}

export function BadgeGenerationModal({ students, onClose }: BadgeGenerationModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [showPreview, setShowPreview] = useState(false);
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

  const handleGenerateBadges = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowPreview(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (showPreview) {
    return (
      <BadgePreview
        students={selectedStudents.length > 0 ? selectedStudents : students}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Génération des badges
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher des élèves..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === students.length}
                    onChange={(e) => {
                      setSelectedStudents(e.target.checked ? students : []);
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sélectionner tous les élèves</span>
                </label>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="py-4 flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.some(s => s.id === student.id)}
                      onChange={(e) => {
                        setSelectedStudents(prev =>
                          e.target.checked
                            ? [...prev, student]
                            : prev.filter(s => s.id !== student.id)
                        );
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Classe: {student.grade} | N° {student.studentNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleGenerateBadges}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isLoading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    'Générer les badges'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}