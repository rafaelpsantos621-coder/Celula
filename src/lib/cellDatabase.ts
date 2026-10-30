import { User, CellMember, GameHistoryEntry, StoredImage } from '../types';

const DB_NAME = 'CelulaDespertarMainDB';
const DB_VERSION = 1;
const STORE_PROFILES = 'profiles';
const STORE_GAMES = 'game_history';
const STORE_IMAGES = 'images';

const LS_PROFILES_KEY = 'cell_db_profiles_v1';
const LS_GAMES_KEY = 'cell_db_games_v1';
const LS_IMAGES_KEY = 'cell_db_images_v1';

function openLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROFILES)) {
        db.createObjectStore(STORE_PROFILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_GAMES)) {
        db.createObjectStore(STORE_GAMES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putAllInStore<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
  try {
    const db = await openLocalDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Fallback handled by localStorage
  }
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openLocalDB();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        resolve((req.result as T[]) || []);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return [];
  }
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  try {
    const db = await openLocalDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore
  }
}

/**
 * Compresses an image file to a clean JPEG DataURL so it can be stored reliably
 * both in the server JSON database and in local IndexedDB.
 */
export function compressImageForDB(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Falha ao processar imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 1. PROFILES DATABASE (Perfis Criados)
// ==========================================
export async function getProfilesFromDB(): Promise<CellMember[]> {
  try {
    const res = await fetch('/api/members');
    if (res.ok) {
      const serverMembers: CellMember[] = await res.json();
      if (Array.isArray(serverMembers)) {
        try {
          localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(serverMembers));
        } catch {}
        await putAllInStore(STORE_PROFILES, serverMembers);
        return serverMembers.sort((a, b) => (b.points || 0) - (a.points || 0));
      }
    }
  } catch {
    // Offline fallback
  }

  const idbProfiles = await getAllFromStore<CellMember>(STORE_PROFILES);
  if (idbProfiles.length > 0) {
    return idbProfiles.sort((a, b) => (b.points || 0) - (a.points || 0));
  }

  try {
    const saved = localStorage.getItem(LS_PROFILES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export async function saveProfileToDB(user: User): Promise<CellMember> {
  const memberEntry: CellMember = {
    id: user.id,
    name: user.name,
    role: user.role,
    points: user.points || 0,
    avatarUrl: user.avatarUrl || '',
    bio: user.bio || '',
    phone: user.phone || '',
    familyRole: user.familyRole || 'Membro da Célula',
    joinedAt: user.joinedAt || Date.now(),
    lastActive: Date.now(),
  };

  // Save locally immediately
  try {
    const current = await getProfilesFromDB();
    const updated = [memberEntry, ...current.filter((m) => m.id !== memberEntry.id)];
    localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(updated));
    await putAllInStore(STORE_PROFILES, updated);
  } catch {}

  // Sync with server
  if (user.role !== 'visitor') {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberEntry),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
  }

  return memberEntry;
}

export async function deleteProfileFromDB(id: string): Promise<void> {
  await deleteFromStore(STORE_PROFILES, id);
  try {
    const saved = localStorage.getItem(LS_PROFILES_KEY);
    if (saved) {
      const filtered = JSON.parse(saved).filter((p: CellMember) => p.id !== id);
      localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(filtered));
    }
  } catch {}
  try {
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
  } catch {}
}

