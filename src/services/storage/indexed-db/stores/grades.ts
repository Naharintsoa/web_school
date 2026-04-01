import { getAll, get, add, update, remove, clear } from '../operations';
import type { Grade } from '../../../../types/grade';

export const gradeStore = {
  getAll: () => getAll<Grade>('grades'),
  get: (id: string) => get<Grade>('grades', id),
  add: (grade: Grade) => add('grades', grade),
  update: (grade: Grade) => update('grades', grade),
  delete: (id: string) => remove('grades', id),
  clear: () => clear('grades'),
};