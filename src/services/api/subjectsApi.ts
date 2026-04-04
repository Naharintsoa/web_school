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
  getAll: async (): Promise<Subject[]> => {
    return apiFetch<Subject[]>('/subjects');
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

  subscribe,
};
