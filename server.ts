import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const UPLOAD_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration for uploads (videos, audio, docs, images)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    cb(null, `${safeBaseName}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 250 * 1024 * 1024, // Up to 250MB video / file limit
  },
});

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_DIR));

// Ensure data directory exists for shared persistence
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSONFile<T>(filename: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.warn(`Erro ao ler arquivo ${filename}:`, err);
  }
  return fallback;
}

function writeJSONFile<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Erro ao salvar arquivo ${filename}:`, err);
  }
}

// Clean initial messages - no bot or mock users
const DEFAULT_MESSAGES: any[] = [];

// Initial seed posts
const DEFAULT_POSTS = [
  {
    id: 'p1',
    authorId: 'adm1',
    authorName: 'Liderança',
    title: 'Bem-vindos à Célula Despertar!',
    content:
      'Este é o nosso espaço de comunhão, oração e fortalecimento espiritual. Fiquem à vontade para interagir no chat, conferir a agenda e compartilhar testemunhos na comunidade!',
    createdAt: Date.now() - 86400000,
    imageUrl:
      'https://images.unsplash.com/photo-1544427928-c49cdfebf194?w=800',
  },
];

// --- Shared Members API (Real Members Only - No Bots) ---
app.get('/api/members', (_req, res) => {
  const members = readJSONFile<any[]>('members.json', []);
  res.json(members);
});

app.post('/api/members', (req, res) => {
  const memberData = req.body;
  if (!memberData || !memberData.id || !memberData.name) {
    return res.status(400).json({ error: 'Dados do membro incompletos' });
  }

  // Sanitize: ensure no bot is ever inserted
  const safeName = String(memberData.name).trim();
  if (safeName.toLowerCase().includes('bot')) {
    return res.status(400).json({ error: 'Nome inválido' });
  }

  const members = readJSONFile<any[]>('members.json', []);
  const index = members.findIndex((m) => m.id === memberData.id);

  const memberToSave = {
    id: memberData.id,
    name: safeName,
    role: memberData.role || 'member',
    points: typeof memberData.points === 'number' ? memberData.points : 0,
    avatarUrl: memberData.avatarUrl || '',
    bio: memberData.bio || '',
    phone: memberData.phone || '',
    familyRole: memberData.familyRole || '',
    joinedAt: index >= 0 && members[index].joinedAt ? members[index].joinedAt : Date.now(),
    lastActive: Date.now(),
  };

  let updated;
  if (index >= 0) {
    updated = [...members];
    updated[index] = { ...updated[index], ...memberToSave };
  } else {
    updated = [...members, memberToSave];
  }

  writeJSONFile('members.json', updated);
  res.status(200).json(memberToSave);
});

app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const members = readJSONFile<any[]>('members.json', []);
  const updated = members.filter((m) => m.id !== id);
  writeJSONFile('members.json', updated);
  res.json({ success: true, count: updated.length });
});

// --- Shared Messages API (Clean & Real) ---
app.get('/api/messages', (_req, res) => {
  const messages = readJSONFile<any[]>('messages.json', DEFAULT_MESSAGES);
  // Guarantee no legacy mock messages (Sarah/Tiago/bot) leak through
  const realMessages = messages.filter(
    (m) =>
      m.senderId !== 'prev' &&
      m.senderId !== 'prev2' &&
      m.senderId !== 'bot' &&
      m.senderName !== 'Sarah' &&
      m.senderName !== 'Tiago' &&
      !m.senderName?.toLowerCase().includes('bot')
  );
  if (realMessages.length !== messages.length) {
    writeJSONFile('messages.json', realMessages);
  }
  res.json(realMessages);
});

app.post('/api/messages', (req, res) => {
  const newMsg = req.body;
  if (!newMsg || (!newMsg.text && !newMsg.attachment)) {
    return res.status(400).json({ error: 'Mensagem vazia' });
  }
  const messages = readJSONFile<any[]>('messages.json', DEFAULT_MESSAGES);
  const exists = messages.some((m) => m.id === newMsg.id);
  const updated = exists ? messages : [...messages, newMsg];
  writeJSONFile('messages.json', updated);
  res.status(201).json(newMsg);
});

app.delete('/api/messages', (_req, res) => {
  writeJSONFile('messages.json', []);
  res.json({ success: true, messages: [] });
});

