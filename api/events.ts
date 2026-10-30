let inMemoryEvents: any[] = [];

export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const newEvent = req.body;
    if (!newEvent || !newEvent.title) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    const index = inMemoryEvents.findIndex((e) => e.id === newEvent.id);
    if (index >= 0) {
      inMemoryEvents[index] = { ...inMemoryEvents[index], ...newEvent };
    } else {
      inMemoryEvents.push(newEvent);
    }
    return res.status(201).json(newEvent);
  }

  if (req.method === 'PUT') {
    const { id } = req.query || {};
    const patch = req.body || {};
    const index = inMemoryEvents.findIndex((e) => e.id === id);
    if (index >= 0) {
      inMemoryEvents[index] = { ...inMemoryEvents[index], ...patch };
      return res.status(200).json(inMemoryEvents[index]);
    }
    const newEv = { id, ...patch };
    inMemoryEvents.push(newEv);
    return res.status(200).json(newEv);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (id) {
      inMemoryEvents = inMemoryEvents.filter((e) => e.id !== id);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(200).json(inMemoryEvents);
}
