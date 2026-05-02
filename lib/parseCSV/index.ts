import { Trade, parseMT4 } from './parseMT4'
import { parseBinance } from './parseBinance'
import { parseTradingView } from './parseTradingView'
import { parseFTMO } from './parseFTMO'
import { parseBybit } from './parseBybit'

export type { Trade }
export type { NormalizedTrade } from './types'

export async function detectAndParse(
  file: File
): Promise<Trade[]> {
  const text = await file.text()
  const firstLine = text.split('\n')[0].toLowerCase()

  // FTMO Metrix : comme MT5 ("position") mais avec une colonne "fee" en plus
  if (
    firstLine.includes('position') &&
    firstLine.includes('fee')
  ) {
    return parseFTMO(text)
  }

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

  if (firstLine.includes('realized p&l')) {
    return parseBybit(text)
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
    'Binance, Bybit, TradingView et FTMO. Vérifiez que votre ' +
    'fichier est bien un export CSV de ces plateformes.'
  )
}
