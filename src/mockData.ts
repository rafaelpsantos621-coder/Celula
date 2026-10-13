import { Event, BlogPost, Question, Message, HangmanLevel, WordSearchLevel } from './types';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Noite de Oração',
    description: 'Momento de clamor e intercessão pela nossa célula.',
    date: '2026-05-13T19:30:00.000Z',
    type: 'church',
    speaker: 'Pastor João',
    dynamics: 'Dinâmica da Velas',
    worship: 'Equipe de Louvor'
  },
  {
    id: '2',
    title: 'Reunião de Célula',
    description: 'Nossa reunião semanal para comunhão e palavra.',
    date: '2026-05-14T20:00:00.000Z',
    type: 'cell',
    speaker: 'Rafael Santos',
    dynamics: 'Quebra-gelo: Verdade ou Mentira',
    worship: 'Ministério de Louvor Local',
    snackScale: 'Família Souza'
  },
  {
    id: '3',
    title: 'Culto de Celebração',
    description: 'Domingo de adoração e celebração na igreja sede.',
    date: '2026-05-17T18:00:00.000Z',
    type: 'church',
    speaker: 'Pastor Sênior',
    worship: 'Banda da Igreja'
  }
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Qual o primeiro livro da Bíblia?',
    options: ['Êxodo', 'Salmos', 'Gênesis', 'Mateus'],
    correctAnswer: 2,
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'q2',
    text: 'Quem construiu a arca para salvar sua família do Dilúvio?',
    options: ['Moisés', 'Noé', 'Abraão', 'Davi'],
    correctAnswer: 1,
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'q3',
    text: 'Quem foi o homem conhecido por sua força extraordinária?',
    options: ['Sansão', 'Gideão', 'Saul', 'Salomão'],
    correctAnswer: 0,
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'q4',
    text: 'Quantos discípulos Jesus escolheu para segui-lo?',
    options: ['7', '10', '12', '40'],
    correctAnswer: 2,
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'q5',
    text: 'Em qual cidade Jesus nasceu?',
    options: ['Nazaré', 'Jerusalém', 'Belém', 'Jericó'],
    correctAnswer: 2,
    difficulty: 'easy',
    points: 10
  },
  {
    id: 'q6',
    text: 'Quem escreveu a maioria dos Salmos?',
    options: ['Salomão', 'Davi', 'Asafe', 'Moisés'],
    correctAnswer: 1,
    difficulty: 'medium',
    points: 20
  },
  {
    id: 'q7',
    text: 'Qual é o menor versículo da Bíblia (em Português)?',
    options: ['Jesus chorou', 'Deus é amor', 'Orem sem cessar', 'No princípio era o Verbo'],
    correctAnswer: 0,
    difficulty: 'medium',
    points: 20
  },
  {
    id: 'q8',
    text: 'Quem foi jogado na cova dos leões por orar a Deus?',
    options: ['Elias', 'Isaías', 'Daniel', 'José'],
    correctAnswer: 2,
    difficulty: 'medium',
    points: 20
  },
  {
    id: 'q9',
    text: 'Qual o nome do mar que Moisés dividiu pelo poder de Deus?',
    options: ['Mar Mediterrâneo', 'Mar da Galileia', 'Mar Vermelho', 'Mar Morto'],
    correctAnswer: 2,
    difficulty: 'medium',
    points: 20
  },
  {
    id: 'q10',
    text: 'Quem negou Jesus três vezes antes do galo cantar?',
    options: ['Judas', 'João', 'Pedro', 'Tiago'],
    correctAnswer: 2,
    difficulty: 'medium',
    points: 20
  },
  {
    id: 'q11',
    text: 'Quem foi o sucessor de Moisés na liderança de Israel?',
    options: ['Arão', 'Gideão', 'Josué', 'Calebe'],
    correctAnswer: 2,
    difficulty: 'hard',
    points: 30
  },
  {
    id: 'q12',
    text: 'Qual profeta subiu ao céu num redemoinho com um carro de fogo?',
    options: ['Eliseu', 'Elias', 'Enoque', 'Samuel'],
    correctAnswer: 1,
    difficulty: 'hard',
    points: 30
  },
  {
    id: 'q13',
    text: 'Quantos livros existem no Novo Testamento?',
    options: ['27', '39', '66', '12'],
    correctAnswer: 0,
    difficulty: 'hard',
    points: 30
  },
  {
    id: 'q14',
    text: 'Qual o autor do livro de Atos dos Apóstolos?',
    options: ['Paulo', 'Pedro', 'Marcos', 'Lucas'],
    correctAnswer: 3,
    difficulty: 'hard',
    points: 30
  },
  {
    id: 'q15',
    text: 'Quem foi a esposa de Isaque?',
    options: ['Sara', 'Raquel', 'Rebeca', 'Lia'],
    correctAnswer: 2,
    difficulty: 'hard',
    points: 30
  },
  {
    id: 'q16',
    text: 'Qual rei teve sua vida prolongada por 15 anos após orar?',
    options: ['Josias', 'Ezequias', 'Uziarias', 'Acaz'],
    correctAnswer: 1,
    difficulty: 'master',
    points: 50
  },
  {
    id: 'q17',
    text: 'Qual filho de Davi se rebelou e tentou tomar o trono de seu pai?',
    options: ['Salomão', 'Absalão', 'Adonias', 'Amnom'],
    correctAnswer: 1,
    difficulty: 'master',
    points: 50
  },
  {
    id: 'q18',
    text: 'Em qual cidade os discípulos foram chamados de "cristãos" pela primeira vez?',
    options: ['Roma', 'Éfeso', 'Antioquia', 'Corinto'],
    correctAnswer: 2,
    difficulty: 'master',
    points: 50
  },
  {
    id: 'q19',
    text: 'Qual era o nome do sogro de Moisés, sacerdote de Midiã?',
    options: ['Jetro', 'Labão', 'Melquisedeque', 'Nadabe'],
    correctAnswer: 0,
    difficulty: 'master',
    points: 50
  },
  {
    id: 'q20',
    text: 'De onde era o profeta Amós e qual era sua ocupação original?',
    options: ['Jerusalém, Sacerdote', 'Tecoa, Boiadeiro', 'Belém, Pastor', 'Nazaré, Carpinteiro'],
    correctAnswer: 1,
    difficulty: 'extreme',
    points: 100
  }
];

