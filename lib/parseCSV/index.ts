import { Trade, parseMT4 } from './parseMT4'
import { parseBinance } from './parseBinance'
import { parseTradingView } from './parseTradingView'
import { parseFTMO } from './parseFTMO'
import { parseBybit } from './parseBybit'
import { normalizeCSV } from './utils'

export type { Trade }

export async function detectAndParse(
  file: File
): Promise<Trade[]> {
  const text = normalizeCSV(await file.text())
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

  // Message affiché TEL QUEL sur les deux surfaces membres (dropzone « Analyser
  // vos trades » et import du « Journal de trades ») : une cause = un message.
  // La liste des plateformes vit sur la dropzone et /help, pas ici.
  throw new Error(
    "Votre fichier n'a pas été reconnu. Vérifiez qu'il provient " +
    "d'une plateforme compatible."
  )
}
