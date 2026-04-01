import { initDB } from './config';
import type { CollegeSullyDB } from './schema';

// Utility function to ensure DB is initialized before any operation
export async function withDB<T>(
  operation: (db: IDBPDatabase<CollegeSullyDB>) => Promise<T>
): Promise<T> {
  const db = await initDB();
  return operation(db);
}

// Error handling wrapper
export async function tryCatchWrapper<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw error;
  }
}