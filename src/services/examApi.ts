import type { ExamSubject, ExamFile } from '../types/exam';
import { examStorage } from './examStorage';

let examSubjects = examStorage.getExamSubjects();
let examFiles = examStorage.getExamFiles();

export const examApi = {
  // Récupérer tous les sujets d'une matière
  getBySubject: (subjectId: string) => 
    Promise.resolve(examSubjects.filter(exam => exam.subjectId === subjectId)),

  // Récupérer les sujets par trimestre
  getByTerm: (subjectId: string, term: 1 | 2 | 3) =>
    Promise.resolve(
      examSubjects.filter(exam => 
        exam.subjectId === subjectId && exam.term === term
      )
    ),

  // Ajouter un nouveau sujet
  create: async (examSubject: Omit<ExamSubject, 'id'>, file: File) => {
    // Créer un ID unique
    const id = Math.random().toString(36).substr(2, 9);

    // Créer l'entrée du fichier
    const examFile: ExamFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };

    // Ajouter le fichier
    examFiles = [...examFiles, examFile];
    examStorage.saveExamFiles(examFiles);

    // Créer le sujet
    const newExam: ExamSubject = {
      ...examSubject,
      id,
      fileName: file.name,
      fileUrl: examFile.url,
    };

    examSubjects = [...examSubjects, newExam];
    examStorage.saveExamSubjects(examSubjects);

    return Promise.resolve(newExam);
  },

  // Supprimer un sujet
  delete: async (examId: string) => {
    const exam = examSubjects.find(e => e.id === examId);
    if (exam) {
      // Supprimer le fichier associé
      examFiles = examFiles.filter(f => f.name !== exam.fileName);
      examStorage.saveExamFiles(examFiles);

      // Supprimer le sujet
      examSubjects = examSubjects.filter(e => e.id !== examId);
      examStorage.saveExamSubjects(examSubjects);
    }
    return Promise.resolve();
  },

  // Télécharger un fichier
  download: async (examId: string) => {
    const exam = examSubjects.find(e => e.id === examId);
    if (!exam) throw new Error('Fichier non trouvé');

    const file = examFiles.find(f => f.name === exam.fileName);
    if (!file) throw new Error('Fichier non trouvé');

    return Promise.resolve(file);
  }
};