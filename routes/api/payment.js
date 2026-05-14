const express = require('express');
const router = express.Router();
const webhookHandler = express.Router();
const { db } = require('../../config/db');
const { authMiddleware } = require('../../middleware/auth');
const {
  PRICING,
  handleWebhookEvent,
  stripe
} = require('../../services/stripe');

router.get('/pricing', (req, res) => {
  res.json({
    tiers: PRICING,
    free: {
      name: 'Zdarma',
      price: 0,
      credits: 5,
      maxWords: 500,
      features: ['1 základní šablona', '1 ukázka zdarma']
    }
  });
});

router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { tier } = req.body;

    if (!PRICING[tier]) {
      return res.status(400).json({ error: 'Neplatný plán' });
    }

    const priceIdKey = `STRIPE_PRICE_${tier.toUpperCase()}`;
    const priceId = process.env[priceIdKey];

    if (!priceId) {
      return res.status(500).json({
        error: 'Platba není nakonfigurována',
        message: 'Kontaktujte podporu na benbrokes.it@gmail.com pro aktivaci předplatného'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: String(user.id) }
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${process.env.APP_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.APP_URL}/dashboard?upgrade=cancelled`,
      metadata: {
        userId: String(user.id),
        tier
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Chyba checkout:', err);
    res.status(500).json({ error: 'Nepodařilo se vytvořit platební relaci' });
  }
});

router.post('/portal', authMiddleware, async (req, res) => {
  try {
    const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(req.user.id);

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'Nebylo nalezeno aktivní předplatné' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.APP_URL}/dashboard`
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error('Chyba portálu:', err);
    res.status(500).json({ error: 'Nepodařilo se otevřít platební portál' });
  }
});

webhookHandler.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = await handleWebhookEvent(req.body, sig);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, tier } = session.metadata;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        const credits = PRICING[tier]?.credits || 100;

        db.prepare('UPDATE users SET tier = ?, credits = ?, stripe_subscription_id = ? WHERE id = ?')
          .run(tier, credits, subscription.id, userId);

        db.prepare(
          'INSERT INTO subscriptions (user_id, stripe_subscription_id, tier, status, current_period_end) VALUES (?, ?, ?, ?, ?)'
        ).run(
          userId,
          subscription.id,
          tier,
          'active',
          new Date(subscription.current_period_end * 1000).toISOString()
        );
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const { userId } = subscription.metadata;

        if (userId) {
          const credits = PRICING[subscription.metadata.tier]?.credits || 100;
          db.prepare('UPDATE users SET credits = ?, stripe_subscription_id = ? WHERE id = ?')
            .run(credits, subscription.id, userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const { userId } = subscription.metadata;

        if (userId) {
          db.prepare('UPDATE users SET tier = ?, credits = ?, stripe_subscription_id = NULL WHERE id = ?')
            .run('free', 5, userId);
          db.prepare('UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?')
            .run('cancelled', subscription.id);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Chyba webhooku:', err.message);
    res.status(400).json({ error: 'Webhook error' });
  }
});

module.exports = { router, webhookHandler };
