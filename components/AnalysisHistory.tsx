"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import TradeReport from "@/components/TradeReport"
import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes"

interface AnalysisRow {
  id: string
  created_at: string
  plan: string
  report: AiAnalysisResult
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getPlanLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function ScorePill({ score }: { score: number }) {
  const normalized = score > 0 && score <= 1 ? score * 100 : score
  const capped = Math.min(100, Math.max(0, normalized))
  const color =
    capped > 60 ? "text-green border-green/30 bg-green/10"
    : capped >= 40 ? "text-cyan border-cyan/30 bg-cyan/10"
    : "text-red border-red/30 bg-red/10"
  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-xs font-semibold ${color}`}>
      {Math.round(capped)}/100
    </span>
  )
}

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/analyses")
        const data = await res.json()
        if (res.ok) setAnalyses(data.analyses ?? [])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Historique</h1>
        </div>
        <div className="flex items-center justify-center py-24">
          <svg className="h-6 w-6 animate-spin text-secondary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Historique</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-secondary text-sm">Aucune analyse disponible.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Historique</h1>
      </div>
      <div className="space-y-3">
        {analyses.map((a, i) => {
          const isOpen = expandedId === a.id
          const s = a.report.globalStats
          const psych = a.report.psychologicalProfile
          const pnl = s.totalPnL
          const pnlPositive = pnl >= 0
          const winRate = s.winRate <= 1 ? s.winRate * 100 : s.winRate

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : a.id)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-hover"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-secondary">{formatDate(a.created_at)}</span>
                  <span className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-secondary">
                    {getPlanLabel(a.plan)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-4 sm:flex">
                    <div className="text-right">
                      <p className="text-xs text-secondary">Score psycho</p>
                      <ScorePill score={psych.overallScore} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-secondary">Win Rate</p>
                      <span className="font-mono text-sm font-semibold text-primary">
                        {winRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-secondary">PnL</p>
                      <span className={`font-mono text-sm font-semibold ${pnlPositive ? "text-green" : "text-red"}`}>
                        {pnlPositive ? "+" : ""}{pnl.toFixed(0)}€
                      </span>
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-secondary" />
                    : <ChevronDown className="h-4 w-4 shrink-0 text-secondary" />
                  }
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="p-5">
                      <TradeReport report={a.report} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
