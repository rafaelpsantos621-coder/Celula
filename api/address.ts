let inMemoryAddress = 'Rua da Fé, 123 - Centro';

export default function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { address } = req.body || {};
    if (address && typeof address === 'string') {
      inMemoryAddress = address;
    }
    return res.status(200).json({ address: inMemoryAddress });
  }

  return res.status(200).json({ address: inMemoryAddress });
}
