import { Trade } from './parseMT4'

export function parseTradingView(
  csvText: string
): Trade[] {
  const lines = csvText.split('\n').filter(Boolean)
  
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => 
      c.trim().replace(/"/g, ''))
    
    const time = new Date(cols[3])
    const direction: Trade['direction'] = cols[1].toUpperCase()
      .includes('LONG') ? 'BUY' : 'SELL'
    const entryPrice = parseFloat(cols[4]) || 0
    const exitPrice = parseFloat(cols[4]) || 0
    const pnl = parseFloat(cols[6]) || 0
    const hour = time.getUTCHours()
    
    return {
      ticket: cols[0],
      symbol: 'UNKNOWN',
      direction,
      lotSize: parseFloat(cols[5]) || 0,
      entryPrice,
      exitPrice,
      stopLoss: null,
      takeProfit: null,
      openTime: time,
      closeTime: time,
      durationMinutes: 0,
      commission: 0,
      swap: 0,
      profitLoss: pnl,
      profitLossPips: 0,
      session: (
        hour >= 7 && hour < 16 ? 'London' :
        hour >= 13 && hour < 22 ? 'New York' :
        hour >= 0 && hour < 8 ? 'Asian' : 'Other'
      ) as Trade['session'],
    }
  }).filter(t => t.entryPrice > 0)
}
