import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes";

/** Analyse statique pour la démo sans clé OpenAI (aperçu produit). */
export function getStaticDemoAnalysis(): AiAnalysisResult {
  return {
    globalStats: {
      totalTrades: 12,
      winRate: 46,
      avgWin: 210,
      avgLoss: 118,
      profitFactor: 1.35,
      sharpeRatio: 0.92,
      maxDrawdown: 420,
      maxDrawdownPercent: 8.2,
      avgRiskReward: 1.4,
      totalPnL: 380,
      bestTrade: { symbol: "BTCUSDT", pnl: 312, date: "2026-03-03" },
      worstTrade: { symbol: "XAUUSD", pnl: -154, date: "2026-03-02" },
      avgTradeDuration: "2h15",
      totalCommissions: 48,
    },
    sessionAnalysis: {
      bestSession: "New York",
      worstSession: "Asian",
      londonWinRate: 44,
      newYorkWinRate: 52,
      asianWinRate: 33,
      insight:
        "Les meilleures séquences coïncident avec la session New York ; la liquidité asiatique amplifie les faux breakouts sur le métal.",
    },
    psychologicalProfile: {
      overallScore: 58,
      dominantBias: "Revenge Trading",
      biases: [
        {
          name: "Revenge Trading",
          severity: "MOYEN",
          frequency: 3,
          description:
            "Reprises rapides sur la même paire après Stop Loss.",
          evidence:
            "Deux Long EURUSD dans l’heure suivant une perte sur la même direction.",
        },
        {
          name: "FOMO",
          severity: "FAIBLE",
          frequency: 2,
          description: "Entrées après extension du mouvement.",
          evidence: "Ouverture XAUUSD en retard sur le spike.",
        },
        {
          name: "Overtrading",
          severity: "MOYEN",
          frequency: 4,
          description: "Volume élevé de tickets le même jour.",
          evidence: "Plus de 4 trades sur EURUSD en une session.",
        },
      ],
    },
    performancePatterns: {
      bestSymbol: { symbol: "BTCUSDT", winRate: 62, pnl: 280 },
      worstSymbol: { symbol: "XAUUSD", winRate: 35, pnl: -120 },
      bestDayOfWeek: "Mercredi",
      worstDayOfWeek: "Lundi",
      bestTimeOfDay: "14:00–18:00 UTC",
      worstTimeOfDay: "01:00–05:00 UTC",
      consecutiveLossesPattern:
        "Jusqu’à 3 pertes d’affilée avant pause ; pas de règle de cooldown.",
      holdingTimeAnalysis:
        "Les gagnants sont tenus plus longtemps que les perdants en moyenne — bon signe de laisser courir les gains.",
    },
    riskManagement: {
      score: 61,
      avgRiskPerTrade: 0.85,
      riskConsistency: "MOYEN",
      stopLossUsage: 78,
      takeProfitUsage: 65,
      issues: [
        {
          issue: "Taille de position variable après série perdante",
          impact: "Drawdown plus profond que prévu sur XAUUSD.",
        },
        {
          issue: "Take Profit rarement atteint sur le métal",
          impact: "Profit Factor artificiellement bas sur ce symbole.",
        },
      ],
    },
    propFirmReadiness: {
      score: 55,
      wouldPassFTMO: false,
      mainObstacles: [
        "Drawdown quotidien encore proche des limites",
        "Manque de règle stricte après pertes consécutives",
      ],
      estimatedTimeToReady: "6–10 semaines avec journal et règles fixes",
    },
    actionPlan: [
      {
        priority: 1,
        category: "Psychologie",
        action:
          "Imposer un cooldown de 2h après 2 Stop Loss sur la même paire.",
        expectedImpact: "Réduction des entrées émotionnelles.",
        timeframe: "Immédiat",
      },
      {
        priority: 2,
        category: "Risque",
        action:
          "Fixer un Risk/Reward minimum et refuser tout setup en dessous.",
        expectedImpact: "Profit Factor plus stable.",
        timeframe: "2 semaines",
      },
      {
        priority: 3,
        category: "Stratégie",
        action:
          "Journaliser motif (Breakout, Support, Resistance) avant chaque entrée.",
        expectedImpact: "Meilleure traçabilité des biais.",
        timeframe: "Continu",
      },
    ],
    personalizedInsight:
      "Sur cet échantillon, le Win Rate reste honorable mais une séquence de pertes rapprochées (Drawdown) mérite attention. Le Profit Factor tient grâce au trade gagnant sur BTCUSDT. La gestion des Stop Loss est présente ; le Risk/Reward gagnerait à être calibré après la série perdante sur EURUSD. Priorité : casser le cycle Revenge Trading sur le forex.",
  };
}
