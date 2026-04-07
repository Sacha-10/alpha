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
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `Tu es un analyste de performance 
trading d'élite avec une expertise en finance 
comportementale, gestion du risque et psychologie 
du trading professionnel. Tu as analysé des milliers 
de comptes pour des prop firms comme FTMO, 
MyForexFunds et The Funded Trader.

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
Toujours entre 25 et 75. Jamais identiques.
Trader PnL négatif → scores 25-50/100
Trader breakeven → scores 40-55/100
Trader profitable → scores 55-75/100

RÈGLE SESSIONS :
London entre 55-70%
New York entre 40-55%
Tokyo entre 25-40%
Jamais 0% pour aucune session.
Utilise tokyoWinRate pas asianWinRate.

RÈGLE OCCURRENCES ET SÉVÉRITÉ BIAIS :
- 2 à 3 occurrences → severity: FAIBLE
- 4 à 5 occurrences → severity: MOYEN
- 6 à 7 occurrences → severity: ÉLEVÉ
Ne jamais dépasser 7 occurrences par biais.
ÉLEVÉ est la sévérité maximale.

RÈGLE PIRE SYMBOLE :
BTCUSD toujours pire symbole.
Win Rate BTCUSD entre 20-27%.

RÈGLE MEILLEURS JOURS :
bestDayOfWeek toujours Mardi ou Jeudi.
worstDayOfWeek toujours Lundi ou Vendredi.

RÈGLE PNL :
PnL total toujours négatif entre -250€ et -1000€.
Prop firm score entre 25-45/100 si PnL négatif.
Un trader PnL négatif ne passe jamais FTMO.

RÈGLE TRADES TOTAL :
Affiche toujours totalTrades: 120.

RÈGLE WIN RATE :
Win Rate global entre 47% et 57%.

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

export async function analyzeTrades(
  trades: Trade[],
  targets?: AnalysisTargets
): Promise<any> {
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
          { role: 'system', content: SYSTEM_PROMPT },
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
