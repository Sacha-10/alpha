import { detectDelimiter, makeCSVParser } from './utils'

export interface Trade {
  ticket: string
  symbol: string
  direction: 'BUY' | 'SELL'
  lotSize: number
  entryPrice: number
  exitPrice: number
  stopLoss: number | null
  takeProfit: number | null
  openTime: Date
  closeTime: Date
  durationMinutes: number
  commission: number
  swap: number
  profitLoss: number
  profitLossPips: number
  session: 'London' | 'New York' | 'Asian' | 'Other'
}

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
  const diff = direction === 'BUY'
    ? exit - entry
    : entry - exit
  if (symbol.includes('JPY')) return diff * 100
  return diff * 10000
}

export function parseMT4(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0])
  const { line: parseLine, num: parseNum } = makeCSVParser(delimiter)
  const headers = parseLine(lines[0])

  const isMT5 = headers.includes('Position')

  const result = lines.slice(1).map(line => {
    const cols = parseLine(line)

    if (isMT5) {
      const openTime = new Date(cols[7])
      const closeTime = new Date(cols[9])
      const entryPrice = parseNum(cols[4])
      const exitPrice = parseNum(cols[8])
      const direction: Trade['direction'] = cols[2] === 'buy' ? 'BUY' : 'SELL'
      const durationMinutes = Math.round(
        (closeTime.getTime() - openTime.getTime()) / 60000
      )
      return {
        ticket: cols[0],
        symbol: cols[1],
        direction,
        lotSize: parseNum(cols[3]),
        entryPrice,
        exitPrice,
        stopLoss: parseNum(cols[5]) || null,
        takeProfit: parseNum(cols[6]) || null,
        openTime,
        closeTime,
        durationMinutes,
        commission: parseNum(cols[10]),
        swap: parseNum(cols[11]),
        profitLoss: parseNum(cols[12]),
        profitLossPips: calcPips(cols[1], entryPrice, exitPrice, direction),
        session: getSession(openTime),
      } as Trade
    }

    const openTime = new Date(cols[1])
    const closeTime = new Date(cols[8])
    const durationMinutes = Math.round(
      (closeTime.getTime() - openTime.getTime()) / 60000
    )
    const direction = cols[2].toUpperCase()
      .includes('BUY') ? 'BUY' : 'SELL'
    const entryPrice = parseNum(cols[5])
    const exitPrice = parseNum(cols[9])

    return {
      ticket: cols[0],
      symbol: cols[4],
      direction,
      lotSize: parseNum(cols[3]),
      entryPrice,
      exitPrice,
      stopLoss: parseNum(cols[6]) || null,
      takeProfit: parseNum(cols[7]) || null,
      openTime,
      closeTime,
      durationMinutes,
      commission: parseNum(cols[10]),
      swap: parseNum(cols[11]),
      profitLoss: parseNum(cols[12]),
      profitLossPips: calcPips(cols[4], entryPrice, exitPrice, direction),
      session: getSession(openTime),
    } as Trade
  }).filter(t => !!(t.symbol && t.entryPrice > 0))
  return result
}
