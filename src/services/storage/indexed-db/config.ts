import { openDB } from "idb";
import type { CollegeSullyDB } from './schema';

let db: IDBPDatabase<CollegeSullyDB>;

export async function initDB() {
  if (db) return db;

  try {
    db = await openDB<CollegeSullyDB>('college-sully-db', 1, {
      upgrade(db) {
        // Students store
        if (!db.objectStoreNames.contains('students')) {
          const studentStore = db.createObjectStore('students', { keyPath: 'id' });
          studentStore.createIndex('by-grade', 'grade');
        }

        // Grades store
        if (!db.objectStoreNames.contains('grades')) {
          const gradesStore = db.createObjectStore('grades', { keyPath: 'id' });
          gradesStore.createIndex('by-student', 'studentId');
        }

        // Archive store
        if (!db.objectStoreNames.contains('archive')) {
          db.createObjectStore('archive', { keyPath: 'student.id' });
        }

        // Exam subjects store
        if (!db.objectStoreNames.contains('examSubjects')) {
          const examSubjectsStore = db.createObjectStore('examSubjects', { keyPath: 'id' });
          examSubjectsStore.createIndex('by-subject', 'subjectId');
        }

        // Exam files store
        if (!db.objectStoreNames.contains('examFiles')) {
          db.createObjectStore('examFiles', { keyPath: 'id' });
        }
      },
    });

    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw new Error('Failed to initialize database');
  }
}