export const MOCK_HANGMAN_LEVELS: HangmanLevel[] = [
  { word: 'JERUSALEM', hint: 'Cidade onde Jesus foi crucificado e ressuscitou' },
  { word: 'MOISES', hint: 'Líder que libertou o povo do Egito atravessando o mar' },
  { word: 'ABRAAO', hint: 'Chamado de pai de multidões e amigo de Deus' },
  { word: 'GOLIAS', hint: 'Gigante filisteu derrotado pelo jovem Davi' },
  { word: 'NAZARE', hint: 'Cidade da Galileia onde Jesus passou sua infância' },
  { word: 'BELEM', hint: 'Cidade de Judá onde nasceu o Salvador' },
  { word: 'SAMUEL', hint: 'Profeta que ungiu os primeiros reis de Israel' },
  { word: 'ESTER', hint: 'Rainha que intercedeu pela salvação de seu povo' },
  { word: 'DEBORA', hint: 'Profetisa que julgou Israel debaixo de uma palmeira' },
  { word: 'GIDEAO', hint: 'Líder que venceu os midianitas com apenas 300 homens' },
  { word: 'JOSUE', hint: 'Líder que conduziu o povo na conquista de Jericó' },
  { word: 'ELIAS', hint: 'Profeta que subiu ao céu num carro de fogo' },
  { word: 'ELISEU', hint: 'Profeta que pediu porção dobrada do espírito de Elias' },
  { word: 'SALOMAO', hint: 'Rei que construiu o primeiro templo em Jerusalém' },
  { word: 'NOE', hint: 'Homem justo que encontrou graça para salvar a vida na Terra' },
  { word: 'MATEUS', hint: 'Cobrador de impostos que se tornou um dos doze' },
  { word: 'PAULO', hint: 'Perseguidor da igreja que teve um encontro no caminho de Damasco' },
  { word: 'PEDRO', hint: 'O apóstolo que andou sobre as águas com Jesus' },
  { word: 'TIAGO', hint: 'Filho de Zebedeu e um dos doze discípulos' },
  { word: 'JOAO', hint: 'Autor do livro de Apocalipse na ilha de Patmos' }
];

