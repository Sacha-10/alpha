import { detectDelimiter, makeCSVParser, cleanSymbol, parseTradeDate } from './utils'
import { getSession } from './session'

export type TradeSource =
  | 'mt4'
  | 'mt5'
  | 'ftmo'
  | 'binance'
  | 'bybit'
  | 'tradingview'

export interface Trade {
  ticket: string
  // Format d'origine détecté — porté jusqu'à l'import pour la clé de dédup
  // (user_id, source, source_id). Renseigné par chaque parser.
  source: TradeSource
  symbol: string
  direction: 'BUY' | 'SELL'
  lotSize: number
  entryPrice: number
  exitPrice: number
  stopLoss: number | null
  takeProfit: number | null
  openTime: Date
  closeTime: Date
  durationMinutes: number
  commission: number
  swap: number
  profitLoss: number
  profitLossPips: number
  session: 'London' | 'New York' | 'Asian' | 'Other'
}

function calcPips(
  symbol: string,
  entry: number,
  exit: number,
  direction: string
): number {
  const diff = direction === 'BUY'
    ? exit - entry
    : entry - exit
  if (symbol.includes('JPY')) return diff * 100
  return diff * 10000
}

export function parseMT4(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0])
  const { line: parseLine, num: parseNum } = makeCSVParser(delimiter)
  const headers = parseLine(lines[0])

  const isMT5 = headers.includes('Position')

  const result: Trade[] = []
  for (const line of lines.slice(1)) {
    const cols = parseLine(line)

    // Ligne tronquée (pied de page, solde, séparateur) : skip silencieux,
    // les deux formats lisent jusqu'à l'index 12.
    if (cols.length < 13) continue

    if (isMT5) {
      const openTime = parseTradeDate(cols[7])
      const closeTime = parseTradeDate(cols[9])
      // Date invalide : skip silencieux — même politique que la garde cols.length.
      if (isNaN(openTime.getTime()) || isNaN(closeTime.getTime())) continue
      const entryPrice = parseNum(cols[4])
      const exitPrice = parseNum(cols[8])
      const direction: Trade['direction'] = cols[2] === 'buy' ? 'BUY' : 'SELL'
      const durationMinutes = Math.round(
        (closeTime.getTime() - openTime.getTime()) / 60000
      )
      const sym = cleanSymbol(cols[1])
      result.push({
        ticket: cols[0],
        source: 'mt5',
        symbol: sym,
        direction,
        lotSize: parseNum(cols[3]),
        entryPrice,
        exitPrice,
        stopLoss: parseNum(cols[5]) || null,
        takeProfit: parseNum(cols[6]) || null,
        openTime,
        closeTime,
        durationMinutes,
        commission: parseNum(cols[10]),
        swap: parseNum(cols[11]),
        profitLoss: parseNum(cols[12]),
        profitLossPips: calcPips(sym, entryPrice, exitPrice, direction),
        session: getSession(openTime),
      } as Trade)
      continue
    }

    const openTime = parseTradeDate(cols[1])
    const closeTime = parseTradeDate(cols[8])
    // Date invalide : skip silencieux — même politique que la garde cols.length.
    if (isNaN(openTime.getTime()) || isNaN(closeTime.getTime())) continue
    const durationMinutes = Math.round(
      (closeTime.getTime() - openTime.getTime()) / 60000
    )
    const direction = cols[2].toUpperCase()
      .includes('BUY') ? 'BUY' : 'SELL'
    const entryPrice = parseNum(cols[5])
    const exitPrice = parseNum(cols[9])
    const sym = cleanSymbol(cols[4])

    result.push({
      ticket: cols[0],
      source: 'mt4',
      symbol: sym,
      direction,
      lotSize: parseNum(cols[3]),
      entryPrice,
      exitPrice,
      stopLoss: parseNum(cols[6]) || null,
      takeProfit: parseNum(cols[7]) || null,
      openTime,
      closeTime,
      durationMinutes,
      commission: parseNum(cols[10]),
      swap: parseNum(cols[11]),
      profitLoss: parseNum(cols[12]),
      profitLossPips: calcPips(sym, entryPrice, exitPrice, direction),
      session: getSession(openTime),
    } as Trade)
  }
  return result.filter(t => !!(t.symbol && t.entryPrice > 0))
}