// ==========================================
// 2. GAME HISTORY DATABASE (Histórico de Jogos)
// ==========================================
export async function getGameHistoryFromDB(): Promise<GameHistoryEntry[]> {
  try {
    const res = await fetch('/api/game-history');
    if (res.ok) {
      const serverHistory: GameHistoryEntry[] = await res.json();
      if (Array.isArray(serverHistory)) {
        try {
          localStorage.setItem(LS_GAMES_KEY, JSON.stringify(serverHistory));
        } catch {}
        await putAllInStore(STORE_GAMES, serverHistory);
        return serverHistory.sort((a, b) => b.playedAt - a.playedAt);
      }
    }
  } catch {}

  const idbGames = await getAllFromStore<GameHistoryEntry>(STORE_GAMES);
  if (idbGames.length > 0) {
    return idbGames.sort((a, b) => b.playedAt - a.playedAt);
  }

  try {
    const saved = localStorage.getItem(LS_GAMES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export async function recordGameSession(params: {
  user: User;
  gameType: 'quiz' | 'memory' | 'wordsearch' | 'hangman';
  gameTitle: string;
  score: number;
}): Promise<GameHistoryEntry> {
  const { user, gameType, gameTitle, score } = params;
  const totalPointsAfter = (user.points || 0) + score;

  const entry: GameHistoryEntry = {
    id: `gh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.id,
    userName: user.name,
    userAvatarUrl: user.avatarUrl || '',
    gameType,
    gameTitle,
    score,
    totalPointsAfter,
    playedAt: Date.now(),
  };

  // Save locally first
  try {
    const existing = await getGameHistoryFromDB();
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 300);
    localStorage.setItem(LS_GAMES_KEY, JSON.stringify(updated));
    await putAllInStore(STORE_GAMES, [entry]);
  } catch {}

  // Sync to server DB
  try {
    const res = await fetch('/api/game-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, role: user.role }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return entry;
}

export async function deleteGameHistoryFromDB(id: string): Promise<void> {
  await deleteFromStore(STORE_GAMES, id);
  try {
    const saved = localStorage.getItem(LS_GAMES_KEY);
    if (saved) {
      const filtered = JSON.parse(saved).filter((g: GameHistoryEntry) => g.id !== id);
      localStorage.setItem(LS_GAMES_KEY, JSON.stringify(filtered));
    }
  } catch {}
  try {
    await fetch(`/api/game-history/${id}`, { method: 'DELETE' });
  } catch {}
}

// ==========================================
// 3. IMAGES DATABASE (Banco de Imagens)
// ==========================================
export async function getImagesFromDB(): Promise<StoredImage[]> {
  try {
    const res = await fetch('/api/images');
    if (res.ok) {
      const serverImages: StoredImage[] = await res.json();
      if (Array.isArray(serverImages)) {
        try {
          localStorage.setItem(LS_IMAGES_KEY, JSON.stringify(serverImages.slice(0, 40)));
        } catch {}
        await putAllInStore(STORE_IMAGES, serverImages);
        return serverImages.sort((a, b) => b.createdAt - a.createdAt);
      }
    }
  } catch {}

  const idbImages = await getAllFromStore<StoredImage>(STORE_IMAGES);
  if (idbImages.length > 0) {
    return idbImages.sort((a, b) => b.createdAt - a.createdAt);
  }

  try {
    const saved = localStorage.getItem(LS_IMAGES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export async function uploadAndSaveImageToDB(params: {
  file: File;
  title?: string;
  category: 'profile' | 'blog' | 'chat' | 'gallery';
  user: User;
}): Promise<StoredImage> {
  const { file, title, category, user } = params;
  const maxDim = category === 'profile' ? 480 : 900;
  const compressedDataUrl = await compressImageForDB(file, maxDim, maxDim, 0.84);

  let uploadedUrl = '';
  try {
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      if (uploadData && uploadData.url) {
        uploadedUrl = uploadData.url;
      }
    }
  } catch {}

  const finalUrl = uploadedUrl || compressedDataUrl;

  const imgRecord: StoredImage = {
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title || file.name.replace(/\.[^/.]+$/, '') || 'Imagem da Célula',
    url: finalUrl,
    dataUrl: compressedDataUrl,
    category,
    uploadedBy: user.id,
    uploadedByName: user.name,
    mimeType: file.type || 'image/jpeg',
    size: file.size,
    createdAt: Date.now(),
  };

  // Save in IndexedDB immediately
  await putAllInStore(STORE_IMAGES, [imgRecord]);

  // Save in Server Image DB
  try {
    const res = await fetch('/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(imgRecord),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return imgRecord;
}

export async function deleteImageFromDB(id: string): Promise<void> {
  await deleteFromStore(STORE_IMAGES, id);
  try {
    const saved = localStorage.getItem(LS_IMAGES_KEY);
    if (saved) {
      const filtered = JSON.parse(saved).filter((i: StoredImage) => i.id !== id);
      localStorage.setItem(LS_IMAGES_KEY, JSON.stringify(filtered));
    }
  } catch {}
  try {
    await fetch(`/api/images/${id}`, { method: 'DELETE' });
  } catch {}
}

// ==========================================
// 4. BACKUP & RESTORE
// ==========================================
export async function exportDatabaseSnapshot(): Promise<void> {
  let snapshot: any = null;
  try {
    const res = await fetch('/api/db/snapshot');
    if (res.ok) {
      snapshot = await res.json();
    }
  } catch {}

  if (!snapshot) {
    const [members, gameHistory, images] = await Promise.all([
      getProfilesFromDB(),
      getGameHistoryFromDB(),
      getImagesFromDB(),
    ]);
    snapshot = {
      version: 1,
      exportedAt: Date.now(),
      members,
      gameHistory,
      images,
    };
  }

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `banco-dados-celula-despertar-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDatabaseSnapshot(file: File): Promise<boolean> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') {
    throw new Error('Arquivo inválido');
  }

  if (Array.isArray(data.members)) {
    await putAllInStore(STORE_PROFILES, data.members);
    localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(data.members));
  }
  if (Array.isArray(data.gameHistory)) {
    await putAllInStore(STORE_GAMES, data.gameHistory);
    localStorage.setItem(LS_GAMES_KEY, JSON.stringify(data.gameHistory));
  }
  if (Array.isArray(data.images)) {
    await putAllInStore(STORE_IMAGES, data.images);
  }

  try {
    await fetch('/api/db/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {}

  return true;
}
