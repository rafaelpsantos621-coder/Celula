import {
  CachedDevotional,
  getDevotionalFromCache,
  getSyncDevotionalFromCache,
  getTodayDateKey,
  preseedOfflineDevotionals,
  saveDevotionalToCache,
} from '../lib/devotionalStorage';

export interface Devotional {
  verse: string;
  reference: string;
  reflection: string;
  cachedAt?: number;
  isOffline?: boolean;
}

export const FALLBACK_DEVOTIONALS: Devotional[] = [
  {
    verse: 'Eu e a minha casa serviremos ao Senhor.',
    reference: 'Josué 24:15',
    reflection:
      'A família é o projeto mais precioso do coração de Deus. Quando decidimos consagrar nosso lar, filhos e relacionamentos a Cristo, a paz celestial estabelece raízes profundas na nossa casa.',
  },
  {
    verse: 'O Senhor é o meu pastor, nada me faltará.',
    reference: 'Salmos 23:1',
    reflection:
      'Em tempos de incerteza, o Senhor guia toda a nossa família com amor e cuidado. Ele é o nosso refúgio e o provedor de todas as necessidades do nosso lar.',
  },
  {
    verse:
      'Não andem ansiosos por coisa alguma, mas em tudo apresentem seus pedidos a Deus com ação de graças.',
    reference: 'Filipenses 4:6',
    reflection:
      'A paz de Deus guarda os lares que oram juntos. Quando compartilhamos nossas preocupações em oração e cultivamos gratidão em família, o Senhor guarda nossos pensamentos em Cristo Jesus.',
  },
  {
    verse:
      'Instrui o menino no caminho em que deve andar, e até quando envelhecer não se desviará dele.',
    reference: 'Provérbios 22:6',
    reflection:
      'O exemplo de fé, amor e temor a Deus vivido dentro de casa é a maior herança que podemos deixar para as próximas gerações. Seja a luz do Senhor para a sua família hoje.',
  },
  {
    verse: 'Como é bom e agradável quando os irmãos vivem em união!',
    reference: 'Salmos 133:1',
    reflection:
      'A união em família e na célula atrai a bênção e a vida para sempre da parte do Senhor. Celebre cada momento de comunhão e oração compartilhada.',
  },
  {
    verse:
      'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.',
    reference: 'Romanos 8:28',
    reflection:
      'Mesmo em situações desafiadoras, Deus está cuidando do seu lar e entrelaçando cada momento para um propósito maior de bênção e salvação familiar.',
  },
  {
    verse: 'Tudo posso naquele que me fortalece.',
    reference: 'Filipenses 4:13',
    reflection:
      'A força para enfrentar os desafios diários da vida, trabalho e família não vem de nós mesmos, mas da graça viva de Jesus derramada em nossos corações.',
  },
  {
    verse: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.',
    reference: 'Salmos 37:5',
    reflection:
      'Descansar no Senhor é um ato de confiança corajosa. Entregue os planos da sua família nas mãos do Pai e veja a fidelidade d\'Ele transformar sua história.',
  },
];

/**
 * Loads today's devotional with offline-first caching:
 * 1. Checks memory/localStorage/IndexedDB cache for today
 * 2. If online, fetches updated devotional from server and updates cache
 * 3. If offline or request fails, seamlessly provides cached item or curated devotional
 */
export async function generateDailyDevotional(): Promise<Devotional> {
  const todayKey = getTodayDateKey();

  // 1. Check local cache (synchronous check)
  const cachedSync = getSyncDevotionalFromCache(todayKey);

  // If navigator is explicitly offline, immediately return the cached item
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (isOffline && cachedSync) {
    return {
      verse: cachedSync.verse,
      reference: cachedSync.reference,
      reflection: cachedSync.reflection,
      cachedAt: cachedSync.cachedAt,
      isOffline: true,
    };
  }

  // 2. If online, try fetching fresh devotional from server API
  if (!isOffline) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch('/api/devotional', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.verse && data.reference && data.reflection) {
          // Save to IndexedDB & localStorage cache for future offline access
          await saveDevotionalToCache(data, todayKey, 'ai');
          // Also pre-seed fallback history in background
          preseedOfflineDevotionals(FALLBACK_DEVOTIONALS).catch(() => {});

          return {
            ...data,
            cachedAt: Date.now(),
            isOffline: false,
          };
        }
      }
    } catch {
      // Network failed, timeout, or server unreachable -> smooth fallback to cache below
    }
  }

  // 3. Fallback to IndexedDB (asynchronous lookup)
  const cachedAsync = await getDevotionalFromCache(todayKey);
  if (cachedAsync) {
    return {
      verse: cachedAsync.verse,
      reference: cachedAsync.reference,
      reflection: cachedAsync.reflection,
      cachedAt: cachedAsync.cachedAt,
      isOffline: true,
    };
  }

  // 4. If neither cache has today's entry yet, pick curated fallback for today
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const fallback = FALLBACK_DEVOTIONALS[dayOfYear % FALLBACK_DEVOTIONALS.length];

  // Save the curated item into cache so subsequent offline visits find it
  await saveDevotionalToCache(fallback, todayKey, 'curated');
  preseedOfflineDevotionals(FALLBACK_DEVOTIONALS).catch(() => {});

  return {
    ...fallback,
    cachedAt: Date.now(),
    isOffline: true,
  };
}
