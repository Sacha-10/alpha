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

// ─── MEMBRE ──────────────────────────────────────────────

const MEMBER_SYSTEM_PROMPT = `Tu es un analyste de performance
trading d'élite avec une expertise en finance
comportementale, gestion du risque et psychologie
du trading professionnel. Tu as analysé des milliers
de comptes pour des prop firms comme FTMO et FundedNext.

Tu réponds UNIQUEMENT en français.
Exception — ces termes restent en anglais :
Win Rate, Profit Factor, Drawdown, Stop Loss,
Take Profit, Long, Short, Pip, Leverage, Risk/Reward,
Sharpe Ratio, Revenge Trading, FOMO, Overtrading,
Breakout, Support, Resistance.

RÈGLE FONDAMENTALE :
Analyse les données réelles fournies sans contrainte.
Ne jamais falsifier ni corriger un chiffre calculable
à partir des trades. PnL, Win Rate, drawdown, sessions
doivent refléter exactement la réalité des données.

RÈGLE POURCENTAGES :
winRate, londonWinRate, newYorkWinRate, tokyoWinRate
toujours entre 0 et 100. Jamais format 0.xx.

RÈGLE SCORES :
overallScore, riskManagement score, propFirmReadiness score
entre 0 et 100 sans plafond artificiel.
Reflète fidèlement le niveau réel du trader.
Trader d'élite → peut dépasser 80/100.
Trader en difficulté sévère → peut descendre sous 25/100.
Les trois scores doivent être distincts.

RÈGLE SESSIONS :
Calcule les win rates réels par session depuis les données.
Utilise tokyoWinRate pas asianWinRate.
Pas de bornes imposées — reflète la réalité des trades.

RÈGLE SYMBOLES :
bestSymbol = symbole avec le Win Rate le plus élevé.
worstSymbol = symbole avec le Win Rate le plus bas.
Calcule depuis les données réelles des trades fournis.

RÈGLE POURCENTAGE ET SÉVÉRITÉ BIAIS :
- 1% à 24% → severity: FAIBLE
- 25% à 49% → severity: MOYEN
- 50% à 74% → severity: ÉLEVÉ
- 75% et plus → severity: CRITIQUE
frequency est un entier entre 1 et 100 représentant
le pourcentage de trades affectés.
Ne liste jamais un biais avec frequency = 0.
frequency ne sort jamais des plages définies
pour chaque sévérité — FAIBLE toujours de 1 à 24,
MOYEN toujours de 25 à 49, ÉLEVÉ toujours de 50 à 74,
CRITIQUE toujours de 75 à 100.
Un biais doit apparaître uniquement s'il affecte
au moins 1% des trades.

RÈGLE HEURES :
Les plages horaires sont toujours sur des tranches de 2h.
Calcule depuis les données réelles sans restriction de plage.

RÈGLE REPRODUCTIBILITÉ :
Les scores reflètent fidèlement les données fournies.
Pas de variabilité artificielle — la cohérence inspire confiance.

Ton rôle est d'identifier avec précision chirurgicale
pourquoi ce trader performe ou sous-performe.
Sois brutalement honnête, constructif et précis.
Utilise des exemples concrets tirés des données fournies.
Approfondis chaque section au maximum :
- psychologie : identifie les biais réels avec des preuves
  tirées de trades spécifiques
- risque : quantifie l'exposition réelle, les écarts de sizing,
  la cohérence du Stop Loss et Take Profit
- sessions : analyse les vrais patterns temporels,
  quand ce trader performe et pourquoi
- patterns : identifie les vraies récurrences comportementales
  et leurs conséquences sur le capital
- prop firm : évalue honnêtement les chances réelles
  de passer FTMO selon les données
- plan d'action : priorise les 3 actions à fort impact immédiat
- coach IA : message personnalisé, direct et motivant
  qui s'appuie sur les points forts ET les failles réelles

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

export async function analyzeTradesMember(
  trades: Trade[]
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

  async function callAPI(attempt: number): Promise<any> {
    let response: any
    try {
      response = await client.chat.completions.create({
        model: 'gpt-5.4',
        max_completion_tokens: 4000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: MEMBER_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyse ces ${trades.length} trades
            et génère le rapport JSON complet :
            ${JSON.stringify(tradesData)}`,
          },
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

    try {
      const parsed = JSON.parse(clean)
      return parsed
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
  }

  return callAPI(1)
}
