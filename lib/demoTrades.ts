import type { Trade } from './parseCSV'

/** Tokyo = champ session 'Asian' (compat. Trade). */
type TradeSession = Trade['session']

interface SymbolSpec {
  symbol: string
  count: number
  targetWins: number
  min: number
  max: number
  defaultLot: number
}

/**
 * 120 trades, 3 actifs. Gains symboles (priorité) : XAU 35/50 (70%), EUR 26/50 (52%), BTC 5/20 (25%) → 66 gains, WR global 55%.
 * Sessions (20/60/40 trades) : 7 + 39 + 20 = 66 gains (~35% Tokyo, ~65% London, ~50% NY).
 */
const SYMBOL_SPECS: SymbolSpec[] = [
  { symbol: 'XAUUSD', count: 50, targetWins: 35, min: 2800, max: 3100, defaultLot: 0.3 },
  { symbol: 'EURUSD', count: 50, targetWins: 26, min: 1.075, max: 1.105, defaultLot: 0.35 },
  { symbol: 'BTCUSD', count: 20, targetWins: 5, min: 70000, max: 88000, defaultLot: 0.12 },
]

/** Lundi UTC : dayOffset % 7 aligné avec mar./jeu. (gains) et lun./ven. (pertes). */
const START_DATE_UTC = new Date(Date.UTC(2025, 0, 6, 0, 0, 0, 0))

const SESSION_TEMPLATE: TradeSession[] = [
  ...Array(20).fill('Asian' as const),
  ...Array(60).fill('London' as const),
  ...Array(40).fill('New York' as const),
]

const TOKYO_WINS = 7
const LONDON_WINS = 39
const NEW_YORK_WINS = 20

/** FOMO 4 | Coupure TP 5 | Moving SL 3 | Revenge 3 trades (2×0.2 + 1 oversize) */
const FOMO_INDEXES = new Set([5, 18, 71, 95])
const EARLY_TP_INDEXES = new Set([7, 22, 38, 52, 89])
const MOVING_SL_INDEXES = new Set([41, 66, 108])

/** Une série revenge : 2 pertes 0.2 lot + 1 perte 1.2-1.5 lot (≤800€ max dans rawPnl). */
const REVENGE = [{ a: 28, b: 29, oversize: 30, bigLot: 1.35 }]

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

function rng(seed = 20260412): () => number {
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
  if (symbol === 'EURUSD') return 5
  if (symbol === 'XAUUSD' || symbol === 'BTCUSD') return 2
  return 5
}

function pipScale(symbol: string): number {
  if (symbol === 'EURUSD') return 10000
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

/** Lots 0.1-0.5 : +100/+500, -50/-250 | Lots ≥1 revenge : pertes -200/-800 max. BTC : gains modestes, pertes hautes du plage (pire symbole). */
function rawPnlEur(row: Row): number {
  const highVol = row.movingSl || row.fomo
  const lot = row.lotSize
  if (row.win) {
    if (lot >= 1) return Math.round(randInRange(120, 480))
    if (row.symbol === 'BTCUSD') return Math.round(randInRange(95, 200))
    return Math.round(randInRange(100, 500))
  }
  if (lot >= 1) return -Math.round(randInRange(200, 800))
  if (row.symbol === 'BTCUSD')
    return -Math.round(randInRange(175, 250))
  const lossCap = highVol ? 280 : 250
  return -Math.round(randInRange(50, lossCap))
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
          r.session !== sess && !EARLY_TP_INDEXES.has(idx)
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
  const fixedLoss = (i: number) => REVENGE_INDICES.has(i) || MOVING_SL_INDEXES.has(i)
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
  return REVENGE_INDICES.has(i) || MOVING_SL_INDEXES.has(i)
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
            !fixedLossSlot(i)
        )
        if (idxLoss < 0) continue
        const sess = rows[idxLoss].session
        let donor = rows.findIndex(
          (r, i) =>
            r.win &&
            r.session === sess &&
            r.symbol !== spec.symbol &&
            !EARLY_TP_INDEXES.has(i) &&
            countSymWins(rows, r.symbol) > specBySym[r.symbol].targetWins
        )
        if (donor < 0) {
          donor = rows.findIndex(
            (r, i) =>
              r.win &&
              r.session === sess &&
              r.symbol !== spec.symbol &&
              !EARLY_TP_INDEXES.has(i)
          )
        }
        if (donor >= 0) {
          rows[donor].win = false
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
      SYMBOL_SPECS.find(sp => sp.symbol === rows[i].symbol)?.defaultLot ?? 0.25
    rows[i].lotSize = Number((base * 2).toFixed(2))
    rows[i].win = false
  }
}

