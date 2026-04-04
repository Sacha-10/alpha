"use client";

import { motion } from "framer-motion";

type Props = {
  title: string;
  value: string;
  hint?: string;
  variant?: "default" | "positive" | "negative" | "accent";
};

const variantClass: Record<NonNullable<Props["variant"]>, string> = {
  default: "border-border bg-card",
  positive: "border-emerald-500/30 bg-emerald-500/5",
  negative: "border-rose-500/30 bg-rose-500/5",
  accent: "border-cyan-500/30 bg-cyan-500/5",
};

export function StatsCard({ title, value, hint, variant = "default" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 shadow-sm ${variantClass[variant]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-50">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </motion.div>
  );
}
