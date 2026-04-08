export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' });

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts/lists/3', {
      headers: { 'api-key': apiKey },
    });

    if (!response.ok) return res.status(500).json({ error: 'Error consultando Brevo' });

    const data = await response.json();
    return res.status(200).json({ count: data.totalSubscribers || 0 });
  } catch (err) {
    console.error('Count error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
