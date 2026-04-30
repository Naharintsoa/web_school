/**
 * Utilitaires de calcul des notes.
 * La règle fondamentale : une matière sans note saisie ne compte pas dans la moyenne.
 */
import type { Grade } from '../types/grade';

/**
 * Calcule la moyenne pondérée.
 * IMPORTANT : seules les matières avec une note saisie (score défini) sont incluses.
 * Une matière non notée n'affecte pas la moyenne.
 *
 * @param grades - Liste des notes (uniquement celles effectivement saisies)
 */
export function calculateAverage(grades: Grade[]): number {
  // Ne garder que les notes réellement saisies (score défini et valide)
  const entered = grades.filter(g =>
    g.score !== undefined &&
    g.score !== null &&
    !isNaN(g.score)
  );

  if (entered.length === 0) return 0;

  const totalWeighted = entered.reduce((sum, g) => sum + g.score * g.coefficient, 0);
  const totalCoeff    = entered.reduce((sum, g) => sum + g.coefficient, 0);

  return totalCoeff === 0 ? 0 : totalWeighted / totalCoeff;
}

/**
 * Calcule les statistiques d'une classe pour une matière donnée.
 * Retourne moyenne, note minimale et maximale.
 *
 * @param gradesList - Toutes les notes de la classe pour cette matière
 */
export function calculateClassStats(gradesList: Grade[]): {
  avg: number;
  min: number;
  max: number;
} {
  const scores = gradesList
    .filter(g => g.score !== undefined && g.score !== null && !isNaN(g.score))
    .map(g => g.score);

  if (scores.length === 0) return { avg: 0, min: 0, max: 0 };

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return {
    avg,
    min: Math.min(...scores),
    max: Math.max(...scores),
  };
}

/**
 * Retourne le niveau lettre basé sur le score (barème français sur 20).
 */
export function getGradeLevel(score: number): string {
  if (score >= 18) return 'A+';
  if (score >= 16) return 'A';
  if (score >= 14) return 'B+';
  if (score >= 12) return 'B';
  if (score >= 10) return 'C';
  if (score >= 8)  return 'D';
  return 'E';
}

/**
 * Retourne l'appréciation par défaut selon le score.
 */
export function getDefaultAppreciation(score: number): string {
  if (score >= 18) return 'Excellent';
  if (score >= 16) return 'Très bien';
  if (score >= 14) return 'Bien';
  if (score >= 12) return 'Assez bien';
  if (score >= 10) return 'Passable';
  return 'Insuffisant';
}

/**
 * Retourne la mention du bulletin selon la moyenne générale (barème /20).
 *   ≥ 16  → félicitations
 *   ≥ 14  → encouragements
 *   ≥ 10  → progresse
 *    < 10  → insuffisant
 */
export function getMentionFromAverage(average: number): 'félicitations' | 'encouragements' | 'progresse' | 'insuffisant' | '' {
  if (average <= 0) return '';
  if (average >= 16) return 'félicitations';
  if (average >= 14) return 'encouragements';
  if (average >= 10) return 'progresse';
  return 'insuffisant';
}

/**
 * Formate un score pour l'affichage (2 décimales).
 */
export function formatScore(score: number): string {
  return score.toFixed(2);
}

/**
 * Calcule les moyennes Brevet de manière cohérente.
 * Utilisé par les bulletins, le conseil de classe et le diaporama.
 */
export interface BrevetAverages {
  hasAnglais: boolean;
  hasEspagnol: boolean;
  hasAllemand: boolean;
  anglais: number;
  espagnol: number;
  allemand: number;
}

export function computeBrevetAverages(grades: Grade[]): BrevetAverages {
  const BREVET_SUBJECTS = [
    'francais', 'malagasy', 'anglais', 'espagnol', 'allemand',
    'svt', 'histoire', 'geographie', 'physique', 'chimie', 'emc', 'mathematiques',
  ];
  const isBrevetSubject = (name: string) => BREVET_SUBJECTS.some(s => name.toLowerCase().includes(s));

  const brevAnglais = grades.filter(g => {
    const n = g.subjectName?.toLowerCase() ?? '';
    return isBrevetSubject(n) && !n.includes('espagnol') && !n.includes('allemand');
  });
  const brevEspagnol = grades.filter(g => {
    const n = g.subjectName?.toLowerCase() ?? '';
    return isBrevetSubject(n) && !n.includes('allemand');
  });
  const brevAllemand = grades.filter(g => {
    const n = g.subjectName?.toLowerCase() ?? '';
    return isBrevetSubject(n) && n.includes('allemand');
  });

  return {
    hasAnglais: brevAnglais.length > 0,
    hasEspagnol: brevEspagnol.length > 0,
    hasAllemand: brevAllemand.length > 0,
    anglais: calculateAverage(brevAnglais),
    espagnol: calculateAverage(brevEspagnol),
    allemand: calculateAverage(brevAllemand),
  };
}
