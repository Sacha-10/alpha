export const PLANS = {
  pro: {
    name: 'Pro',
    limit: 4,
    monthly: 24.5,
    annual: 234,
    stripePriceMonthly: 'price_1TTLOeCfiBqZlYaU8iD9koqi',
    stripePriceAnnual: 'price_1TTLQ0CfiBqZlYaUglWMCEnS',
    stripeProductId: 'prod_USFuMfpRKBAZy7',
  },
  premium: {
    name: 'Premium',
    limit: 24,
    monthly: 49.5,
    annual: 474,
    stripePriceMonthly: 'price_1TTLTmCfiBqZlYaUJpLtJQpI',
    stripePriceAnnual: 'price_1TTLULCfiBqZlYaUvD3uShDj',
    stripeProductId: 'prod_USFzAgsnVlZhXI',
  },
  elite: {
    name: 'Élite',
    limit: 999999,
    monthly: 99.5,
    annual: 954,
    stripePriceMonthly: 'price_1TTLWACfiBqZlYaUQab9a7mk',
    stripePriceAnnual: 'price_1TTLXvCfiBqZlYaUuyVVXJgs',
    stripeProductId: 'prod_USG2lMmgRXDxG0',
  },
} as const