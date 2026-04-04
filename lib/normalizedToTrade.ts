import type { NormalizedTrade, Trade } from '@/lib/parseCSV'

function sessionFromUtc(date: Date): Trade['session'] {
  const hour = date.getUTCHours()
  if (hour >= 7 && hour < 16) return 'London'
  if (hour >= 13 && hour < 22) return 'New York'
  if (hour >= 0 && hour < 8) return 'Asian'
  return 'Other'
}

export function normalizedToTrade(n: NormalizedTrade): Trade {
  const openTime = new Date(n.openedAt)
  const closeTime = n.closedAt ? new Date(n.closedAt) : openTime
  const durationMinutes = Math.round(
    (closeTime.getTime() - openTime.getTime()) / 60000
  )
  return {
    ticket: n.id,
    symbol: n.symbol,
    direction: n.side === 'Long' ? 'BUY' : 'SELL',
    lotSize: n.volume,
    entryPrice: n.entry,
    exitPrice: n.exit ?? n.entry,
    stopLoss: n.stopLoss ?? null,
    takeProfit: n.takeProfit ?? null,
    openTime,
    closeTime,
    durationMinutes,
    commission: 0,
    swap: 0,
    profitLoss: n.profit ?? 0,
    profitLossPips: n.pips ?? 0,
    session: sessionFromUtc(openTime),
  }
}