function rebalanceSessionWins(rows: Row[]): void {
  const fixedLoss = (i: number) => REVENGE_INDICES.has(i) || MOVING_SL_INDEXES.has(i)
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

/**
 * Répartition stricte par jour (120 trades) :
 * - Mardi  : 27/38 gagnants (71.05%)
 * - Jeudi  : 27/38 gagnants (71.05%)
 * - Lundi  : 6/22 gagnants (27.27%)
 * - Vendredi : 6/22 gagnants (27.27%)
 * Cette structure garde Mardi/Jeudi équilibrés pour faire alterner bestDayOfWeek.
 */
function assignDayOffsets(rows: Row[]): void {
  const plans = [
    { mod7: 1, total: 38, wins: 27 }, // Mardi
    { mod7: 3, total: 38, wins: 27 }, // Jeudi
    { mod7: 0, total: 22, wins: 6 },  // Lundi
    { mod7: 4, total: 22, wins: 6 },  // Vendredi
  ]

  const winIdx = rows
    .map((r, i) => (r.win ? i : -1))
    .filter(i => i >= 0)
  const lossIdx = rows
    .map((r, i) => (!r.win ? i : -1))
    .filter(i => i >= 0)

  shuffleInPlace(winIdx, rand)
  shuffleInPlace(lossIdx, rand)

  const occurrences: Record<number, number> = {
    0: 0,
    1: 0,
    3: 0,
    4: 0,
  }

  for (const plan of plans) {
    const losses = plan.total - plan.wins
    for (let i = 0; i < plan.wins; i++) {
      const idx = winIdx.pop()
      if (idx === undefined) break
      const week = occurrences[plan.mod7]++
      rows[idx].dayOffset = week * 7 + plan.mod7
    }
    for (let i = 0; i < losses; i++) {
      const idx = lossIdx.pop()
      if (idx === undefined) break
      const week = occurrences[plan.mod7]++
      rows[idx].dayOffset = week * 7 + plan.mod7
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

  const rows: Row[] = symbolsFlat.map((symRow, i) => ({
    symbol: symRow.symbol,
    session: sessions[i],
    win: false,
    lotSize: symRow.defaultLot,
    min: symRow.min,
    max: symRow.max,
    fomo: FOMO_INDEXES.has(i),
    earlyTp: EARLY_TP_INDEXES.has(i),
    movingSl: MOVING_SL_INDEXES.has(i),
    direction: i % 2 === 0 ? 'BUY' : 'SELL',
    dayOffset: 0,
    hour: 0,
    minute: (i * 13) % 60,
  }))

  balanceEarlyTpSessions(rows)
  assignWinsForSessions(rows)
  refineSymbolTargets(rows)
  applyStructureOverrides(rows)
  rebalanceSessionWins(rows)
  refineSymbolTargets(rows)
  rebalanceSessionWins(rows)

  assignDayOffsets(rows)
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
    row.symbol === 'BTCUSD' ? 0.007 : row.symbol === 'XAUUSD' ? 0.0025 : 0.0016
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
  const duration = row.fomo ? 20 + (index % 28) : 40 + (index % 100)
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

function sumPnls(pnls: number[]): number {
  return pnls.reduce((a, b) => a + b, 0)
}

function pnlBySymbol(rows: Row[], pnls: number[]): Record<string, number> {
  const t: Record<string, number> = { XAUUSD: 0, EURUSD: 0, BTCUSD: 0 }
  rows.forEach((r, i) => {
    t[r.symbol] = (t[r.symbol] ?? 0) + pnls[i]
  })
  return t
}

function clampPnlToCaps(rows: Row[], pnls: number[]): void {
  for (let i = 0; i < pnls.length; i++) {
    const r = rows[i]
    if (r.win) pnls[i] = Math.min(500, Math.max(100, pnls[i]))
    else if (r.lotSize >= 1)
      pnls[i] = Math.min(-200, Math.max(-800, pnls[i]))
    else pnls[i] = Math.min(-50, Math.max(-250, pnls[i]))
  }
}

function enforcePnlBandAndBtcWorst(rows: Row[], pnls: number[]): void {
  const low = -1000
  const high = -250

  for (let guard = 0; guard < 200; guard++) {
    const sum = sumPnls(pnls)
    if (sum >= low && sum <= high) break
    if (sum > high) {
      const idx = pnls.findIndex(
        (_, i) => !rows[i].win && rows[i].symbol === 'BTCUSD'
      )
      const j = idx >= 0 ? idx : pnls.findIndex((_, i) => !rows[i].win)
      if (j < 0) break
      const cap = rows[j].lotSize >= 1 ? -800 : -250
      pnls[j] = Math.max(cap, pnls[j] - 22)
    } else if (sum < low) {
      const idx = pnls.findIndex((_, i) => rows[i].win && rows[i].symbol !== 'BTCUSD')
      const j = idx >= 0 ? idx : pnls.findIndex((_, i) => rows[i].win)
      if (j < 0) break
      pnls[j] = Math.min(500, pnls[j] + 14)
    }
    clampPnlToCaps(rows, pnls)
  }

  for (let guard = 0; guard < 120; guard++) {
    const by = pnlBySymbol(rows, pnls)
    if (by.BTCUSD <= by.XAUUSD && by.BTCUSD <= by.EURUSD) break
    const idx = pnls.findIndex(
      (_, i) => !rows[i].win && rows[i].symbol === 'BTCUSD'
    )
    if (idx < 0) break
    pnls[idx] = Math.max(-250, pnls[idx] - 20)
    clampPnlToCaps(rows, pnls)
  }

  for (let guard = 0; guard < 80; guard++) {
    const sum = sumPnls(pnls)
    if (sum >= low && sum <= high) break
    if (sum > high) {
      const idx = pnls.findIndex((_, i) => !rows[i].win)
      if (idx < 0) break
      const cap = rows[idx].lotSize >= 1 ? -800 : -250
      pnls[idx] = Math.max(cap, pnls[idx] - 15)
    } else if (sum < low) {
      const idx = pnls.findIndex((_, i) => rows[i].win)
      if (idx < 0) break
      pnls[idx] = Math.min(500, pnls[idx] + 10)
    }
    clampPnlToCaps(rows, pnls)
  }
}

function finalizePnls(rows: Row[]): Trade[] {
  const fee = (lot: number) => -Math.max(1.5, Number((lot * 6.5).toFixed(2)))
  const pnls: number[] = rows.map(r => rawPnlEur(r) + fee(r.lotSize))

  const targetMid = -625
  let sum = sumPnls(pnls)
  for (let iter = 0; iter < 120; iter++) {
    if (sum <= -250 && sum >= -1000) break
    const adj = Math.max(-28, Math.min(28, (targetMid - sum) / pnls.length))
    for (let i = 0; i < pnls.length; i++) {
      const r = rows[i]
      const capHi = r.win ? (r.lotSize >= 1 ? 480 : 500) : r.lotSize >= 1 ? -200 : -50
      const capLo = r.win ? (r.lotSize >= 1 ? 120 : 100) : r.lotSize >= 1 ? -800 : -250
      const w = r.win ? 0.35 : -0.65
      pnls[i] = Math.min(capHi, Math.max(capLo, pnls[i] + adj * w))
    }
    sum = sumPnls(pnls)
  }

  clampPnlToCaps(rows, pnls)

  function openMs(row: Row): number {
    const d = new Date(START_DATE_UTC)
    d.setUTCDate(d.getUTCDate() + row.dayOffset)
    d.setUTCHours(row.hour, row.minute, 0, 0)
    return d.getTime()
  }
  const order = pnls.map((_, i) => i).sort((a, b) => openMs(rows[a]) - openMs(rows[b]))
  let dd = equityDrawdownPct(order.map(i => pnls[i]))
  for (let tries = 0; tries < 90 && (dd < 7 || dd > 15); tries++) {
    const factor = dd < 7 ? 1.03 : 0.97
    for (let i = 0; i < pnls.length; i++) {
      if (!rows[i].win) {
        const lo = rows[i].lotSize >= 1 ? -800 : -250
        pnls[i] = Math.max(lo, Math.round(pnls[i] * factor))
      }
    }
    clampPnlToCaps(rows, pnls)
    dd = equityDrawdownPct(order.map(i => pnls[i]))
  }

  enforcePnlBandAndBtcWorst(rows, pnls)

  return rows.map((row, i) => buildTrade(row, i, Number(pnls[i].toFixed(2))))
}

const builtRows = buildRows()
export const demoTrades: Trade[] = finalizePnls(builtRows)
