import { Devotional } from '../services/aiService';

export interface CachedDevotional extends Devotional {
  id: string;
  dateKey: string; // YYYY-MM-DD
  dateLabel: string; // Ex: '13 de outubro de 2026'
  cachedAt: number; // Date.now()
  isFavorite?: boolean;
  source?: 'ai' | 'curated' | 'cache';
}

const DB_NAME = 'CellDevotionalsDB';
const DB_VERSION = 1;
const STORE_NAME = 'devotionals';
const LOCAL_STORAGE_KEY_TODAY = 'daily_devotional';
const LOCAL_STORAGE_KEY_ARCHIVE = 'cell_devotionals_archive';

/**
 * Returns normalized local date string in YYYY-MM-DD format
 */
export function getTodayDateKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns user-friendly date label in Portuguese
 */
export function formatDateLabel(d: Date = new Date()): string {
  try {
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}

/**
 * Open or create the IndexedDB database for Devotionals
 */
function openDevotionalsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado neste navegador'));
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('dateKey', 'dateKey', { unique: true });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Erro ao abrir IndexedDB'));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Synchronous read from localStorage for instant initial render
 */
export function getSyncDevotionalFromCache(targetDateKey?: string): CachedDevotional | null {
  if (typeof window === 'undefined') return null;
  const key = targetDateKey || getTodayDateKey();

  try {
    // 1. Check today's primary localStorage entry
    const savedToday = localStorage.getItem(LOCAL_STORAGE_KEY_TODAY);
    if (savedToday) {
      const parsed = JSON.parse(savedToday);
      if (parsed) {
        // If stored with dateKey match
        if (parsed.dateKey === key && parsed.content) {
          return {
            id: parsed.id || `dev-${key}`,
            dateKey: parsed.dateKey,
            dateLabel: parsed.dateLabel || formatDateLabel(),
            verse: parsed.content.verse || parsed.verse,
            reference: parsed.content.reference || parsed.reference,
            reflection: parsed.content.reflection || parsed.reflection,
            cachedAt: parsed.cachedAt || Date.now(),
            isFavorite: parsed.isFavorite || false,
            source: parsed.source || 'cache',
          };
        }
        // Legacy format check (date === toDateString())
        const todayStr = new Date().toDateString();
        if ((parsed.date === todayStr || parsed.dateKey === key) && parsed.content) {
          return {
            id: `dev-${key}`,
            dateKey: key,
            dateLabel: formatDateLabel(),
            verse: parsed.content.verse,
            reference: parsed.content.reference,
            reflection: parsed.content.reflection,
            cachedAt: parsed.cachedAt || Date.now(),
            isFavorite: parsed.isFavorite || false,
            source: parsed.source || 'cache',
          };
        }
      }
    }

    // 2. Check archive in localStorage
    const savedArchive = localStorage.getItem(LOCAL_STORAGE_KEY_ARCHIVE);
    if (savedArchive) {
      const archive: CachedDevotional[] = JSON.parse(savedArchive);
      if (Array.isArray(archive)) {
        const found = archive.find((item) => item.dateKey === key);
        if (found) return found;
      }
    }
  } catch (err) {
    console.warn('Erro ao ler cache síncrono do devocional:', err);
  }

  return null;
}

/**
 * Asynchronous retrieval from IndexedDB with fallback to localStorage
 */
export async function getDevotionalFromCache(
  targetDateKey?: string
): Promise<CachedDevotional | null> {
  const key = targetDateKey || getTodayDateKey();

  // Try IndexedDB first
  try {
    const db = await openDevotionalsDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const result = await new Promise<CachedDevotional | null>((resolve, reject) => {
      let index: IDBIndex | null = null;
      try {
        index = store.index('dateKey');
      } catch {
        index = null;
      }

      if (index) {
        const req = index.get(key);
        req.onsuccess = () => resolve((req.result as CachedDevotional) || null);
        req.onerror = () => reject(req.error);
      } else {
        const idReq = store.get(`dev-${key}`);
        idReq.onsuccess = () => resolve((idReq.result as CachedDevotional) || null);
        idReq.onerror = () => reject(idReq.error);
      }
    });

    if (result) {
      // Sync back to localStorage for faster future sync reads
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY_TODAY,
          JSON.stringify({
            date: new Date().toDateString(),
            dateKey: result.dateKey,
            content: {
              verse: result.verse,
              reference: result.reference,
              reflection: result.reflection,
            },
            cachedAt: result.cachedAt,
          })
        );
      } catch {
        // Ignore quota errors
      }
      return result;
    }
  } catch (err) {
    console.warn('IndexedDB indisponível, usando fallback de localStorage:', err);
  }

  // Fallback to synchronous localStorage read
  return getSyncDevotionalFromCache(key);
}

/**
 * Saves a devotional into both IndexedDB and localStorage
 */
