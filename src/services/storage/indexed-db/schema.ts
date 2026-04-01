import type { DBSchema } from 'idb';
import type { Student } from '../../../types/student';
import type { Grade } from '../../../types/grade';
import type { ArchivedStudent } from '../../../types/archive';
import type { ExamSubject, ExamFile } from '../../../types/exam';

export interface CollegeSullyDB extends DBSchema {
  students: {
    key: string;
    value: Student;
    indexes: { 'by-grade': string };
  };
  grades: {
    key: string;
    value: Grade;
    indexes: { 'by-student': string };
  };
  archive: {
    key: string;
    value: ArchivedStudent;
  };
  examSubjects: {
    key: string;
    value: ExamSubject;
    indexes: { 'by-subject': string };
  };
  examFiles: {
    key: string;
    value: ExamFile;
  };
}