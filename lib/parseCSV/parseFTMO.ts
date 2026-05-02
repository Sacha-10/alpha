import { Trade } from './parseMT4'

// Format FTMO Metrix (Trading Journal > Export CSV) :
// Position, Symbol, Type, Volume, Price(open), S/L, T/P, Time(open),
// Price(close), Time(close), Commission, Fee, Swap, Profit
//
// Diffère du MT5 standard par la colonne "Fee" à l'index 11,
// qui décale Swap → [12] et Profit → [13].

function getSession(date: Date): Trade['session'] {
  const hour = date.getUTCHours()
  if (hour >= 7 && hour < 16) return 'London'
  if (hour >= 13 && hour < 22) return 'New York'
  if (hour >= 0 && hour < 8) return 'Asian'
  return 'Other'
}

function calcPips(
  symbol: string,
  entry: number,
  exit: number,
  direction: string
): number {
  const diff = direction === 'BUY' ? exit - entry : entry - exit
  if (symbol.includes('JPY')) return diff * 100
  return diff * 10000
}

export function parseFTMO(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(Boolean)

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/"/g, ''))

    const openTime = new Date(cols[7])
    const closeTime = new Date(cols[9])
    const entryPrice = parseFloat(cols[4]) || 0
    const exitPrice = parseFloat(cols[8]) || 0
    const direction: Trade['direction'] =
      cols[2].toLowerCase() === 'buy' ? 'BUY' : 'SELL'

    return {
      ticket: cols[0],
      symbol: cols[1],
      direction,
      lotSize: parseFloat(cols[3]) || 0,
      entryPrice,
      exitPrice,
      stopLoss: parseFloat(cols[5]) || null,
      takeProfit: parseFloat(cols[6]) || null,
      openTime,
      closeTime,
      durationMinutes: Math.round(
        (closeTime.getTime() - openTime.getTime()) / 60000
      ),
      commission: (parseFloat(cols[10]) || 0) + (parseFloat(cols[11]) || 0),
      swap: parseFloat(cols[12]) || 0,
      profitLoss: parseFloat(cols[13]) || 0,
      profitLossPips: calcPips(cols[1], entryPrice, exitPrice, direction),
      session: getSession(openTime),
    } as Trade
  }).filter(t => t.symbol && t.entryPrice > 0)
}
