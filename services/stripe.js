const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICING = {
  starter: {
    name: 'Starter',
    price: 19,
    credits: 100,
    maxWords: 1500,
    features: ['All basic templates', 'Email support', 'Export to PDF']
  },
  pro: {
    name: 'Pro',
    price: 49,
    credits: 500,
    maxWords: 3000,
    features: ['All templates', 'Priority support', 'Export to all formats', 'Team collaboration', 'API access']
  },
  enterprise: {
    name: 'Enterprise',
    price: 149,
    credits: 99999,
    maxWords: 10000,
    features: ['Everything in Pro', 'Dedicated account manager', 'Custom templates', 'SSO', 'SLA guarantee', 'White-label option']
  }
};

async function createCustomer(email, name) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { source: 'contentforge-ai' }
  });
  return customer;
}

async function createCheckoutSession(userId, email, tier, priceId) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/pricing`,
    metadata: {
      userId: String(userId),
      tier
    }
  });
  return session;
}

async function handleWebhookEvent(payload, signature) {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  return event;
}

async function cancelSubscription(subscriptionId) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

async function createPortalSession(customerId, returnUrl) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });
}

async function getCustomer(customerId) {
  return await stripe.customers.retrieve(customerId);
}

module.exports = {
  stripe,
  PRICING,
  createCustomer,
  createCheckoutSession,
  handleWebhookEvent,
  cancelSubscription,
  createPortalSession,
  getCustomer
};
