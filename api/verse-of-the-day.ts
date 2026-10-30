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

export default function handler(_req: any, res: any) {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const verse = SERVER_VERSES[dayOfYear % SERVER_VERSES.length];
  res.status(200).json(verse);
}
