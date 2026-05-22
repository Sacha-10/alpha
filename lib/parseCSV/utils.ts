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
