import OpenAI from 'openai'
import { Trade } from './parseCSV'

type AnalysisTargets = {
  winRate: number
  pnl: number
  drawdown: number
  profitFactor: number
  sharpe: number
  riskReward: number
  londonWinRate: number
  newYorkWinRate: number
  tokyoWinRate: number
  psychoScore: number
  propFirmScore: number
  riskScore: number
  targetBestSymbolWinRate: number
  targetWorstSymbolWinRate: number
  targetBestSymbol: string
  targetWorstSymbol: string
  targetBestDay: string
  targetWorstDay: string
  targetBestHour: string
  targetWorstHour: string
}

// ─── DÉMO ────────────────────────────────────────────────

const DEMO_SYSTEM_PROMPT = `Tu es un analyste de performance
trading d'élite avec une expertise en finance
comportementale, gestion du risque et psychologie
du trading professionnel. Tu as analysé des milliers
de comptes pour des prop firms comme FTMO
et FundedNext.

Tu réponds UNIQUEMENT en français.
Exception — ces termes restent en anglais :
Win Rate, Profit Factor, Drawdown, Stop Loss,
Take Profit, Long, Short, Pip, Leverage, Risk/Reward,
Sharpe Ratio, Revenge Trading, FOMO, Overtrading,
Breakout, Support, Resistance.

RÈGLE POURCENTAGES :
winRate, londonWinRate, newYorkWinRate, tokyoWinRate
toujours entre 0 et 100. Jamais format 0.xx.

RÈGLE SCORES PERFORMANCE GLOBALE :
overallScore, risk score, prop firm score
Toujours de 25 à 75. Jamais identiques.
Trader PnL négatif → scores 25-50/100
Trader breakeven → scores 40-55/100
Trader profitable → scores 55-75/100

RÈGLE SESSIONS :
London de 55% à 70%
New York de 40% à 55%
Tokyo de 25% à 40%
Jamais 0% pour aucune session.
Utilise tokyoWinRate pas asianWinRate.

RÈGLE POURCENTAGE ET SÉVÉRITÉ BIAIS :
- 20% à 30% → severity: FAIBLE
- 35% à 45% → severity: MOYEN
- 50% à 60% → severity: ÉLEVÉ
- 65% à 75% → severity: CRITIQUE
Seuil minimum : 20% — un biais en dessous de 20%
n'apparaît pas dans la liste.
frequency est un entier entre 20 et 75 représentant
le pourcentage de trades affectés.
frequency ne sort jamais des plages définies
pour chaque sévérité — FAIBLE toujours de 20 à 30,
MOYEN toujours de 35 à 45, ÉLEVÉ toujours de
50 à 60, CRITIQUE toujours de 65 à 75.

RÈGLE SYMBOLES :
bestSymbol = symbole avec le Win Rate le plus élevé.
worstSymbol = symbole avec le Win Rate le plus bas.
Respecte exactement le meilleur et pire symbole
indiqués dans les cibles avec leurs Win Rate exacts.
EURUSD ne peut jamais être meilleur ET pire
symbole en même temps.

RÈGLE JOURS ET HEURES :
Respecte exactement bestDayOfWeek, worstDayOfWeek,
bestTimeOfDay et worstTimeOfDay indiqués dans les cibles.
Les heures sont toujours sur des tranches de 2h
entre 07:00 et 22:00 maximum.

RÈGLE PNL :
PnL total toujours négatif compris entre -1000€ et -250€.
Prop firm score de 25 à 45/100 si PnL négatif.
Un trader PnL négatif ne passe jamais FTMO.

RÈGLE WIN RATE :
Win Rate global de 47% à 57%.

RÈGLE TOTAL TRADES :
totalTrades doit être exactement 120.

RÈGLE VARIATIONS :
Chaque analyse doit être unique et différente.
Varie le biais dominant à chaque analyse.
Varie l'ordre des biais détectés.
Varie les recommandations du plan d'action.
Varie le ton du coach IA — parfois plus direct,
parfois plus encourageant.
Les scores peuvent varier de ±10 points
entre deux analyses des mêmes trades.

Ton rôle est d'identifier exactement pourquoi ce trader
perd de l'argent ou laisse de la performance sur la table.
Sois brutalement honnête mais constructif.
Utilise des exemples concrets tirés des données fournies.

Retourne UNIQUEMENT un objet JSON valide.
Aucun texte avant ou après. Pas de markdown.
Pas de backticks. Juste le JSON brut.

Structure JSON exacte :
{
  "globalStats": {
    "totalTrades": number,
    "winRate": number,
    "avgWin": number,
    "avgLoss": number,
    "profitFactor": number,
    "sharpeRatio": number,
    "maxDrawdown": number,
    "maxDrawdownPercent": number,
    "avgRiskReward": number,
    "totalPnL": number,
    "bestTrade": {
      "symbol": string,
      "pnl": number,
      "date": string
    },
    "worstTrade": {
      "symbol": string,
      "pnl": number,
      "date": string
    },
    "avgTradeDuration": string,
    "totalCommissions": number
  },
  "sessionAnalysis": {
    "bestSession": string,
    "worstSession": string,
    "londonWinRate": number,
    "newYorkWinRate": number,
    "tokyoWinRate": number,
    "insight": string
  },
  "psychologicalProfile": {
    "overallScore": number,
    "dominantBias": string,
    "biases": [
      {
        "name": string,
        "severity": "FAIBLE"|"MOYEN"|"ÉLEVÉ"|"CRITIQUE",
        "frequency": number,
        "description": string,
        "evidence": string
      }
    ]
  },
  "performancePatterns": {
    "bestSymbol": {
      "symbol": string,
      "winRate": number,
      "pnl": number
    },
    "worstSymbol": {
      "symbol": string,
      "winRate": number,
      "pnl": number
    },
    "bestDayOfWeek": string,
    "worstDayOfWeek": string,
    "bestTimeOfDay": string,
    "worstTimeOfDay": string,
    "consecutiveLossesPattern": string,
    "holdingTimeAnalysis": string
  },
  "riskManagement": {
    "score": number,
    "avgRiskPerTrade": number,
    "riskConsistency":
      "INSUFFISANT"|"MOYEN"|"BON"|"EXCELLENT",
    "stopLossUsage": number,
    "takeProfitUsage": number,
    "issues": [
      { "issue": string, "impact": string }
    ]
  },
  "propFirmReadiness": {
    "score": number,
    "wouldPassFTMO": boolean,
    "mainObstacles": [string],
    "estimatedTimeToReady": string
  },
  "actionPlan": [
    {
      "priority": 1|2|3,
      "category":
        "Psychologie"|"Risque"|"Stratégie"|"Timing",
      "action": string,
      "expectedImpact": string,
      "timeframe": string
    }
  ],
  "personalizedInsight": string
}`

