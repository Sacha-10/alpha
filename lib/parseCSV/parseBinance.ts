import { Trade } from './parseMT4'
import { detectDelimiter, makeCSVParser } from './utils'

// Format Binance Futures : Date, Symbol, Side, Price, Qty, Realized Profit, Fee
// Format Binance Spot    : Date, Pair,   Type, Price, Amount, Total, Fee, Fee Coin
// Détecté via la présence de "Realized Profit" dans les headers
export function parseBinance(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0])
  const { line: parseLine, num: parseNum } = makeCSVParser(delimiter)
  const headers = parseLine(lines[0])

  const isFutures = headers.includes('Realized Profit')
  const trades: Trade[] = []
  const partialOrders: Record<string, any[]> = {}

  lines.slice(1).forEach(line => {
    const cols = parseLine(line)

    const time = new Date(cols[0])
    // Spot exporte parfois "BTC/USDT" — on normalise en "BTCUSDT"
    const symbol = cols[1].replace('/', '')
    const side = cols[2].toUpperCase() as 'BUY' | 'SELL'
    const price = parseNum(cols[3])
    const qty = parseNum(cols[4])
    // cols[5] = Realized Profit (futures) ou Total montant (spot, non pertinent)
    const pnl = isFutures ? parseNum(cols[5]) : 0
    const fee = parseNum(cols[6])

    if (!partialOrders[symbol]) {
      partialOrders[symbol] = []
    }
    partialOrders[symbol].push({ symbol, side, price, qty, pnl, fee, time })

    if (partialOrders[symbol].length >= 2) {
      const orders = partialOrders[symbol]
      const totalQty = orders.reduce((sum, o) => sum + o.qty, 0)
      const avgEntry = orders.reduce(
        (sum, o) => sum + o.price * o.qty, 0
      ) / totalQty
      const totalPnl = orders.reduce((sum, o) => sum + o.pnl, 0)
      const direction: Trade['direction'] = orders[0].side === 'BUY'
        ? 'BUY' : 'SELL'

      trades.push({
        ticket: `${symbol}-${time.getTime()}`,
        symbol,
        direction,
        lotSize: totalQty,
        entryPrice: avgEntry,
        exitPrice: price,
        stopLoss: null,
        takeProfit: null,
        openTime: orders[0].time,
        closeTime: time,
        durationMinutes: Math.round(
          (time.getTime() - orders[0].time.getTime()) / 60000
        ),
        commission: fee,
        swap: 0,
        profitLoss: totalPnl ||
          (direction === 'BUY'
            ? (price - avgEntry) * totalQty
            : (avgEntry - price) * totalQty),
        profitLossPips: 0,
        session: (() => {
          const h = time.getUTCHours()
          if (h >= 7 && h < 16) return 'London'
          if (h >= 13 && h < 22) return 'New York'
          if (h >= 0 && h < 8) return 'Asian'
          return 'Other'
        })() as Trade['session'],
      })
      partialOrders[symbol] = []
    }
  })

  return trades.filter(t => t.symbol && t.entryPrice > 0)
}
