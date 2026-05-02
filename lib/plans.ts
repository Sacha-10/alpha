export const PLANS = {
  starter: { monthly: 24.5, annual: 23, name: 'Starter', limit: 4,      stripeProductId: 'prod_STARTER_ID' },
  pro:     { monthly: 49.5, annual: 63, name: 'Pro',     limit: 24,     stripeProductId: 'prod_PRO_ID' },
  elite:   { monthly: 99.5, annual: 159, name: 'Elite',  limit: 999999, stripeProductId: 'prod_ELITE_ID' },
} as const
