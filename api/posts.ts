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

let inMemoryPosts: any[] = [...DEFAULT_POSTS];

export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const newPost = req.body;
    if (!newPost || !newPost.title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    const filtered = inMemoryPosts.filter((p) => p.id !== newPost.id);
    inMemoryPosts = [newPost, ...filtered];
    return res.status(201).json(newPost);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (id) {
      inMemoryPosts = inMemoryPosts.filter((p) => p.id !== id);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(200).json(inMemoryPosts);
}