export const MOCK_WORDSEARCH_LEVELS: WordSearchLevel[] = [
  { theme: 'Nomes de Jesus', words: ['JESUS', 'CRISTO', 'MESTRE', 'FILHO', 'VERBO'] },
  { theme: 'Fruto do Espírito', words: ['AMOR', 'GOZO', 'PAZ', 'BONDADE', 'FE'] },
  { theme: 'Pentateuco', words: ['GENESIS', 'EXODO', 'NUMEROS', 'JOAO', 'ATOS'] }, // Note: Intentional mix or difficulty? Let's use real ones
  { theme: 'Profetas', words: ['ISAIAS', 'DANIEL', 'OSEIAS', 'AMOS', 'MIQUEIAS'] },
  { theme: 'Evangelhos', words: ['MATEUS', 'MARCOS', 'LUCAS', 'JOAO', 'ATOS'] },
  { theme: 'Montanhas', words: ['SINAI', 'HERMON', 'TABOR', 'CARMELO', 'HOREBE'] },
  { theme: 'Rios e Mares', words: ['JORDAO', 'NILO', 'TIGRE', 'EUFRATES', 'MORTO'] },
  { theme: 'Reis de Israel', words: ['SAUL', 'DAVI', 'SALOMAO', 'JOSIAS', 'ACAZ'] },
  { theme: 'Mulheres da Bíblia', words: ['SARA', 'REBECA', 'RAQUEL', 'ESTER', 'RUTE'] },
  { theme: 'Cidades Bíblicas', words: ['JERICO', 'NINIVE', 'ROMA', 'EFESO', 'CORINTO'] },
  { theme: 'Parábolas', words: ['FILHO', 'OVELHA', 'TALENTO', 'DRACMA', 'TRIGO'] },
  { theme: 'Milagres', words: ['CURA', 'VIDA', 'VINHO', 'PAO', 'PEIXE'] },
  { theme: 'Valores Cristãos', words: ['JUSTICA', 'PERDAO', 'VERDADE', 'MANSO', 'PURA'] },
  { theme: 'Armadura de Deus', words: ['ESCUDO', 'ESPADA', 'CINTO', 'YELMO', 'ZAPATO'] }, // Correcting some to Portuguese or standard refs
  { theme: 'Atributos de Deus', words: ['SANTO', 'FIEL', 'JUSTO', 'ETERNO', 'ONIPOTENTE'] },
  { theme: 'Discípulos', words: ['ANDRE', 'FILIPE', 'TOME', 'TADEU', 'SIMAO'] },
  { theme: 'Epístolas', words: ['ROMANOS', 'GALATAS', 'EFESIOS', 'HEBREUS', 'JUDAS'] },
  { theme: 'Oração', words: ['PAI', 'NOSSO', 'REINO', 'GLORIA', 'AMEM'] },
  { theme: 'Aliança', words: ['ARCO', 'SANGUE', 'PROMESSA', 'LEI', 'GRACA'] },
  { theme: 'Vida Eterna', words: ['CEU', 'COROA', 'Luz', 'SANTO', 'SALVO'] }
];

export const MOCK_POSTS: BlogPost[] = [
  {
    id: 'p1',
    authorId: 'admin',
    authorName: 'Pastor João',
    title: 'A Importância da Oração',
    content: 'Hoje vamos refletir sobre como a oração nos conecta diretamente com Deus...',
    createdAt: Date.now() - 3600000 * 5
  }
];
