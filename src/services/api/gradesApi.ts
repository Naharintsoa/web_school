/**
 * API pour la gestion des notes.
 */
import { apiFetch } from './client';
import type { Grade } from '../../types';

export const gradesApi = {
  /** Récupère toutes les notes */
  getAll: async (): Promise<Grade[]> => {
    return apiFetch<Grade[]>('/grades');
  },

  /** Récupère toutes les notes d'un élève */
  getByStudent: async (studentId: string): Promise<Grade[]> => {
    return apiFetch<Grade[]>(`/grades/student/${studentId}`);
  },

  /** Sauvegarde ou met à jour une note (upsert) */
  update: async (grade: Grade): Promise<Grade> => {
    return apiFetch<Grade>('/grades', {
      method: 'POST',
      body: JSON.stringify(grade),
    });
  },

  /**
   * Supprime une note spécifique (utilisé quand le champ est vidé).
   * Identifié par l'élève + la matière + le trimestre.
   */
  deleteByCompositeKey: async (studentId: string, subjectId: string, term: 1 | 2 | 3): Promise<void> => {
    const params = new URLSearchParams({
      studentId,
      subjectId,
      term: String(term),
    });
    return apiFetch<void>(`/grades?${params.toString()}`, { method: 'DELETE' });
  },
};
