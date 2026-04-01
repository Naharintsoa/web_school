import type { ExamSubject, ExamFile } from '../types/exam';

const STORAGE_KEYS = {
  EXAM_SUBJECTS: 'college-sully-exam-subjects',
  EXAM_FILES: 'college-sully-exam-files',
};

export const examStorage = {
  // Sujets d'examens
  saveExamSubjects: (examSubjects: ExamSubject[]) => {
    localStorage.setItem(STORAGE_KEYS.EXAM_SUBJECTS, JSON.stringify(examSubjects));
  },

  getExamSubjects: (): ExamSubject[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXAM_SUBJECTS);
    return data ? JSON.parse(data) : [];
  },

  // Fichiers d'examens
  saveExamFiles: (examFiles: ExamFile[]) => {
    localStorage.setItem(STORAGE_KEYS.EXAM_FILES, JSON.stringify(examFiles));
  },

  getExamFiles: (): ExamFile[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXAM_FILES);
    return data ? JSON.parse(data) : [];
  },
};