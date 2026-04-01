import { STORAGE_KEYS } from './constants';
import { localStorage } from './local-storage';
import { studentStore, gradeStore, archiveStore } from './indexed-db/stores';
import type { Student } from '../../types/student';
import type { Grade } from '../../types/grade';
import type { ArchivedStudent } from '../../types/archive';

class StorageService {
  private async syncStorage<T extends { id: string }>(
    key: string,
    data: T[],
    store: typeof studentStore | typeof gradeStore | typeof archiveStore
  ): Promise<void> {
    try {
      // Clear existing data
      await store.clear();
      
      // Save new data
      const savePromises = data.map(item => store.add(item));
      await Promise.all(savePromises);
      
      // Update localStorage as backup
      localStorage.setData(key, data);
    } catch (error) {
      console.error('Error syncing storage:', error);
      // Fallback to localStorage only
      localStorage.setData(key, data);
    }
  }

  private async getData<T extends { id: string }>(
    key: string,
    store: typeof studentStore | typeof gradeStore | typeof archiveStore
  ): Promise<T[]> {
    try {
      // Try IndexedDB first
      const dbData = await store.getAll();
      if (dbData.length > 0) {
        return dbData as T[];
      }

      // If no IndexedDB data, try localStorage
      const localData = localStorage.getData<T>(key);
      if (localData.length > 0) {
        // Sync to IndexedDB
        await this.syncStorage(key, localData, store);
        return localData;
      }

      return [];
    } catch (error) {
      console.error('Error getting data:', error);
      // Fallback to localStorage
      return localStorage.getData<T>(key);
    }
  }

  readonly students = {
    save: async (students: Student[]) => {
      await this.syncStorage(STORAGE_KEYS.STUDENTS, students, studentStore);
    },
    get: async () => {
      return this.getData<Student>(STORAGE_KEYS.STUDENTS, studentStore);
    },
    delete: async (id: string) => {
      try {
        await studentStore.delete(id);
        const students = await this.getData<Student>(STORAGE_KEYS.STUDENTS, studentStore);
        const updatedStudents = students.filter(s => s.id !== id);
        await this.syncStorage(STORAGE_KEYS.STUDENTS, updatedStudents, studentStore);
      } catch (error) {
        console.error('Error deleting student:', error);
        throw error;
      }
    }
  };

  readonly grades = {
    save: async (grades: Grade[]) => {
      await this.syncStorage(STORAGE_KEYS.GRADES, grades, gradeStore);
    },
    get: async () => {
      return this.getData<Grade>(STORAGE_KEYS.GRADES, gradeStore);
    }
  };

  readonly archive = {
    save: async (archive: ArchivedStudent[]) => {
      await this.syncStorage(STORAGE_KEYS.ARCHIVE, archive, archiveStore);
    },
    get: async () => {
      return this.getData<ArchivedStudent>(STORAGE_KEYS.ARCHIVE, archiveStore);
    }
  };
}

export const storageService = new StorageService();