// --- Shared Blog Posts API ---
app.get('/api/posts', (_req, res) => {
  const posts = readJSONFile('posts.json', DEFAULT_POSTS);
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const newPost = req.body;
  if (!newPost || !newPost.title) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }
  const posts = readJSONFile<any[]>('posts.json', DEFAULT_POSTS);
  const filtered = posts.filter((p) => p.id !== newPost.id);
  const updated = [newPost, ...filtered];
  writeJSONFile('posts.json', updated);
  res.status(201).json(newPost);
});

app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const posts = readJSONFile<any[]>('posts.json', DEFAULT_POSTS);
  const updated = posts.filter((p) => p.id !== id);
  writeJSONFile('posts.json', updated);
  res.json({ success: true });
});

// --- Shared Events & Scales API ---
app.get('/api/events', (_req, res) => {
  const events = readJSONFile<any[]>('events.json', []);
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const newEvent = req.body;
  if (!newEvent || !newEvent.title) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }
  const events = readJSONFile<any[]>('events.json', []);
  const index = events.findIndex((e) => e.id === newEvent.id);
  let updated;
  if (index >= 0) {
    updated = [...events];
    updated[index] = { ...updated[index], ...newEvent };
  } else {
    updated = [...events, newEvent];
  }
  writeJSONFile('events.json', updated);
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const patch = req.body;
  const events = readJSONFile<any[]>('events.json', []);
  const index = events.findIndex((e) => e.id === id);
  if (index >= 0) {
    events[index] = { ...events[index], ...patch };
    writeJSONFile('events.json', events);
    return res.json(events[index]);
  }
  const newEv = { id, ...patch };
  events.push(newEv);
  writeJSONFile('events.json', events);
  res.json(newEv);
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const events = readJSONFile<any[]>('events.json', []);
  const updated = events.filter((e) => e.id !== id);
  writeJSONFile('events.json', updated);
  res.json({ success: true });
});

// --- Shared Cell Address API ---
app.get('/api/address', (_req, res) => {
  const data = readJSONFile('address.json', {
    address: 'Rua da Fé, 123 - Centro',
  });
  res.json(data);
});

app.post('/api/address', (req, res) => {
  const { address } = req.body;
  const data = { address: address || 'Rua da Fé, 123 - Centro' };
  writeJSONFile('address.json', data);
  res.json(data);
});

// Upload API route
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'O arquivo excede o limite máximo permitido de 250 MB.',
        });
      }
      return res.status(500).json({
        error: err.message || 'Erro ao processar envio do arquivo.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      url: fileUrl,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
});

interface Devotional {
  verse: string;
  reference: string;
  reflection: string;
}

const FALLBACK_DEVOTIONALS: Devotional[] = [
  {
    verse: 'O Senhor é o meu pastor, nada me faltará.',
    reference: 'Salmos 23:1',
    reflection:
      'Em tempos de incerteza, o Senhor nos guia com amor e cuidado. Ele é o nosso refúgio e o provedor de todas as nossas necessidades. Confie que Ele está cuidando de cada detalhe da sua vida hoje.',
  },
  {
    verse:
      'Não andem ansiosos por coisa alguma, mas em tudo apresentem seus pedidos a Deus com ação de graças.',
    reference: 'Filipenses 4:6',
    reflection:
      'A paz de Deus transcende todo o entendimento humano. Quando colocamos nossas preocupações em oração e cultivamos um coração grato, o Senhor guarda nossos pensamentos em Cristo Jesus.',
  },
  {
    verse:
      'Aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos.',
    reference: 'Isaías 40:31',
    reflection:
      'O cansaço físico e espiritual pode nos abater, mas o poder restaurador de Deus é inesgotável. Espere pacientemente no Senhor e permita que a presença d\'Ele renove seu ânimo hoje.',
  },
  {
    verse:
      'Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.',
    reference: 'Josué 1:9',
    reflection:
      'A verdadeira coragem não nasce da ausência do medo, mas da certeza de que Deus caminha ao nosso lado em qualquer jornada. Avance com fé e propósito na caminhada da célula.',
  },
  {
    verse:
      'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.',
    reference: 'Provérbios 3:5',
    reflection:
      'Nossos planos são limitados pela nossa visão terrena, mas os propósitos de Deus são eternos e perfeitos. Submeta seus caminhos ao Pai e Ele endireitará suas veredas.',
  },
  {
    verse:
      'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.',
    reference: 'Romanos 8:28',
    reflection:
      'Mesmo em situações que parecem contrárias, Deus está entrelaçando cada momento para um propósito maior. Mantenha o coração firme na fidelidade do Pai.',
  },
];

