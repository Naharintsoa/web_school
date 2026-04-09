/**
 * Type Subject — matière scolaire avec coefficient et professeur.
 * teacherName est optionnel pour rester compatible avec l'API subjectsApi
 * et les données statiques de data/subjects.ts.
 */
export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  /** Nom du professeur qui enseigne cette matière */
  teacherName?: string;
  /** Établissement auquel appartient cette matière */
  school?: string;
  /**
   * Classe spécifique (ex: '3EME') ou null = toutes les classes.
   * Quand null, cette entrée sert de fallback si aucune entrée spécifique n'existe.
   */
  grade?: string | null;
}
