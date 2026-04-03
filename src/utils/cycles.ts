import type { ClassLevel, Cycle } from '../types/student';

export const CYCLES: Record<Cycle, { name: string; grades: ClassLevel[] }> = {
  'CYCLE1': {
    name: 'Cycle 1 - Cycle des apprentissages premiers',
    grades: ['PS', 'MS', 'GS']
  },
  'CYCLE2': {
    name: 'Cycle 2 - Cycle des apprentissages fondamentaux',
    grades: ['CP', 'CE1', 'CE2']
  },
  'CYCLE3': {
    name: 'Cycle 3 - Cycle de consolidation',
    grades: ['CM1', 'CM2', '6EME']
  },
  'CYCLE4': {
    name: 'Cycle 4 - Cycle des approfondissements',
    grades: ['5EME', '4EME', '3EME']
  }
};

export function getGradeCycle(grade: ClassLevel): Cycle {
  for (const [cycle, info] of Object.entries(CYCLES)) {
    if (info.grades.includes(grade)) {
      return cycle as Cycle;
    }
  }
  throw new Error(`Invalid grade: ${grade}`);
}