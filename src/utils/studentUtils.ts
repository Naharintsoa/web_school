import type { Grade, MatriculeInfo } from '../types';

// Generate a student number within their class
export function generateStudentNumber(existingNumbers: number[]): number {
  if (existingNumbers.length === 0) return 1;
  return Math.max(...existingNumbers) + 1;
}

// Generate a unique matricule number
export function generateMatricule({ year, grade, sequence }: MatriculeInfo): string {
  // Format: AAGG###
  // AA: Last two digits of the year
  // GG: Two digits representing the grade
  // ###: Three-digit sequence number
  
  const yearCode = year.slice(2, 4);
  const gradeCode = getGradeCode(grade);
  const sequenceCode = String(sequence).padStart(3, '0');
  
  return `${yearCode}${gradeCode}${sequenceCode}`;
}

// Convert grade to two-digit code
function getGradeCode(grade: Grade): string {
  const gradeCodes = {
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
  
  return gradeCodes[grade];
}

// Format matricule for display
export function formatMatricule(matricule: string): string {
  return `${matricule.slice(0, 2)}-${matricule.slice(2, 4)}-${matricule.slice(4)}`;
}