let serverCachedDevotional: { date: string; data: Devotional } | null = null;

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function generateDevotional(): Promise<Devotional> {
  const today = new Date().toDateString();
  if (serverCachedDevotional && serverCachedDevotional.date === today) {
    return serverCachedDevotional.data;
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const fallback = FALLBACK_DEVOTIONALS[dayOfYear % FALLBACK_DEVOTIONALS.length];

  const ai = getAIClient();
  if (!ai) {
    serverCachedDevotional = { date: today, data: fallback };
    return fallback;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents:
        'Gere um devocional cristão inspirador e bíblico para hoje. Inclua um versículo bíblico curto, a referência bíblica exata (ex: Salmos 23:1 ou Josué 24:15) e uma reflexão edificante de 3 a 5 frases focada na família, lar cristão, oração, comunhão e fidelidade a Deus. Responda em português.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verse: { type: Type.STRING },
            reference: { type: Type.STRING },
            reflection: { type: Type.STRING },
          },
          required: ['verse', 'reference', 'reflection'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.verse && parsed.reference && parsed.reflection) {
      serverCachedDevotional = { date: today, data: parsed };
      return parsed;
    }
    serverCachedDevotional = { date: today, data: fallback };
    return fallback;
  } catch (error) {
    console.warn(
      'Gemini API em quota ou indisponibilidade temporária. Servindo devocional seguro do dia:',
      error instanceof Error ? error.message : error
    );
    serverCachedDevotional = { date: today, data: fallback };
    return fallback;
  }
}

app.get('/api/devotional', async (_req, res) => {
  try {
    const devotional = await generateDevotional();
    res.json(devotional);
  } catch {
    res.json(FALLBACK_DEVOTIONALS[0]);
  }
});

const SERVER_VERSES = [
  { id: 'v1', verse: 'Eu e a minha casa serviremos ao Senhor.', reference: 'Josué 24:15', theme: 'Família & Aliança' },
  { id: 'v2', verse: 'O Senhor é o meu pastor; nada me faltará.', reference: 'Salmos 23:1', theme: 'Provisão & Cuidado' },
  { id: 'v3', verse: 'Entrega o teu caminho ao Senhor; confia nele, e ele o fará.', reference: 'Salmos 37:5', theme: 'Confiança' },
  { id: 'v4', verse: 'Instrui o menino no caminho em que deve andar, e até quando envelhecer não se desviará dele.', reference: 'Provérbios 22:6', theme: 'Lar & Ensino' },
  { id: 'v5', verse: 'Tudo posso naquele que me fortalece.', reference: 'Filipenses 4:13', theme: 'Fortaleza' },
  { id: 'v6', verse: 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.', reference: '1 Coríntios 13:4', theme: 'Amor & União' },
  { id: 'v7', verse: 'Não andem ansiosos por coisa alguma, mas em tudo apresentem os seus pedidos a Deus.', reference: 'Filipenses 4:6', theme: 'Paz & Oração' },
  { id: 'v8', verse: 'Como é bom e agradável quando os irmãos vivem em união!', reference: 'Salmos 133:1', theme: 'Comunhão' },
  { id: 'v9', verse: 'Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.', reference: 'Salmos 119:105', theme: 'Palavra de Deus' },
  { id: 'v10', verse: 'Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.', reference: 'Romanos 12:12', theme: 'Esperança' }
];

app.get('/api/verse-of-the-day', (_req, res) => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const verse = SERVER_VERSES[dayOfYear % SERVER_VERSES.length];
  res.json(verse);
});

// Serve static public folder (favicon, og-image, manifest)
app.use(express.static(path.resolve(__dirname, 'public')));

// Convenient alias routes for members accessing friendly paths
app.get(
  [
    '/celula-despertar',
    '/celuladespertar',
    '/celula',
    '/despertar',
    '/convite',
    '/app',
  ],
  (_req, res) => {
    res.redirect('/');
  }
);

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
