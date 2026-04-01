import { STORAGE_KEYS } from './constants';

export const localStorage = {
  getData: <T>(key: string): T[] => {
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  setData: <T>(key: string, data: T[]): void => {
    window.localStorage.setItem(key, JSON.stringify(data));
  },

  removeData: (key: string): void => {
    window.localStorage.removeItem(key);
  },
};