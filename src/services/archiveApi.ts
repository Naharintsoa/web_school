import type { ArchivedStudent } from '../types/archive';
import type { Student } from '../types/student';
import { storageService } from './storage/storage-service';

export const archiveApi = {
  getAll: async () => {
    try {
      return await storageService.archive.get();
    } catch (error) {
      console.error('Failed to get archived students:', error);
      throw new Error('Failed to get archived students');
    }
  },

  archiveStudent: async (student: Student, reason?: string) => {
    try {
      const archivedStudent: ArchivedStudent = {
        student,
        archivedAt: new Date().toISOString(),
        reason,
      };

      const archivedStudents = await storageService.archive.get();
      await storageService.archive.save([...archivedStudents, archivedStudent]);
      return archivedStudent;
    } catch (error) {
      console.error('Failed to archive student:', error);
      throw new Error('Failed to archive student');
    }
  },

  restoreStudent: async (archivedStudent: ArchivedStudent) => {
    try {
      const archivedStudents = await storageService.archive.get();
      await storageService.archive.save(
        archivedStudents.filter((s) => s.student.id !== archivedStudent.student.id)
      );
      return archivedStudent.student;
    } catch (error) {
      console.error('Failed to restore student:', error);
      throw new Error('Failed to restore student');
    }
  },
};