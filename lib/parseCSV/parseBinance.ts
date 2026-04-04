import { Trade } from './parseMT4'

export function parseBinance(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(Boolean)
  const headers = lines[0].split(',').map(h => 
    h.trim().replace(/"/g, ''))
  
  const isFutures = headers.includes('Realized Profit')
  const trades: Trade[] = []
  const partialOrders: Record<string, any[]> = {}
  
  lines.slice(1).forEach(line => {
    const cols = line.split(',').map(c => 
      c.trim().replace(/"/g, ''))
    
    const symbol = isFutures ? cols[1] : cols[1]
    const side = isFutures ? cols[2] : cols[2]
    const price = parseFloat(
      isFutures ? cols[3] : cols[3]
    ) || 0
    const qty = parseFloat(
      isFutures ? cols[4] : cols[4]
    ) || 0
    const pnl = parseFloat(
      isFutures ? cols[5] : '0'
    ) || 0
    const fee = parseFloat(
      isFutures ? cols[6] : cols[6]
    ) || 0
    const time = new Date(
      isFutures ? cols[0] : cols[0]
    )
    
    if (!partialOrders[symbol]) {
      partialOrders[symbol] = []
    }
    partialOrders[symbol].push({
      symbol, side, price, qty, pnl, fee, time
    })
    
    if (partialOrders[symbol].length >= 2) {
      const orders = partialOrders[symbol]
      const avgEntry = orders.reduce(
        (sum, o) => sum + o.price * o.qty, 0
      ) / orders.reduce((sum, o) => sum + o.qty, 0)
      const totalQty = orders.reduce(
        (sum, o) => sum + o.qty, 0
      )
      const totalPnl = orders.reduce(
        (sum, o) => sum + o.pnl, 0
      )
      const direction = orders[0].side === 'BUY' 
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
          (time.getTime() - orders[0].time.getTime()) 
          / 60000
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
