import { Check, X } from "lucide-react";
import type { AiAnalysisResult, BiasSeverity } from "@/lib/tradingAnalysisTypes";

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const normalized = score > 0 && score <= 1 ? score * 100 : score;
  const capped = Math.min(100, Math.max(0, normalized));
  const color =
    capped > 60 ? "var(--cyan)" : capped >= 40 ? "var(--orange)" : "var(--red)";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20 sm:h-24 sm:w-24">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-90 transform"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${capped * 2.83} 283`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold leading-tight sm:text-lg"
          style={{ color }}
        >
          {Math.round(capped)}/100
        </span>
      </div>
      <span className="mt-2 w-24 text-center text-xs text-secondary sm:w-auto sm:whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: BiasSeverity | string }) {
  const styles: Record<string, string> = {
    CRITIQUE: "bg-red/20 text-red",
    ÉLEVÉ: "bg-red/20 text-red",
    MOYEN: "bg-orange/20 text-orange",
    FAIBLE: "bg-cyan/20 text-cyan",
  };
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${styles[severity] ?? styles.FAIBLE}`}
    >
      {severity}
    </span>
  );
}

export function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

export function safeStr(v: unknown, fallback = "—"): string {
  if (v == null || v === "N/A" || v === "") return fallback;
  return String(v);
}

export function displayRate(v: unknown): string {
  const n = safeNum(v);
  return n <= 1 ? (n * 100).toFixed(1) : n.toFixed(1);
}

function sessionPctColorClasses(pct: number): { bar: string; text: string } {
  if (pct < 40) return { bar: "var(--red)", text: "text-red" };
  if (pct <= 60) return { bar: "var(--orange)", text: "text-orange" };
  return { bar: "var(--cyan)", text: "text-cyan" };
}

