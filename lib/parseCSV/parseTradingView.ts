import { Trade } from './parseMT4'

// Format attendu (TradingView Strategy Tester — Liste des trades fermés) :
// Trade #, Type, Signal, Entry Date/Time, Entry Price, Exit Date/Time, Exit Price, Contracts, Profit, ...
export function parseTradingView(
  csvText: string
): Trade[] {
  const lines = csvText.split('\n').filter(Boolean)

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c =>
      c.trim().replace(/"/g, ''))

    const openTime = new Date(cols[3])
    const closeTime = new Date(cols[5])
    const direction: Trade['direction'] = cols[1].toUpperCase()
      .includes('LONG') ? 'BUY' : 'SELL'
    const entryPrice = parseFloat(cols[4]) || 0
    const exitPrice = parseFloat(cols[6]) || 0
    const lotSize = parseFloat(cols[7]) || 0
    const pnl = parseFloat(cols[8]) || 0
    const durationMinutes = Math.round(
      (closeTime.getTime() - openTime.getTime()) / 60000
    )
    const hour = openTime.getUTCHours()

    return {
      ticket: cols[0],
      symbol: cols[2] || 'UNKNOWN',
      direction,
      lotSize,
      entryPrice,
      exitPrice,
      stopLoss: null,
      takeProfit: null,
      openTime,
      closeTime,
      durationMinutes,
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
