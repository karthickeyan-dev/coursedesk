/**
 * Persist FileSystemDirectoryHandle in IndexedDB (handles cannot live in localStorage).
 */

const DB_NAME = "coursedesk";
const DB_VERSION = 1;
const STORE = "handles";
const ROOT_KEY = "coursesRoot";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function idbReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export async function saveCoursesRootHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    await idbReq(tx.objectStore(STORE).put(handle, ROOT_KEY));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    });
  } finally {
    db.close();
  }
}

export async function loadCoursesRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const value = await idbReq(tx.objectStore(STORE).get(ROOT_KEY));
    return (value as FileSystemDirectoryHandle | undefined) ?? null;
  } catch {
    return null;
  } finally {
    db.close();
  }
}

export async function clearCoursesRootHandle(): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    await idbReq(tx.objectStore(STORE).delete(ROOT_KEY));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    });
  } finally {
    db.close();
  }
}
