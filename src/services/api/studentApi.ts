import { apiFetch } from './client';
import type { Student } from '../../types';

export const studentApi = {
  getAll: async (year?: string, school?: string): Promise<Student[]> => {
    const params = new URLSearchParams();
    if (year)   params.set('year',   year);
    if (school) params.set('school', school);
    const qs = params.toString();
    return apiFetch<Student[]>(qs ? `/students?${qs}` : '/students');
  },

  getById: async (id: string): Promise<Student> => {
    return apiFetch<Student>(`/students/${id}`);
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

  promote: async (payload: {
    fromYear: string;
    toYear: string;
    decisions: { studentId: string; decision: 'promoted' | 'repeat' | 'skip' }[];
  }): Promise<{ promoted: number; repeated: number; skipped: number; errors: string[] }> => {
    return apiFetch('/students/promote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
