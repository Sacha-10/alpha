import OpenAI from 'openai'
import { Trade } from './parseCSV'

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
    "asianWinRate": number,
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
  trades: Trade[]
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

  async function callAPI(attempt: number): Promise<any> {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-5.4-thinking',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Analyse ces ${trades.length} trades 
            et génère le rapport JSON complet : 
            ${JSON.stringify(tradesData)}`
          }
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
      console.error('[OpenAI Error]', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        type: error?.type,
      })
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000))
        return callAPI(attempt + 1)
      }
      throw new Error(
        'Erreur lors de l\'analyse. ' +
        'Veuillez réessayer dans quelques instants.'
      )
    }
  }

  return callAPI(1)
}
