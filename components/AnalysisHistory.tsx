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
  })
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
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Historique</h1>
        </div>
        <div className="pointer-events-none fixed inset-0 top-14 left-0 md:left-[280px] flex items-center justify-center">
          <p className="text-secondary text-sm">Aucune analyse disponible.</p>
        </div>
      </>
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
          const pnl = a.report.globalStats.totalPnL
          const pnlPositive = pnl >= 0

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
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-hover"
              >
                <span className="text-sm text-secondary">{formatDate(a.created_at)}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-semibold ${pnlPositive ? "text-green" : "text-red"}`}>
                    {pnlPositive ? "+" : ""}{pnl.toFixed(0)}€
                  </span>
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
                    <div className="px-3 py-4 sm:px-5 sm:py-5">
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
