import { Trade, parseMT4 } from './parseMT4'
import { parseBinance } from './parseBinance'
import { parseTradingView } from './parseTradingView'

export type { Trade }
export type { NormalizedTrade } from './types'

export async function detectAndParse(
  file: File
): Promise<Trade[]> {
  const text = await file.text()
  const firstLine = text.split('\n')[0].toLowerCase()
  
  if (
    firstLine.includes('ticket') || 
    firstLine.includes('position')
  ) {
    return parseMT4(text)
  }
  
  if (
    firstLine.includes('pair') || 
    firstLine.includes('realized profit') ||
    firstLine.includes('date(utc)')
  ) {
    return parseBinance(text)
  }
  
  if (
    firstLine.includes('trade #') || 
    firstLine.includes('signal') ||
    firstLine.includes('cum. profit')
  ) {
    return parseTradingView(text)
  }
  
  throw new Error(
    'Format non reconnu. Nous supportons MT4, MT5, ' +
    'Binance et TradingView. Vérifiez que votre ' +
    'fichier est bien un export CSV de ces plateformes.'
  )
}
