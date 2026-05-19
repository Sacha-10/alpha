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
  console.log('[parseMT4] Contenu brut reçu (200 premiers chars):', csvText.slice(0, 200))
  const lines = csvText.split('\n').filter(Boolean)
  console.log('[parseMT4] Nb lignes (hors vides):', lines.length)
  const headers = lines[0].split(',').map(h =>
    h.trim().replace(/"/g, ''))
  console.log('[parseMT4] Headers détectés:', headers)

  const isMT5 = headers.includes('Position')
  console.log('[parseMT4] Format détecté:', isMT5 ? 'MT5' : 'MT4')
  
  const result = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => 
      c.trim().replace(/"/g, ''))
    
    if (isMT5) {
      const openTime = new Date(cols[7])
      const closeTime = new Date(cols[9])
      const entryPrice = parseFloat(cols[4]) || 0
      const exitPrice = parseFloat(cols[8]) || 0
      const direction: Trade['direction'] = cols[2] === 'buy' ? 'BUY' : 'SELL'
      const durationMinutes = Math.round(
        (closeTime.getTime() - openTime.getTime()) / 60000
      )
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
        durationMinutes,
        commission: parseFloat(cols[10]) || 0,
        swap: parseFloat(cols[11]) || 0,
        profitLoss: parseFloat(cols[12]) || 0,
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
    const entryPrice = parseFloat(cols[5]) || 0
    const exitPrice = parseFloat(cols[9]) || 0
    
    return {
      ticket: cols[0],
      symbol: cols[4],
      direction,
      lotSize: parseFloat(cols[3]) || 0,
      entryPrice,
      exitPrice,
      stopLoss: parseFloat(cols[6]) || null,
      takeProfit: parseFloat(cols[7]) || null,
      openTime,
      closeTime,
      durationMinutes,
      commission: parseFloat(cols[10]) || 0,
      swap: parseFloat(cols[11]) || 0,
      profitLoss: parseFloat(cols[12]) || 0,
      profitLossPips: calcPips(
        cols[4], entryPrice, exitPrice, direction
      ),
      session: getSession(openTime),
    } as Trade
  }).filter(t => {
    const ok = !!(t.symbol && t.entryPrice > 0)
    if (!ok) console.warn('[parseMT4] Trade filtré (symbol ou entryPrice manquant):', t)
    return ok
  })
  console.log('[parseMT4] Trades parsés et valides:', result.length, '| Premier résultat:', result[0] ?? null)
  return result
}