export function TradeReportBody({ report }: { report: AiAnalysisResult }) {
  const s = report.globalStats;
  const psych = report.psychologicalProfile;
  const risk = report.riskManagement;
  const prop = report.propFirmReadiness;
  const patterns = report.performancePatterns;
  const session = report.sessionAnalysis;

  const winRateRaw = safeNum(s.winRate);
  const winRateNum = winRateRaw <= 1 ? winRateRaw * 100 : winRateRaw;
  const ddRaw = safeNum(s.maxDrawdownPercent);
  const ddNum = ddRaw <= 1 ? ddRaw * 100 : ddRaw;

  const tokyoRate =
    "tokyoWinRate" in session && typeof session.tokyoWinRate === "number"
      ? session.tokyoWinRate
      : "asianWinRate" in session &&
          typeof (session as { asianWinRate?: number }).asianWinRate === "number"
        ? (session as { asianWinRate: number }).asianWinRate
        : 30;

  const keyStats: {
    label: string;
    value: string;
    positive: boolean;
    valueClass?: string;
    showWarning?: boolean;
  }[] = [
    {
      label: "Win Rate",
      value: `${displayRate(s.winRate)}%`,
      positive: winRateNum >= 50,
    },
    {
      label: "Profit Factor",
      value: safeNum(s.profitFactor).toFixed(2),
      positive: safeNum(s.profitFactor) >= 1,
    },
    {
      label: "Max Drawdown",
      value: `${displayRate(s.maxDrawdownPercent)}%`,
      positive: false,
      valueClass: ddNum > 10 ? "text-red" : "text-secondary",
      showWarning: ddNum > 10,
    },
    {
      label: "PnL Total",
      value: (() => {
        const pnl = safeNum(s.totalPnL);
        return pnl < 0 ? `-${Math.abs(pnl).toFixed(0)}€` : `+${pnl.toFixed(0)}€`;
      })(),
      positive: safeNum(s.totalPnL) > 0,
      valueClass: safeNum(s.totalPnL) < 0 ? "text-red" : "text-cyan",
    },
    {
      label: "Trades Total",
      value: String(s.totalTrades ?? 0),
      positive: true,
      valueClass: "text-primary",
    },
    {
      label: "Sharpe Ratio",
      value: safeNum(s.sharpeRatio).toFixed(2),
      positive: safeNum(s.sharpeRatio) >= 1,
    },
    {
      label: "Risk/Reward",
      value: safeNum(s.avgRiskReward).toFixed(2),
      positive: safeNum(s.avgRiskReward) >= 1,
    },
    {
      label: "Durée moyenne",
      value: safeStr(s.avgTradeDuration),
      positive: true,
      valueClass: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Performance globale */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Performance globale</h2>
        <div className="flex justify-around">
          <ScoreCircle
            score={safeNum(psych.overallScore)}
            label="Score psychologique"
          />
          <ScoreCircle score={safeNum(risk.score)} label="Gestion du risque" />
          <ScoreCircle score={safeNum(prop.score)} label="Prop Firm Readiness" />
        </div>
      </div>

      {/* Statistiques clés */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Statistiques clés</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {keyStats.map((stat, i) => (
            <div key={i} className="rounded-xl bg-hover p-4">
              <div className="mb-1">
                <p className="text-sm text-secondary">{stat.label}</p>
              </div>
              <p
                className={`font-mono text-xl font-bold ${
                  stat.valueClass !== undefined
                    ? stat.valueClass
                    : stat.positive
                      ? "text-cyan"
                      : "text-red"
                }`}
              >
                {stat.value}
                {stat.showWarning && (
                  <span className="ml-1 text-base leading-none">⚠️</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Profil psychologique */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Profil psychologique</h2>
        {psych.dominantBias && (
          <p className="mb-4 text-sm leading-relaxed text-red">
            {psych.dominantBias}
          </p>
        )}
        <div className="space-y-4">
          {(psych.biases ?? []).map((bias, i) => (
            <div key={`${bias.name}-${i}`} className="rounded-xl bg-hover p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-bold">{bias.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm text-secondary">
                    {bias.frequency}%
                  </span>
                  <SeverityBadge severity={bias.severity} />
                </div>
              </div>
              <p className="mb-2 text-sm text-secondary">{bias.description}</p>
              <p className="text-xs text-secondary/70">{bias.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance par session */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Performance par session</h2>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { name: "London", rate: safeNum(session.londonWinRate) },
            { name: "New York", rate: safeNum(session.newYorkWinRate) },
            { name: "Tokyo", rate: safeNum(tokyoRate) },
          ].map((sess, i) => {
            const rateValue = Number(displayRate(sess.rate));
            const se = sessionPctColorClasses(rateValue);
            return (
              <div key={i} className="rounded-xl bg-hover p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-secondary">{sess.name}</span>
                  <span className={`font-mono font-bold ${se.text}`}>
                    {displayRate(sess.rate)}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-background">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, rateValue)}%`,
                      background: se.bar,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-secondary">{safeStr(session.insight, "")}</p>
      </div>

      {/* Patterns de performance */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Patterns de performance</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Meilleur jour",
              value: safeStr(patterns.bestDayOfWeek),
              positive: true,
            },
            {
              label: "Pire jour",
              value: safeStr(patterns.worstDayOfWeek),
              positive: false,
            },
            {
              label: "Meilleure heure",
              value: safeStr(patterns.bestTimeOfDay).replace(/ UTC$/i, ""),
              positive: true,
            },
            {
              label: "Pire heure",
              value: safeStr(patterns.worstTimeOfDay).replace(/ UTC$/i, ""),
              positive: false,
            },
            {
              label: "Meilleur symbole",
              value: patterns.bestSymbol
                ? `${safeStr(patterns.bestSymbol.symbol)} (${displayRate(patterns.bestSymbol.winRate)}%)`
                : "—",
              positive: true,
            },
            {
              label: "Pire symbole",
              value: patterns.worstSymbol
                ? `${safeStr(patterns.worstSymbol.symbol)} (${displayRate(patterns.worstSymbol.winRate)}%)`
                : "—",
              positive: false,
            },
          ].map((p, i) => (
            <div key={i} className="rounded-xl bg-hover p-4">
              <p className="mb-1 text-sm text-secondary">{p.label}</p>
              <p
                className={`break-words font-mono text-sm font-bold sm:text-base ${p.positive ? "text-cyan" : "text-red"}`}
                title={p.value}
              >
                {p.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Prop Firm Readiness */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Prop Firm Readiness</h2>
        <p className="mb-4 text-sm leading-relaxed text-secondary">
          {safeStr(prop.estimatedTimeToReady)}
        </p>
        <ul className="space-y-3">
          {(prop.mainObstacles ?? []).map((obs, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {prop.wouldPassFTMO ? (
                <Check
                  className="mr-1.5 inline h-4 w-4 align-text-bottom text-green"
                  aria-hidden
                />
              ) : (
                <X
                  className="mr-1.5 inline h-4 w-4 align-text-bottom text-red"
                  aria-hidden
                />
              )}
              <span
                className={
                  prop.wouldPassFTMO ? "text-primary" : "text-secondary"
                }
              >
                {obs}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Plan d'action */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Plan d&apos;action</h2>
        <div className="space-y-4">
          {(report.actionPlan ?? []).map((item, i) => {
            const catColors: Record<string, string> = {
              Psychologie: "bg-red/20 text-red",
              Risque: "bg-orange/20 text-orange",
              Stratégie: "bg-orange/20 text-orange",
              Timing: "bg-cyan/20 text-cyan",
            };
            return (
              <div key={i} className="rounded-xl bg-hover p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="shrink-0 font-mono text-xs font-semibold text-secondary">
                    {item.priority}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${catColors[item.category] ?? "bg-secondary/20 text-secondary"}`}
                  >
                    {item.category}
                  </span>
                  <span className="text-xs text-secondary">{item.timeframe}</span>
                </div>
                <p className="mb-1 font-medium">{item.action}</p>
                <p className="text-sm text-secondary">{item.expectedImpact}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analyste IA */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Analyste IA</h2>
        <p className="text-sm leading-relaxed text-secondary">
          {safeStr(report.personalizedInsight)}
        </p>
      </div>
    </div>
  );
}
