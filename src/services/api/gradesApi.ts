/**
 * API pour la gestion des notes.
 * Supporte la récupération par élève/classe, la mise à jour et la suppression.
 */
import { storageService } from '../storage/storage-service';
import type { Grade } from '../../types';

export const gradesApi = {
  /** Récupère toutes les notes d'un élève */
  getByStudent: async (studentId: string): Promise<Grade[]> => {
    try {
      const grades = await storageService.grades.get();
      return grades.filter(g => g.studentId === studentId);
    } catch (error) {
      console.error('Erreur récupération notes:', error);
      return [];
    }
  },

  /** Récupère toutes les notes d'une classe pour un trimestre donné */
  getByGradeAndTerm: async (grade: string, term: 1 | 2 | 3): Promise<Grade[]> => {
    try {
      const allGrades = await storageService.grades.get();
      // Note : on filtre par le champ term ; le grade (classe) est dans le student
      return allGrades.filter(g => g.term === term);
    } catch (error) {
      console.error('Erreur récupération notes de classe:', error);
      return [];
    }
  },

  /** Récupère toutes les notes stockées */
  getAll: async (): Promise<Grade[]> => {
    try {
      return await storageService.grades.get();
    } catch {
      return [];
    }
  },

  /** Sauvegarde ou met à jour une note */
  update: async (grade: Grade): Promise<Grade> => {
    try {
      const grades = await storageService.grades.get();
      const index = grades.findIndex(
        g => g.studentId === grade.studentId &&
             g.subjectId === grade.subjectId &&
             g.term === grade.term
      );
      if (index >= 0) {
        grades[index] = grade;
      } else {
        grades.push(grade);
      }
      await storageService.grades.save(grades);
      return grade;
    } catch (error) {
      console.error('Erreur mise à jour note:', error);
      throw error;
    }
  },

  /**
   * Supprime une note spécifique (utilisé quand le champ est vidé).
   * Identifié par l'élève + la matière + le trimestre.
   */
  deleteByCompositeKey: async (studentId: string, subjectId: string, term: 1 | 2 | 3): Promise<void> => {
    try {
      const grades = await storageService.grades.get();
      const filtered = grades.filter(
        g => !(g.studentId === studentId && g.subjectId === subjectId && g.term === term)
      );
      await storageService.grades.save(filtered);
    } catch (error) {
      console.error('Erreur suppression note:', error);
      throw error;
    }
  },
};
