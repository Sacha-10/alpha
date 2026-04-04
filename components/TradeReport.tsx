"use client";

import { motion } from "framer-motion";
import type { AiAnalysisResult, BiasSeverity } from "@/lib/tradingAnalysisTypes";

interface Props {
  report: AiAnalysisResult;
  analysesLeft?: number;
  analysesLimit?: number;
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color =
    score >= 70 ? "#00E5B0" : score >= 40 ? "#FFB800" : "#FF3D57";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-90 transform"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#1E2035"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${score * 2.83} 283`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <span className="mt-2 text-center text-sm text-secondary">{label}</span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: BiasSeverity | string }) {
  const styles: Record<string, string> = {
    CRITIQUE: "bg-red/20 text-red border-red/30",
    ÉLEVÉ: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    MOYEN: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    FAIBLE: "bg-secondary/20 text-secondary border-secondary/30",
  };
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-medium ${styles[severity] ?? styles.FAIBLE}`}
    >
      {severity}
    </span>
  );
}

export default function TradeReport({
  report,
  analysesLeft,
  analysesLimit,
}: Props) {
  const s = report.globalStats;
  const psych = report.psychologicalProfile;
  const risk = report.riskManagement;
  const prop = report.propFirmReadiness;
  const patterns = report.performancePatterns;
  const session = report.sessionAnalysis;

  const limit = Math.max(analysesLimit ?? 4, 1);
  const remainingPct = Math.min(
    100,
    Math.max(0, ((analysesLeft ?? 0) / limit) * 100)
  );

  const keyStats: {
    label: string;
    value: string;
    positive: boolean;
  }[] = [
    {
      label: "Win Rate",
      value: `${s.winRate.toFixed(1)}%`,
      positive: s.winRate >= 50,
    },
    {
      label: "Profit Factor",
      value: s.profitFactor.toFixed(2),
      positive: s.profitFactor >= 1,
    },
    {
      label: "Max Drawdown",
      value: `${s.maxDrawdownPercent.toFixed(1)}%`,
      positive: false,
    },
    {
      label: "PnL Total",
      value: `${s.totalPnL > 0 ? "+" : ""}${s.totalPnL.toFixed(0)}€`,
      positive: s.totalPnL > 0,
    },
    {
      label: "Trades Total",
      value: String(s.totalTrades),
      positive: true,
    },
    {
      label: "Sharpe Ratio",
      value: s.sharpeRatio.toFixed(2),
      positive: s.sharpeRatio >= 1,
    },
    {
      label: "Risk/Reward moyen",
      value: s.avgRiskReward.toFixed(2),
      positive: s.avgRiskReward >= 1,
    },
    {
      label: "Durée moyenne",
      value: s.avgTradeDuration,
      positive: true,
    },
  ];

  return (
    <div className="space-y-6">
      {analysesLeft !== undefined && (
        <div className="card flex items-center justify-between p-4">
          <span className="text-secondary">
            Analyses restantes ce mois-ci
          </span>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 rounded-full bg-hover">
              <div
                className="h-full rounded-full bg-blue"
                style={{ width: `${remainingPct}%` }}
              />
            </div>
            <span className="font-mono text-primary">
              {analysesLeft}/{analysesLimit ?? limit}
            </span>
            {analysesLeft <= 1 && (
              <a
                href="/api/create-checkout?plan=pro"
                className="btn-primary px-3 py-1 text-sm"
              >
                Passer au Pro
              </a>
            )}
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <h2 className="mb-6 text-xl font-bold">Votre performance globale</h2>
        <div className="flex justify-around">
          <ScoreCircle
            score={psych.overallScore}
            label="Score psychologique"
          />
          <ScoreCircle score={prop.score} label="Prop Firm Readiness" />
          <ScoreCircle score={risk.score} label="Gestion du risque" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="mb-4 text-xl font-bold">Statistiques clés</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {keyStats.map((stat, i) => (
            <div key={i} className="rounded-xl bg-hover p-4">
              <p className="mb-1 text-sm text-secondary">{stat.label}</p>
              <p
                className={`font-mono text-xl font-bold ${stat.positive ? "text-green" : "text-red"}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h2 className="mb-2 text-xl font-bold">Votre profil psychologique</h2>
        <p className="mb-4 text-secondary">
          Biais dominant :{" "}
          <span className="ml-1 font-medium text-red">{psych.dominantBias}</span>
        </p>
        <div className="space-y-4">
          {psych.biases.map((bias, i) => (
            <div key={`${bias.name}-${i}`} className="rounded-xl bg-hover p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold">{bias.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary">
                    {bias.frequency}× détecté
                  </span>
                  <SeverityBadge severity={bias.severity} />
                </div>
              </div>
              <p className="mb-2 text-sm text-secondary">{bias.description}</p>
              <p className="text-xs italic text-secondary/70">
                &ldquo;{bias.evidence}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <h2 className="mb-4 text-xl font-bold">Performance par session</h2>
        <div className="mb-4 grid grid-cols-3 gap-4">
          {[
            { name: "London", rate: session.londonWinRate },
            { name: "New York", rate: session.newYorkWinRate },
            { name: "Asian", rate: session.asianWinRate },
          ].map((sess, i) => (
            <div key={i} className="rounded-xl bg-hover p-4 text-center">
              <p className="mb-2 text-sm text-secondary">{sess.name}</p>
              <div className="mb-2 h-3 w-full rounded-full bg-background">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${sess.rate}%`,
                    background: sess.rate >= 50 ? "#00E5B0" : "#FF3D57",
                  }}
                />
              </div>
              <p
                className={`font-mono font-bold ${sess.rate >= 50 ? "text-green" : "text-red"}`}
              >
                {sess.rate.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm italic text-secondary">{session.insight}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card p-6"
      >
        <h2 className="mb-4 text-xl font-bold">Vos patterns de performance</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Meilleur jour",
              value: patterns.bestDayOfWeek,
              positive: true,
            },
            {
              label: "Pire jour",
              value: patterns.worstDayOfWeek,
              positive: false,
            },
            {
              label: "Meilleure heure",
              value: patterns.bestTimeOfDay,
              positive: true,
            },
            {
              label: "Pire heure",
              value: patterns.worstTimeOfDay,
              positive: false,
            },
            {
              label: "Meilleur symbole",
              value: `${patterns.bestSymbol.symbol} (${patterns.bestSymbol.winRate.toFixed(1)}%)`,
              positive: true,
            },
            {
              label: "Pire symbole",
              value: `${patterns.worstSymbol.symbol} (${patterns.worstSymbol.winRate.toFixed(1)}%)`,
              positive: false,
            },
          ].map((p, i) => (
            <div key={i} className="rounded-xl bg-hover p-4">
              <p className="mb-1 text-sm text-secondary">{p.label}</p>
              <p
                className={`font-mono font-bold ${p.positive ? "text-green" : "text-red"}`}
              >
                {p.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h2 className="mb-4 text-xl font-bold">
          Êtes-vous prêt pour une prop firm ?
        </h2>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <span
            className={`rounded-full px-4 py-2 font-bold ${prop.wouldPassFTMO ? "bg-green/20 text-green" : "bg-red/20 text-red"}`}
          >
            {prop.wouldPassFTMO
              ? "✓ Passerait le challenge FTMO"
              : "✗ Ne passerait pas encore le challenge FTMO"}
          </span>
          <span className="text-secondary">
            Temps estimé : {prop.estimatedTimeToReady}
          </span>
        </div>
        <ul className="space-y-2">
          {prop.mainObstacles.map((obs, i) => (
            <li key={i} className="flex gap-2 text-sm text-secondary">
              <span className="text-red">✗</span>
              {obs}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card p-6"
      >
        <h2 className="mb-4 text-xl font-bold">
          Votre plan d&apos;action personnalisé
        </h2>
        <div className="space-y-4">
          {report.actionPlan.map((item, i) => {
            const catColors: Record<string, string> = {
              Psychologie: "bg-red/20 text-red",
              Risque: "bg-orange-500/20 text-orange-400",
              Stratégie: "bg-blue/20 text-blue",
              Timing: "bg-cyan/20 text-cyan",
            };
            return (
              <div key={i} className="flex gap-4 rounded-xl bg-hover p-4">
                <span className="font-mono text-3xl font-bold text-blue/30">
                  {item.priority}
                </span>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${catColors[item.category] ?? "bg-secondary/20 text-secondary"}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-secondary">{item.timeframe}</span>
                  </div>
                  <p className="mb-1 font-medium">{item.action}</p>
                  <p className="text-sm text-secondary">
                    Impact : {item.expectedImpact}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card border-blue/30 bg-blue/5 p-6"
      >
        <h2 className="mb-4 text-xl font-bold">L&apos;avis de votre coach IA</h2>
        <p className="text-lg italic leading-relaxed text-secondary">
          &ldquo;{report.personalizedInsight}&rdquo;
        </p>
        <p className="mt-4 font-medium text-blue">
          — Votre coach IA trading
        </p>
      </motion.div>

      <div className="pb-8 text-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-outline"
        >
          Télécharger mon rapport PDF
        </button>
      </div>
    </div>
  );
}
