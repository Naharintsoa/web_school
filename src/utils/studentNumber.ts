import type { Student, ClassLevel } from '../types/student';

export function generateStudentNumber(existingStudents: Student[], grade: ClassLevel): number {
  const classStudents = existingStudents.filter(student => student.grade === grade);
  if (classStudents.length === 0) return 1;
  return Math.max(...classStudents.map(s => s.studentNumber)) + 1;
}