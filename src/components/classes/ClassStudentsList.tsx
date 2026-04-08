import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Student } from '../../types/student';
import { StudentDetailsModal } from '../students/StudentDetailsModal';
import { ArchivedStudentsList } from '../archive/ArchivedStudentsList';
import { CertificateModal } from './certificates/CertificateModal';
import { CertificateMultiPrint } from './certificates/CertificateMultiPrint';
import { StudentListHeader } from './students/StudentListHeader';
import { StudentListTable } from './students/StudentListTable';
import { useStudentOperations } from '../../hooks/useStudentOperations';
import { FR } from '../../constants/translations';

interface ClassStudentsListProps {
  grade: string;
  students: Student[];
  onClose: () => void;
  onStudentsChange: () => void;
}

export function ClassStudentsList({ grade, students, onClose, onStudentsChange }: ClassStudentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateType, setCertificateType] = useState<'scolarite' | 'radiation' | null>(null);
  const [selectedStudentForCertificate, setSelectedStudentForCertificate] = useState<Student | null>(null);

  // Multi-sélection pour impression groupée
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);

  const {
    currentStudents,
    archivedStudents,
    handleDelete,
    handleRestore,
    loadArchivedStudents
  } = useStudentOperations(students, grade, onStudentsChange);

  useEffect(() => {
    loadArchivedStudents();
  }, []);

  const filteredStudents = currentStudents.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.matricule && student.matricule.includes(searchTerm))
  );

  const handleCertificateClick = (student: Student, type: 'scolarite' | 'radiation') => {
    setSelectedStudentForCertificate(student);
    setCertificateType(type);
    setShowCertificateModal(true);
  };

  const toggleMultiSelect = () => {
    setMultiSelectMode(m => !m);
    setSelectedIds(new Set());
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePrintSelected = () => {
    if (selectedIds.size === 0) return;
    setPrinting(true);
  };

  const selectedStudents = filteredStudents.filter(s => selectedIds.has(s.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <StudentListHeader
          grade={grade}
          onClose={onClose}
          onShowArchive={() => setShowArchive(true)}
          multiSelectMode={multiSelectMode}
          selectedCount={selectedIds.size}
          onToggleMultiSelect={toggleMultiSelect}
          onPrintSelected={handlePrintSelected}
        />

        <div className="p-6 border-b border-gray-200">
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

          {/* Barre de sélection globale en mode multi */}
          {multiSelectMode && (
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={filteredStudents.length > 0 && selectedIds.size === filteredStudents.length}
                onChange={() => {
                  if (selectedIds.size === filteredStudents.length) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(filteredStudents.map(s => s.id)));
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600"
              />
              <span>Tout sélectionner ({filteredStudents.length} élèves)</span>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <StudentListTable
            students={filteredStudents}
            onSelect={setSelectedStudent}
            onEdit={setSelectedStudent}
            onDelete={handleDelete}
            onCertificateClick={handleCertificateClick}
            multiSelect={multiSelectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleOne}
          />
        </div>
      </div>

      {selectedStudent && !multiSelectMode && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={s => setSelectedStudent(s)}
          onDelete={handleDelete}
        />
      )}

      {showArchive && (
        <ArchivedStudentsList
          archivedStudents={archivedStudents}
          onRestore={handleRestore}
          onClose={() => setShowArchive(false)}
        />
      )}

      {showCertificateModal && certificateType && selectedStudentForCertificate && (
        <CertificateModal
          type={certificateType}
          grade={grade}
          students={[selectedStudentForCertificate]}
          onClose={() => {
            setShowCertificateModal(false);
            setCertificateType(null);
            setSelectedStudentForCertificate(null);
          }}
        />
      )}

      {printing && (
        <CertificateMultiPrint
          students={selectedStudents}
          type="scolarite"
          onDone={() => {
            setPrinting(false);
            setMultiSelectMode(false);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}
