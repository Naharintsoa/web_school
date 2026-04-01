import { initDB } from './config';
import type { CollegeSullyDB } from './schema';

// Helper to ensure DB is initialized
async function getDB() {
  return await initDB();
}

// Generic CRUD operations
export async function getAll<T>(storeName: keyof CollegeSullyDB): Promise<T[]> {
  try {
    const db = await getDB();
    return await db.getAll(storeName);
  } catch (error) {
    console.error(`Failed to get all items from ${storeName}:`, error);
    return [];
  }
}

export async function get<T>(storeName: keyof CollegeSullyDB, id: string): Promise<T | undefined> {
  try {
    const db = await getDB();
    return await db.get(storeName, id);
  } catch (error) {
    console.error(`Failed to get item ${id} from ${storeName}:`, error);
    return undefined;
  }
}

export async function add<T extends { id: string }>(storeName: keyof CollegeSullyDB, item: T): Promise<T> {
  try {
    const db = await getDB();
    await db.add(storeName, item);
    return item;
  } catch (error: any) {
    if (error.name === 'ConstraintError') {
      return await update(storeName, item);
    }
    console.error(`Failed to add item to ${storeName}:`, error);
    throw error;
  }
}

export async function update<T extends { id: string }>(storeName: keyof CollegeSullyDB, item: T): Promise<T> {
  try {
    const db = await getDB();
    await db.put(storeName, item);
    return item;
  } catch (error) {
    console.error(`Failed to update item in ${storeName}:`, error);
    throw error;
  }
}

export async function remove(storeName: keyof CollegeSullyDB, id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(storeName, id);
  } catch (error) {
    console.error(`Failed to delete item ${id} from ${storeName}:`, error);
    throw error;
  }
}

export async function clear(storeName: keyof CollegeSullyDB): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(storeName);
  } catch (error) {
    console.error(`Failed to clear store ${storeName}:`, error);
    throw error;
  }
}