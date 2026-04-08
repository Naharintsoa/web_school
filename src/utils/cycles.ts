import type { ClassLevel, Cycle, SullyClassLevel, AnnexeClassLevel } from '../types/student';

export const CYCLES: Record<Cycle, { name: string; grades: SullyClassLevel[] }> = {
  'CYCLE1': {
    name: 'Cycle 1 — Apprentissages premiers',
    grades: ['PS', 'MS', 'GS'],
  },
  'CYCLE2': {
    name: 'Cycle 2 — Apprentissages fondamentaux',
    grades: ['CP', 'CE1', 'CE2'],
  },
  'CYCLE3': {
    name: 'Cycle 3 — Consolidation',
    grades: ['CM1', 'CM2', '6EME'],
  },
  'CYCLE4': {
    name: 'Cycle 4 — Approfondissements',
    grades: ['5EME', '4EME', '3EME'],
  },
};

export const ANNEXE_CYCLES: Record<Cycle, { name: string; grades: AnnexeClassLevel[] }> = {
  'CYCLE1': {
    name: 'Cycle 1 — Apprentissages premiers',
    grades: ['PS-A', 'PS-B', 'MS-A', 'MS-B', 'GS-A', 'GS-B'],
  },
  'CYCLE2': {
    name: 'Cycle 2 — Apprentissages fondamentaux',
    grades: ['CP-A', 'CP-B', 'CE1-A', 'CE1-B', 'CE2-A', 'CE2-B'],
  },
  'CYCLE3': {
    name: 'Cycle 3 — Consolidation',
    grades: ['CM1-A', 'CM1-B', 'CM2-A', 'CM2-B', '6EME-A', '6EME-B'],
  },
  'CYCLE4': {
    name: 'Cycle 4 — Approfondissements',
    grades: ['5EME-A', '5EME-B', '4EME-A', '4EME-B', '3EME-A', '3EME-B'],
  },
};

/** Retourne le cycle d'un niveau de classe (Sully ou Annexe). */
export function getGradeCycle(grade: ClassLevel): Cycle {
  // Chercher d'abord dans les classes Sully
  for (const [cycle, info] of Object.entries(CYCLES)) {
    if ((info.grades as string[]).includes(grade)) return cycle as Cycle;
  }
  // Chercher dans les classes Annexe
  for (const [cycle, info] of Object.entries(ANNEXE_CYCLES)) {
    if ((info.grades as string[]).includes(grade)) return cycle as Cycle;
  }
  // Fallback : déduire depuis le niveau de base (ex: 'PS-A' → 'PS')
  const base = grade.replace(/-[AB]$/, '') as SullyClassLevel;
  for (const [cycle, info] of Object.entries(CYCLES)) {
    if ((info.grades as string[]).includes(base)) return cycle as Cycle;
  }
  return 'CYCLE1';
}
