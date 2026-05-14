const jwt = require('jsonwebtoken');

const TIER_LIMITS = {
  free: { credits: 5, maxWords: 500, templates: ['popis-produktu'] },
  starter: { credits: 100, maxWords: 1500, templates: ['popis-produktu', 'poutavy-titulek', 'seo-meta'] },
  pro: { credits: 500, maxWords: 3000, templates: ['all'] },
  enterprise: { credits: 99999, maxWords: 10000, templates: ['all'] }
};

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Je vyžadováno přihlášení' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Neplatný nebo vypršený token' });
  }
};

const checkTemplateAccess = (req, res, next) => {
  const { db } = require('../../config/db');
  const user = db.prepare('SELECT tier FROM users WHERE id = ?').get(req.user.id);
  const template = req.body.template;

  const limits = TIER_LIMITS[user.tier];
  if (!limits.templates.includes('all') && !limits.templates.includes(template)) {
    return res.status(403).json({
      error: 'Šablona není dostupná',
      message: `Pro přístup k této šabloně si rozšiřte plán`
    });
  }
  next();
};

module.exports = { authMiddleware, checkTemplateAccess, TIER_LIMITS };
