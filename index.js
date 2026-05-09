// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const Database = require('sqlite-async');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// environment variables (create .env file)
const PORT = process.env.PORT || 4000;
const MERCHANT_UPI = process.env.MERCHANT_UPI || 'merchant@upi';
const MERCHANT_NAME = process.env.MERCHANT_NAME || 'Glow & Scent';
const MERCHANT_WHATSAPP = process.env.MERCHANT_WHATSAPP || '91999XXXXXXX'; // country code + number, no plus sign

// Simple SQLite DB file
const DB_FILE = path.join(__dirname, 'orders.db');

let dbReady = false;
Database.open(DB_FILE)
  .then(db => {
    return db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        created_at INTEGER,
        name TEXT,
        phone TEXT,
        address TEXT,
        amount REAL,
        items TEXT,
        status TEXT
      );
    `).then(() => {
      app.locals.db = db;
      dbReady = true;
      console.log('DB ready:', DB_FILE);
    });
  })
  .catch(err => {
    console.error('Failed to open DB:', err);
  });

// Helper to create an order id
function genOrderId() {
  return 'ORD-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

// Build UPI URI
function buildUpiUri(amount, orderId, note) {
  // required fields: pa (payee vpa), pn (payee name), am (amount), cu (currency)
  // tn is transaction note (character limit applies, keeping it brief)
  const params = new URLSearchParams({
    pa: MERCHANT_UPI,
    pn: MERCHANT_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: orderId, // Use only orderId for reliability across bank apps
  });
  return `upi://pay?${params.toString()}`;
}

// Build WhatsApp prefilled link
function buildWhatsappLink(orderId, name, phone, address, items, amount) {
  // wa.me/<number>?text=<encoded text>
  const number = MERCHANT_WHATSAPP.replace(/\D/g, '');
  const textLines = [
    `New order (${orderId}) from Glow & Scent`,
    `Customer: ${name}`,
    `Phone: ${phone}`,
    `Address: ${address}`,
    `Amount: ₹${amount.toFixed(2)}`,
    `Items:`,
    ...items.map(it => `- ${it.name} x${it.qty} (₹${(it.price*it.qty).toFixed(2)})`)
  ];
  const text = encodeURIComponent(textLines.join('\n'));
  return `https://wa.me/${number}?text=${text}`;
}

// Middleware to check if DB is ready
app.use((req, res, next) => {
  if (!dbReady && req.path.startsWith('/api/')) {
    return res.status(503).json({ error: 'Database initializing, please try again in a moment.' });
  }
  next();
});

// API: create-order
app.post('/api/create-order', async (req, res) => {

  try {
    const { cart, user } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!user || !user.name || !user.phone) {
      return res.status(400).json({ error: 'Missing user details (name & phone required)' });
    }

    // compute total
    let total = 0;
    const items = cart.map(it => {
      const qty = Number(it.qty || 1);
      const price = Number(it.price || 0);
      total += price * qty;
      return { name: it.name || 'Item', qty, price };
    });

    const orderId = genOrderId();
    const createdAt = Date.now();

    // store order in DB
    const db = req.app.locals.db;
    await db.run(
      `INSERT INTO orders (id, created_at, name, phone, address, amount, items, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, createdAt, user.name, user.phone, user.address || '', total, JSON.stringify(items), 'PENDING']
    );

    // Build UPI URI & WhatsApp link
    const upiUri = buildUpiUri(total, orderId, `Order ${orderId}`);
    const whatsappLink = buildWhatsappLink(orderId, user.name, user.phone, user.address || '', items, total);

    // return data to client
    res.json({
      orderId,
      upiUri,
      whatsappLink,
      amount: total
    });

  } catch (err) {
    console.error('create-order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optional: get order by id
app.get('/api/orders/:id', async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'DB not ready' });
  const db = req.app.locals.db;
  const id = req.params.id;
  try {
    const row = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Order not found' });
    row.items = JSON.parse(row.items);
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
