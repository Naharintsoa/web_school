/** Classes primaires concernées par le Bilan des Acquis Scolaires — Sully */
export const BILAN_CLASSES = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] as const;

/** Classes primaires Sully Annexe (2 sections parallèles) */
export const BILAN_CLASSES_ANNEXE = [
  'CP-A', 'CP-B', 'CE1-A', 'CE1-B', 'CE2-A', 'CE2-B', 'CM1-A', 'CM1-B', 'CM2-A', 'CM2-B',
] as const;

/** Grille de progression scolaire : 3 cycles × 3 classes */
export const CAREER_GRID = [
  { cycle: 2, classes: ['CP', 'CE1', 'CE2'] },
  { cycle: 3, classes: ['CM1', 'CM2', '6EME'] },
  { cycle: 4, classes: ['5EME', '4EME', '3EME'] },
] as const;
