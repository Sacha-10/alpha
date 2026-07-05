import { Trade } from './parseMT4'
import { detectDelimiter, makeCSVParser, cleanSymbol } from './utils'

// Format attendu (TradingView Strategy Tester — Liste des trades fermés) :
// Trade #, Type, Signal, Entry Date/Time, Entry Price, Exit Date/Time, Exit Price, Contracts, Profit, ...
export function parseTradingView(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0])
  const { line: parseLine, num: parseNum } = makeCSVParser(delimiter)

  const result: Trade[] = []
  for (const line of lines.slice(1)) {
    const cols = parseLine(line)

    // Ligne tronquée (pied de page, résumé) : skip silencieux,
    // le format lit jusqu'à l'index 8 (Profit).
    if (cols.length < 9) continue

    const openTime = new Date(cols[3])
    const closeTime = new Date(cols[5])
    const direction: Trade['direction'] = cols[1].toUpperCase()
      .includes('LONG') ? 'BUY' : 'SELL'
    const entryPrice = parseNum(cols[4])
    const exitPrice = parseNum(cols[6])
    const lotSize = parseNum(cols[7])
    const pnl = parseNum(cols[8])
    const durationMinutes = Math.round(
      (closeTime.getTime() - openTime.getTime()) / 60000
    )
    const hour = openTime.getUTCHours()

    result.push({
      ticket: cols[0],
      source: 'tradingview',
      symbol: cleanSymbol(cols[2]) || 'UNKNOWN',
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
    } as Trade)
  }
  return result.filter(t => t.entryPrice > 0)
}
