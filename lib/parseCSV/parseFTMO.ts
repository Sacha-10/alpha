import { Trade } from './parseMT4'
import { detectDelimiter, makeCSVParser, cleanSymbol } from './utils'
import { getSession } from './session'

// Format FTMO Metrix (Trading Journal > Export CSV) :
// Position, Symbol, Type, Volume, Price(open), S/L, T/P, Time(open),
// Price(close), Time(close), Commission, Fee, Swap, Profit
//
// Diffère du MT5 standard par la colonne "Fee" à l'index 11,
// qui décale Swap → [12] et Profit → [13].

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
  const lines = csvText.split('\n').filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0])
  const { line: parseLine, num: parseNum } = makeCSVParser(delimiter)

  const result: Trade[] = []
  for (const line of lines.slice(1)) {
    const cols = parseLine(line)

    // Ligne tronquée (pied de page, solde) : skip silencieux,
    // le format lit jusqu'à l'index 13 (Profit).
    if (cols.length < 14) continue

    const openTime = new Date(cols[7])
    const closeTime = new Date(cols[9])
    const entryPrice = parseNum(cols[4])
    const exitPrice = parseNum(cols[8])
    const direction: Trade['direction'] =
      cols[2].toLowerCase() === 'buy' ? 'BUY' : 'SELL'
    const sym = cleanSymbol(cols[1])

    result.push({
      ticket: cols[0],
      source: 'ftmo',
      symbol: sym,
      direction,
      lotSize: parseNum(cols[3]),
      entryPrice,
      exitPrice,
      stopLoss: parseNum(cols[5]) || null,
      takeProfit: parseNum(cols[6]) || null,
      openTime,
      closeTime,
      durationMinutes: Math.round(
        (closeTime.getTime() - openTime.getTime()) / 60000
      ),
      commission: parseNum(cols[10]) + parseNum(cols[11]),
      swap: parseNum(cols[12]),
      profitLoss: parseNum(cols[13]),
      profitLossPips: calcPips(sym, entryPrice, exitPrice, direction),
      session: getSession(openTime),
    } as Trade)
  }
  return result.filter(t => t.symbol && t.entryPrice > 0)
}
