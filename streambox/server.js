const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'visits.json');

// --- config (override with environment variables when you deploy) ---
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace-this-secret-in-production';
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 } // 8 hour session
}));

// ---------- helpers ----------
function loadVisits() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function saveVisits(visits) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(visits, null, 2));
}
function getClientIp(req) {
  // If you put this behind a proxy (Render/Railway/nginx), the real IP is in x-forwarded-for.
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress;
}
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  return res.redirect('/admin/login');
}

// ---------- public site ----------
app.use(express.static(path.join(__dirname, 'public')));

// Visitor consented (clicked "Allow") -> log the visit.
// The consent text on the page tells the visitor this happens.
app.post('/api/log-visit', (req, res) => {
  const visits = loadVisits();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || '',
    latitude: typeof req.body.latitude === 'number' ? req.body.latitude : null,
    longitude: typeof req.body.longitude === 'number' ? req.body.longitude : null,
    locationStatus: req.body.locationStatus || 'unknown', // 'granted' | 'denied' | 'unavailable'
    timestamp: new Date().toISOString()
  };
  visits.unshift(entry);
  saveVisits(visits.slice(0, 5000)); // keep file from growing forever
  res.json({ ok: true });
});

// ---------- admin panel ----------
app.get('/admin/login', (req, res) => {
  if (req.session.loggedIn) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.loggedIn = true;
    return res.redirect('/admin');
  }
  return res.redirect('/admin/login?error=1');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.get('/api/admin/visits', requireAuth, (req, res) => {
  res.json(loadVisits());
});

app.post('/api/admin/visits/clear', requireAuth, (req, res) => {
  saveVisits([]);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin  (user: ${ADMIN_USER})`);
});
