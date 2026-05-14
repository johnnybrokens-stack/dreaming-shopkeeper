const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { db } = require('../../config/db');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Příliš mnoho pokusů o přihlášení, zkuste to prosím později' }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'E-mail, heslo a jméno jsou povinné' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Neplatný formát e-mailu' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Heslo musí mít alespoň 8 znaků' });
    }

    const sanitizedName = name.replace(/<[^>]*>/g, '').trim();
    if (!sanitizedName) {
      return res.status(400).json({ error: 'Jméno je povinné' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Tento e-mail je již registrován' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = db.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    ).run(email, hashedPassword, sanitizedName);

    const token = jwt.sign(
      { id: result.lastInsertRowid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Účet byl úspěšně vytvořen',
      token,
      user: { id: result.lastInsertRowid, email, name: sanitizedName, tier: 'free', credits: 5 }
    });
  } catch (err) {
    console.error('Chyba registrace:', err);
    res.status(500).json({ error: 'Registrace se nezdařila' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Neplatný formát e-mailu' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Neplatný e-mail nebo heslo' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Přihlášení úspěšné',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        credits: user.credits
      }
    });
  } catch (err) {
    console.error('Chyba přihlášení:', err);
    res.status(500).json({ error: 'Přihlášení se nezdařilo' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'E-mail a jméno z Google jsou povinné' });
    }

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      const tempPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const result = db.prepare(
        'INSERT INTO users (email, password, name, google_id) VALUES (?, ?, ?, ?)'
      ).run(email, hashedPassword, name, googleId || null);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Přihlášení přes Google úspěšné',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        credits: user.credits,
        googleAuth: true
      }
    });
  } catch (err) {
    console.error('Chyba Google přihlášení:', err);
    res.status(500).json({ error: 'Přihlášení přes Google se nezdařilo' });
  }
});

module.exports = router;
