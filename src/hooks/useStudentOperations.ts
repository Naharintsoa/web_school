import { useState, useEffect, useCallback } from 'react';
import type { Student } from '../types/student';
import type { ArchivedStudent } from '../types/archive';
import { studentApi } from '../services/api';
import { archiveApi } from '../services/archiveApi';
import { FR } from '../constants/translations';

export function useStudentOperations(
  initialStudents: Student[],
  grade: string,
  onStudentsChange: () => void
) {
  const [currentStudents, setCurrentStudents] = useState<Student[]>(initialStudents);
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    setCurrentStudents(initialStudents);
  }, [initialStudents]);

  const loadArchivedStudents = useCallback(async () => {
    try {
      const archived = await archiveApi.getAll();
      setArchivedStudents(archived);
    } catch (error) {
      console.error('Error loading archived students:', error);
    }
  }, []);

  /**
   * Ouvre ou ferme le formulaire d'édition.
   * Passer null pour fermer le modal sans sauvegarder.
   */
  const handleEdit = (student: Student | null) => {
    setEditingStudent(student);
  };

  const handleSaveEdit = async (updatedStudent: Omit<Student, 'id'>) => {
    if (!editingStudent) return false;

    setIsLoading(true);
    try {
      const updated = await studentApi.update(editingStudent.id, updatedStudent);
      setCurrentStudents(prev => 
        prev.map(s => s.id === editingStudent.id ? updated : s)
      );
      setEditingStudent(null);
      onStudentsChange();
      return true;
    } catch (error) {
      console.error('Error updating student:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!window.confirm(FR.archive.confirmDelete)) {
      return false;
    }

    setIsLoading(true);
    try {
      // Archive first
      await archiveApi.archiveStudent(student, 'Supprimé de la classe');
      await loadArchivedStudents();

      // Then delete
      await studentApi.delete(student.id);
      setCurrentStudents(prev => prev.filter(s => s.id !== student.id));
      
      onStudentsChange();
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (archivedStudent: ArchivedStudent) => {
    if (!window.confirm(FR.archive.confirmRestore)) {
      return false;
    }

    setIsLoading(true);
    try {
      const restored = await archiveApi.restoreStudent(archivedStudent);
      const createdStudent = await studentApi.create(restored);
      
      if (restored.grade === grade) {
        setCurrentStudents(prev => [...prev, createdStudent]);
      }
      
      await loadArchivedStudents();
      onStudentsChange();
      return true;
    } catch (error) {
      console.error('Error restoring student:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentStudents,
    archivedStudents,
    isLoading,
    editingStudent,
    handleEdit,
    handleSaveEdit,
    handleDelete,
    handleRestore,
    loadArchivedStudents
  };
}