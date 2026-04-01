import { dbOperations } from './db';
import type { Student } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'college-sully-students',
  GRADES: 'college-sully-grades',
  ARCHIVE: 'college-sully-archive',
};

// Helper to handle both IndexedDB and localStorage
async function saveData<T>(key: string, data: T[], dbOperation: (data: T) => Promise<T>) {
  // Save to IndexedDB
  await Promise.all(data.map(item => dbOperation(item)));
  
  // Save to localStorage as backup
  localStorage.setItem(key, JSON.stringify(data));
}

async function getData<T>(key: string, dbGetAll: () => Promise<T[]>): Promise<T[]> {
  try {
    // Try to get from IndexedDB first
    const dbData = await dbGetAll();
    if (dbData.length > 0) {
      return dbData;
    }

    // If no data in IndexedDB, try localStorage
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsedData = JSON.parse(localData);
      // Sync localStorage data to IndexedDB
      await Promise.all(parsedData.map((item: T) => dbOperations.students.add(item as any)));
      return parsedData;
    }

    return [];
  } catch (error) {
    console.error('Error getting data:', error);
    // Fallback to localStorage
    const localData = localStorage.getItem(key);
    return localData ? JSON.parse(localData) : [];
  }
}

export const storage = {
  // Students
  saveStudents: async (students: Student[]) => {
    await saveData(STORAGE_KEYS.STUDENTS, students, dbOperations.students.add);
  },

  getStudents: async () => {
    return getData(STORAGE_KEYS.STUDENTS, dbOperations.students.getAll);
  },

  // Grades
  saveGrades: async (grades: any[]) => {
    await saveData(STORAGE_KEYS.GRADES, grades, dbOperations.grades.add);
  },

  getGrades: async () => {
    return getData(STORAGE_KEYS.GRADES, dbOperations.grades.getAll);
  },

  // Archive
  saveArchive: async (archive: any[]) => {
    await saveData(STORAGE_KEYS.ARCHIVE, archive, dbOperations.archive.add);
  },

  getArchive: async () => {
    return getData(STORAGE_KEYS.ARCHIVE, dbOperations.archive.getAll);
  },
};