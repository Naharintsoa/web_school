/**
 * API pour la gestion des matières.
 * Stockage dans localStorage avec notification des abonnés
 * à chaque modification (ajout, modification, suppression).
 *
 * Les composants peuvent s'abonner via subjectsApi.subscribe()
 * pour être notifiés immédiatement sans avoir à poller.
 */
import type { Subject } from '../../types';
import { SUBJECTS as DEFAULT_SUBJECTS } from '../../data/subjects';
import { TEACHERS } from '../../data/teachers';

const STORAGE_KEY = 'college-sully-subjects';

// ─── Abonnés (pattern Observer) ───────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

/** S'abonner aux modifications des matières. Retourne la fonction de désabonnement. */
function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Notifier tous les abonnés */
function notify(): void {
  listeners.forEach(fn => fn());
}

// ─── Persistence ──────────────────────────────────────────────────────────────

/** Charge les matières depuis localStorage, ou retourne les valeurs par défaut */
function loadSubjects(): Subject[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignorer les erreurs de parsing
  }
  // Première utilisation : construire depuis les données statiques avec noms des profs
  return DEFAULT_SUBJECTS.map(s => {
    const teacher = TEACHERS.find(t => t.id === s.teacherId);
    return {
      id: s.id,
      name: s.name,
      coefficient: s.coefficient,
      teacherName: teacher?.name ?? '',
    };
  });
}

function saveSubjects(subjects: Subject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  notify();
}

// ─── API publique ─────────────────────────────────────────────────────────────

export const subjectsApi = {
  /** Récupère toutes les matières */
  getAll: (): Promise<Subject[]> => Promise.resolve(loadSubjects()),

  /** Crée une nouvelle matière */
  create: (subject: Omit<Subject, 'id'>): Promise<Subject> => {
    const subjects = loadSubjects();
    const newSubject: Subject = {
      ...subject,
      id: `subj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    saveSubjects([...subjects, newSubject]);
    return Promise.resolve(newSubject);
  },

  /** Modifie une matière existante */
  update: (id: string, subject: Omit<Subject, 'id'>): Promise<Subject> => {
    const subjects = loadSubjects();
    const updated: Subject = { ...subject, id };
    saveSubjects(subjects.map(s => s.id === id ? updated : s));
    return Promise.resolve(updated);
  },

  /** Supprime une matière */
  delete: (id: string): Promise<void> => {
    saveSubjects(loadSubjects().filter(s => s.id !== id));
    return Promise.resolve();
  },

  /** S'abonner aux modifications. Retourne une fonction de désabonnement. */
  subscribe,
};
