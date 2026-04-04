"use client";

import { motion } from "framer-motion";

const KNOWN = new Set([
  "Revenge Trading",
  "FOMO",
  "Overtrading",
  "Breakout",
  "Support",
  "Resistance",
]);

type Props = {
  tag: string;
  note?: string;
};

function styleFor(tag: string) {
  if (tag === "Revenge Trading" || tag === "FOMO" || tag === "Overtrading") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-100";
  }
  if (tag === "Breakout" || tag === "Support" || tag === "Resistance") {
    return "border-cyan-500/35 bg-cyan-500/10 text-cyan-100";
  }
  if (KNOWN.has(tag)) {
    return "border-slate-500/40 bg-slate-500/10 text-slate-100";
  }
  return "border-border bg-card text-slate-200";
}

export function PsychologyBadge({ tag, note }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg border px-3 py-2 text-sm ${styleFor(tag)}`}
    >
      <span className="font-semibold">{tag}</span>
      {note ? (
        <p className="mt-1 text-xs leading-relaxed text-slate-300">{note}</p>
      ) : null}
    </motion.div>
  );
}
