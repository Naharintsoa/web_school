import { apiFetch } from './client';

export interface BulletinRemark {
  studentId: string;
  term: 1 | 2 | 3;
  observation: string;
  mention: string;
  absences: string;
  demiJournees: string;
  retards: string;
}

export const bulletinRemarksApi = {
  get: async (studentId: string, term: 1 | 2 | 3): Promise<BulletinRemark | null> => {
    return apiFetch<BulletinRemark | null>(`/bulletin-remarks/${studentId}/${term}`);
  },

  save: async (studentId: string, term: 1 | 2 | 3, data: Omit<BulletinRemark, 'studentId' | 'term'>): Promise<BulletinRemark> => {
    return apiFetch<BulletinRemark>(`/bulletin-remarks/${studentId}/${term}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
