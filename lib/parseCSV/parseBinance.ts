import { Trade } from './parseMT4'
import { detectDelimiter, makeCSVParser, cleanSymbol, parseTradeDate } from './utils'
import { getSession } from './session'

// Format Binance Futures : Date, Symbol, Side, Price, Qty, Realized Profit, Fee
// Format Binance Spot    : Date, Pair,   Type, Price, Amount, Total, Fee, Fee Coin
// Détecté via la présence de "Realized Profit" dans les headers
//
// Appariement par POSITION NETTE (option A) : position signée suivie par
// symbole. Les fills qui AUGMENTENT |position| nourrissent le prix d'entrée
// moyen pondéré ; ceux qui la RÉDUISENT nourrissent le prix de sortie moyen
// pondéré et cumulent le PnL réalisé. Position revenue à 0 → UN trade émis.
// Un fill qui traverse 0 (renversement) clôt le trade et ouvre une position
// inverse avec le reliquat. Position encore ouverte en fin de fichier →
// écartée avec compteur logué (jamais en silence).

type OpenPosition = {
  side: Trade['direction']
  qty: number       // quantité encore ouverte
  maxQty: number    // taille max atteinte → lotSize du trade émis
  entryCost: number // Σ prix × qty des fills d'entrée
  entryQty: number
  exitCost: number  // Σ prix × qty des fills de sortie
  exitQty: number
  pnl: number       // Σ Realized Profit de tous les fills du trade
  fee: number       // Σ frais de tous les fills du trade
  openTime: Date
}

// Tolérance flottante : 0.10 − 0.05 − 0.05 ne retombe pas exactement à 0.
const QTY_EPSILON = 1e-9

export function parseBinance(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  const delimiter = detectDelimiter(lines[0])
  const { line: parseLine, num: parseNum } = makeCSVParser(delimiter)
  const headers = parseLine(lines[0])

  const isFutures = headers.includes('Realized Profit')
  const trades: Trade[] = []
  const positions: Record<string, OpenPosition> = {}

  const emit = (symbol: string, pos: OpenPosition, closeTime: Date) => {
    const entryPrice = pos.entryQty > 0 ? pos.entryCost / pos.entryQty : 0
    const exitPrice = pos.exitQty > 0 ? pos.exitCost / pos.exitQty : entryPrice
    trades.push({
      ticket: `${symbol}-${closeTime.getTime()}`,
      source: 'binance',
      symbol,
      direction: pos.side,
      lotSize: pos.maxQty,
      entryPrice,
      exitPrice,
      stopLoss: null,
      takeProfit: null,
      openTime: pos.openTime,
      closeTime,
      durationMinutes: Math.round(
        (closeTime.getTime() - pos.openTime.getTime()) / 60000
      ),
      commission: pos.fee,
      swap: 0,
      // Spot (aucun Realized Profit exporté) : PnL reconstruit depuis les
      // moyennes pondérées d'entrée/sortie.
      profitLoss: pos.pnl ||
        (pos.side === 'BUY'
          ? (exitPrice - entryPrice) * pos.maxQty
          : (entryPrice - exitPrice) * pos.maxQty),
      profitLossPips: 0,
      session: getSession(pos.openTime),
    })
  }

  for (const line of lines.slice(1)) {
    const cols = parseLine(line)

    // Ligne tronquée (pied de page, total) : skip silencieux,
    // les deux formats lisent jusqu'à l'index 6 (Fee).
    if (cols.length < 7) continue

    const time = parseTradeDate(cols[0])
    // Date invalide : skip silencieux — même politique que la garde cols.length.
    if (isNaN(time.getTime())) continue
    const symbol = cleanSymbol(cols[1])
    if (!symbol) continue
    const side = cols[2].toUpperCase() === 'BUY' ? 'BUY' : 'SELL'
    const price = parseNum(cols[3])
    const qty = parseNum(cols[4])
    if (price <= 0 || qty <= 0) continue
    // cols[5] = Realized Profit (futures) ou Total montant (spot, non pertinent)
    let fillPnl = isFutures ? parseNum(cols[5]) : 0
    let fillFee = parseNum(cols[6])

    let remaining = qty
    while (remaining > QTY_EPSILON) {
      const pos = positions[symbol]

      if (!pos) {
        // Ouverture : ce fill démarre une nouvelle position.
        positions[symbol] = {
          side,
          qty: remaining,
          maxQty: remaining,
          entryCost: price * remaining,
          entryQty: remaining,
          exitCost: 0,
          exitQty: 0,
          pnl: fillPnl,
          fee: fillFee,
          openTime: time,
        }
        remaining = 0
      } else if (pos.side === side) {
        // Même sens : augmente |position| → nourrit l'entrée moyenne pondérée.
        pos.qty += remaining
        pos.maxQty = Math.max(pos.maxQty, pos.qty)
        pos.entryCost += price * remaining
        pos.entryQty += remaining
        pos.pnl += fillPnl
        pos.fee += fillFee
        remaining = 0
      } else {
        // Sens opposé : réduit |position| → nourrit la sortie moyenne pondérée.
        const closeQty = Math.min(remaining, pos.qty)
        pos.exitCost += price * closeQty
        pos.exitQty += closeQty
        pos.qty -= closeQty
        pos.pnl += fillPnl
        pos.fee += fillFee
        // PnL/frais du fill consommés une seule fois (cas du renversement).
        fillPnl = 0
        fillFee = 0
        remaining -= closeQty

        if (pos.qty <= QTY_EPSILON) {
          emit(symbol, pos, time)
          delete positions[symbol]
        }
        // Reliquat éventuel (renversement) : la boucle repart et ouvre une
        // position inverse au prix de ce fill.
      }
    }
  }

  // Reliquat de fin de fichier : positions jamais revenues à 0 (fills
  // d'entrée sans clôture correspondante) — écartées, JAMAIS en silence.
  const leftovers = Object.keys(positions)
  if (leftovers.length > 0) {
    console.warn(
      `[parseBinance] ${leftovers.length} position(s) non clôturée(s) écartée(s) en fin de fichier :`,
      leftovers.join(', ')
    )
  }

  return trades.filter(t => t.symbol && t.entryPrice > 0)
}
