export interface BibleVerse {
  id: string;
  verse: string;
  reference: string;
  theme?: string;
}

export const DAILY_BIBLE_VERSES: BibleVerse[] = [
  {
    id: 'v1',
    verse: 'Eu e a minha casa serviremos ao Senhor.',
    reference: 'Josué 24:15',
    theme: 'Família & Aliança',
  },
  {
    id: 'v2',
    verse: 'O Senhor é o meu pastor; nada me faltará.',
    reference: 'Salmos 23:1',
    theme: 'Provisão & Cuidado',
  },
  {
    id: 'v3',
    verse: 'Entrega o teu caminho ao Senhor; confia nele, e ele o fará.',
    reference: 'Salmos 37:5',
    theme: 'Confiança',
  },
  {
    id: 'v4',
    verse: 'Instrui o menino no caminho em que deve andar, e até quando envelhecer não se desviará dele.',
    reference: 'Provérbios 22:6',
    theme: 'Lar & Ensino',
  },
  {
    id: 'v5',
    verse: 'Tudo posso naquele que me fortalece.',
    reference: 'Filipenses 4:13',
    theme: 'Fortaleza',
  },
  {
    id: 'v6',
    verse: 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.',
    reference: '1 Coríntios 13:4',
    theme: 'Amor & União',
  },
  {
    id: 'v7',
    verse: 'Não andem ansiosos por coisa alguma, mas em tudo apresentem os seus pedidos a Deus.',
    reference: 'Filipenses 4:6',
    theme: 'Paz & Oração',
  },
  {
    id: 'v8',
    verse: 'Como é bom e agradável quando os irmãos vivem em união!',
    reference: 'Salmos 133:1',
    theme: 'Comunhão',
  },
  {
    id: 'v9',
    verse: 'Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.',
    reference: 'Salmos 119:105',
    theme: 'Palavra de Deus',
  },
  {
    id: 'v10',
    verse: 'Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.',
    reference: 'Romanos 12:12',
    theme: 'Esperança',
  },
  {
    id: 'v11',
    verse: 'Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor estará com você por onde você andar.',
    reference: 'Josué 1:9',
    theme: 'Coragem',
  },
  {
    id: 'v12',
    verse: 'O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti.',
    reference: 'Números 6:24-25',
    theme: 'Bênção Sacerdotal',
  },
  {
    id: 'v13',
    verse: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar.',
    reference: 'Jeremias 29:11',
    theme: 'Propósito Divino',
  },
  {
    id: 'v14',
    verse: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.',
    reference: 'Mateus 11:28',
    theme: 'Descanso em Jesus',
  },
  {
    id: 'v15',
    verse: 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam.',
    reference: 'Romanos 8:28',
    theme: 'Fidelidade de Deus',
  },
  {
    id: 'v16',
    verse: 'Herança do Senhor são os filhos; o fruto do ventre, o seu galardão.',
    reference: 'Salmos 127:3',
    theme: 'Família & Herança',
  },
  {
    id: 'v17',
    verse: 'Acima de tudo, porém, revistam-se do amor, que é o elo perfeito.',
    reference: 'Colossenses 3:14',
    theme: 'União Familiar',
  },
  {
    id: 'v18',
    verse: 'A paz vos deixo, a minha paz vos dou; não vo-la dou como o mundo a dá.',
    reference: 'João 14:27',
    theme: 'Paz de Cristo',
  },
  {
    id: 'v19',
    verse: 'Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas.',
    reference: 'Mateus 6:33',
    theme: 'Prioridade Espiritual',
  },
  {
    id: 'v20',
    verse: 'O Senhor é a minha luz e a minha salvação; de quem terei medo?',
    reference: 'Salmos 27:1',
    theme: 'Segurança & Fé',
  }
];

export async function fetchDailyVerse(): Promise<BibleVerse> {
  try {
    const res = await fetch('/api/verse-of-the-day');
    if (res.ok) {
      const data = await res.json();
      if (data && data.verse && data.reference) {
        return data;
      }
    }
  } catch {
    // fallback below
  }

  // Fallback to random verse from local list
  const randomIndex = Math.floor(Math.random() * DAILY_BIBLE_VERSES.length);
  return DAILY_BIBLE_VERSES[randomIndex];
}

export function getRandomLocalVerse(excludeId?: string): BibleVerse {
  const filtered = excludeId
    ? DAILY_BIBLE_VERSES.filter((v) => v.id !== excludeId)
    : DAILY_BIBLE_VERSES;
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index] || DAILY_BIBLE_VERSES[0];
}
