"use client"

import { useEffect, useState } from "react"
import {
  scoreClass,
  winRateClass,
  profitFactorClass,
  riskRewardClass,
  drawdownClass,
  deltaClass,
  fmtDelta,
  fmtPct,
  fmtRatio,
  fmtScore,
  fmtPnl,
  type Direction,
} from "@/lib/weeklyFormat"

// ── Types (miroir de la réponse /api/weekly-summary) ───────────────────────

type Tone = "good" | "bad" | "neutral" | "none"
type Movement = { label: string; delta: number; direction: Direction; formatted: string }
type Val = { value: number | null; delta: number | null }
type Bias =
  | { has: true; key: string; label: string; frequency: number; severity: string; description: string; lever: string }
  | { has: false; lever: string }

type SummaryOk = {
  status: "ok"
  weekRangeLabel: string
  isoWeek: number
  tradeCount: number
  hasBaseline: boolean
  verdict: { label: string; tone: Tone }
  movements: Movement[]
  regularityFlag: boolean
  scores: { psycho: Val; risk: Val; propFirm: Val }
  values: { pnl: Val; winRate: Val; profitFactor: { value: number | null }; riskReward: { value: number | null }; maxDrawdown: Val }
  bias: Bias
}
type SummaryResp = SummaryOk | { status: "none" }

type Props = { plan: string | null }

const NO_BIAS_TEXT =
  "Aucun biais marqué cette semaine. Ton exécution est restée alignée sur ta stratégie."

// ── Spinner (identique à Évolution) ────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <svg className="h-6 w-6 animate-spin text-secondary" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

function verdictClass(tone: Tone): string {
  if (tone === "good") return "text-cyan"
  if (tone === "bad") return "text-red"
  if (tone === "neutral") return "text-orange"
  return "text-primary"
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "CRITIQUE" || severity === "ÉLEVÉ"
      ? "bg-red/20 text-red"
      : severity === "MOYEN"
        ? "bg-orange/20 text-orange"
        : "bg-cyan/20 text-cyan"
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}>
      {severity}
    </span>
  )
}

