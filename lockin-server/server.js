require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const SALT_ROUNDS = 12;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const JWT_SECRET  = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}
const JWT_EXPIRES = '7d';

const Razorpay = require('razorpay');
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// ─── DATABASE ─────────────────────────────────────────────────────────────────
const db = new sqlite3.Database(path.join(__dirname, 'lockin.db'), (err) => {
  if (err) { console.error('DB error:', err.message); process.exit(1); }
});

db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS waitlist (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT UNIQUE NOT NULL,
    joined_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    username           TEXT UNIQUE NOT NULL,
    email              TEXT UNIQUE NOT NULL,
    password_hash      TEXT NOT NULL DEFAULT '',
    google_id          TEXT UNIQUE,
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    streak             INTEGER NOT NULL DEFAULT 0,
    points             INTEGER NOT NULL DEFAULT 0,
    sessions_completed INTEGER NOT NULL DEFAULT 0,
    penalties          INTEGER NOT NULL DEFAULT 0,
    is_active          INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    started_at    TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at      TEXT,
    duration      INTEGER NOT NULL,
    stake         REAL    NOT NULL DEFAULT 0,
    outcome       TEXT,
    points_earned INTEGER NOT NULL DEFAULT 0,
    blur_count    INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )`);

  // Add google_id column to existing DBs (safe no-op if already exists)
  db.run(`ALTER TABLE users ADD COLUMN google_id TEXT`, () => {});

  // Seed demo leaderboard users on first run
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (!err && row && row.count === 0) {
      const demoHash = bcrypt.hashSync('demo1234', 10);
      const stmt = db.prepare(
        `INSERT OR IGNORE INTO users (username, email, password_hash, streak, points, sessions_completed)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      [
        ['Alex_Dev',  'alex@demo.lockin',   142, 8750, 156],
        ['SarahJ',    'sarah@demo.lockin',  118, 7230, 134],
        ['Marcus_99', 'marcus@demo.lockin',  97, 6890, 127],
        ['Tejas_U',   'tejas@demo.lockin',   84, 5740, 108],
        ['Dev_P',     'devp@demo.lockin',    71, 5230,  97],
        ['Rohan_V',   'rohan@demo.lockin',   63, 4810,  89],
        ['Sara_T',    'sarat@demo.lockin',   54, 4120,  76],
      ].forEach(([u, e, s, p, sc]) => stmt.run(u, e, demoHash, s, p, sc));
      stmt.finalize();
      console.log('  ▸ Demo users seeded');
    }
  });
});

// Promisified DB helpers
const dbRun = (sql, p = []) =>
  new Promise((res, rej) => db.run(sql, p, function (err) { err ? rej(err) : res(this); }));
const dbGet = (sql, p = []) =>
  new Promise((res, rej) => db.get(sql, p, (err, row) => err ? rej(err) : res(row)));
const dbAll = (sql, p = []) =>
  new Promise((res, rej) => db.all(sql, p, (err, rows) => err ? rej(err) : res(rows)));

// ─── EXPRESS SETUP ────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  `http://localhost:${PORT},http://127.0.0.1:${PORT},http://localhost:3000,http://127.0.0.1:3000`
).split(',').map(o => o.trim()).filter(Boolean);

app.disable('x-powered-by');
if ((process.env.TRUST_PROXY || '').toLowerCase() === 'true') app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..')));

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function authRequired(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}

