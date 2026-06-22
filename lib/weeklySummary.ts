// ── Source unique du « Résumé semaine » (page + email).
//    deriveSummary est PURE et déterministe : elle ne recalcule rien, elle
//    consomme la donnée déjà produite par Évolution (WeeklyEvolutionResponse)
//    et n'effectue AUCUN appel LLM. La description du biais dominant nécessite
//    le relatedData de computeStats : elle est injectée par la route via
//    biasDescription() (cf. §8 du cahier des charges). ──

import {
  isoWeekKey,
  mondayFromKey,
  buildWeeklyData,
  bucketTradesByWeek,
  type WeeklyEvolutionResponse,
  type TradeRow,
} from './weeklyData'
import { BIAS_LABELS, fmtDelta, type Direction } from './weeklyFormat'
import { severityOf, computeStats } from './openai'

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const DAY_MS = 24 * 60 * 60 * 1000

export type Tone = 'good' | 'bad' | 'neutral' | 'none'

export const NO_BIAS_TEXT =
  'Aucun biais marqué cette semaine. Ton exécution est restée alignée sur ta stratégie.'

export type SummaryMovement = {
  label: string
  delta: number
  direction: Direction
  formatted: string
}

export type SummaryValue = {
  value: number | null
  delta: number | null
}

export type SummaryBias =
  | {
      has: true
      key: string
      label: string
      frequency: number
      severity: string
      description: string
      lever: string
    }
  | { has: false; lever: string }

export type WeeklySummaryData = {
  status: 'ok'
  weekRangeLabel: string
  isoWeek: number
  tradeCount: number
  hasBaseline: boolean
  verdict: { label: string; tone: Tone }
  movements: SummaryMovement[]
  regularityFlag: boolean
  scores: {
    psycho: SummaryValue
    risk: SummaryValue
    propFirm: SummaryValue
  }
  values: {
    pnl: SummaryValue
    winRate: SummaryValue
    profitFactor: { value: number | null }
    riskReward: { value: number | null }
    maxDrawdown: SummaryValue
  }
  bias: SummaryBias
}

export type WeeklySummaryResult = WeeklySummaryData | { status: 'none' }

// ── Helpers numériques ──────────────────────────────────────────────────

function mean(nums: number[]): number {
  return nums.reduce((s, n) => s + n, 0) / nums.length
}

// Moyenne des valeurs non-null. excludeSentinel : ignore aussi ±99 (∞/−∞).
function meanOrNull(vals: (number | null)[], excludeSentinel = false): number | null {
  const valid: number[] = []
  for (const v of vals) {
    if (v === null) continue
    if (excludeSentinel && Math.abs(v) === 99) continue
    valid.push(v)
  }
  return valid.length === 0 ? null : mean(valid)
}

// Delta cible − baseline : null si un côté null ou sentinel (±99).
function diffSafe(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null
  if (Math.abs(a) === 99 || Math.abs(b) === 99) return null
  return a - b
}

function formatRange(start: Date, end: Date): string {
  const sd = start.getUTCDate()
  const ed = end.getUTCDate()
  const sm = MONTHS_FR[start.getUTCMonth()]
  const em = MONTHS_FR[end.getUTCMonth()]
  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `du ${sd} au ${ed} ${em}`
  }
  return `du ${sd} ${sm} au ${ed} ${em}`
}

// ── deriveSummary ─────────────────────────────────────────────────────────

