import type { Student, Grade } from '../types/student';

export function generateStudentNumber(existingStudents: Student[], grade: Grade): number {
  const classStudents = existingStudents.filter(student => student.grade === grade);
  if (classStudents.length === 0) return 1;
  return Math.max(...classStudents.map(s => s.studentNumber)) + 1;
}