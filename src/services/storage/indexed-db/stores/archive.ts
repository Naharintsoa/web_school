import { getAll, get, add, update, remove, clear } from '../operations';
import type { ArchivedStudent } from '../../../../types/archive';

export const archiveStore = {
  getAll: () => getAll<ArchivedStudent>('archive'),
  get: (id: string) => get<ArchivedStudent>('archive', id),
  add: (archived: ArchivedStudent) => add('archive', archived),
  update: (archived: ArchivedStudent) => update('archive', archived),
  delete: (id: string) => remove('archive', id),
  clear: () => clear('archive'),
};