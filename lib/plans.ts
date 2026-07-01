// ── Source de vérité unique des plans ────────────────────────────────────
// Toute valeur liée aux plans (limite d'analyses, fenêtre d'historique,
// seuil « illimité », libellé, prix, critère d'éligibilité, palier requis par
// feature, plancher de date) est définie ICI et nulle part ailleurs. Les
// consommateurs passent par les helpers exportés.

/**
 * Seuil sentinelle représentant une limite « illimitée ».
 * Définition unique — ne jamais réécrire 999999 en dur ailleurs.
 */
export const UNLIMITED = 999999

export const PLANS = {
  pro: {
    name: 'Pro',
    limit: 4,
    historyMonths: 1,
    monthly: 24.5,
    annual: 235.2,
    annualPerMonth: 19.6,
    // Valeurs marketing d'affichage (non facturées) — stockées exactes pour
    // éviter tout flottant imprécis à l'affichage (cf. TÂCHE prix cartes).
    annualFull: 470.4, // total annuel plein (barré)
    publicMonthly: 49, // prix public mensuel
    publicAnnualPerMonth: 39.2, // prix public mensualisé (vue annuelle)
    stripePriceMonthly: 'price_1To2awCfiBqZlYaUVDueCu2W',
    stripePriceAnnual: 'price_1To2crCfiBqZlYaUuRzJNJam',
    stripeProductId: 'prod_USL2OMHSRxPwPE',
  },
  premium: {
    name: 'Premium',
    limit: 24,
    historyMonths: 12,
    monthly: 49.5,
    annual: 475.2,
    annualPerMonth: 39.6,
    annualFull: 950.4, // total annuel plein (barré)
    publicMonthly: 99, // prix public mensuel
    publicAnnualPerMonth: 79.2, // prix public mensualisé (vue annuelle)
    stripePriceMonthly: 'price_1To2flCfiBqZlYaUIVaGGRUJ',
    stripePriceAnnual: 'price_1To2hhCfiBqZlYaUR2QPNhOI',
    stripeProductId: 'prod_USL3p21C1Kc8Rc',
  },
  elite: {
    name: 'Élite',
    limit: UNLIMITED,
    historyMonths: null, // null = historique illimité
    monthly: 99.5,
    annual: 955.2,
    annualPerMonth: 79.6,
    annualFull: 1910.4, // total annuel plein (barré)
    publicMonthly: 199, // prix public mensuel
    publicAnnualPerMonth: 159.2, // prix public mensualisé (vue annuelle)
    stripePriceMonthly: 'price_1To2kbCfiBqZlYaUqTh42IQJ',
    stripePriceAnnual: 'price_1To2mXCfiBqZlYaUflkYYQVz',
    stripeProductId: 'prod_USL53dmtaWpiDq',
  },
} as const

export type PlanKey = keyof typeof PLANS

/**
 * Interrupteur unique des plans désactivés à la vente. Un plan listé ici est
 * bloqué à la fois côté page (bouton neutralisé, cf. renderCTA dans
 * app/pricing/page.tsx) et côté serveur (refus du checkout dans
 * app/api/create-checkout/route.ts). Source unique — aucune constante dupliquée.
 *
 * Pour REMETTRE un plan en vente : le retirer de ce tableau (ou vider le
 * tableau). Aucun autre changement requis.
 */
export const DISABLED_PLANS: PlanKey[] = ['elite']

/**
 * Plancher calendaire de l'app : aucune donnée (trade / analyse) n'existe avant
 * cette date. Sert (1) de repli pour la borne de rétention quand la date
 * d'inscription est absente, (2) de plancher de navigation du calendrier
 * (cf. minNav du Journal, dérivé d'ici). Unique source du « plancher 01/2026 ».
 */
export const APP_LAUNCH = new Date('2026-01-01T00:00:00Z')

/** Ordre croissant des paliers — unique source du rang d'un plan. */
const PLAN_ORDER = ['pro', 'premium', 'elite'] as const

/**
 * Palier minimum requis par feature de la grille de plans. TABLE CENTRALISÉE :
 * unique source de vérité des paliers. Inclure TOUTES les features verrouillées,
 * même celles sans route encore (couverture automatique à leur implémentation).
 * Le Journal de trades et « Analyser vos trades » n'y figurent pas : accessibles
 * à tous les plans actifs (aucun palier — cf. leurs règles propres).
 */
export const FEATURE_MIN_PLAN = {
  analysesHistory: 'premium',
  weeklyEvolution: 'premium',
  weeklySummary: 'premium',
  prioritySupport: 'premium',
  propFirmScore: 'elite',
  predictiveDetection: 'elite',
  telegramAlerts: 'elite',
  apiAccess: 'elite',
} as const satisfies Record<string, PlanKey>

