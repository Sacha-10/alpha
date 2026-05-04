export const PLANS = {
  pro: {
    name: 'Pro',
    limit: 4,
    monthly: 24.5,
    annual: 234,
    stripePriceMonthly: 'price_1TTQM6CfiBqZlYaUIHzEg8mE',
    stripePriceAnnual: 'price_1TTQMUCfiBqZlYaUBGMvBO8M',
    stripeProductId: 'prod_USL2OMHSRxPwPE',
  },
  premium: {
    name: 'Premium',
    limit: 24,
    monthly: 49.5,
    annual: 474,
    stripePriceMonthly: 'price_1TTQNkCfiBqZlYaUz2FyNlFi',
    stripePriceAnnual: 'price_1TTQOBCfiBqZlYaUu2bZWfBQ',
    stripeProductId: 'prod_USL3p21C1Kc8Rc',
  },
  elite: {
    name: 'Élite',
    limit: 999999,
    monthly: 99.5,
    annual: 954,
    stripePriceMonthly: 'price_1TTQPXCfiBqZlYaU11kT9Yoc',
    stripePriceAnnual: 'price_1TTQQ2CfiBqZlYaUvCndD4Xz',
    stripeProductId: 'prod_USL53dmtaWpiDq',
  },
} as const