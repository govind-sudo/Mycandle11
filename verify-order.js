export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { orderId } = req.query;
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

  try {
    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CF_APP_ID,
        'x-client-secret': process.env.CF_SECRET_KEY,
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
