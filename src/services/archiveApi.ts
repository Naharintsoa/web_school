import { apiFetch } from './api/client';
import type { ArchivedStudent } from '../types/archive';
import type { Student } from '../types/student';

export const archiveApi = {
  getAll: async (): Promise<ArchivedStudent[]> => {
    return apiFetch<ArchivedStudent[]>('/archive');
  },

  archiveStudent: async (student: Student, reason?: string): Promise<ArchivedStudent> => {
    return apiFetch<ArchivedStudent>('/archive', {
      method: 'POST',
      body: JSON.stringify({ student, reason }),
    });
  },

  restoreStudent: async (archivedStudent: ArchivedStudent): Promise<Student> => {
    await apiFetch<void>(`/archive/${archivedStudent.student.id}`, { method: 'DELETE' });
    return archivedStudent.student;
  },
};
