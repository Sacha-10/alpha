import { Trade } from './parseMT4'
import { detectDelimiter, makeCSVParser } from './utils'

// Format Bybit CSV (Trade History export) :
// Date, Symbol, Side, Price, Quantity, Fee, Realized P&L, Order ID
export function parseBybit(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0])
  const { line: parseLine, num: parseNum } = makeCSVParser(delimiter)

  return lines.slice(1).map(line => {
    const cols = parseLine(line)

    const time = new Date(cols[0])
    const symbol = cols[1]
    const direction: Trade['direction'] =
      cols[2].toUpperCase() === 'BUY' ? 'BUY' : 'SELL'
    const price = parseNum(cols[3])
    const qty = parseNum(cols[4])
    const fee = parseNum(cols[5])
    const pnl = parseNum(cols[6])
    const orderId = cols[7]

    return {
      ticket: orderId || `bybit-${time.getTime()}`,
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
      session: (() => {
        const h = time.getUTCHours()
        if (h >= 7 && h < 16) return 'London'
        if (h >= 13 && h < 22) return 'New York'
        if (h >= 0 && h < 8) return 'Asian'
        return 'Other'
      })() as Trade['session'],
    } as Trade
  }).filter(t => t.symbol && t.entryPrice > 0)
}