function Tile({
  label,
  valueText,
  valueClass,
  deltaText,
  deltaClassName,
}: {
  label: string
  valueText: string
  valueClass: string
  deltaText?: string
  deltaClassName?: string
}) {
  return (
    <div className="rounded-xl bg-hover p-3 text-center md:p-4">
      <p className="text-xs text-secondary md:text-sm">{label}</p>
      <p className={`font-mono text-lg font-bold md:text-2xl ${valueClass}`}>{valueText}</p>
      {deltaText !== undefined && (
        <p className={`font-mono text-xs ${deltaClassName ?? ""}`}>{deltaText}</p>
      )}
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────────

export default function WeeklySummary({ plan: _plan }: Props) {
  const [data, setData] = useState<SummaryResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { createBrowserClient } = await import("@supabase/ssr")
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const res = await fetch(`/api/weekly-summary?token=${token}`, { cache: "no-store" })
        const json = await res.json()
        if (!active) return
        if (res.ok) {
          setData(json)
        } else {
          setErrored(true)
        }
      } catch {
        if (active) setErrored(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  if (loading) {
    return (
      <div className="w-full space-y-6 pb-12">
        <h1 className="text-2xl font-bold text-primary">Résumé semaine</h1>
        <Spinner />
      </div>
    )
  }

  if (errored || !data || data.status !== "ok") {
    return (
      <div className="w-full space-y-6 pb-12">
        <h1 className="text-2xl font-bold text-primary">Résumé semaine</h1>
        <div className="card p-6 text-center text-sm text-secondary">
          Aucune semaine disponible
        </div>
      </div>
    )
  }

  const { verdict, movements, regularityFlag, scores, values, bias, hasBaseline } = data

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-primary">Résumé semaine</h1>
        <p className="text-secondary">{data.weekRangeLabel}</p>
      </div>

      {/* ── Le verdict de la semaine ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Le verdict de la semaine</h2>
        <p className={`text-base font-semibold ${verdictClass(verdict.tone)}`}>{verdict.label}</p>

        {hasBaseline && movements.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {movements.map((m, i) => (
              <span key={m.label} className={`font-mono ${deltaClass(m.delta, m.direction)}`}>
                {i === 0 && <span className="font-sans text-secondary">Cette semaine · </span>}
                {m.label} {m.formatted}
              </span>
            ))}
          </p>
        )}

        {hasBaseline && movements.length === 0 && regularityFlag && (
          <p className="text-sm text-secondary">
            Aucun écart notable. La régularité est une signature.
          </p>
        )}
      </section>

      {/* ── Tes valeurs de la semaine ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Tes valeurs de la semaine</h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile
            label="Psychologie"
            valueText={fmtScore(scores.psycho.value ?? 0)}
            valueClass={scoreClass(scores.psycho.value ?? 0)}
            deltaText={hasBaseline ? fmtDelta(scores.psycho.delta, 0) : undefined}
            deltaClassName={deltaClass(scores.psycho.delta, "up")}
          />
          <Tile
            label="Risque"
            valueText={fmtScore(scores.risk.value ?? 0)}
            valueClass={scoreClass(scores.risk.value ?? 0)}
            deltaText={hasBaseline ? fmtDelta(scores.risk.delta, 0) : undefined}
            deltaClassName={deltaClass(scores.risk.delta, "up")}
          />
          <Tile
            label="Prop Firm"
            valueText={fmtScore(scores.propFirm.value ?? 0)}
            valueClass={scoreClass(scores.propFirm.value ?? 0)}
            deltaText={hasBaseline ? fmtDelta(scores.propFirm.delta, 0) : undefined}
            deltaClassName={deltaClass(scores.propFirm.delta, "up")}
          />
          <Tile
            label="Win Rate"
            valueText={fmtPct(values.winRate.value)}
            valueClass={winRateClass(values.winRate.value)}
            deltaText={hasBaseline ? fmtDelta(values.winRate.delta, 1, "%") : undefined}
            deltaClassName={deltaClass(values.winRate.delta, "up")}
          />
          <Tile
            label="Profit Factor"
            valueText={fmtRatio(values.profitFactor.value)}
            valueClass={profitFactorClass(values.profitFactor.value)}
          />
          <Tile
            label="Risk/Reward"
            valueText={fmtRatio(values.riskReward.value)}
            valueClass={riskRewardClass(values.riskReward.value)}
          />
          <Tile
            label="Max Drawdown"
            valueText={fmtPct(values.maxDrawdown.value)}
            valueClass={drawdownClass(values.maxDrawdown.value)}
            deltaText={hasBaseline ? fmtDelta(values.maxDrawdown.delta, 1, "%") : undefined}
            deltaClassName={deltaClass(values.maxDrawdown.delta, "down")}
          />
          <div className="rounded-xl bg-hover p-3 text-center md:p-4">
            <p className="text-xs text-secondary md:text-sm">PnL</p>
            <p className={`font-mono text-lg font-bold md:text-2xl ${(values.pnl.value ?? 0) < 0 ? "text-red" : "text-cyan"}`}>
              {fmtPnl(values.pnl.value ?? 0)}
            </p>
          </div>
        </div>

        {!hasBaseline && (
          <p className="text-xs text-secondary">
            Première semaine analysée. Pas encore de moyenne pour te situer.
          </p>
        )}
      </section>

      {/* ── Le biais de la semaine ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Le biais de la semaine</h2>
        <div className="rounded-xl bg-hover p-4">
          {bias.has ? (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-bold text-red">{bias.label}</span>
                <SeverityBadge severity={bias.severity} />
                <span className="font-mono text-sm text-secondary">{bias.frequency}%</span>
              </div>
              <p className="text-sm text-primary">{bias.description}</p>
            </>
          ) : (
            <p className="text-sm text-primary">{NO_BIAS_TEXT}</p>
          )}
        </div>
      </section>

      {/* ── Ton levier pour la semaine ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Ton levier pour la semaine</h2>
        <div className="rounded-xl bg-hover p-4">
          <p className="text-sm text-primary">{bias.lever}</p>
        </div>
      </section>

      <p className="text-xs text-secondary">
        Semaine ISO {data.isoWeek} · {data.tradeCount} trades · recalculé à la volée
      </p>
    </div>
  )
}