export type FeatureKey = keyof typeof FEATURE_MIN_PLAN

// ── Normalisation ──────────────────────────────────────────────────────────

/**
 * Normalise la casse / les espaces du plan. Centralisé : tout helper passe par
 * ici, donc 'Premium' (majuscule) ou ' premium ' ne cassent jamais la logique.
 */
export function normalizePlan(plan: string | null | undefined): string | null {
  if (!plan) return null
  const p = plan.trim().toLowerCase()
  return p || null
}

/** Clé de plan normalisée, ou null si plan absent / inconnu. */
function toPlanKey(plan: string | null | undefined): PlanKey | null {
  const p = normalizePlan(plan)
  return p && p in PLANS ? (p as PlanKey) : null
}

/** Rang du plan dans PLAN_ORDER (pro=0, premium=1, elite=2) ; -1 si inconnu. */
export function planRank(plan: string | null | undefined): number {
  const k = toPlanKey(plan)
  return k ? PLAN_ORDER.indexOf(k) : -1
}

// ── Helpers plan ───────────────────────────────────────────────────────────

/**
 * Limite d'analyses mensuelle d'un plan.
 * Plan absent / inconnu / sans abonnement → 0.
 */
export function getPlanLimit(plan: string | null | undefined): number {
  const k = toPlanKey(plan)
  return k ? PLANS[k].limit : 0
}

/**
 * Fenêtre glissante d'historique, en mois.
 * Pro = 1 · Premium = 12 · Elite = null (illimité).
 * Plan absent / inconnu / sans abonnement → 0 (aucune fenêtre).
 */
export function getPlanMonths(plan: string | null | undefined): number | null {
  const k = toPlanKey(plan)
  return k ? PLANS[k].historyMonths : 0
}

/** Vrai si la limite correspond à un accès illimité. */
export function isUnlimited(limit: number): boolean {
  return limit >= UNLIMITED
}

/** Seul critère d'accès à l'espace membre : abonnement actif. */
export function hasActiveAccess(status: string | null | undefined): boolean {
  return status === 'active'
}

/**
 * Vrai si le plan est au moins du palier Premium (Premium ou Élite).
 * Critère unique de palier « Premium et au-dessus ».
 */
export function isPremiumOrAbove(plan: string | null | undefined): boolean {
  return planRank(plan) >= planRank('premium')
}

/**
 * Éligibilité à l'email hebdomadaire : abonnement actif ET palier Premium+.
 */
export function isWeeklyEmailEligible(
  plan: string | null | undefined,
  status: string | null | undefined,
): boolean {
  return hasActiveAccess(status) && isPremiumOrAbove(plan)
}

/** Libellé affichable d'un plan. Plan absent / inconnu → '—'. */
export function getPlanLabel(plan: string | null | undefined): string {
  const k = toPlanKey(plan)
  return k ? PLANS[k].name : '—'
}

// ── Contrôle de palier par feature (table centralisée + fail-safe) ─────────

/**
 * Vrai si `plan` atteint le palier minimum requis par `featureKey`.
 * FAIL-SAFE : une featureKey non déclarée dans FEATURE_MIN_PLAN refuse l'accès
 * par défaut — oublier de déclarer une feature bloque visiblement, ne crée
 * jamais de faille silencieuse.
 */
export function requirePlanFor(
  featureKey: string,
  plan: string | null | undefined,
): boolean {
  const required = (FEATURE_MIN_PLAN as Record<string, PlanKey>)[featureKey]
  if (!required) return false // feature non déclarée → accès refusé
  return planRank(plan) >= planRank(required)
}

// ── Rétention glissante (Journal de trades & Historique des analyses) ──────

/**
 * Borne de rétention = date la plus ancienne visible. Renvoie LA PLUS RÉCENTE
 * de : (aujourd'hui − rétention du plan) et (date d'inscription).
 * Toujours calculée sur le plan ACTUEL : aucune donnée n'est supprimée à un
 * changement de plan, seule cette fenêtre d'affichage change.
 *  - Elite (rétention illimitée) → borne = date d'inscription (aucun glissement).
 *  - Plan absent / inconnu → fenêtre nulle (borne = maintenant).
 *  - Date d'inscription absente → repli sur APP_LAUNCH.
 */
export function getRetentionFloor(
  plan: string | null | undefined,
  registeredAt: string | Date | null | undefined,
  now: Date = new Date(),
): Date {
  const registered = registeredAt ? new Date(registeredAt) : APP_LAUNCH
  const months = getPlanMonths(plan)

  // Elite : pas de fenêtre glissante → tout depuis l'inscription.
  if (months === null) return registered

  const sliding = new Date(now)
  sliding.setMonth(sliding.getMonth() - months)

  // La plus récente des deux bornes.
  return sliding > registered ? sliding : registered
}
