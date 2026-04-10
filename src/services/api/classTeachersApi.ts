import { apiFetch } from './client';

export const classTeachersApi = {
  get: async (school: string, grade: string): Promise<string> => {
    const data = await apiFetch<{ teacherName: string }>(
      `/class-teachers?school=${encodeURIComponent(school)}&grade=${encodeURIComponent(grade)}`
    );
    return data.teacherName ?? '';
  },

  update: async (school: string, grade: string, teacherName: string): Promise<void> => {
    await apiFetch(`/class-teachers/${encodeURIComponent(school)}/${encodeURIComponent(grade)}`, {
      method: 'PUT',
      body: JSON.stringify({ teacherName }),
    });
  },
};
