import type { Trade } from './parseCSV'

/** Fenêtre Tokyo → session 'Asian' (compat. Trade / parseCSV). */
type TradeSession = Trade['session']

interface SymbolSpec {
  symbol: string
  count: number
  targetWins: number
  min: number
  max: number
  defaultLot: number
}

/** targetWins somme = 62 (= 6 Tokyo + 37 London + 19 NY), proches des win rates cibles par symbole. */
const SYMBOL_SPECS: SymbolSpec[] = [
  { symbol: 'EURUSD', count: 25, targetWins: 17, min: 1.075, max: 1.105, defaultLot: 0.4 },
  { symbol: 'GBPUSD', count: 20, targetWins: 11, min: 1.25, max: 1.29, defaultLot: 0.4 },
  { symbol: 'USDJPY', count: 10, targetWins: 5, min: 145, max: 152, defaultLot: 0.35 },
  { symbol: 'XAUUSD', count: 15, targetWins: 10, min: 3700, max: 4200, defaultLot: 0.25 },
  { symbol: 'BTCUSDT', count: 15, targetWins: 6, min: 70000, max: 88000, defaultLot: 0.15 },
  { symbol: 'ETHUSD', count: 10, targetWins: 5, min: 2200, max: 3700, defaultLot: 0.25 },
  { symbol: 'NAS100', count: 10, targetWins: 4, min: 17000, max: 19500, defaultLot: 0.35 },
  { symbol: 'SP500', count: 5, targetWins: 2, min: 5000, max: 5700, defaultLot: 0.4 },
  { symbol: 'GBPJPY', count: 10, targetWins: 2, min: 185, max: 195, defaultLot: 0.3 },
]

const START_DATE_UTC = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0))

const SESSION_TEMPLATE: TradeSession[] = [
  ...Array(20).fill('Asian' as const),
  ...Array(60).fill('London' as const),
  ...Array(40).fill('New York' as const),
]

const TOKYO_WINS = 6
const LONDON_WINS = 37
const NEW_YORK_WINS = 19

const FOMO_INDEXES = new Set([2, 11, 23, 34, 45, 57, 68, 79, 91, 102])
const EARLY_TP_INDEXES = new Set([
  4, 8, 14, 19, 26, 31, 39, 44, 51, 56, 62, 71, 77, 85, 94,
])
const MOVING_SL_INDEXES = new Set([40, 58, 72, 88, 103])
const FRIDAY_BLOCK = new Set([110, 111, 112, 113, 114, 115, 116, 117])

const REVENGE = [
  { a: 20, b: 21, oversize: 22, bigLot: 1.75 },
  { a: 64, b: 65, oversize: 66, bigLot: 1.9 },
]

function revengeIdxSet(): Set<number> {
  const s = new Set<number>()
  for (const r of REVENGE) {
    s.add(r.a)
    s.add(r.b)
    s.add(r.oversize)
  }
  return s
}

const REVENGE_INDICES = revengeIdxSet()

function rng(seed = 20260406): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const rand = rng()

