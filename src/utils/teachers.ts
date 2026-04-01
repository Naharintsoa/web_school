import { TEACHERS } from '../data/teachers';
import { SUBJECTS } from '../data/subjects';
import type { Teacher, Subject } from '../types';

/**
 * Get teacher information for a specific subject
 */
export function getTeacherForSubject(subjectId: string): Teacher | undefined {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  if (!subject) return undefined;
  return TEACHERS.find(t => t.id === subject.teacherId);
}

/**
 * Get all subjects taught by a teacher
 */
export function getTeacherSubjects(teacherId: string): Subject[] {
  return SUBJECTS.filter(subject => subject.teacherId === teacherId);
}

/**
 * Get all teachers for a specific grade
 */
export function getTeachersForGrade(grade: string): Teacher[] {
  // Get all subjects for this grade level
  const gradeSubjects = SUBJECTS.filter(subject => {
    // You can add grade-specific logic here
    return true; // For now, return all teachers
  });

  // Get unique teacher IDs
  const teacherIds = [...new Set(gradeSubjects.map(subject => subject.teacherId))];

  // Return teacher objects
  return TEACHERS.filter(teacher => teacherIds.includes(teacher.id));
}

/**
 * Check if a teacher teaches a specific subject
 */
export function teachesSubject(teacherId: string, subjectId: string): boolean {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  return subject?.teacherId === teacherId;
}

/**
 * Get subject name with teacher information
 */
export function getSubjectWithTeacher(subjectId: string): string {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  const teacher = subject ? getTeacherForSubject(subject.id) : undefined;
  
  if (!subject) return '';
  if (!teacher) return subject.name;
  
  return `${subject.name} (${teacher.name})`;
}