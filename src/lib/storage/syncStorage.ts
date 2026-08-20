// Resilient local persistence layer paired with Firestore synchronization

const STORAGE_PREFIX = 'finapp_v1_';

export function getLocalData<T>(userId: string, collectionName: string): T[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}_${collectionName}`);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch (e) {
    console.warn(`Error reading local storage for ${collectionName}:`, e);
    return [];
  }
}

export function setLocalData<T>(userId: string, collectionName: string, data: T[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}_${collectionName}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving local storage for ${collectionName}:`, e);
  }
}

export function saveLocalItem<T extends { id: string }>(
  userId: string,
  collectionName: string,
  item: T
): T[] {
  const current = getLocalData<T>(userId, collectionName);
  const index = current.findIndex((i) => i.id === item.id);
  let updated: T[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...item };
  } else {
    updated = [item, ...current];
  }
  setLocalData(userId, collectionName, updated);
  return updated;
}

export function removeLocalItem<T extends { id: string }>(
  userId: string,
  collectionName: string,
  id: string
): T[] {
  const current = getLocalData<T>(userId, collectionName);
  const updated = current.filter((i) => i.id !== id);
  setLocalData(userId, collectionName, updated);
  return updated;
}

export async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 1200,
  fallbackValue?: T
): Promise<T> {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(`Firestore query timed out after ${timeoutMs}ms (Database may not be created yet in Firebase Console)`));
      }
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle);
    throw err;
  }
}
