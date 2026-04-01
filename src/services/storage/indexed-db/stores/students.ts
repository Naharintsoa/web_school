import { getAll, get, add, update, remove, clear } from '../operations';
import type { Student } from '../../../../types/student';

export const studentStore = {
  getAll: () => getAll<Student>('students'),
  get: (id: string) => get<Student>('students', id),
  add: (student: Student) => add('students', student),
  update: (student: Student) => update('students', student),
  delete: (id: string) => remove('students', id),
  clear: () => clear('students'),
};