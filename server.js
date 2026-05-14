const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDb } = require('./config/db');
const authRoutes = require('./routes/api/auth');
const contentRoutes = require('./routes/api/content');
const paymentRoutes = require('./routes/api/payment');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Příliš mnoho požadavků, zkuste to prosím později' }
});
app.use('/api/', limiter);

// Webhook needs RAW body — mount before express.json()
app.use('/api/payment/webhook', paymentRoutes.webhookHandler);

// Body parsing
app.use(express.json());
app.use(express.static('public'));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/payment', paymentRoutes.router);

// Pages
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/pricing', (req, res) => {
  res.sendFile(__dirname + '/public/paywall.html');
});

// React app (built) — assets served at /app/, HTML served at /generator
app.use('/app', express.static(__dirname + '/react-app/dist'));
app.get('/app/*', (req, res) => {
  res.sendFile(__dirname + '/react-app/dist/index.html');
});

app.get('/generator', (req, res) => {
  res.sendFile(__dirname + '/react-app/dist/index.html');
});

app.get('/generator/:template', (req, res) => {
  const valid = ['popis-produktu', 'poutavy-titulek', 'seo-meta', 'opusteny-kosik'];
  if (valid.includes(req.params.template)) {
    res.sendFile(__dirname + '/react-app/dist/index.html');
  } else {
    res.redirect('/generator');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nebyl nalezen' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Vnitřní chyba serveru' });
});

// Start server after DB init
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🏪 Dreaming Shopkeeper běží na http://localhost:${PORT}`);
    console.log(`📊 Panel: http://localhost:${PORT}/dashboard`);
    console.log(`🎨 Landing: http://localhost:${PORT}\n`);
  });
});

module.exports = app;