function shuffleInPlace<T>(arr: T[], r: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function decimalsFor(symbol: string): number {
  if (symbol === 'EURUSD' || symbol === 'GBPUSD') return 5
  if (symbol.includes('JPY')) return 3
  if (symbol === 'XAUUSD' || symbol === 'BTCUSDT' || symbol === 'ETHUSD') return 2
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

function sessionToHourUTC(session: TradeSession, salt: number): number {
  if (session === 'Asian') return 2 + (salt % 8)
  if (session === 'London') return 8 + (salt % 8)
  return 14 + (salt % 8)
}

function randInRange(a: number, b: number): number {
  return a + rand() * (b - a)
}

function rawPnlEur(lot: number, win: boolean, highVol: boolean): number {
  if (win) {
    if (lot >= 1) return Math.round(randInRange(120, 480))
    return Math.round(randInRange(100, 500))
  }
  if (lot >= 1) return -Math.round(randInRange(200, 1200))
  const lossCap = highVol ? 280 : 250
  return -Math.round(randInRange(50, lossCap))
}

interface Row {
  symbol: string
  session: TradeSession
  win: boolean
  lotSize: number
  min: number
  max: number
  fomo: boolean
  earlyTp: boolean
  movingSl: boolean
  direction: 'BUY' | 'SELL'
  dayOffset: number
  hour: number
  minute: number
}

function sessionNeed(sess: TradeSession): number {
  if (sess === 'Asian') return TOKYO_WINS
  if (sess === 'London') return LONDON_WINS
  return NEW_YORK_WINS
}

function balanceEarlyTpSessions(rows: Row[]): void {
  const limits: Partial<Record<TradeSession, number>> = {
    Asian: TOKYO_WINS,
    London: LONDON_WINS,
    'New York': NEW_YORK_WINS,
  }
  for (let pass = 0; pass < 200; pass++) {
    let moved = false
    for (const sess of ['Asian', 'London', 'New York'] as TradeSession[]) {
      const cap = limits[sess]
      if (cap === undefined) continue
      const et = rows.filter(
        (r, i) => r.session === sess && EARLY_TP_INDEXES.has(i)
      ).length
      if (et <= cap) continue
      const i = rows.findIndex(
        (r, idx) => r.session === sess && EARLY_TP_INDEXES.has(idx)
      )
      const j = rows.findIndex(
        (r, idx) =>
          r.session !== sess && !EARLY_TP_INDEXES.has(idx) && !FRIDAY_BLOCK.has(idx)
      )
      if (i >= 0 && j >= 0) {
        const tmp = rows[i].session
        rows[i].session = rows[j].session
        rows[j].session = tmp
        moved = true
      }
    }
    if (!moved) break
  }
}

function assignWinsForSessions(rows: Row[]): void {
  const fixedLoss = (i: number) =>
    FRIDAY_BLOCK.has(i) || REVENGE_INDICES.has(i) || MOVING_SL_INDEXES.has(i)
  const fixedWin = (i: number) => EARLY_TP_INDEXES.has(i)

  for (const sess of ['Asian', 'London', 'New York'] as TradeSession[]) {
    const need = sessionNeed(sess)
    const idxs = rows.map((r, i) => (r.session === sess ? i : -1)).filter(i => i >= 0)
    for (const i of idxs) rows[i].win = false

    const mustWinIdx = idxs.filter(i => fixedWin(i))
    const pool = idxs.filter(i => !fixedLoss(i) && !fixedWin(i))
    shuffleInPlace(pool, rand)
    let wins = 0
    for (const i of mustWinIdx) {
      rows[i].win = true
      wins++
    }
    for (const i of pool) {
      if (wins >= need) break
      rows[i].win = true
      wins++
    }
    while (wins > need) {
      const flip = pool.find(i => rows[i].win)
      if (flip === undefined) {
        const w = idxs.find(i => rows[i].win && !fixedWin(i))
        if (w === undefined) break
        rows[w].win = false
      } else {
        rows[flip].win = false
      }
      wins--
    }
  }
}

function countSymWins(rows: Row[], sym: string): number {
  return rows.filter(r => r.symbol === sym && r.win).length
}

function fixedLossSlot(i: number): boolean {
  return FRIDAY_BLOCK.has(i) || REVENGE_INDICES.has(i) || MOVING_SL_INDEXES.has(i)
}

function refineSymbolTargets(rows: Row[]): void {
  const specBySym = Object.fromEntries(SYMBOL_SPECS.map(s => [s.symbol, s])) as Record<
    string,
    SymbolSpec
  >

  for (let pass = 0; pass < 300; pass++) {
    let moved = false
    for (const spec of SYMBOL_SPECS) {
      const diff = spec.targetWins - countSymWins(rows, spec.symbol)
      if (diff === 0) continue

      if (diff > 0) {
        const idxLoss = rows.findIndex(
          (r, i) =>
            r.symbol === spec.symbol &&
            !r.win &&
            !EARLY_TP_INDEXES.has(i) &&
            !FRIDAY_BLOCK.has(i) &&
            !REVENGE_INDICES.has(i)
        )
        if (idxLoss < 0) continue
        const sess = rows[idxLoss].session
        const donor = rows.findIndex(
          (r, i) =>
            r.win &&
            r.session === sess &&
            r.symbol !== spec.symbol &&
            !EARLY_TP_INDEXES.has(i) &&
            countSymWins(rows, r.symbol) > specBySym[r.symbol].targetWins
        )
        if (donor >= 0) {
          rows[donor].win = false
          rows[idxLoss].win = true
          moved = true
          continue
        }
        const anyDonor = rows.findIndex(
          (r, i) =>
            r.win &&
            r.session === sess &&
            r.symbol !== spec.symbol &&
            !EARLY_TP_INDEXES.has(i)
        )
        if (anyDonor >= 0) {
          rows[anyDonor].win = false
          rows[idxLoss].win = true
          moved = true
        }
      } else {
        const idxWin = rows.findIndex(
          (r, i) => r.symbol === spec.symbol && r.win && !EARLY_TP_INDEXES.has(i)
        )
        if (idxWin < 0) continue
        const sess = rows[idxWin].session
        const recv = rows.findIndex(
          (r, i) =>
            !r.win &&
            r.session === sess &&
            r.symbol !== spec.symbol &&
            !fixedLossSlot(i)
        )
        if (recv >= 0) {
          rows[idxWin].win = false
          rows[recv].win = true
          moved = true
        }
      }
    }
    if (!moved) break
  }
}

function applyStructureOverrides(rows: Row[]): void {
  for (const i of EARLY_TP_INDEXES) rows[i].win = true
  for (const i of FRIDAY_BLOCK) rows[i].win = false
  for (const s of REVENGE) {
    rows[s.a].win = false
    rows[s.b].win = false
    rows[s.oversize].win = false
    rows[s.a].lotSize = 0.2
    rows[s.b].lotSize = 0.2
    rows[s.oversize].lotSize = s.bigLot
  }
  for (const i of MOVING_SL_INDEXES) {
    const base =
      SYMBOL_SPECS.find(sp => sp.symbol === rows[i].symbol)?.defaultLot ?? 0.3
    rows[i].lotSize = Number((base * 2).toFixed(2))
    rows[i].win = false
  }
}

function rebalanceSessionWins(rows: Row[]): void {
  const fixedLoss = (i: number) =>
    FRIDAY_BLOCK.has(i) || REVENGE_INDICES.has(i) || MOVING_SL_INDEXES.has(i)
  const fixedWin = (i: number) => EARLY_TP_INDEXES.has(i)

  for (const sess of ['Asian', 'London', 'New York'] as TradeSession[]) {
    const need = sessionNeed(sess)
    const idxs = rows.map((r, i) => (r.session === sess ? i : -1)).filter(i => i >= 0)
    let wins = idxs.filter(i => rows[i].win).length

    while (wins < need) {
      const i = idxs.find(idx => !rows[idx].win && !fixedLoss(idx))
      if (i === undefined) break
      rows[i].win = true
      wins++
    }
    while (wins > need) {
      const i = idxs.find(idx => rows[idx].win && !fixedWin(idx))
      if (i === undefined) break
      rows[i].win = false
      wins--
    }
  }
}

function buildRows(): Row[] {
  const symbolsFlat: { symbol: string; min: number; max: number; defaultLot: number }[] = []
  for (const s of SYMBOL_SPECS) {
    for (let i = 0; i < s.count; i++) {
      symbolsFlat.push({
        symbol: s.symbol,
        min: s.min,
        max: s.max,
        defaultLot: s.defaultLot,
      })
    }
  }

  const sessions = [...SESSION_TEMPLATE]
  shuffleInPlace(sessions, rand)

  const rows: Row[] = symbolsFlat.map((s, i) => ({
    symbol: s.symbol,
    session: sessions[i],
    win: false,
    lotSize: s.defaultLot,
    min: s.min,
    max: s.max,
    fomo: FOMO_INDEXES.has(i),
    earlyTp: EARLY_TP_INDEXES.has(i),
    movingSl: MOVING_SL_INDEXES.has(i),
    direction: i % 2 === 0 ? 'BUY' : 'SELL',
    dayOffset: Math.floor(i * 1.47) % 170,
    hour: 0,
    minute: (i * 11) % 60,
  }))

  balanceEarlyTpSessions(rows)
  assignWinsForSessions(rows)
  refineSymbolTargets(rows)
  applyStructureOverrides(rows)
  rebalanceSessionWins(rows)
  refineSymbolTargets(rows)
  rebalanceSessionWins(rows)

  for (let i = 0; i < rows.length; i++) {
    rows[i].hour = sessionToHourUTC(rows[i].session, i)
  }

  return rows
}

function equityDrawdownPct(pnls: number[]): number {
  let eq = 10000
  let peak = eq
  let maxDdPct = 0
  for (const p of pnls) {
    eq += p
    if (eq > peak) peak = eq
    const dd = peak > 0 ? ((peak - eq) / peak) * 100 : 0
    if (dd > maxDdPct) maxDdPct = dd
  }
  return maxDdPct
}

function buildTrade(row: Row, index: number, profitLoss: number): Trade {
  const span = row.max - row.min
  const entryPrice = roundPrice(row.symbol, row.min + rand() * span)
  const riskPct =
    row.symbol === 'BTCUSDT' || row.symbol === 'ETHUSD'
      ? 0.008
      : row.symbol === 'XAUUSD'
        ? 0.0028
        : 0.0016
  const riskDist = entryPrice * riskPct
  const rewardDist = row.earlyTp ? riskDist * 0.55 : riskDist * 1.75
  const move = row.win
    ? row.fomo
      ? riskDist * 0.15
      : rewardDist
    : riskDist * (row.movingSl ? 2.2 : 1)
  const dir = row.direction
  const exitPrice = roundPrice(
    row.symbol,
    dir === 'BUY'
      ? entryPrice + (row.win ? move : -move)
      : entryPrice - (row.win ? move : -move)
  )
  const stopLoss = roundPrice(
    row.symbol,
    dir === 'BUY' ? entryPrice - riskDist : entryPrice + riskDist
  )
  const takeProfit = roundPrice(
    row.symbol,
    dir === 'BUY' ? entryPrice + rewardDist : entryPrice - rewardDist
  )
  const open = new Date(START_DATE_UTC)
  open.setUTCDate(open.getUTCDate() + row.dayOffset)
  open.setUTCHours(row.hour, row.minute, 0, 0)
  const duration = row.fomo ? 20 + (index % 30) : 40 + (index % 120)
  const close = new Date(open.getTime() + duration * 60000)
  const commission = -Math.max(1.5, Number((row.lotSize * 6.5).toFixed(2)))
  const pipDiff =
    (dir === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice) * pipScale(row.symbol)
  return {
    ticket: String(index + 1).padStart(3, '0'),
    symbol: row.symbol,
    direction: dir,
    lotSize: Number(row.lotSize.toFixed(2)),
    entryPrice,
    exitPrice,
    stopLoss: Math.min(row.max, Math.max(row.min, stopLoss)),
    takeProfit: Math.min(row.max, Math.max(row.min, takeProfit)),
    openTime: open,
    closeTime: close,
    durationMinutes: duration,
    commission,
    swap: 0,
    profitLoss,
    profitLossPips: Number(pipDiff.toFixed(1)),
    session: row.session,
  }
}

function finalizePnls(rows: Row[]): Trade[] {
  const fee = (lot: number) => -Math.max(1.5, Number((lot * 6.5).toFixed(2)))
  const pnls: number[] = rows.map((r, i) => rawPnlEur(r.lotSize, r.win, r.movingSl || r.fomo) + fee(r.lotSize))

  const targetMid = -950
  let sum = pnls.reduce((a, b) => a + b, 0)
  for (let iter = 0; iter < 120; iter++) {
    if (sum <= -500 && sum >= -1500) break
    const adj = Math.max(-35, Math.min(35, (targetMid - sum) / pnls.length))
    for (let i = 0; i < pnls.length; i++) {
      const r = rows[i]
      const capHi = r.win ? (r.lotSize >= 1 ? 480 : 500) : r.lotSize >= 1 ? -200 : -50
      const capLo = r.win ? (r.lotSize >= 1 ? 120 : 100) : r.lotSize >= 1 ? -1200 : -250
      const w = r.win ? 0.35 : -0.65
      pnls[i] = Math.min(capHi, Math.max(capLo, pnls[i] + adj * w))
    }
    sum = pnls.reduce((a, b) => a + b, 0)
  }

  for (let i = 0; i < pnls.length; i++) {
    const r = rows[i]
    if (r.win) pnls[i] = Math.min(500, Math.max(100, pnls[i]))
    else if (r.lotSize >= 1) pnls[i] = Math.min(-200, Math.max(-1200, pnls[i]))
    else pnls[i] = Math.min(-50, Math.max(-250, pnls[i]))
  }

  sum = pnls.reduce((a, b) => a + b, 0)
  for (let guard = 0; guard < 120 && (sum > -500 || sum < -1500); guard++) {
    if (sum > -500) {
      const idx = pnls.findIndex((_, i) => !rows[i].win && rows[i].lotSize < 1)
      if (idx >= 0) pnls[idx] = Math.max(-250, pnls[idx] - 20)
    } else {
      const idx = pnls.findIndex((_, i) => rows[i].win)
      if (idx >= 0) pnls[idx] = Math.min(500, pnls[idx] + 15)
    }
    sum = pnls.reduce((a, b) => a + b, 0)
  }

  function openMs(row: Row): number {
    const d = new Date(START_DATE_UTC)
    d.setUTCDate(d.getUTCDate() + row.dayOffset)
    d.setUTCHours(row.hour, row.minute, 0, 0)
    return d.getTime()
  }
  const order = pnls.map((_, i) => i).sort((a, b) => openMs(rows[a]) - openMs(rows[b]))
  let dd = equityDrawdownPct(order.map(i => pnls[i]))
  for (let tries = 0; tries < 80 && (dd < 7 || dd > 15); tries++) {
    const factor = dd < 7 ? 1.035 : 0.965
    for (let i = 0; i < pnls.length; i++) {
      if (!rows[i].win) {
        const lo = rows[i].lotSize >= 1 ? -1200 : -250
        pnls[i] = Math.max(lo, Math.round(pnls[i] * factor))
      }
    }
    dd = equityDrawdownPct(order.map(i => pnls[i]))
  }

  return rows.map((row, i) => buildTrade(row, i, Number(pnls[i].toFixed(2))))
}

const builtRows = buildRows()
export const demoTrades: Trade[] = finalizePnls(builtRows)
