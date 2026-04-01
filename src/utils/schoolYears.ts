// Génère les 5 prochaines années scolaires à partir de l'année actuelle
export function generateSchoolYears(startYear: number = 2024): string[] {
  const years: string[] = [];
  for (let i = 0; i < 5; i++) {
    years.push(`${startYear + i}-${startYear + i + 1}`);
  }
  return years;
}

export const SCHOOL_YEARS = generateSchoolYears();