export async function analyzeTradesDemo(
  trades: Trade[],
  targets?: AnalysisTargets
): Promise<any> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const tradesData = trades.map(t => ({
    symbol: t.symbol,
    direction: t.direction,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    lotSize: t.lotSize,
    profitLoss: t.profitLoss,
    openTime: t.openTime,
    closeTime: t.closeTime,
    durationMinutes: t.durationMinutes,
    session: t.session,
    stopLoss: t.stopLoss,
    takeProfit: t.takeProfit,
  }))

  const targetsPrompt = targets
    ? `

Cible exacte pour cette analyse :
- Win Rate : ${targets.winRate}%
- PnL Total : ${targets.pnl}€
- Max Drawdown : ${targets.drawdown}%
- Profit Factor : ${targets.profitFactor}
- Sharpe Ratio : ${targets.sharpe}
- Risk/Reward moyen : ${targets.riskReward}
- London Win Rate : ${targets.londonWinRate}%
- New York Win Rate : ${targets.newYorkWinRate}%
- Tokyo Win Rate : ${targets.tokyoWinRate}%
- Score psychologique : ${targets.psychoScore}/100
- Score Prop Firm : ${targets.propFirmScore}/100
- Score Gestion du risque : ${targets.riskScore}/100
- Meilleur symbole : ${targets.targetBestSymbol}
  Win Rate ${targets.targetBestSymbolWinRate}%
- Pire symbole : ${targets.targetWorstSymbol}
  Win Rate ${targets.targetWorstSymbolWinRate}%
- Meilleur jour : ${targets.targetBestDay}
- Pire jour : ${targets.targetWorstDay}
- Meilleure heure : ${targets.targetBestHour}
- Pire heure : ${targets.targetWorstHour}
Ces valeurs doivent être respectées exactement
dans le JSON retourné.`
    : ''

  async function callAPI(attempt: number): Promise<any> {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-5.4',
        max_completion_tokens: 4000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: DEMO_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyse ces ${trades.length} trades
            et génère le rapport JSON complet :
            ${JSON.stringify(tradesData)}${targetsPrompt}`,
          },
        ],
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Réponse vide')

      const clean = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      return JSON.parse(clean)
    } catch (error: any) {
      let errorJson = ''
      try {
        errorJson = JSON.stringify(error)
      } catch (jsonErr: any) {
        errorJson = `JSON.stringify failed: ${jsonErr?.message || String(jsonErr)}`
      }

      console.error('[OpenAI Error - Detailed]', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        type: error?.type,
        json: errorJson,
      })
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000))
        return callAPI(attempt + 1)
      }
      throw new Error(
        "Erreur lors de l'analyse. " +
          'Veuillez réessayer dans quelques instants.'
      )
    }
  }

  return callAPI(1)
}

// ─── MEMBRE — PRÉCALCUL ───────────────────────────────────

type BiasSeverity = 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ' | 'CRITIQUE'

interface BiasPattern {
  patternKey: string
  frequency: number
  severity: BiasSeverity
  relatedData: Record<string, unknown>
}

interface ComputedStats {
  totalTrades: number
  winRate: number
  totalPnL: number
  profitFactor: number
  maxDrawdownAbs: number
  maxDrawdownPct: number
  sharpeRatio: number
  riskReward: number
  avgTradeDuration: string
  avgWin: number
  avgLoss: number
  totalCommissions: number
  bestTrade: { symbol: string; pnl: number; date: string }
  worstTrade: { symbol: string; pnl: number; date: string }
  londonWinRate: number
  londonWins: number
  londonLosses: number
  londonTotal: number
  newYorkWinRate: number
  newYorkWins: number
  newYorkLosses: number
  newYorkTotal: number
  tokyoWinRate: number
  tokyoWins: number
  tokyoLosses: number
  tokyoTotal: number
  bestSession: string
  worstSession: string
  bestDay: string
  worstDay: string
  bestHour: string
  worstHour: string
  bestSymbol: string
  bestSymbolWinRate: number
  bestSymbolPnL: number
  worstSymbol: string
  worstSymbolWinRate: number
  worstSymbolPnL: number
  symbolStats: Array<{
    symbol: string
    winRate: number
    pnl: number
    total: number
    avgEntry: number
    avgExit: number
  }>
  minLot: number
  maxLot: number
  stopLossUsage: number
  takeProfitUsage: number
  avgRiskPerTrade: number
  riskConsistency: 'INSUFFISANT' | 'MOYEN' | 'BON' | 'EXCELLENT'
  psychoScore: number
  riskScore: number
  propFirmScore: number
  worstDayLossPct: number
  wouldPassFTMO: boolean
  biasPatterns: BiasPattern[]
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

function toDate(v: unknown): Date {
  return v instanceof Date ? v : new Date(v as string)
}

function sessionOf(d: Date): 'London' | 'New York' | 'Tokyo' {
  const h = d.getUTCHours()
  if (h >= 7 && h < 13) return 'London'
  if (h >= 13 && h < 20) return 'New York'
  return 'Tokyo'
}

function severityOf(freq: number): BiasSeverity {
  if (freq >= 75) return 'CRITIQUE'
  if (freq >= 50) return 'ÉLEVÉ'
  if (freq >= 25) return 'MOYEN'
  return 'FAIBLE'
}

function computeStats(rawTrades: Trade[]): ComputedStats {
  const trades = rawTrades.map(t => ({
    ...t,
    openTime: toDate(t.openTime),
    closeTime: toDate(t.closeTime),
  }))

  const n = trades.length
  const pnls = trades.map(t => t.profitLoss)
  const totalPnL = r2(pnls.reduce((s, p) => s + p, 0))
  const winners = trades.filter(t => t.profitLoss > 0)
  const losers = trades.filter(t => t.profitLoss <= 0)
  const winRate = r2((winners.length / n) * 100)

  const grossWin = winners.reduce((s, t) => s + t.profitLoss, 0)
  const grossLoss = Math.abs(losers.reduce((s, t) => s + t.profitLoss, 0))
  const profitFactor = grossLoss === 0 ? 99 : r2(grossWin / grossLoss)
  const avgWin = winners.length > 0 ? r2(grossWin / winners.length) : 0
  const avgLoss = losers.length > 0 ? r2(grossLoss / losers.length) : 0
  const riskReward = avgLoss === 0 ? 0 : r2(avgWin / avgLoss)

  const avgPnl = totalPnL / n
  const variance = pnls.reduce((s, p) => s + (p - avgPnl) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)
  const sharpeRatio = stdDev === 0 ? 0 : r2((avgPnl / stdDev) * Math.sqrt(n))

  const chronoPnls = [...trades]
    .sort((a, b) => a.openTime.getTime() - b.openTime.getTime())
    .map(t => t.profitLoss)
  let peak = 0, equity = 0, maxDDAbs = 0, maxDDRatio = 0
  for (const pnl of chronoPnls) {
    equity += pnl
    if (equity > peak) peak = equity
    const ddAbs = peak - equity
    if (ddAbs > maxDDAbs) maxDDAbs = ddAbs
    const ratio = peak > 0 ? ddAbs / peak : 0
    if (ratio > maxDDRatio) maxDDRatio = ratio
  }
  const maxDrawdownAbs = r2(maxDDAbs)
  const maxDrawdownPct = r2(maxDDRatio * 100)

  const avgDurMin = Math.round(
    trades.reduce((s, t) => s + t.durationMinutes, 0) / n
  )
  const durH = Math.floor(avgDurMin / 60)
  const durM = avgDurMin % 60
  const avgTradeDuration = durH > 0
    ? `${durH}h ${String(durM).padStart(2, '0')}min`
    : `${durM}min`

  const totalCommissions = r2(
    trades.reduce((s, t) => s + (t.commission ?? 0) + (t.swap ?? 0), 0)
  )

  const bestTrade = trades.reduce((b, t) => t.profitLoss > b.profitLoss ? t : b)
  const worstTrade = trades.reduce((b, t) => t.profitLoss < b.profitLoss ? t : b)

  // Sessions (London 07-13 UTC / New York 13-20 UTC / Tokyo 20-07 UTC)
  const sessMap: Record<string, { wins: number; total: number }> = {
    'London': { wins: 0, total: 0 },
    'New York': { wins: 0, total: 0 },
    'Tokyo': { wins: 0, total: 0 },
  }
  for (const t of trades) {
    const s = sessionOf(t.openTime)
    sessMap[s].total++
    if (t.profitLoss > 0) sessMap[s].wins++
  }
  const sessWR: Record<string, number> = {}
  for (const [k, v] of Object.entries(sessMap)) {
    sessWR[k] = v.total === 0 ? 0 : r2((v.wins / v.total) * 100)
  }
  const sessSorted = Object.entries(sessWR).sort((a, b) => b[1] - a[1])
  const bestSession = sessSorted[0][0]
  const worstSession = sessSorted[sessSorted.length - 1][0]

  // Jours (seuil minimal 3 trades ; fallback = jour avec le plus de trades)
  const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const dayMap: Record<number, { wins: number; total: number }> = {}
  for (const t of trades) {
    const d = t.openTime.getDay()
    if (!dayMap[d]) dayMap[d] = { wins: 0, total: 0 }
    dayMap[d].total++
    if (t.profitLoss > 0) dayMap[d].wins++
  }
  const dayWRs = Object.entries(dayMap)
    .map(([d, v]) => ({ day: DAY_NAMES[+d], wr: v.wins / v.total, total: v.total }))
    .filter(d => d.total >= 3)
    .sort((a, b) => b.wr - a.wr)
  const dayByCount = Object.entries(dayMap)
    .map(([d, v]) => ({ day: DAY_NAMES[+d], total: v.total }))
    .sort((a, b) => b.total - a.total)
  const bestDay = dayWRs[0]?.day ?? dayByCount[0]?.day ?? 'N/A'
  const worstDay = dayWRs[dayWRs.length - 1]?.day ?? dayByCount[0]?.day ?? bestDay

  // Heures (tranches de 2h, seuil minimal 2 trades ; fallback = slot avec le plus de trades)
  const hourMap: Record<number, { wins: number; total: number }> = {}
  for (const t of trades) {
    const slot = Math.floor(t.openTime.getUTCHours() / 2) * 2
    if (!hourMap[slot]) hourMap[slot] = { wins: 0, total: 0 }
    hourMap[slot].total++
    if (t.profitLoss > 0) hourMap[slot].wins++
  }
  const fmtSlot = (h: number) =>
    `${String(h).padStart(2, '0')}:00-${String(h + 2).padStart(2, '0')}:00 UTC`
  const hourWRs = Object.entries(hourMap)
    .map(([h, v]) => ({ h: +h, wr: v.wins / v.total, total: v.total }))
    .filter(h => h.total >= 2)
    .sort((a, b) => b.wr - a.wr)
  const hourByCount = Object.entries(hourMap)
    .map(([h, v]) => ({ h: +h, total: v.total }))
    .sort((a, b) => b.total - a.total)
  const bestHour = hourWRs[0]
    ? fmtSlot(hourWRs[0].h)
    : (hourByCount[0] ? fmtSlot(hourByCount[0].h) : 'N/A')
  const worstHour = hourWRs[hourWRs.length - 1]
    ? fmtSlot(hourWRs[hourWRs.length - 1].h)
    : (hourByCount[0] ? fmtSlot(hourByCount[0].h) : 'N/A')

  // Symboles
  const symMap: Record<string, { wins: number; total: number; pnl: number; entries: number[]; exits: number[] }> = {}
  for (const t of trades) {
    if (!symMap[t.symbol]) symMap[t.symbol] = { wins: 0, total: 0, pnl: 0, entries: [], exits: [] }
    symMap[t.symbol].total++
    symMap[t.symbol].pnl += t.profitLoss
    symMap[t.symbol].entries.push(t.entryPrice)
    symMap[t.symbol].exits.push(t.exitPrice)
    if (t.profitLoss > 0) symMap[t.symbol].wins++
  }
  const symbolStats = Object.entries(symMap).map(([sym, v]) => ({
    symbol: sym,
    winRate: r2((v.wins / v.total) * 100),
    pnl: r2(v.pnl),
    total: v.total,
    avgEntry: r2(v.entries.reduce((s, e) => s + e, 0) / v.entries.length),
    avgExit: r2(v.exits.reduce((s, e) => s + e, 0) / v.exits.length),
  }))
  const symByWR = [...symbolStats].filter(s => s.total >= 2).sort((a, b) => b.winRate - a.winRate)
  const symByWRFull = [...symbolStats].sort((a, b) => b.winRate - a.winRate)
  const bestSymData = symByWR[0] ?? symByWRFull[0]
  const worstSymData = symByWR.length > 1
    ? symByWR[symByWR.length - 1]
    : (symByWRFull.length > 1 ? symByWRFull[symByWRFull.length - 1] : symByWRFull[0])

  // Sizing
  const lots = trades.map(t => t.lotSize)
  const minLot = Math.min(...lots)
  const maxLot = Math.max(...lots)
  const avgLot = r2(lots.reduce((s, l) => s + l, 0) / n)

  // Gestion du risque
  const withSL = trades.filter(t => t.stopLoss != null && t.stopLoss !== 0)
  const withTP = trades.filter(t => t.takeProfit != null && t.takeProfit !== 0)
  const stopLossUsage = r2((withSL.length / n) * 100)
  const takeProfitUsage = r2((withTP.length / n) * 100)
  const lotCV = avgLot === 0 ? 1
    : Math.sqrt(lots.reduce((s, l) => s + (l - avgLot) ** 2, 0) / n) / avgLot
  const riskConsistency: ComputedStats['riskConsistency'] =
    lotCV < 0.1 ? 'EXCELLENT' : lotCV < 0.2 ? 'BON' : lotCV < 0.35 ? 'MOYEN' : 'INSUFFISANT'

  // PnL par jour (partagé : FTMO consistency + overtrading)
  const byDay: Record<string, { count: number; pnl: number }> = {}
  for (const t of trades) {
    const k = t.openTime.toISOString().slice(0, 10)
    if (!byDay[k]) byDay[k] = { count: 0, pnl: 0 }
    byDay[k].count++
    byDay[k].pnl += t.profitLoss
  }

  // Régularité journalière (composante du score psychologique)
  const dailyPnLValues = Object.values(byDay).map(d => d.pnl)
  const avgDailyPnL = dailyPnLValues.reduce((s, p) => s + p, 0) / Math.max(dailyPnLValues.length, 1)
  const dailyStdDev = Math.sqrt(
    dailyPnLValues.reduce((s, p) => s + (p - avgDailyPnL) ** 2, 0) / Math.max(dailyPnLValues.length, 1)
  )
  const regularityScore = dailyStdDev === 0 ? 100
    : Math.max(0, 100 - (dailyStdDev / Math.max(Math.abs(avgDailyPnL), 0.01)) * 50)

  // Scores (formules déterministes)
  const psychoScore = Math.round(Math.min(100, Math.max(0,
    (winRate / 100) * 40 +
    Math.min(profitFactor / 3, 1) * 20 +
    Math.max(0, 1 - maxDrawdownPct / 25) * 20 +
    (regularityScore / 100) * 20
  )))
  const riskScore = Math.round(Math.min(100, Math.max(0,
    Math.max(0, 1 - maxDrawdownPct / 15) * 40 +
    Math.min(Math.max(sharpeRatio, 0) / 2.5, 1) * 30 +
    Math.min(riskReward / 3, 1) * 30
  )))
  const propFirmScore = Math.round(Math.min(100, Math.max(0,
    Math.max(0, 1 - maxDrawdownPct / 10) * 40 +
    Math.min(winRate / 70, 1) * 30 +
    Math.min(profitFactor / 2, 1) * 30
  )))

  // FTMO consistency rule : pire jour en % du gross PnL total (proxy du capital engagé)
  const totalGross = grossWin + grossLoss
  const dailyPnLs = Object.values(byDay).map(d => d.pnl)
  const worstDayPnL = dailyPnLs.length > 0 ? Math.min(...dailyPnLs) : 0
  const worstDayLossPct = totalGross === 0 ? 0
    : r2(Math.abs(Math.min(worstDayPnL, 0)) / totalGross * 100)

  const wouldPassFTMO =
    maxDrawdownPct < 10 &&
    winRate > 50 &&
    profitFactor > 1 &&
    worstDayLossPct < 5 &&
    n >= 10

  // Patterns de biais (fréquences calculées depuis les trades)
  const sorted = [...trades].sort((a, b) => a.openTime.getTime() - b.openTime.getTime())
  const clampFreq = (v: number) => Math.max(1, Math.min(100, Math.round(v)))
  const biasPatterns: BiasPattern[] = []

  // 1. Revenge trading : trade ouvert dans les 60 min après une perte
  let revengeCount = 0
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (prev.profitLoss <= 0) {
      const gapMin = (curr.openTime.getTime() - prev.closeTime.getTime()) / 60000
      if (gapMin >= 0 && gapMin <= 60) revengeCount++
    }
  }
  if (revengeCount > 0) {
    const freq = clampFreq((revengeCount / n) * 100)
    biasPatterns.push({
      patternKey: 'revenge_trading',
      frequency: freq,
      severity: severityOf(freq),
      relatedData: {
        tradesAfterLoss: revengeCount,
        exampleLosses: losers.slice(0, 3).map(t => ({
          date: t.openTime.toISOString().slice(0, 10),
          pnl: r2(t.profitLoss),
          symbol: t.symbol,
        })),
      },
    })
  }

  // 2. Biais directionnel : écart Win Rate > 15% entre BUY et SELL
  const buyTs = trades.filter(t => t.direction === 'BUY')
  const sellTs = trades.filter(t => t.direction === 'SELL')
  const buyWR = buyTs.length > 0
    ? buyTs.filter(t => t.profitLoss > 0).length / buyTs.length * 100 : 50
  const sellWR = sellTs.length > 0
    ? sellTs.filter(t => t.profitLoss > 0).length / sellTs.length * 100 : 50
  if (Math.abs(buyWR - sellWR) > 15) {
    const worseDir = buyWR < sellWR ? 'BUY' : 'SELL'
    const worseDirTs = worseDir === 'BUY' ? buyTs : sellTs
    const freq = clampFreq((worseDirTs.length / n) * 100)
    biasPatterns.push({
      patternKey: 'direction_bias',
      frequency: freq,
      severity: severityOf(freq),
      relatedData: {
        worseDirection: worseDir,
        worseWinRate: r2(worseDir === 'BUY' ? buyWR : sellWR),
        betterWinRate: r2(worseDir === 'BUY' ? sellWR : buyWR),
        tradeCount: worseDirTs.length,
      },
    })
  }

  // 3. Surexposition session : perte > 55% dans la pire session et > 1% des trades
  const worstSessD = sessMap[worstSession]
  if (worstSessD.total > 0) {
    const sessLossRate = ((worstSessD.total - worstSessD.wins) / worstSessD.total) * 100
    const exposure = (worstSessD.total / n) * 100
    if (sessLossRate > 55 && exposure >= 1) {
      const freq = clampFreq(exposure)
      biasPatterns.push({
        patternKey: 'session_bias',
        frequency: freq,
        severity: severityOf(freq),
        relatedData: {
          worstSession,
          lossRate: r2(sessLossRate),
          winRate: r2(sessWR[worstSession]),
          tradeCount: worstSessD.total,
        },
      })
    }
  }

  // 4. Overtrading : jours avec nb trades >= 2× médiane ET >= 5 trades minimum
  const dayCounts = Object.values(byDay).map(d => d.count).sort((a, b) => a - b)
  const medianDay = dayCounts[Math.floor(dayCounts.length / 2)]
  const overtradedDays = Object.entries(byDay).filter(([, d]) => d.count >= medianDay * 2 && d.count >= 5)
  const overtradedTradeCount = overtradedDays.reduce((s, [, d]) => s + d.count, 0)
  if (overtradedTradeCount > 0) {
    const freq = clampFreq((overtradedTradeCount / n) * 100)
    biasPatterns.push({
      patternKey: 'overtrading',
      frequency: freq,
      severity: severityOf(freq),
      relatedData: {
        overtradedDaysCount: overtradedDays.length,
        maxTradesInDay: Math.max(...dayCounts),
        threshold: Math.max(medianDay * 2, 5),
        exampleDays: overtradedDays.slice(0, 3).map(([d]) => d),
      },
    })
  }

  // 5. Extension des pertes : durée moyenne pertes > 1.5× durée moyenne gains
  const avgWinDur = winners.length > 0
    ? winners.reduce((s, t) => s + t.durationMinutes, 0) / winners.length : 0
  const avgLossDur = losers.length > 0
    ? losers.reduce((s, t) => s + t.durationMinutes, 0) / losers.length : 0
  if (winners.length > 0 && losers.length > 0 && avgLossDur > avgWinDur * 1.5) {
    const longHeldLosers = losers.filter(t => t.durationMinutes > avgWinDur)
    if (longHeldLosers.length > 0) {
      const freq = clampFreq((longHeldLosers.length / n) * 100)
      biasPatterns.push({
        patternKey: 'loss_extension',
        frequency: freq,
        severity: severityOf(freq),
        relatedData: {
          avgWinDurationMin: Math.round(avgWinDur),
          avgLossDurationMin: Math.round(avgLossDur),
          ratio: r2(avgLossDur / Math.max(avgWinDur, 1)),
        },
      })
    }
  }

  // 6. Biais de confirmation : trade dans le même sens après 3+ gains consécutifs dans ce sens
  let confirmBiasCount = 0
  let streakLen = 0
  let streakDir: string | null = null
  for (const t of sorted) {
    if (streakLen >= 3 && t.direction === streakDir) {
      confirmBiasCount++
    }
    if (t.profitLoss > 0 && t.direction === streakDir) {
      streakLen++
    } else if (t.profitLoss > 0) {
      streakLen = 1
      streakDir = t.direction
    } else {
      streakLen = 0
      streakDir = null
    }
  }
  if (confirmBiasCount > 0) {
    const freq = clampFreq((confirmBiasCount / n) * 100)
    biasPatterns.push({
      patternKey: 'confirmation_bias',
      frequency: freq,
      severity: severityOf(freq),
      relatedData: {
        tradesAfterStreak: confirmBiasCount,
        minStreakLength: 3,
      },
    })
  }

  // 7. Biais de taille de position : lots moyens plus élevés sur les trades perdants
  const avgLotWinners = winners.length > 0
    ? winners.reduce((s, t) => s + t.lotSize, 0) / winners.length : 0
  const avgLotLosers = losers.length > 0
    ? losers.reduce((s, t) => s + t.lotSize, 0) / losers.length : 0
  if (winners.length > 0 && losers.length > 0 && avgLotLosers > avgLotWinners * 1.1) {
    const oversizedLosers = losers.filter(t => t.lotSize > avgLotWinners)
    if (oversizedLosers.length > 0) {
      const freq = clampFreq((oversizedLosers.length / n) * 100)
      biasPatterns.push({
        patternKey: 'position_sizing_bias',
        frequency: freq,
        severity: severityOf(freq),
        relatedData: {
          avgLotWinners: r2(avgLotWinners),
          avgLotLosers: r2(avgLotLosers),
          sizingRatio: r2(avgLotLosers / avgLotWinners),
          oversizedLosersCount: oversizedLosers.length,
        },
      })
    }
  }

  return {
    totalTrades: n,
    winRate,
    totalPnL,
    profitFactor,
    maxDrawdownAbs,
    maxDrawdownPct,
    sharpeRatio,
    riskReward,
    avgTradeDuration,
    avgWin,
    avgLoss,
    totalCommissions,
    bestTrade: {
      symbol: bestTrade.symbol,
      pnl: r2(bestTrade.profitLoss),
      date: bestTrade.openTime.toISOString().slice(0, 10),
    },
    worstTrade: {
      symbol: worstTrade.symbol,
      pnl: r2(worstTrade.profitLoss),
      date: worstTrade.openTime.toISOString().slice(0, 10),
    },
    londonWinRate: sessWR['London'],
    londonWins: sessMap['London'].wins,
    londonLosses: sessMap['London'].total - sessMap['London'].wins,
    londonTotal: sessMap['London'].total,
    newYorkWinRate: sessWR['New York'],
    newYorkWins: sessMap['New York'].wins,
    newYorkLosses: sessMap['New York'].total - sessMap['New York'].wins,
    newYorkTotal: sessMap['New York'].total,
    tokyoWinRate: sessWR['Tokyo'],
    tokyoWins: sessMap['Tokyo'].wins,
    tokyoLosses: sessMap['Tokyo'].total - sessMap['Tokyo'].wins,
    tokyoTotal: sessMap['Tokyo'].total,
    bestSession,
    worstSession,
    bestDay,
    worstDay,
    bestHour,
    worstHour,
    bestSymbol: bestSymData.symbol,
    bestSymbolWinRate: bestSymData.winRate,
    bestSymbolPnL: bestSymData.pnl,
    worstSymbol: worstSymData.symbol,
    worstSymbolWinRate: worstSymData.winRate,
    worstSymbolPnL: worstSymData.pnl,
    symbolStats,
    minLot,
    maxLot,
    stopLossUsage,
    takeProfitUsage,
    avgRiskPerTrade: avgLot,
    riskConsistency,
    psychoScore,
    riskScore,
    propFirmScore,
    worstDayLossPct,
    wouldPassFTMO,
    biasPatterns,
  }
}

// ─── MEMBRE — PROMPT LLM (contenu qualitatif uniquement) ─

const MEMBER_SYSTEM_PROMPT = `Tu es un analyste de performance
trading d'élite avec une expertise en finance
comportementale, gestion du risque et psychologie
du trading professionnel.

Tu réponds UNIQUEMENT en français.
Exception — ces termes restent en anglais :
Win Rate, Profit Factor, Drawdown, Stop Loss,
Take Profit, Long, Short, Pip, Leverage, Risk/Reward,
Sharpe Ratio, Revenge Trading, FOMO, Overtrading,
Breakout, Support, Resistance.

RÈGLE FONDAMENTALE — ABSOLUMENT CRITIQUE :
Toutes les statistiques chiffrées sont fournies
dans le bloc STATS. Tu n'inventes, ne calcules,
ni ne modifies AUCUNE valeur numérique.
Tu génères UNIQUEMENT du contenu textuel et qualitatif
basé sur les statistiques précalculées fournies.

RÈGLE BIAIS :
Le bloc STATS contient biasPatterns — liste de patterns
détectés avec leur patternKey, frequency et severity
déjà calculés depuis les trades réels.
Pour chaque pattern, tu fournis :
- name : nom du biais (français sauf termes réservés)
- description : explication comportementale
- evidence : preuves concrètes tirées des données
Tu ne crées PAS de patterns supplémentaires.
Tu n'en supprimes PAS.
Retourne exactement autant d'entrées dans biases
qu'il y a de patterns dans biasPatterns.

RÈGLE ACTION PLAN :
Génère exactement 3 actions (priority 1, 2, 3).
Chaque action doit être concrète et mesurable.

RÈGLE VALEURS TEXTUELLES OBLIGATOIRES :
sessionInsight, dominantBias, consecutiveLossesPattern,
holdingTimeAnalysis, estimatedTimeToReady et
personalizedInsight ne peuvent jamais être vides.
mainObstacles et riskIssues : au moins 1 entrée chacun.

Retourne UNIQUEMENT un objet JSON valide.
Aucun texte avant ou après. Pas de markdown.
Pas de backticks. Juste le JSON brut.

Structure JSON exacte :
{
  "sessionInsight": string,
  "dominantBias": string,
  "biases": [
    {
      "patternKey": string,
      "name": string,
      "description": string,
      "evidence": string
    }
  ],
  "consecutiveLossesPattern": string,
  "holdingTimeAnalysis": string,
  "riskIssues": [
    { "issue": string, "impact": string }
  ],
  "mainObstacles": [string],
  "estimatedTimeToReady": string,
  "actionPlan": [
    {
      "priority": 1|2|3,
      "category":
        "Psychologie"|"Risque"|"Stratégie"|"Timing",
      "action": string,
      "expectedImpact": string,
      "timeframe": string
    }
  ],
  "personalizedInsight": string
}`

// ─── MEMBRE ──────────────────────────────────────────────

export async function analyzeTradesMember(
  trades: Trade[]
): Promise<any> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const stats = computeStats(trades)

  const tradesSummary = trades.map(t => ({
    symbol: (t as any).symbol,
    direction: (t as any).direction,
    openTime: new Date((t as any).openTime).toISOString().slice(0, 16),
    closeTime: new Date((t as any).closeTime).toISOString().slice(0, 16),
    pnl: r2((t as any).profitLoss),
    durationMinutes: (t as any).durationMinutes,
    lotSize: (t as any).lotSize,
  }))

  const userMessage =
    `STATS PRÉCALCULÉES (valeurs fixes — ne jamais modifier) :\n` +
    JSON.stringify(stats) +
    `\n\nTRADES BRUTS (${trades.length} trades — pour contexte textuel uniquement) :\n` +
    JSON.stringify(tradesSummary)

  async function callAPI(attempt: number): Promise<any> {
    let response: any
    try {
      response = await client.chat.completions.create({
        model: 'gpt-5.4',
        max_completion_tokens: 3000,
        temperature: 0.6,
        messages: [
          { role: 'system', content: MEMBER_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      })
    } catch (apiError: any) {
      let errJson = ''
      try { errJson = JSON.stringify(apiError) } catch { errJson = String(apiError) }
      console.error(`[MEMBER attempt=${attempt}] ERREUR APPEL OPENAI`, {
        message: apiError?.message,
        status: apiError?.status,
        code: apiError?.code,
        type: apiError?.type,
        json: errJson,
      })
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000))
        return callAPI(attempt + 1)
      }
      throw new Error(
        "Erreur lors de l'analyse. " +
        'Veuillez réessayer dans quelques instants.'
      )
    }

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.error(`[MEMBER attempt=${attempt}] ERREUR CONTENU VIDE`, {
        choices: response.choices,
      })
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000))
        return callAPI(attempt + 1)
      }
      throw new Error(
        "Erreur lors de l'analyse. " +
        'Veuillez réessayer dans quelques instants.'
      )
    }

    const clean = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    let llm: any
    try {
      llm = JSON.parse(clean)
    } catch (parseError: any) {
      console.error(`[MEMBER attempt=${attempt}] ERREUR JSON.PARSE`, {
        message: parseError?.message,
        contentStart: clean.slice(0, 300),
        contentEnd: clean.slice(-200),
      })
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000))
        return callAPI(attempt + 1)
      }
      throw new Error(
        "Erreur lors de l'analyse. " +
        'Veuillez réessayer dans quelques instants.'
      )
    }

    // Fusion : stats précalculées + contenu qualitatif LLM
    const biases = stats.biasPatterns.map(bp => {
      const llmBias = (llm.biases ?? []).find((b: any) => b.patternKey === bp.patternKey)
      return {
        name: llmBias?.name ?? bp.patternKey.replace(/_/g, ' '),
        severity: bp.severity,
        frequency: bp.frequency,
        description: llmBias?.description ?? '',
        evidence: llmBias?.evidence ?? '',
      }
    })

    return {
      globalStats: {
        totalTrades: stats.totalTrades,
        winRate: stats.winRate,
        avgWin: stats.avgWin,
        avgLoss: stats.avgLoss,
        profitFactor: stats.profitFactor,
        sharpeRatio: stats.sharpeRatio,
        maxDrawdown: stats.maxDrawdownAbs,
        maxDrawdownPercent: stats.maxDrawdownPct,
        avgRiskReward: stats.riskReward,
        totalPnL: stats.totalPnL,
        bestTrade: stats.bestTrade,
        worstTrade: stats.worstTrade,
        avgTradeDuration: stats.avgTradeDuration,
        totalCommissions: stats.totalCommissions,
      },
      sessionAnalysis: {
        bestSession: stats.bestSession,
        worstSession: stats.worstSession,
        londonWinRate: stats.londonWinRate,
        newYorkWinRate: stats.newYorkWinRate,
        tokyoWinRate: stats.tokyoWinRate,
        insight: llm.sessionInsight ?? '',
      },
      psychologicalProfile: {
        overallScore: stats.psychoScore,
        dominantBias: llm.dominantBias ?? (biases[0]?.name ?? ''),
        biases,
      },
      performancePatterns: {
        bestSymbol: {
          symbol: stats.bestSymbol,
          winRate: stats.bestSymbolWinRate,
          pnl: stats.bestSymbolPnL,
        },
        worstSymbol: {
          symbol: stats.worstSymbol,
          winRate: stats.worstSymbolWinRate,
          pnl: stats.worstSymbolPnL,
        },
        bestDayOfWeek: stats.bestDay,
        worstDayOfWeek: stats.worstDay,
        bestTimeOfDay: stats.bestHour,
        worstTimeOfDay: stats.worstHour,
        consecutiveLossesPattern: llm.consecutiveLossesPattern ?? '',
        holdingTimeAnalysis: llm.holdingTimeAnalysis ?? '',
      },
      riskManagement: {
        score: stats.riskScore,
        avgRiskPerTrade: stats.avgRiskPerTrade,
        riskConsistency: stats.riskConsistency,
        stopLossUsage: stats.stopLossUsage,
        takeProfitUsage: stats.takeProfitUsage,
        issues: llm.riskIssues ?? [],
      },
      propFirmReadiness: {
        score: stats.propFirmScore,
        wouldPassFTMO: stats.wouldPassFTMO,
        mainObstacles: llm.mainObstacles ?? [],
        estimatedTimeToReady: llm.estimatedTimeToReady ?? '',
      },
      actionPlan: llm.actionPlan ?? [],
      personalizedInsight: llm.personalizedInsight ?? '',
    }
  }

  return callAPI(1)
}
