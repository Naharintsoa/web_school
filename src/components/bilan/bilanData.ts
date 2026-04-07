/** Classes primaires concernées par le Bilan des Acquis Scolaires */
export const BILAN_CLASSES = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'] as const;

/** Grille de progression scolaire : 3 cycles × 3 classes */
export const CAREER_GRID = [
  { cycle: 2, classes: ['CP', 'CE1', 'CE2'] },
  { cycle: 3, classes: ['CM1', 'CM2', '6EME'] },
  { cycle: 4, classes: ['5EME', '4EME', '3EME'] },
] as const;
