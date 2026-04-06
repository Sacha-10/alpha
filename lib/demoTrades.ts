import { Trade } from './parseCSV'

type SessionType = 'Tokyo' | 'London' | 'New York'

interface SymbolPlan {
  symbol: string
  trades: number
  wins: number
  min: number
  max: number
  lot: number
}

interface TradeBlueprint {
  symbol: string
  win: boolean
  session: SessionType
  dayOffset: number
  hour: number
  minute: number
  lotSize: number
  direction: 'BUY' | 'SELL'
  fomo?: boolean
  earlyProfitCut?: boolean
  movingStopLoss?: boolean
}

const SYMBOL_PLANS: SymbolPlan[] = [
  { symbol: 'EURUSD', trades: 25, wins: 18, min: 1.075, max: 1.105, lot: 0.5 },
  { symbol: 'GBPUSD', trades: 15, wins: 9, min: 1.25, max: 1.29, lot: 0.4 },
  { symbol: 'USDJPY', trades: 25, wins: 13, min: 145, max: 152, lot: 0.4 },
  { symbol: 'GBPJPY', trades: 4, wins: 1, min: 185, max: 195, lot: 0.3 },
  { symbol: 'XAUUSD', trades: 12, wins: 8, min: 3700, max: 4200, lot: 0.12 },
  { symbol: 'BTCUSDT', trades: 11, wins: 5, min: 70000, max: 88000, lot: 0.08 },
  { symbol: 'ETHUSD', trades: 10, wins: 5, min: 2200, max: 3700, lot: 0.3 },
  { symbol: 'NAS100', trades: 10, wins: 4, min: 17000, max: 19500, lot: 0.2 },
  { symbol: 'SP500', trades: 8, wins: 3, min: 5000, max: 5700, lot: 0.5 },
]

const START_DATE_UTC = new Date(Date.UTC(2025, 9, 6, 0, 0, 0, 0))

const FOMO_INDEXES = new Set([9, 18, 27, 36, 45, 56, 67, 79, 93, 108])
const EARLY_TP_INDEXES = new Set([6, 11, 15, 21, 26, 33, 38, 44, 50, 58, 63, 74, 82, 96, 114])
const MOVING_SL_INDEXES = new Set([30, 49, 60, 88, 116])
const FRIDAY_OVERTRADING_LOSSES = new Set([112, 113, 114, 115, 116, 117, 118, 119])

// 2 séries revenge: 2 pertes 0.2 lot + 1 perte oversize (1.5-2.0)
const REVENGE_SERIES = [
  { normalA: 22, normalB: 23, oversize: 24, lot: 1.8 },
  { normalA: 70, normalB: 71, oversize: 72, lot: 1.6 },
]

function rng(seed = 202604): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const rand = rng()

function toSession(hour: number): Trade['session'] {
  if (hour >= 2 && hour < 10) return 'Asian'
  if (hour >= 8 && hour < 16) return 'London'
  if (hour >= 14 && hour < 22) return 'New York'
  return 'Other'
}

