import { Message } from '../types';

const DB_NAME = 'CellChatDB';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

function openChatDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMessagesToDB(messages: Message[]): Promise<void> {
  try {
    const db = await openChatDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Clear and re-populate
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const msg of messages) {
      store.put(msg);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save messages to IndexedDB:', err);
  }
}

export async function loadMessagesFromDB(): Promise<Message[] | null> {
  try {
    const db = await openChatDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    return await new Promise<Message[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const result = req.result as Message[];
        resolve(result || []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not load messages from IndexedDB:', err);
    return null;
  }
}
