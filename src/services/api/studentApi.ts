import { apiFetch } from './client';
import type { Student } from '../../types';

export const studentApi = {
  getAll: async (): Promise<Student[]> => {
    return apiFetch<Student[]>('/students');
  },

  create: async (student: Omit<Student, 'id'>): Promise<Student> => {
    return apiFetch<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  },

  update: async (id: string, student: Omit<Student, 'id'>): Promise<Student> => {
    return apiFetch<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/students/${id}`, { method: 'DELETE' });
  },

  getSiblings: async (familyId: string): Promise<Student[]> => {
    return apiFetch<Student[]>(`/students/family/${encodeURIComponent(familyId)}`);
  },

  updateFamily: async (id: string, familyId: string | null): Promise<Student> => {
    return apiFetch<Student>(`/students/${id}/family`, {
      method: 'PATCH',
      body: JSON.stringify({ familyId }),
    });
  },
};
