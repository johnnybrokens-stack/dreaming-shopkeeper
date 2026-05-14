const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authMiddleware, checkTemplateAccess } = require('../middleware/auth');
const { generateContent, getTemplates } = require('../services/openai');

router.get('/templates', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(req.user.id);
  const templates = getTemplates(user.tier);
  res.json({ templates });
});

router.post('/generate', authMiddleware, checkTemplateAccess, async (req, res) => {
  try {
    const { template, topic, audience, keywords } = req.body;

    if (!template || !topic) {
      return res.status(400).json({ error: 'Šablona a téma jsou povinné' });
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
      output,
      wordCount,
      remainingCredits: user.credits - 1
    });
  } catch (err) {
    console.error('Chyba generování:', err);
    res.status(500).json({ error: 'Nepodařilo se vygenerovat obsah. Zkuste to znovu.' });
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
