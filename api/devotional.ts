import { GoogleGenAI, Type } from '@google/genai';

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

let cachedDevotional: { date: string; data: Devotional } | null = null;

export default async function handler(_req: any, res: any) {
  const today = new Date().toDateString();
  if (cachedDevotional && cachedDevotional.date === today) {
    return res.status(200).json(cachedDevotional.data);
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const fallback = FALLBACK_DEVOTIONALS[dayOfYear % FALLBACK_DEVOTIONALS.length];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    cachedDevotional = { date: today, data: fallback };
    return res.status(200).json(fallback);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents:
        'Gere um devocional cristão inspirador e bíblico para hoje. Inclua um versículo bíblico curto, a referência bíblica exata (ex: Salmos 23:1) e uma reflexão de 3 a 5 frases focada em fé, oração, comunhão e vida cristã. Responda em português.',
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
      cachedDevotional = { date: today, data: parsed };
      return res.status(200).json(parsed);
    }
    cachedDevotional = { date: today, data: fallback };
    return res.status(200).json(fallback);
  } catch {
    cachedDevotional = { date: today, data: fallback };
    return res.status(200).json(fallback);
  }
}