export async function saveDevotionalToCache(
  devotional: Devotional,
  targetDateKey?: string,
  source: 'ai' | 'curated' | 'cache' = 'ai'
): Promise<CachedDevotional> {
  const dateKey = targetDateKey || getTodayDateKey();
  const id = `dev-${dateKey}`;
  const now = Date.now();

  const record: CachedDevotional = {
    id,
    dateKey,
    dateLabel: formatDateLabel(),
    verse: devotional.verse,
    reference: devotional.reference,
    reflection: devotional.reflection,
    cachedAt: now,
    isFavorite: false,
    source,
  };

  // 1. Save to localStorage (both current day & archive list)
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_TODAY,
      JSON.stringify({
        date: new Date().toDateString(),
        dateKey,
        content: {
          verse: record.verse,
          reference: record.reference,
          reflection: record.reflection,
        },
        cachedAt: record.cachedAt,
        source: record.source,
      })
    );

    const savedArchive = localStorage.getItem(LOCAL_STORAGE_KEY_ARCHIVE);
    let archive: CachedDevotional[] = savedArchive ? JSON.parse(savedArchive) : [];
    if (!Array.isArray(archive)) archive = [];

    // Filter out existing matching dateKey and prepend newest
    archive = [record, ...archive.filter((a) => a.dateKey !== dateKey)].slice(0, 30);
    localStorage.setItem(LOCAL_STORAGE_KEY_ARCHIVE, JSON.stringify(archive));
  } catch (err) {
    console.warn('Erro ao salvar devocional no localStorage:', err);
  }

  // 2. Save to IndexedDB
  try {
    const db = await openDevotionalsDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Keep existing favorite status if present
    const existingReq = store.get(id);
    existingReq.onsuccess = () => {
      if (existingReq.result?.isFavorite) {
        record.isFavorite = true;
      }
      store.put(record);
    };
    existingReq.onerror = () => {
      store.put(record);
    };

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Erro ao salvar devocional no IndexedDB:', err);
  }

  return record;
}

/**
 * Retrieve all devotionals stored in local cache (IndexedDB + localStorage archive)
 * Enables offline browsing of past devotionals
 */
export async function getAllCachedDevotionals(): Promise<CachedDevotional[]> {
  const map = new Map<string, CachedDevotional>();

  // 1. Read from localStorage archive
  try {
    const savedArchive = localStorage.getItem(LOCAL_STORAGE_KEY_ARCHIVE);
    if (savedArchive) {
      const archive: CachedDevotional[] = JSON.parse(savedArchive);
      if (Array.isArray(archive)) {
        archive.forEach((item) => {
          if (item && item.dateKey) {
            map.set(item.dateKey, item);
          }
        });
      }
    }
  } catch {
    // Ignore JSON errors
  }

  // 2. Read from IndexedDB
  try {
    const db = await openDevotionalsDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const items = await new Promise<CachedDevotional[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as CachedDevotional[]) || []);
      req.onerror = () => reject(req.error);
    });

    items.forEach((item) => {
      if (item && item.dateKey) {
        map.set(item.dateKey, item);
      }
    });
  } catch (err) {
    console.warn('Não foi possível ler lista completa do IndexedDB:', err);
  }

  // Sort by dateKey descending (most recent first)
  return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

/**
 * Toggle favorite status of a devotional in offline cache
 */
export async function toggleDevotionalFavorite(id: string): Promise<boolean> {
  let newStatus = false;

  // 1. Update in IndexedDB
  try {
    const db = await openDevotionalsDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(id);
    await new Promise<void>((resolve, reject) => {
      getReq.onsuccess = () => {
        const item: CachedDevotional = getReq.result;
        if (item) {
          item.isFavorite = !item.isFavorite;
          newStatus = item.isFavorite;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Erro ao atualizar favorito no IndexedDB:', err);
  }

  // 2. Update in localStorage archive
  try {
    const savedArchive = localStorage.getItem(LOCAL_STORAGE_KEY_ARCHIVE);
    if (savedArchive) {
      const archive: CachedDevotional[] = JSON.parse(savedArchive);
      if (Array.isArray(archive)) {
        const updated = archive.map((item) => {
          if (item.id === id) {
            return { ...item, isFavorite: !item.isFavorite };
          }
          return item;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY_ARCHIVE, JSON.stringify(updated));
      }
    }
  } catch {
    // Ignore error
  }

  return newStatus;
}

/**
 * Pre-populate local cache with rich curated family and faith devotionals
 * Ensures that even on the very first offline open, multiple devotionals are ready.
 */
export async function preseedOfflineDevotionals(
  curatedList: Devotional[]
): Promise<void> {
  if (!curatedList || curatedList.length === 0) return;

  const today = new Date();
  for (let i = 0; i < Math.min(curatedList.length, 7); i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getTodayDateKey(d);

    const existing = getSyncDevotionalFromCache(key);
    if (!existing) {
      const item = curatedList[i % curatedList.length];
      await saveDevotionalToCache(item, key, 'curated');
    }
  }
}
