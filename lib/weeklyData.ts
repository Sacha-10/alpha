// ── Logique de données d'« Évolution semaine » (extraite de
//    app/api/weekly-evolution/route.ts SANS changement de comportement).
//    Source unique consommée par la route Évolution, la route Résumé et le
//    cron email. ──

import { computeStats } from '@/lib/openai'
import type { Trade } from '@/lib/parseCSV'

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export const BIAS_KEYS = [
  'revenge_trading',
  'direction_bias',
  'session_bias',
  'overtrading',
  'loss_extension',
  'confirmation_bias',
  'position_sizing_bias',
] as const

const DAY_MS = 24 * 60 * 60 * 1000

export type WeekPoint = {
  weekKey: string
  weekStart: string
  label: string
  tradeCount: number
  pnlTotal: number
  scores: { psycho: number; risk: number; propFirm: number }
  metrics: {
    winRate: number | null
    profitFactor: number | null
    maxDrawdownPct: number | null
    riskReward: number | null
  }
  biases: Record<string, number>
}

export type WeeklyEvolutionResponse = {
  weeksActiveCount: number
  trajectory: WeekPoint[]
  current: WeekPoint | null
  gapWeeks: number
}

export function r2(n: number): number {
  return Math.round(n * 100) / 100
}

export function finiteOrNull(v: number | null): number | null {
  return v !== null && Number.isFinite(v) ? v : null
}

export function finiteOr0(v: number): number {
  return Number.isFinite(v) ? v : 0
}

// ── ISO week helpers (UTC) ──────────────────────────────────────────────

export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function mondayFromKey(key: string): Date {
  const [yearStr, weekStr] = key.split('-W')
  const year = Number(yearStr)
  const week = Number(weekStr)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Monday = new Date(jan4.getTime() - (jan4Day - 1) * DAY_MS)
  return new Date(week1Monday.getTime() + (week - 1) * 7 * DAY_MS)
}

export function weeksBetweenKeys(keyA: string, keyB: string): number {
  const a = mondayFromKey(keyA).getTime()
  const b = mondayFromKey(keyB).getTime()
  return Math.round((b - a) / (7 * DAY_MS))
}

export function labelFromMonday(monday: Date): string {
  return `${monday.getUTCDate()} ${MONTHS_FR[monday.getUTCMonth()]}`
}

// ── DB row → Trade (shape expected by computeStats) ─────────────────────

export type TradeRow = {
  id: string
  opened_at: string | null
  closed_at: string | null
  symbol: string | null
  side: string | null
  entry: number | null
  exit: number | null
  volume: number | null
  profit: number | null
}

export function toComputeTrade(row: TradeRow): Trade | null {
  const openTime = row.opened_at ? new Date(row.opened_at) : new Date(NaN)
  if (isNaN(openTime.getTime())) return null

  let closeTime = row.closed_at ? new Date(row.closed_at) : openTime
  if (isNaN(closeTime.getTime())) closeTime = openTime

  const durationMinutes = Math.max(0, (closeTime.getTime() - openTime.getTime()) / 60000)

  return {
    ticket: row.id,
    // Non lu par computeStats — placeholder pour conformer au type Trade.
    source: 'mt5',
    symbol: row.symbol ?? '',
    direction: row.side === 'SELL' ? 'SELL' : 'BUY',
    lotSize: row.volume ?? 0,
    entryPrice: row.entry ?? 0,
    exitPrice: row.exit ?? 0,
    stopLoss: null,
    takeProfit: null,
    openTime,
    closeTime,
    durationMinutes,
    commission: 0,
    swap: 0,
    profitLoss: row.profit ?? 0,
    profitLossPips: 0,
    session: 'Other',
  }
}

// ── Week point builder ───────────────────────────────────────────────────

export function buildWeekPoint(weekKey: string, trades: Trade[]): WeekPoint {
  const stats = computeStats(trades)
  const monday = mondayFromKey(weekKey)

  const biases: Record<string, number> = {}
  for (const key of BIAS_KEYS) biases[key] = 0
  for (const bp of stats.biasPatterns) {
    if (bp.patternKey in biases) biases[bp.patternKey] = bp.frequency
  }

  return {
    weekKey,
    weekStart: monday.toISOString().slice(0, 10),
    label: labelFromMonday(monday),
    tradeCount: trades.length,
    pnlTotal: r2(stats.totalPnL),
    scores: {
      psycho: finiteOr0(stats.psychoScore),
      risk: finiteOr0(stats.riskScore),
      propFirm: finiteOr0(stats.propFirmScore),
    },
    metrics: {
      winRate: finiteOrNull(stats.winRate),
      profitFactor: finiteOrNull(stats.profitFactor),
      maxDrawdownPct: finiteOrNull(stats.maxDrawdownPct),
      riskReward: finiteOrNull(stats.riskReward),
    },
    biases,
  }
}

// ── Bucketing par semaine ISO (date de clôture, fallback ouverture) ─────────

export function bucketTradesByWeek(rows: TradeRow[]): Map<string, Trade[]> {
  const weekMap = new Map<string, Trade[]>()
  for (const row of rows) {
    const trade = toComputeTrade(row)
    if (!trade) continue
    const key = isoWeekKey(trade.closeTime)
    const bucket = weekMap.get(key)
    if (bucket) bucket.push(trade)
    else weekMap.set(key, [trade])
  }
  return weekMap
}

// ── Construction de la réponse Évolution (comportement strictement identique
//    à l'ancienne route) ──

export function buildWeeklyData(rows: TradeRow[]): WeeklyEvolutionResponse {
  const weekMap = bucketTradesByWeek(rows)

  const currentWeekKey = isoWeekKey(new Date())

  const completeWeekKeys = [...weekMap.keys()]
    .filter(k => k < currentWeekKey && (weekMap.get(k)?.length ?? 0) >= 1)
    .sort()

  const weeksActiveCount = completeWeekKeys.length
  const trajectoryKeys = completeWeekKeys.slice(-8)
  const trajectory = trajectoryKeys.map(k => buildWeekPoint(k, weekMap.get(k)!))

  const currentTrades = weekMap.get(currentWeekKey)
  const current = currentTrades && currentTrades.length > 0
    ? buildWeekPoint(currentWeekKey, currentTrades)
    : null

  // gapWeeks : écart entre les 2 derniers termes du face-à-face
  let gapWeeks = 0
  const actualKey = current ? currentWeekKey : trajectoryKeys[trajectoryKeys.length - 1]
  const previousKey = current
    ? trajectoryKeys[trajectoryKeys.length - 1]
    : trajectoryKeys[trajectoryKeys.length - 2]
  if (actualKey && previousKey) {
    gapWeeks = Math.max(0, weeksBetweenKeys(previousKey, actualKey) - 1)
  }

  return { weeksActiveCount, trajectory, current, gapWeeks }
}