function weekdayDateInWindow(index: number): { dayOffset: number; hour: number; minute: number } {
  const week = Math.floor(index / 5)
  const pos = index % 5
  const preferredWeekday = [2, 1, 3, 4, 5][pos] // mer, mar, jeu, ven, sam
  const dayOffset = week * 7 + preferredWeekday
  const slot = index % 3
  const hour = slot === 0 ? 9 : slot === 1 ? 15 : 3
  const minute = (index * 7) % 60
  return { dayOffset, hour, minute }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function decimalsFor(symbol: string): number {
  if (symbol === 'EURUSD' || symbol === 'GBPUSD') return 5
  if (symbol.includes('JPY')) return 3
  if (symbol === 'XAUUSD') return 2
  if (symbol === 'BTCUSDT' || symbol === 'ETHUSD') return 2
  return 1
}

function pipScale(symbol: string): number {
  if (symbol === 'EURUSD' || symbol === 'GBPUSD') return 10000
  if (symbol.includes('JPY')) return 100
  return 1
}

function roundPrice(symbol: string, value: number): number {
  return Number(value.toFixed(decimalsFor(symbol)))
}

function buildBlueprints(): TradeBlueprint[] {
  const blueprints: TradeBlueprint[] = []

  for (const plan of SYMBOL_PLANS) {
    for (let i = 0; i < plan.trades; i++) {
      blueprints.push({
        symbol: plan.symbol,
        win: i < plan.wins,
        session: i % 3 === 0 ? 'London' : i % 3 === 1 ? 'New York' : 'Tokyo',
        ...weekdayDateInWindow(blueprints.length),
        lotSize: plan.lot,
        direction: (i + blueprints.length) % 2 === 0 ? 'BUY' : 'SELL',
      })
    }
  }

  // Friday 15-17 overtrading: 8 pertes consécutives
  for (const index of FRIDAY_OVERTRADING_LOSSES) {
    const bp = blueprints[index]
    bp.win = false
    bp.session = 'New York'
    bp.hour = 15 + (index % 2)
    bp.minute = (index * 5) % 60
    bp.dayOffset = Math.floor(index / 5) * 7 + 4
  }

  // Revenge trading mandatory
  for (const s of REVENGE_SERIES) {
    blueprints[s.normalA].win = false
    blueprints[s.normalB].win = false
    blueprints[s.oversize].win = false
    blueprints[s.normalA].lotSize = 0.2
    blueprints[s.normalB].lotSize = 0.2
    blueprints[s.oversize].lotSize = s.lot
  }

  // FOMO + early cut + moving SL labels
  for (const index of FOMO_INDEXES) blueprints[index].fomo = true
  for (const index of EARLY_TP_INDEXES) {
    blueprints[index].earlyProfitCut = true
    blueprints[index].win = true
  }
  for (const index of MOVING_SL_INDEXES) {
    blueprints[index].movingStopLoss = true
    blueprints[index].lotSize = blueprints[index].lotSize * 2
    blueprints[index].win = false
  }

  return blueprints
}

function enforceSymbolWinTargets(blueprints: TradeBlueprint[]): void {
  for (const plan of SYMBOL_PLANS) {
    const indexes = blueprints
      .map((bp, idx) => ({ bp, idx }))
      .filter(x => x.bp.symbol === plan.symbol)
      .map(x => x.idx)
    let wins = indexes.filter(i => blueprints[i].win).length
    while (wins > plan.wins) {
      const idx = indexes.find(i => blueprints[i].win && !EARLY_TP_INDEXES.has(i))
      if (idx === undefined) break
      blueprints[idx].win = false
      wins--
    }
    while (wins < plan.wins) {
      const idx = indexes.find(i => !blueprints[i].win && !FRIDAY_OVERTRADING_LOSSES.has(i))
      if (idx === undefined) break
      blueprints[idx].win = true
      wins++
    }
  }
}

function buildTrade(bp: TradeBlueprint, index: number): Trade {
  const plan = SYMBOL_PLANS.find(p => p.symbol === bp.symbol)!
  const priceSpan = plan.max - plan.min
  const base = plan.min + rand() * priceSpan
  const entryPrice = roundPrice(bp.symbol, base)

  const riskPct = bp.symbol === 'BTCUSDT' || bp.symbol === 'ETHUSD' ? 0.009 : 0.0018
  const movePctRaw = bp.fomo ? 0.0009 : riskPct
  const movePct = bp.symbol === 'XAUUSD' ? 0.0035 : movePctRaw
  const riskDistance = entryPrice * movePct
  const rewardDistance = bp.earlyProfitCut ? riskDistance * 0.56 : riskDistance * 1.8

  const dir = bp.direction
  const exitMove = bp.win
    ? bp.fomo
      ? riskDistance * 0.18
      : rewardDistance
    : bp.movingStopLoss
      ? riskDistance * 2.6
      : riskDistance

  const exitPrice = roundPrice(
    bp.symbol,
    dir === 'BUY'
      ? entryPrice + (bp.win ? exitMove : -exitMove)
      : entryPrice - (bp.win ? exitMove : -exitMove)
  )

  const stopLoss = roundPrice(
    bp.symbol,
    dir === 'BUY' ? entryPrice - riskDistance : entryPrice + riskDistance
  )
  const takeProfit = roundPrice(
    bp.symbol,
    dir === 'BUY' ? entryPrice + rewardDistance : entryPrice - rewardDistance
  )

  const dt = new Date(START_DATE_UTC)
  dt.setUTCDate(dt.getUTCDate() + bp.dayOffset)
  dt.setUTCHours(bp.hour, bp.minute, 0, 0)
  const durationMinutes = bp.fomo ? 24 + (index % 22) : 45 + (index % 180)
  const closeTime = new Date(dt.getTime() + durationMinutes * 60000)

  const unitPnl =
    bp.symbol === 'EURUSD' || bp.symbol === 'GBPUSD'
      ? 10000
      : bp.symbol.includes('JPY')
        ? 900
        : bp.symbol === 'XAUUSD'
          ? 60
          : bp.symbol === 'BTCUSDT'
            ? 0.25
            : bp.symbol === 'ETHUSD'
              ? 8
              : bp.symbol === 'NAS100'
                ? 4
                : 18
  const signed = bp.win ? 1 : -1
  const severeFactor = bp.movingStopLoss ? 2.4 : 1
  const pnl = signed * Math.abs((exitMove / entryPrice) * unitPnl * bp.lotSize * severeFactor * 100)
  const commission = -Math.max(1.5, Number((bp.lotSize * 7).toFixed(2)))
  const profitLoss = Number((pnl + commission).toFixed(2))
  const pipDiff = (dir === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice) * pipScale(bp.symbol)
  const profitLossPips = Number(pipDiff.toFixed(1))

  return {
    ticket: String(index + 1).padStart(3, '0'),
    symbol: bp.symbol,
    direction: dir,
    lotSize: Number(bp.lotSize.toFixed(2)),
    entryPrice,
    exitPrice,
    stopLoss: clamp(stopLoss, plan.min, plan.max),
    takeProfit: clamp(takeProfit, plan.min, plan.max),
    openTime: dt,
    closeTime,
    durationMinutes,
    commission,
    swap: 0,
    profitLoss,
    profitLossPips,
    session: toSession(bp.hour),
  }
}

const blueprints = buildBlueprints()
enforceSymbolWinTargets(blueprints)

export const demoTrades: Trade[] = blueprints.map((bp, index) => buildTrade(bp, index))
