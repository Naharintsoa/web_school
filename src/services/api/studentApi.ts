import { storageService } from '../storage/storage-service';
import type { Student } from '../../types';

export const studentApi = {
  getAll: async () => {
    try {
      return await storageService.students.get();
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  },
  
  create: async (student: Omit<Student, 'id'>) => {
    try {
      const newStudent = { ...student, id: Math.random().toString(36).substr(2, 9) };
      const students = await storageService.students.get();
      await storageService.students.save([...students, newStudent]);
      return newStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },
  
  update: async (id: string, student: Omit<Student, 'id'>) => {
    try {
      const students = await storageService.students.get();
      const updatedStudents = students.map(s => s.id === id ? { ...student, id } : s);
      await storageService.students.save(updatedStudents);
      return { ...student, id };
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const students = await storageService.students.get();
      const filteredStudents = students.filter(s => s.id !== id);
      await storageService.students.save(filteredStudents);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }
};