// ─── PUBLIC CONFIG (non-secret keys for frontend) ───────────────────────────
app.get('/api/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID });
});

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get('/healthz', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password)
    return res.status(400).json({ error: 'username, email and password are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return res.status(400).json({ error: 'Username: 3-20 chars, letters/numbers/underscores only' });
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await dbRun(
      `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
      [username, email, hash]
    );
    const user = await dbGet(
      'SELECT id, username, email, streak, points, sessions_completed, penalties FROM users WHERE id = ?',
      [result.lastID]
    );
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ ok: true, token, user });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      const field = err.message.includes('username') ? 'username' : 'email';
      return res.status(409).json({ error: `That ${field} is already taken` });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password)
    return res.status(400).json({ error: 'login and password are required' });
  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ? OR username = ?', [login, login]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    await dbRun('UPDATE users SET is_active = 1 WHERE id = ?', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({
      ok: true, token,
      user: { id: user.id, username: user.username, email: user.email,
               streak: user.streak, points: user.points,
               sessions_completed: user.sessions_completed, penalties: user.penalties }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, username, email, streak, points, sessions_completed, penalties, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    const recentSessions = await dbAll(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 10',
      [req.user.id]
    );
    res.json({ ok: true, user, recentSessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/auth/logout', authRequired, async (req, res) => {
  await dbRun('UPDATE users SET is_active = 0 WHERE id = ?', [req.user.id]).catch(() => {});
  res.json({ ok: true });
});

// Google OAuth — verify ID token issued by Google and sign in / register
app.post('/api/auth/google', async (req, res) => {
  if (!googleClient)
    return res.status(501).json({ error: 'Google sign-in is not configured on this server. Add GOOGLE_CLIENT_ID to .env.' });
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'credential is required' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const { sub: googleId, email, name, picture } = ticket.getPayload();
    // Find existing user by google_id or email
    let user = await dbGet('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
    if (user) {
      if (!user.google_id) await dbRun('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
      await dbRun('UPDATE users SET is_active = 1 WHERE id = ?', [user.id]);
    } else {
      // Derive a safe username from the Google display name / email
      let base = (name || email.split('@')[0]).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18) || 'user';
      let username = base;
      if (await dbGet('SELECT id FROM users WHERE username = ?', [username]))
        username = `${base}_${Date.now().toString().slice(-4)}`;
      const result = await dbRun(
        `INSERT INTO users (username, email, password_hash, google_id, is_active) VALUES (?, ?, '', ?, 1)`,
        [username, email, googleId]
      );
      user = await dbGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({
      ok: true, token,
      user: { id: user.id, username: user.username, email: user.email,
              streak: user.streak, points: user.points,
              sessions_completed: user.sessions_completed, penalties: user.penalties },
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
  }
});

// ─── LEADERBOARD (from DB) ────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  try {
    const rows = await dbAll(
      'SELECT id, username, streak, points, sessions_completed, is_active FROM users ORDER BY points DESC LIMIT 20'
    );
    res.json(rows.map((u, i) => ({ ...u, rank: i + 1 })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [sessRow, userRow, activeRow] = await Promise.all([
      dbGet('SELECT COUNT(*) as count FROM sessions'),
      dbGet('SELECT COUNT(*) as count FROM users'),
      dbGet('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
    ]);
    res.json({
      totalSessions: (sessRow?.count || 0) + 4200,
      totalStudents:  (userRow?.count || 0) + 1800,
      completionRate: 92,
      activeLive:     (activeRow?.count || 0) + 124,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── SESSION ROUTES (auth required) ──────────────────────────────────────────
app.post('/api/session/start', authRequired, async (req, res) => {
  const { duration, stake } = req.body || {};
  if (!duration || stake == null)
    return res.status(400).json({ error: 'duration and stake are required' });
  try {
    const existing = await dbGet(
      `SELECT * FROM sessions WHERE user_id = ? AND outcome IS NULL ORDER BY started_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (existing) {
      const elapsed = (Date.now() - new Date(existing.started_at).getTime()) / 1000;
      if (elapsed < existing.duration + 60)
        return res.status(409).json({ error: 'Session already in progress', session: existing });
      await dbRun(`UPDATE sessions SET outcome='abandoned', ended_at=datetime('now') WHERE id=?`, [existing.id]);
    }
    const result = await dbRun(
      `INSERT INTO sessions (user_id, duration, stake) VALUES (?, ?, ?)`,
      [req.user.id, Number(duration), Number(stake)]
    );
    await dbRun('UPDATE users SET is_active = 1 WHERE id = ?', [req.user.id]);
    const session = await dbGet('SELECT * FROM sessions WHERE id = ?', [result.lastID]);
    res.json({ ok: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

app.post('/api/session/complete', authRequired, async (req, res) => {
  try {
    const session = await dbGet(
      `SELECT * FROM sessions WHERE user_id = ? AND outcome IS NULL ORDER BY started_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!session) return res.status(400).json({ error: 'No active session' });
    const elapsed = (Date.now() - new Date(session.started_at).getTime()) / 1000;
    const completed = elapsed >= session.duration * 0.9 && session.blur_count === 0;
    let outcome, pointsEarned = 0;
    if (completed) {
      outcome = 'completed';
      pointsEarned = Math.round((session.duration / 60) * 30 + session.stake * 2);
      await dbRun(
        `UPDATE users SET points=points+?, streak=streak+1, sessions_completed=sessions_completed+1 WHERE id=?`,
        [pointsEarned, req.user.id]
      );
    } else if (session.blur_count > 0) {
      outcome = 'penalised';
      await dbRun(
        `UPDATE users SET points=MAX(0,points-50), streak=0, penalties=penalties+1 WHERE id=?`,
        [req.user.id]
      );
    } else {
      outcome = 'abandoned';
      await dbRun('UPDATE users SET streak=0 WHERE id=?', [req.user.id]);
    }
    await dbRun(
      `UPDATE sessions SET outcome=?, ended_at=datetime('now'), points_earned=? WHERE id=?`,
      [outcome, pointsEarned, session.id]
    );
    await dbRun('UPDATE users SET is_active=0 WHERE id=?', [req.user.id]);
    const updated = await dbGet('SELECT points, streak FROM users WHERE id=?', [req.user.id]);
    res.json({ ok: true, outcome, pointsEarned, newPoints: updated.points, newStreak: updated.streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

app.post('/api/session/penalty', authRequired, async (req, res) => {
  try {
    const session = await dbGet(
      `SELECT * FROM sessions WHERE user_id = ? AND outcome IS NULL ORDER BY started_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!session) return res.status(400).json({ error: 'No active session' });
    await dbRun('UPDATE sessions SET blur_count=blur_count+1 WHERE id=?', [session.id]);
    await dbRun('UPDATE users SET points=MAX(0,points-50), penalties=penalties+1 WHERE id=?', [req.user.id]);
    const user = await dbGet('SELECT points FROM users WHERE id=?', [req.user.id]);
    res.json({ ok: true, penalised: true, points: user.points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply penalty' });
  }
});

app.post('/api/session/blur', authRequired, async (req, res) => {
  try {
    const session = await dbGet(
      `SELECT * FROM sessions WHERE user_id = ? AND outcome IS NULL ORDER BY started_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (!session) return res.json({ ok: true });
    await dbRun('UPDATE sessions SET blur_count=blur_count+1 WHERE id=?', [session.id]);
    const updated = await dbGet('SELECT blur_count FROM sessions WHERE id=?', [session.id]);
    res.json({ ok: true, blurCount: updated.blur_count });
  } catch { res.json({ ok: true }); }
});

app.get('/api/sessions', authRequired, async (req, res) => {
  try {
    const rows = await dbAll(
      'SELECT * FROM sessions WHERE user_id=? ORDER BY started_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
});

// ─── GUEST (backward compat for landing demo) ─────────────────────────────────
const guestState = { streak: 7, points: 840, sessionsCompleted: 23, penalties: 0, currentSession: null };
app.get('/api/guest', (req, res) => res.json(guestState));

// ─── WAITLIST ─────────────────────────────────────────────────────────────────
app.post('/api/waitlist', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Valid email required' });
  try {
    await dbRun(`INSERT INTO waitlist (email) VALUES (?)`, [email]);
    const row = await dbGet('SELECT COUNT(*) as count FROM waitlist');
    res.json({ ok: true, position: row.count, spotsRemaining: Math.max(0, 5000 - row.count) });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.json({ ok: true, alreadyJoined: true });
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/waitlist/count', async (req, res) => {
  try {
    const row = await dbGet('SELECT COUNT(*) as count FROM waitlist');
    res.json({ count: row.count, spotsRemaining: Math.max(0, 5000 - row.count) });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// ─── RAZORPAY ────────────────────────────────────────────────────────────────
app.get('/api/razorpay-key', (req, res) => {
  if (!razorpay) return res.status(503).json({ error: 'Payments not configured.' });
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

app.post('/api/create-order', async (req, res) => {
  if (!razorpay)
    return res.status(503).json({ error: 'Payments not configured. Add RAZORPAY keys to .env.' });

  const { planId, stakeAmountInr } = req.body || {};

  // ── Stake mode: user-defined INR amount ──
  if (planId === 'stake') {
    const rupees = parseInt(stakeAmountInr, 10);
    if (!rupees || rupees < 50)
      return res.status(400).json({ error: 'Minimum stake is ₹50.' });
    try {
      const order = await razorpay.orders.create({
        amount: rupees * 100, // paise
        currency: 'INR',
        receipt: `stake_${Date.now()}`,
        notes: { plan: 'stake', amount_inr: rupees },
      });
      return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
      console.error('Razorpay error:', err.message);
      return res.status(500).json({ error: 'Failed to create order.' });
    }
  }

  // ── Pro subscription (one-time for now) ──
  if (planId === 'pro') {
    try {
      const order = await razorpay.orders.create({
        amount: 29900, // ₹299
        currency: 'INR',
        receipt: `pro_${Date.now()}`,
        notes: { plan: 'pro' },
      });
      return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (err) {
      console.error('Razorpay error:', err.message);
      return res.status(500).json({ error: 'Failed to create order.' });
    }
  }

  return res.status(400).json({ error: 'Invalid plan.' });
});

// Verify payment after completion
app.post('/api/verify-payment', async (req, res) => {
  const crypto = require('crypto');
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return res.status(400).json({ error: 'Missing payment details.' });

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

  if (expected === razorpay_signature) {
    return res.json({ ok: true, message: 'Payment verified successfully.' });
  } else {
    return res.status(400).json({ error: 'Payment verification failed.' });
  }
});

// ─── LIVE LEADERBOARD SIMULATION (demo users only) ────────────────────────────
let simCount = 0;
const simInterval = setInterval(async () => {
  if (simCount++ >= 500) { clearInterval(simInterval); return; }
  try {
    const rows = await dbAll('SELECT id FROM users ORDER BY RANDOM() LIMIT 1');
    if (rows.length)
      await dbRun('UPDATE users SET points=points+? WHERE id=?', [
        Math.floor(Math.random() * 40 + 10), rows[0].id,
      ]);
  } catch {}
}, 10000);

// ─── SERVER ──────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n  ▸ LockIn server  →  http://localhost:${PORT}`);
  console.log(`  ▸ Landing page   →  http://localhost:${PORT}/lockin-landing.html\n`);
});

function shutdown(signal) {
  console.log(`\n  ▸ ${signal} — shutting down…`);
  clearInterval(simInterval);
  server.close(() => db.close(() => { console.log('  ▸ Done'); process.exit(0); }));
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => { console.error('Unhandled rejection:', error); });
process.on('uncaughtException',  (error) => { console.error('Uncaught exception:', error); });
