import { Trade } from './parseMT4'

// Format Bybit CSV (Trade History export) :
// Date, Symbol, Side, Price, Quantity, Fee, Realized P&L, Order ID
export function parseBybit(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(Boolean)

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))

    const time = new Date(cols[0])
    const symbol = cols[1]
    const direction: Trade['direction'] =
      cols[2].toUpperCase() === 'BUY' ? 'BUY' : 'SELL'
    const price = parseFloat(cols[3]) || 0
    const qty = parseFloat(cols[4]) || 0
    const fee = parseFloat(cols[5]) || 0
    const pnl = parseFloat(cols[6]) || 0
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
