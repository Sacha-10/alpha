export const PLANS = {
  starter: { monthly: 29, annual: 23, name: 'Starter', limit: 4 },
  pro:     { monthly: 79, annual: 63, name: 'Pro',     limit: 24 },
  elite:   { monthly: 199, annual: 159, name: 'Elite', limit: 999999 },
} as const
