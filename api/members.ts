let inMemoryMembers: any[] = [];

export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const memberData = req.body;
    if (!memberData || !memberData.id || !memberData.name) {
      return res.status(400).json({ error: 'Dados de membro inválidos' });
    }

    const safeName = String(memberData.name).trim().substring(0, 50);
    const index = inMemoryMembers.findIndex((m) => m.id === memberData.id);

    const memberToSave = {
      id: memberData.id,
      name: safeName,
      role: memberData.role || 'member',
      points: typeof memberData.points === 'number' ? memberData.points : 0,
      avatarUrl: memberData.avatarUrl || '',
      bio: memberData.bio || '',
      phone: memberData.phone || '',
      familyRole: memberData.familyRole || '',
      joinedAt: index >= 0 && inMemoryMembers[index].joinedAt ? inMemoryMembers[index].joinedAt : Date.now(),
      lastActive: Date.now(),
    };

    if (index >= 0) {
      inMemoryMembers[index] = { ...inMemoryMembers[index], ...memberToSave };
    } else {
      inMemoryMembers.push(memberToSave);
    }

    return res.status(200).json(memberToSave);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (id) {
      inMemoryMembers = inMemoryMembers.filter((m) => m.id !== id);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(200).json(inMemoryMembers);
}