export function deriveSummary(
  data: WeeklyEvolutionResponse,
  now: Date
): WeeklySummaryResult {
  const trajectory = data.trajectory
  if (trajectory.length === 0) return { status: 'none' }

  const target = trajectory[trajectory.length - 1]

  // Détection robuste de « la semaine dernière » (ISO, complète).
  const currentKey = isoWeekKey(now)
  const lastMonday = new Date(mondayFromKey(currentKey).getTime() - 7 * DAY_MS)
  const lastWeekKey = isoWeekKey(lastMonday)

  // Règle binaire : la dernière semaine active doit être la semaine dernière.
  // Une vieille semaine n'est jamais présentée comme récente.
  if (target.weekKey !== lastWeekKey) return { status: 'none' }

  // Baseline = moyenne des semaines de trajectory SAUF la cible.
  const baselinePoints = trajectory.slice(0, -1)
  const hasBaseline = baselinePoints.length > 0

  const basePsycho = hasBaseline ? mean(baselinePoints.map(p => p.scores.psycho)) : null
  const baseRisk = hasBaseline ? mean(baselinePoints.map(p => p.scores.risk)) : null
  const basePropFirm = hasBaseline ? mean(baselinePoints.map(p => p.scores.propFirm)) : null
  const basePnl = hasBaseline ? mean(baselinePoints.map(p => p.pnlTotal)) : null
  const baseWinRate = hasBaseline ? meanOrNull(baselinePoints.map(p => p.metrics.winRate)) : null
  const baseDD = hasBaseline ? meanOrNull(baselinePoints.map(p => p.metrics.maxDrawdownPct)) : null

  const dPsycho = hasBaseline ? target.scores.psycho - basePsycho! : null
  const dRisk = hasBaseline ? target.scores.risk - baseRisk! : null
  const dPropFirm = hasBaseline ? target.scores.propFirm - basePropFirm! : null
  const dPnl = hasBaseline ? target.pnlTotal - basePnl! : null
  const dWinRate = hasBaseline ? diffSafe(target.metrics.winRate, baseWinRate) : null
  const dDD = hasBaseline ? diffSafe(target.metrics.maxDrawdownPct, baseDD) : null

  // Verdict
  let verdict: { label: string; tone: Tone }
  if (!hasBaseline) {
    verdict = { label: 'Ta semaine de référence', tone: 'none' }
  } else {
    const sum = dPsycho! + dRisk! + dPropFirm!
    if (sum > 0) verdict = { label: 'Une semaine solide', tone: 'good' }
    else if (sum < 0) verdict = { label: 'Une semaine difficile', tone: 'bad' }
    else verdict = { label: 'Une semaine stable', tone: 'neutral' }
  }

  // Mouvements — candidats { psycho, risk, propFirm, winRate, maxDrawdown(down) }
  // (PAS le PnL), delta non null et non nul, triés par |delta| décroissant,
  // jusqu'à 4. Première semaine (sans baseline) : aucune ligne.
  const movements: SummaryMovement[] = []
  let regularityFlag = false
  if (hasBaseline) {
    const cands: SummaryMovement[] = []
    const consider = (
      label: string,
      delta: number | null,
      direction: Direction,
      decimals: number,
      suffix: string
    ) => {
      if (delta !== null && delta !== 0) {
        cands.push({ label, delta, direction, formatted: fmtDelta(delta, decimals, suffix) })
      }
    }
    consider('Psychologie', dPsycho, 'up', 0, '')
    consider('Risque', dRisk, 'up', 0, '')
    consider('Prop Firm', dPropFirm, 'up', 0, '')
    consider('Win Rate', dWinRate, 'up', 1, '%')
    consider('Max Drawdown', dDD, 'down', 1, '%')
    cands.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    movements.push(...cands.slice(0, 4))
    if (movements.length === 0) regularityFlag = true
  }

  // Biais de la semaine — clé de fréquence MAX (premier max en cas d'égalité).
  let domKey: string | null = null
  let domFreq = 0
  for (const key of Object.keys(BIAS_LABELS)) {
    const f = target.biases[key] ?? 0
    if (f > domFreq) {
      domFreq = f
      domKey = key
    }
  }
  const bias: SummaryBias =
    !domKey || domFreq === 0
      ? { has: false, lever: biasLever(null) }
      : {
          has: true,
          key: domKey,
          label: BIAS_LABELS[domKey],
          frequency: domFreq,
          severity: severityOf(domFreq),
          description: '', // injectée par la route via biasDescription()
          lever: biasLever(domKey),
        }

  // Période de la semaine cible (lundi → dimanche, UTC).
  const start = new Date(target.weekStart)
  const end = new Date(start.getTime() + 6 * DAY_MS)

  return {
    status: 'ok',
    weekRangeLabel: formatRange(start, end),
    isoWeek: Number(target.weekKey.split('-W')[1]),
    tradeCount: target.tradeCount,
    hasBaseline,
    verdict,
    movements,
    regularityFlag,
    scores: {
      psycho: { value: target.scores.psycho, delta: dPsycho },
      risk: { value: target.scores.risk, delta: dRisk },
      propFirm: { value: target.scores.propFirm, delta: dPropFirm },
    },
    values: {
      pnl: { value: target.pnlTotal, delta: dPnl },
      winRate: { value: target.metrics.winRate, delta: dWinRate },
      profitFactor: { value: target.metrics.profitFactor },
      riskReward: { value: target.metrics.riskReward },
      maxDrawdown: { value: target.metrics.maxDrawdownPct, delta: dDD },
    },
    bias,
  }
}

// ── Bout en bout : rows → résumé complet (description du biais injectée) ──
//    Utilisé par la route /api/weekly-summary ET le cron email pour garantir
//    un résultat strictement identique des deux côtés. ──

