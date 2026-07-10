export function cleanSymbol(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9/.]/g, '')
}

export function normalizeCSV(text: string): string {
  // Strip UTF-8 BOM (common in MT4/MT5 exports, causes header mismatch on mobile Safari)
  const stripped = text.codePointAt(0) === 0xFEFF ? text.slice(1) : text
  return stripped
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

// Point d'entrée UNIQUE des dates des 5 parseurs (aucun new Date() direct).
// Deux garanties :
//  1. Le format MT4/MT5 "YYYY.MM.DD HH:MM[:SS]" (Invalid Date sur Safari) est
//     couvert, comme les variantes "-" et "/" (Binance, Bybit, TradingView).
//  2. Les datetimes SANS offset sont construits en UTC (Date.UTC) : "10:30"
//     dans le fichier = 10:30 UTC pour TOUS les membres, quel que soit le
//     fuseau du navigateur qui parse. Déterminisme total des sessions.
// Les chaînes qui ne matchent pas (offset explicite Z/+hh:mm, autres formats)
// passent telles quelles au moteur, qui respecte l'offset porté.
const NO_OFFSET_DATETIME =
  /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/

export function parseTradeDate(raw: string): Date {
  const m = NO_OFFSET_DATETIME.exec(raw.trim())
  if (m) {
    return new Date(Date.UTC(
      +m[1], +m[2] - 1, +m[3],
      m[4] ? +m[4] : 0, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0
    ))
  }
  return new Date(raw)
}

export function detectDelimiter(headerLine: string): ',' | ';' {
  const semicolons = (headerLine.match(/;/g) ?? []).length
  const commas = (headerLine.match(/,/g) ?? []).length
  return semicolons > commas ? ';' : ','
}

export type CSVParser = {
  line(rawLine: string): string[]
  num(value: string): number
}

export function makeCSVParser(delimiter: ',' | ';'): CSVParser {
  return {
    line(rawLine: string): string[] {
      return rawLine.split(delimiter).map(c => c.trim().replace(/"/g, ''))
    },
    num(value: string): number {
      if (!value) return 0
      // When delimiter is ';', commas in column values are decimal separators
      const v = delimiter === ';' ? value.replace(',', '.') : value
      return parseFloat(v) || 0
    },
  }
}
