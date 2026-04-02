/**
 * Liste principale des élèves avec recherche, ajout, édition et suppression.
 * La suppression archive d'abord l'élève avant de le retirer de la liste active.
 */
import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Hash, Archive, Loader2 } from 'lucide-react';
import type { Student, Grade } from '../../types';
import type { ArchivedStudent } from '../../types/archive';
import { ClassSelectionModal } from './ClassSelectionModal';
import { StudentDetailsModal } from './StudentDetailsModal';
import { StudentForm } from './StudentForm';
import { ArchivedStudentsList } from '../archive/ArchivedStudentsList';
import { formatMatricule } from '../../utils/matricule';
import { studentApi } from '../../services/api';
import { archiveApi } from '../../services/archiveApi';
import { useToast } from '../../contexts/ToastContext';
import { FR } from '../../constants/translations';

export function StudentList() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
    loadArchivedStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await studentApi.getAll();
      setStudents(data);
    } catch {
      showToast('Erreur lors du chargement des élèves', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadArchivedStudents = async () => {
    try {
      const data = await archiveApi.getAll();
      setArchivedStudents(data);
    } catch {
      // Silencieux — les archives sont optionnelles
    }
  };

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.matricule && student.matricule.includes(searchTerm))
  );

  const handleAddStudent = () => setShowClassSelection(true);

  const handleClassSelect = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowClassSelection(false);
    setShowStudentForm(true);
  };

  const handleStudentSubmit = async (studentData: Omit<Student, 'id'>) => {
    try {
      await studentApi.create(studentData);
      await loadStudents();
      setShowStudentForm(false);
      setSelectedGrade(null);
      showToast('Élève ajouté avec succès', 'success');
    } catch {
      showToast("Erreur lors de la création de l'élève", 'error');
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
  };

  /**
   * Suppression avec archivage préalable.
   * Accepte un objet Student complet (compatible avec StudentDetailsModal.onDelete).
   */
  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(FR.archive.confirmDelete)) return;

    try {
      // 1. Archiver l'élève pour permettre une restauration future
      await archiveApi.archiveStudent(student, 'Supprimé depuis la liste');
      // 2. Supprimer de la liste active
      await studentApi.delete(student.id);
      await loadStudents();
      await loadArchivedStudents();
      // Fermer le modal de détails si ouvert
      if (selectedStudent?.id === student.id) setSelectedStudent(null);
      showToast(FR.archive.deleteSuccess, 'success');
    } catch {
      showToast("Erreur lors de la suppression de l'élève", 'error');
    }
  };

  const handleRestoreStudent = async (archived: ArchivedStudent) => {
    if (!window.confirm(FR.archive.confirmRestore)) return;
    try {
      const restored = await archiveApi.restoreStudent(archived);
      await studentApi.create(restored);
      await loadStudents();
      await loadArchivedStudents();
      showToast(FR.archive.restoreSuccess, 'success');
    } catch {
      showToast("Erreur lors de la restauration", 'error');
    }
  };

  const handleCloseDetails = () => {
    setSelectedStudent(null);
    loadStudents();
  };

  // Affichage du formulaire d'ajout (pleine page)
  if (showStudentForm && selectedGrade) {
    return (
      <StudentForm
        initialGrade={selectedGrade}
        onSubmit={handleStudentSubmit}
        onCancel={() => {
          setShowStudentForm(false);
          setSelectedGrade(null);
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* En-tête */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{FR.students.title}</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Bouton archives avec badge compteur */}
            <button
              onClick={() => setShowArchive(true)}
              className="relative flex items-center space-x-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Voir les archives"
            >
              <Archive size={18} />
              <span className="hidden sm:inline text-sm">Archives</span>
              {archivedStudents.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {archivedStudents.length}
                </span>
              )}
            </button>
            <button
              onClick={handleAddStudent}
              className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              <span>{FR.students.addStudent}</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
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

      {/* Tableau des élèves */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={32} className="animate-spin mr-3" />
            <span>Chargement des élèves…</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search size={48} className="mb-4 opacity-30" />
            <p className="text-lg">{FR.common.noResults}</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{FR.students.matricule}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{FR.students.name}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{FR.students.grade}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{FR.students.parent}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{FR.students.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.studentNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Hash size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {student.matricule ? formatMatricule(student.matricule) : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {/* Avatar avec initiales */}
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.parentInfo.fatherName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditStudent(student)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded hover:bg-indigo-50"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Supprimer (archivé)"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Compteur en bas de tableau */}
      {!isLoading && filteredStudents.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
          {filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''}
          {searchTerm && ` trouvé${filteredStudents.length > 1 ? 's' : ''}`}
        </div>
      )}

      {/* Modals */}
      {showClassSelection && (
        <ClassSelectionModal
          onSelect={handleClassSelect}
          onClose={() => setShowClassSelection(false)}
        />
      )}

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          allStudents={students}
          onClose={handleCloseDetails}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
        />
      )}

      {showArchive && (
        <ArchivedStudentsList
          archivedStudents={archivedStudents}
          onRestore={handleRestoreStudent}
          onClose={() => setShowArchive(false)}
        />
      )}
    </div>
  );
}
