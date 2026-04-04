export type BiasSeverity = 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ' | 'CRITIQUE'

export type RiskConsistency =
  | 'INSUFFISANT'
  | 'MOYEN'
  | 'BON'
  | 'EXCELLENT'

export type ActionCategory =
  | 'Psychologie'
  | 'Risque'
  | 'Stratégie'
  | 'Timing'

export type ActionPriority = 1 | 2 | 3

export interface TradingBias {
  name: string
  severity: BiasSeverity
  frequency: number
  description: string
  evidence: string
}

export interface AiAnalysisResult {
  globalStats: {
    totalTrades: number
    winRate: number
    avgWin: number
    avgLoss: number
    profitFactor: number
    sharpeRatio: number
    maxDrawdown: number
    maxDrawdownPercent: number
    avgRiskReward: number
    totalPnL: number
    bestTrade: { symbol: string; pnl: number; date: string }
    worstTrade: { symbol: string; pnl: number; date: string }
    avgTradeDuration: string
    totalCommissions: number
  }
  sessionAnalysis: {
    bestSession: string
    worstSession: string
    londonWinRate: number
    newYorkWinRate: number
    asianWinRate: number
    insight: string
  }
  psychologicalProfile: {
    overallScore: number
    dominantBias: string
    biases: TradingBias[]
  }
  performancePatterns: {
    bestSymbol: { symbol: string; winRate: number; pnl: number }
    worstSymbol: { symbol: string; winRate: number; pnl: number }
    bestDayOfWeek: string
    worstDayOfWeek: string
    bestTimeOfDay: string
    worstTimeOfDay: string
    consecutiveLossesPattern: string
    holdingTimeAnalysis: string
  }
  riskManagement: {
    score: number
    avgRiskPerTrade: number
    riskConsistency: RiskConsistency
    stopLossUsage: number
    takeProfitUsage: number
    issues: { issue: string; impact: string }[]
  }
  propFirmReadiness: {
    score: number
    wouldPassFTMO: boolean
    mainObstacles: string[]
    estimatedTimeToReady: string
  }
  actionPlan: {
    priority: ActionPriority
    category: ActionCategory
    action: string
    expectedImpact: string
    timeframe: string
  }[]
  personalizedInsight: string
}
