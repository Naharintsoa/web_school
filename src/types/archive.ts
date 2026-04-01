import type { Student } from './student';

export interface ArchivedStudent {
  student: Student;
  archivedAt: string;
  reason?: string;
}

export interface ArchiveAction {
  type: 'DELETE' | 'RESTORE';
  timestamp: string;
  studentId: string;
}