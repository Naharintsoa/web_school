/**
 * API matières — stockage PostgreSQL via HTTP.
 * Les coefficients et noms de professeurs sont ainsi partagés
 * entre tous les navigateurs et utilisateurs.
 */
import type { Subject } from '../../types';
import { apiFetch } from './client';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach(fn => fn());
}

function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const subjectsApi = {
  /**
   * Récupère les matières.
   * @param school  Établissement ('sully' | 'sully-annexe')
   * @param grade   Classe (ex: '3EME'). Quand fourni, retourne UNE ligne par matière
   *                avec le professeur spécifique à cette classe (ou le fallback générique).
   */
  getAll: async (school?: string, grade?: string): Promise<Subject[]> => {
    const params = new URLSearchParams();
    if (school) params.set('school', school);
    if (grade)  params.set('grade',  grade);
    const qs = params.toString();
    return apiFetch<Subject[]>(qs ? `/subjects?${qs}` : '/subjects');
  },

  create: async (subject: Omit<Subject, 'id'>): Promise<Subject> => {
    const result = await apiFetch<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(subject),
    });
    notify();
    return result;
  },

  update: async (id: string, subject: Omit<Subject, 'id'>): Promise<Subject> => {
    const result = await apiFetch<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subject),
    });
    notify();
    return result;
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/subjects/${id}`, { method: 'DELETE' });
    notify();
  },

  /**
   * Sauvegarde l'ordre d'affichage des matières dans le bulletin.
   * @param ids tableau des IDs dans l'ordre souhaité (index 0 = 1ère ligne)
   */
  reorder: async (ids: string[]): Promise<void> => {
    await apiFetch<void>('/subjects/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    });
    notify();
  },

  subscribe,
};
