import type { ClassLevel, MatriculeInfo } from '../types/student';

const GRADE_CODES: Record<ClassLevel, string> = {
  'PS': '01',
  'MS': '02',
  'GS': '03',
  'CP': '04',
  'CE1': '05',
  'CE2': '06',
  'CM1': '07',
  'CM2': '08',
  '6EME': '09',
  '5EME': '10',
  '4EME': '11',
  '3EME': '12'
};

export function generateMatricule({ year, grade, sequence }: MatriculeInfo): string {
  // Format: AAGG###
  // AA: Last two digits of the year
  // GG: Two digits representing the grade
  // ###: Three-digit sequence number
  const yearCode = year.slice(2, 4);
  const gradeCode = GRADE_CODES[grade];
  const sequenceCode = String(sequence).padStart(3, '0');
  
  return `${yearCode}${gradeCode}${sequenceCode}`;
}

export function formatMatricule(matricule: string): string {
  // Format: AA-GG-### for display
  return `${matricule.slice(0, 2)}-${matricule.slice(2, 4)}-${matricule.slice(4)}`;
}