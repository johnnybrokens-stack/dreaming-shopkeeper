const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { db } = require('../../config/db');
const { authMiddleware, checkTemplateAccess } = require('../../middleware/auth');
const { generateContent, generateSample, getTemplates, TEMPLATES } = require('../../services/openai');

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { error: 'Dosažen limit generování, zkuste to prosím později' }
});

const publicGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Dosažen limit ukázek, zkuste to prosím později' }
});

router.get('/templates', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(req.user.id);
  const templates = getTemplates(user.tier);
  res.json({ templates });
});

router.post('/generate', authMiddleware, checkTemplateAccess, generateLimiter, async (req, res) => {
  try {
    const { template, topic, audience, keywords } = req.body;

    if (!template || !topic) {
      return res.status(400).json({ error: 'Šablona a téma jsou povinné' });
    }

    if (topic.length < 3) {
      return res.status(400).json({ error: 'Téma musí mít alespoň 3 znaky' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (user.credits <= 0) {
      return res.status(402).json({
        error: 'Nemáte žádné kredity',
        message: 'Rozšiřte svůj plán pro pokračování'
      });
    }

    const output = await generateContent(template, topic, audience || '', keywords || '', user.tier);
    const wordCount = output.split(/\s+/).length;

    db.prepare('UPDATE users SET credits = credits - 1 WHERE id = ?').run(user.id);
    const content = db.prepare(
      'INSERT INTO content (user_id, template, topic, prompt, output, word_count) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user.id, template, topic, audience || '', output, wordCount);

    res.json({
      id: content.lastInsertRowid,
      template,
      topic,
      audience: audience || '',
      keywords: keywords || '',
      output,
      wordCount,
      remainingCredits: user.credits - 1
    });
  } catch (err) {
    console.error('Chyba generování:', err.message);
    res.status(500).json({ error: 'Nepodařilo se vygenerovat obsah. Zkuste to prosím později.' });
  }
});

router.post('/public-generate', publicGenerateLimiter, async (req, res) => {
  try {
    const { template, topic, audience, keywords } = req.body;

    if (!template || !topic) {
      return res.status(400).json({ error: 'Šablona a téma jsou povinné' });
    }

    if (topic.length < 3) {
      return res.status(400).json({ error: 'Téma musí mít alespoň 3 znaky' });
    }

    const output = await generateContent(template, topic, audience || '', keywords || '', 'free');
    const wordCount = output.split(/\s+/).length;

    res.json({ output, wordCount, message: 'Ukázka zdarma - zaregistrujte se pro plný přístup' });
  } catch (err) {
    console.error('Chyba veřejného generování:', err.message);
    res.status(500).json({ error: 'Nepodařilo se vygenerovat obsah. Zkuste to prosím později.' });
  }
});

router.post('/free-sample', publicGenerateLimiter, async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || topic.length < 3) {
      return res.status(400).json({ error: 'Zadejte název produktu (min. 3 znaky)' });
    }

    if (topic.length > 200) {
      return res.status(400).json({ error: 'Název produktu je příliš dlouhý' });
    }

    const output = await generateSample(topic);
    const wordCount = output.split(/\s+/).length;

    res.json({
      output,
      wordCount,
      message: 'Ukázka zdarma - zaregistrujte se pro plný přístup'
    });
  } catch (err) {
    console.error('Chyba ukázky:', err.message);
    res.status(500).json({ error: 'Nepodařilo se vygenerovat ukázku. Zkuste to prosím později.' });
  }
});

router.get('/history', authMiddleware, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) as count FROM content WHERE user_id = ?').get(req.user.id);
  const items = db.prepare(
    'SELECT id, template, topic, word_count, created_at FROM content WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(req.user.id, parseInt(limit), offset);

  res.json({
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total.count,
      pages: Math.ceil(total.count / limit)
    }
  });
});

router.get('/history/:id', authMiddleware, (req, res) => {
  const content = db.prepare(
    'SELECT * FROM content WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!content) {
    return res.status(404).json({ error: 'Obsah nebyl nalezen' });
  }

  res.json({ content });
});

router.delete('/history/:id', authMiddleware, (req, res) => {
  const result = db.prepare(
    'DELETE FROM content WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Obsah nebyl nalezen' });
  }

  res.json({ message: 'Obsah byl úspěšně smazán' });
});

module.exports = router;
