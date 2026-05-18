const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { db } = require('../../config/db');

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Příliš mnoho recenzí, zkuste to prosím později' }
});

router.post('/submit', reviewLimiter, (req, res) => {
  try {
    const { name, email, rating, text } = req.body;

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Jméno je povinné (min. 2 znaky)' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Hodnocení musí být 1-5 hvězdiček' });
    }
    if (!text || text.length < 10) {
      return res.status(400).json({ error: 'Text recenze je povinný (min. 10 znaků)' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ error: 'Text recenze je příliš dlouhý (max. 2000 znaků)' });
    }

    db.prepare(
      'INSERT INTO reviews (name, email, rating, text) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), (email || '').trim(), rating, text.trim());

    res.json({ message: 'Děkujeme za vaši recenzi! Po schválení bude zveřejněna.' });
  } catch (err) {
    console.error('Chyba ukládání recenze:', err.message);
    res.status(500).json({ error: 'Nepodařilo se uložit recenzi. Zkuste to prosím později.' });
  }
});

router.get('/list', (req, res) => {
  try {
    const reviews = db.prepare(
      'SELECT name, rating, text, created_at FROM reviews WHERE approved = 1 ORDER BY created_at DESC LIMIT 20'
    ).all();

    res.json({ reviews });
  } catch (err) {
    console.error('Chyba načítání recenzí:', err.message);
    res.status(500).json({ error: 'Nepodařilo se načíst recenze.' });
  }
});

module.exports = router;
