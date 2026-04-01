import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Student } from '../types/student';
import type { Grade } from '../types/grade';
import type { ArchivedStudent } from '../types/archive';
import type { ExamSubject, ExamFile } from '../types/exam';

interface CollegeSullyDB extends DBSchema {
  students: {
    key: string;
    value: Student;
    indexes: { 'by-grade': string };
  };
  grades: {
    key: string;
    value: Grade;
    indexes: { 'by-student': string };
  };
  archive: {
    key: string;
    value: ArchivedStudent;
  };
  examSubjects: {
    key: string;
    value: ExamSubject;
    indexes: { 'by-subject': string };
  };
  examFiles: {
    key: string;
    value: ExamFile;
  };
}

let db: IDBPDatabase<CollegeSullyDB>;

export async function initDB() {
  db = await openDB<CollegeSullyDB>('college-sully-db', 1, {
    upgrade(db) {
      // Students store
      const studentStore = db.createObjectStore('students', { keyPath: 'id' });
      studentStore.createIndex('by-grade', 'grade');

      // Grades store
      const gradesStore = db.createObjectStore('grades', { keyPath: 'id' });
      gradesStore.createIndex('by-student', 'studentId');

      // Archive store
      db.createObjectStore('archive', { keyPath: 'student.id' });

      // Exam subjects store
      const examSubjectsStore = db.createObjectStore('examSubjects', { keyPath: 'id' });
      examSubjectsStore.createIndex('by-subject', 'subjectId');

      // Exam files store
      db.createObjectStore('examFiles', { keyPath: 'id' });
    },
  });
}

// Generic CRUD operations
async function getAll<T>(storeName: keyof CollegeSullyDB): Promise<T[]> {
  await initDB();
  return db.getAll(storeName);
}

async function get<T>(storeName: keyof CollegeSullyDB, id: string): Promise<T | undefined> {
  await initDB();
  return db.get(storeName, id);
}

async function add<T>(storeName: keyof CollegeSullyDB, item: T): Promise<T> {
  await initDB();
  await db.add(storeName, item);
  return item;
}

async function put<T>(storeName: keyof CollegeSullyDB, item: T): Promise<T> {
  await initDB();
  await db.put(storeName, item);
  return item;
}

async function remove(storeName: keyof CollegeSullyDB, id: string): Promise<void> {
  await initDB();
  await db.delete(storeName, id);
}

// Export database operations
export const dbOperations = {
  students: {
    getAll: () => getAll<Student>('students'),
    get: (id: string) => get<Student>('students', id),
    add: (student: Student) => add('students', student),
    update: (student: Student) => put('students', student),
    delete: (id: string) => remove('students', id),
    getByGrade: async (grade: string) => {
      await initDB();
      return db.getAllFromIndex('students', 'by-grade', grade);
    },
  },

  grades: {
    getAll: () => getAll<Grade>('grades'),
    get: (id: string) => get<Grade>('grades', id),
    add: (grade: Grade) => add('grades', grade),
    update: (grade: Grade) => put('grades', grade),
    delete: (id: string) => remove('grades', id),
    getByStudent: async (studentId: string) => {
      await initDB();
      return db.getAllFromIndex('grades', 'by-student', studentId);
    },
  },

  archive: {
    getAll: () => getAll<ArchivedStudent>('archive'),
    add: (archived: ArchivedStudent) => add('archive', archived),
    delete: (id: string) => remove('archive', id),
  },

  examSubjects: {
    getAll: () => getAll<ExamSubject>('examSubjects'),
    get: (id: string) => get<ExamSubject>('examSubjects', id),
    add: (exam: ExamSubject) => add('examSubjects', exam),
    update: (exam: ExamSubject) => put('examSubjects', exam),
    delete: (id: string) => remove('examSubjects', id),
    getBySubject: async (subjectId: string) => {
      await initDB();
      return db.getAllFromIndex('examSubjects', 'by-subject', subjectId);
    },
  },

  examFiles: {
    getAll: () => getAll<ExamFile>('examFiles'),
    get: (id: string) => get<ExamFile>('examFiles', id),
    add: (file: ExamFile) => add('examFiles', file),
    update: (file: ExamFile) => put('examFiles', file),
    delete: (id: string) => remove('examFiles', id),
  },
};