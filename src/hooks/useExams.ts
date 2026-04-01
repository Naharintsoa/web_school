import { useState, useEffect } from 'react';
import type { ExamSubject } from '../types/exam';
import { examApi } from '../services/examApi';

export function useExams(subjectId: string) {
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, [subjectId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await examApi.getBySubject(subjectId);
      setExamSubjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const uploadExam = async (examData: Omit<ExamSubject, 'id'>, file: File) => {
    try {
      const newExam = await examApi.create(examData, file);
      setExamSubjects(prev => [...prev, newExam]);
      return newExam;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
      throw err;
    }
  };

  const deleteExam = async (examId: string) => {
    try {
      await examApi.delete(examId);
      setExamSubjects(prev => prev.filter(exam => exam.id !== examId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    }
  };

  const downloadExam = async (examId: string) => {
    try {
      return await examApi.download(examId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement');
      throw err;
    }
  };

  return {
    examSubjects,
    loading,
    error,
    uploadExam,
    deleteExam,
    downloadExam,
    refresh: loadExams,
  };
}