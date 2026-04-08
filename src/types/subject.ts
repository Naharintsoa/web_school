/**
 * Type Subject — matière scolaire avec coefficient et professeur.
 * teacherName est optionnel pour rester compatible avec l'API subjectsApi
 * et les données statiques de data/subjects.ts.
 */
export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  /** Nom du professeur qui enseigne cette matière (pour le bulletin) */
  teacherName?: string;
  /** Établissement auquel appartient cette matière */
  school?: string;
}
