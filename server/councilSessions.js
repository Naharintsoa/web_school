import { randomUUID } from 'crypto';

// Stockage en mémoire des sessions de conseil de classe.
// Chaque session expire automatiquement après 4 heures.

const sessions = new Map();

export function createSession({ grade, term, schoolYear, students = [] }) {
  const id = randomUUID().replace(/-/g, '').slice(0, 12);
  const session = {
    id,
    grade,
    term,
    schoolYear,
    students,           // [{ id, firstName, lastName, matricule, avg }]
    currentStudentIndex: 0,
    participants: [],   // [{ id, name, role, joinedAt }]
    remarks: {},        // { [studentId]: [{ author, text, at }] }
    phase: 'waiting',   // 'waiting' | 'active' | 'closed'
    createdAt: new Date().toISOString(),
  };
  sessions.set(id, session);
  setTimeout(() => sessions.delete(id), 4 * 60 * 60 * 1000);
  return session;
}

export function getSession(id) {
  return sessions.get(id) ?? null;
}

export function deleteSession(id) {
  sessions.delete(id);
}

export { sessions };
