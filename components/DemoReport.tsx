"use client";

import { motion } from "framer-motion";
import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes";
import { PsychologyBadge } from "@/components/PsychologyBadge";
import { StatsCard } from "@/components/StatsCard";

type Props = {
  analysis: AiAnalysisResult;
};

function fmtPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)} %`;
}

function fmtNum(n: number | null | undefined, digits = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function DemoReport({ analysis }: Props) {
  const g = analysis.globalStats;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 rounded-xl border border-dashed border-cyan-500/25 bg-cyan-500/[0.03] p-6"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-cyan-400/90">
        Démo — données fictives
      </p>
      <p className="text-sm leading-relaxed text-slate-300">
        {analysis.personalizedInsight}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Win Rate" value={fmtPct(g?.winRate)} />
        <StatsCard title="Profit Factor" value={fmtNum(g?.profitFactor)} />
        <StatsCard title="Drawdown" value={fmtPct(g?.maxDrawdownPercent)} />
        <StatsCard title="Sharpe Ratio" value={fmtNum(g?.sharpeRatio)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {analysis.psychologicalProfile?.biases?.map((p, i) => (
          <PsychologyBadge
            key={`${p.name}-demo-${i}`}
            tag={p.name}
            note={p.description}
          />
        ))}
      </div>

      <p className="text-sm text-slate-400">
        {analysis.sessionAnalysis?.insight ?? ""}
      </p>

      <ul className="list-inside list-disc space-y-1 text-sm text-slate-500">
        {analysis.actionPlan?.slice(0, 4).map((a, i) => (
          <li key={i}>{a.action}</li>
        ))}
      </ul>
    </motion.div>
  );
}
