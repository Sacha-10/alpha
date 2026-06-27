import { createHash } from 'crypto'
import type { Trade, TradeSource } from './parseMT4'

// Calcul de la clé `source_id` utilisée (avec user_id + source) pour dédupliquer
// les trades à l'import. Deux cas :
//
//  - Formats à identifiant FIABLE (mt4 / mt5 / ftmo, et bybit quand l'Order ID
//    réel est présent) → on prend le `ticket` brut : c'est un id broker stable,
//    qui distingue même deux trades par ailleurs identiques (scalping / bots).
//
//  - Formats à identifiant FAIBLE ou SYNTHÉTIQUE (binance, tradingview, et bybit
//    SANS Order ID → repli `bybit-<time>`) → on calcule un HASH DÉTERMINISTE des
//    champs invariants du trade. Le hash doit être STABLE entre deux imports du
//    même fichier : on normalise donc dates (epoch ms) et nombres (8 décimales)
//    avant de concaténer dans un ordre fixe. Le hash est préfixé par le `source`
//    pour qu'aucune collision inter-formats ne soit possible.

const STRONG_ID_SOURCES: readonly TradeSource[] = ['mt4', 'mt5', 'ftmo']

// Préfixe du ticket synthétique posé par parseBybit quand l'Order ID est absent.
const BYBIT_SYNTHETIC_PREFIX = 'bybit-'

// Date → timestamp epoch (ms) en string. Accepte une Date ou la string ISO
// reçue après sérialisation JSON (client → route). Jamais de toString() localisé.
function epochMs(value: unknown): string {
  const t =
    value instanceof Date ? value.getTime() : new Date(value as string).getTime()
  return Number.isFinite(t) ? String(t) : '0'
}

// Nombre → string à précision fixe (8 décimales), pour neutraliser les
// micro-écarts de représentation flottante d'un import à l'autre.
function fixed8(value: unknown): string {
  const n = typeof value === 'number' ? value : parseFloat(value as string)
  if (!Number.isFinite(n)) return '0.00000000'
  // +0 évite le cas "-0.00000000"
  return (Math.round(n * 1e8) / 1e8 + 0).toFixed(8)
}

function hashTrade(trade: Trade): string {
  const canonical = [
    epochMs(trade.openTime),
    epochMs(trade.closeTime),
    trade.symbol ?? '',
    trade.direction ?? '',
    fixed8(trade.entryPrice),
    fixed8(trade.exitPrice),
    fixed8(trade.lotSize),
    fixed8(trade.profitLoss),
  ].join('|')
  return createHash('sha256').update(canonical).digest('hex')
}

function hasReliableTicket(trade: Trade): boolean {
  if (STRONG_ID_SOURCES.includes(trade.source)) return true
  // Bybit : fiable uniquement si le ticket n'est PAS le repli synthétique.
  if (trade.source === 'bybit') {
    return !!trade.ticket && !trade.ticket.startsWith(BYBIT_SYNTHETIC_PREFIX)
  }
  return false
}

export function computeSourceId(trade: Trade): string {
  if (hasReliableTicket(trade) && trade.ticket) {
    return trade.ticket
  }
  return `${trade.source}:${hashTrade(trade)}`
}
