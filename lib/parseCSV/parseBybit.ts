import { Trade } from './parseMT4'
import { detectDelimiter, makeCSVParser, cleanSymbol, parseTradeDate } from './utils'
import { getSession } from './session'

// Format Bybit CSV (Trade History export) :
// Date, Symbol, Side, Price, Quantity, Fee, Realized P&L, Order ID
export function parseBybit(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0])
  const { line: parseLine, num: parseNum } = makeCSVParser(delimiter)

  const result: Trade[] = []
  for (const line of lines.slice(1)) {
    const cols = parseLine(line)

    // Ligne tronquée (pied de page, total) : skip silencieux — indices 0 à 7
    // obligatoires, l'Order ID (index 7) est lu plus bas.
    if (cols.length < 8) continue

    const time = parseTradeDate(cols[0])
    // Date invalide : skip silencieux — même politique que la garde cols.length.
    if (isNaN(time.getTime())) continue
    const symbol = cleanSymbol(cols[1])
    const direction: Trade['direction'] =
      cols[2].toUpperCase() === 'BUY' ? 'BUY' : 'SELL'
    const price = parseNum(cols[3])
    const qty = parseNum(cols[4])
    const fee = parseNum(cols[5])
    const pnl = parseNum(cols[6])
    const orderId = cols[7]

    result.push({
      ticket: orderId || `bybit-${time.getTime()}`,
      source: 'bybit',
      symbol,
      direction,
      lotSize: qty,
      entryPrice: price,
      exitPrice: price,
      stopLoss: null,
      takeProfit: null,
      openTime: time,
      closeTime: time,
      durationMinutes: 0,
      commission: fee,
      swap: 0,
      profitLoss: pnl,
      profitLossPips: 0,
      session: getSession(time),
    } as Trade)
  }
  return result.filter(t => t.symbol && t.entryPrice > 0)
}