export function buildSummaryFromRows(rows: TradeRow[], now: Date): WeeklySummaryResult {
  const data = buildWeeklyData(rows)
  const summary = deriveSummary(data, now)

  if (summary.status === 'ok' && summary.bias.has) {
    const bias = summary.bias
    const currentKey = isoWeekKey(now)
    const lastMonday = new Date(mondayFromKey(currentKey).getTime() - 7 * DAY_MS)
    const lastWeekKey = isoWeekKey(lastMonday)
    const weekTrades = bucketTradesByWeek(rows).get(lastWeekKey) ?? []
    if (weekTrades.length > 0) {
      const stats = computeStats(weekTrades)
      const bp = stats.biasPatterns.find(b => b.patternKey === bias.key)
      if (bp) bias.description = biasDescription(bias.key, bp.relatedData)
    }
  }

  return summary
}

// ── Leviers (stables, par clé) ────────────────────────────────────────────

export function biasLever(key: string | null): string {
  switch (key) {
    case 'revenge_trading':
      return "Tu dois t'imposer 1 heure sans prise de position à la suite d'une perte. Tu dois noter ta perte et fermer la plateforme."
    case 'direction_bias':
      return 'Tu dois justifier le sens de chaque prise de position. Lorsque tu ne peux pas le justifier, tu ne rentres pas en position.'
    case 'session_bias':
      return 'Tu dois couper ta session la plus faible sur une semaine et tu dois réallouer ton risque vers la session où tu as le taux de réussite le plus élevé.'
    case 'overtrading':
      return 'Tu dois fixer une limite de positions à prendre par jour. Lorsque ta limite a été atteinte, tu as terminé ta session qu\'elle soit en profit ou à perte.'
    case 'loss_extension':
      return "Tu dois définir ton stop loss avant l'entrée en position et tu ne dois jamais le déplacer dans le mauvais sens. Le marché a invalidé ton setup, tu dois l'accepter."
    case 'confirmation_bias':
      return 'Tu dois repartir de zéro après chaque série de gains. Le marché ne se souvient pas de tes positions précédentes.'
    case 'position_sizing_bias':
      return 'Tu dois fixer une taille de position identique cette semaine. Tu dois dissocier le sizing de toute appréciation subjective.'
    default:
      // Semaine propre (aucun biais marqué).
      return "Reproduis à l'identique la discipline qui a produit ces résultats."
  }
}

// ── Descriptions (chiffres réels injectés depuis relatedData) ──────────────

export function biasDescription(key: string, rd: Record<string, unknown>): string {
  const num = (v: unknown) => Number(v)
  switch (key) {
    case 'revenge_trading': {
      const n = num(rd.tradesAfterLoss)
      return n <= 1
        ? "Tu as ouvert une position dans l'heure suivant une perte. Tu ne suis plus ta stratégie, tu suis tes émotions."
        : `Tu as ouvert ${n} positions dans l'heure suivant une perte. Tu ne suis plus ta stratégie, tu suis tes émotions.`
    }
    case 'direction_bias': {
      const dir = String(rd.worseDirection)
      const x = Math.round(num(rd.worseWinRate))
      const y = Math.round(num(rd.betterWinRate))
      return `Tes trades ${dir} n'ont que ${x}% de réussite, contre ${y}% dans l'autre sens.`
    }
    case 'session_bias': {
      const session = String(rd.worstSession)
      const x = Math.round(num(rd.lossRate))
      return `Sur la session ${session}, ${x}% de tes trades sont perdants. Tu surexposes ton capital où tu performes le moins.`
    }
    case 'overtrading': {
      const seuil = num(rd.threshold)
      const max = num(rd.maxTradesInDay)
      const n = num(rd.overtradedDaysCount)
      return n <= 1
        ? `Tu as ouvert plus de ${seuil} positions sur 1 session et tu as ouvert au plus ${max} positions sur une seule journée. Le volume a pris le pas sur la sélection.`
        : `Tu as ouvert plus de ${seuil} positions sur ${n} sessions et tu as ouvert au plus ${max} positions sur une seule journée. Le volume a pris le pas sur la sélection.`
    }
    case 'loss_extension': {
      const r = num(rd.ratio).toFixed(1)
      const a = num(rd.avgLossDurationMin)
      const b = num(rd.avgWinDurationMin)
      return `Tu gardes tes pertes ${r}× plus de temps que tes profits (${a} min contre ${b} min). Tu laisses courir tes pertes au lieu de les couper.`
    }
    case 'confirmation_bias': {
      const n = num(rd.tradesAfterStreak)
      return n <= 1
        ? 'Tu as pris 1 position dans le même sens après 3 gains consécutifs. Tu es influencé par ta performance récente, plus par ton analyse.'
        : `Tu as pris ${n} positions dans le même sens après 3 gains consécutifs. Tu es influencé par ta performance récente, plus par ton analyse.`
    }
    case 'position_sizing_bias': {
      const r = num(rd.sizingRatio).toFixed(1)
      return `Tes positions perdantes sont ${r}× plus exposées que tes gagnantes. Tu risques davantage de capital sur tes positions perdantes.`
    }
    default:
      return ''
  }
}
