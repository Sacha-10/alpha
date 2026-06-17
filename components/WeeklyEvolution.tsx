"use client"

import { useEffect, useRef, useState } from "react"

// ── Types (miroir de la réponse /api/weekly-evolution) ──────────────────────

type WeekPoint = {
  weekKey: string
  weekStart: string
  label: string
  tradeCount: number
  pnlTotal: number
  scores: { psycho: number; risk: number; propFirm: number }
  metrics: {
    winRate: number | null
    profitFactor: number | null
    maxDrawdownPct: number | null
    riskReward: number | null
  }
  biases: Record<string, number>
}

type WeeklyEvolutionResponse = {
  weeksActiveCount: number
  trajectory: WeekPoint[]
  current: WeekPoint | null
  gapWeeks: number
}

type Props = {
  plan: string | null
}

// ── Constantes ───────────────────────────────────────────────────────────

const BIAS_LABELS: Record<string, string> = {
  revenge_trading: "Revenge trading",
  direction_bias: "Biais directionnel",
  session_bias: "Surexposition session",
  overtrading: "Overtrading",
  loss_extension: "Extension des pertes",
  confirmation_bias: "Biais de confirmation",
  position_sizing_bias: "Biais de taille de position",
}
const BIAS_KEYS = Object.keys(BIAS_LABELS)

const SERIES = [
  { key: "psycho" as const, color: "#10AD79", label: "Psychologie" },
  { key: "risk" as const, color: "var(--blue)", label: "Risque" },
  { key: "propFirm" as const, color: "#9D7BFF", label: "Prop Firm" },
]

// ── Couleurs / formats (seuils EXACTS de l'analyse membre) ──────────────────

function scoreClass(score: number): string {
  if (score > 60) return "text-cyan"
  if (score >= 40) return "text-orange"
  return "text-red"
}

function scoreVar(score: number): string {
  if (score > 60) return "var(--cyan)"
  if (score >= 40) return "var(--orange)"
  return "var(--red)"
}

function winRateClass(v: number | null): string {
  if (v === null) return "text-secondary"
  return v >= 50 ? "text-cyan" : "text-red"
}

function profitFactorClass(v: number | null): string {
  if (v === null) return "text-secondary"
  return v >= 1 ? "text-cyan" : "text-red"
}

function riskRewardClass(v: number | null): string {
  if (v === null) return "text-secondary"
  return v >= 1 ? "text-cyan" : "text-red"
}

function drawdownClass(v: number | null): string {
  if (v === null) return "text-secondary"
  return v > 10 ? "text-red" : "text-cyan"
}

type Direction = "up" | "down"

function deltaClass(delta: number | null, direction: Direction): string {
  if (delta === null || delta === 0) return "text-secondary"
  const good = direction === "up" ? delta > 0 : delta < 0
  return good ? "text-cyan" : "text-red"
}

function fmtDelta(delta: number | null, decimals = 1, suffix = ""): string {
  if (delta === null) return "—"
  if (delta === 0) return `0${suffix}`
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toFixed(decimals)}${suffix}`
}

function fmtPct(v: number | null, decimals = 1): string {
  return v === null ? "—" : `${v.toFixed(decimals)}%`
}

function fmtRatio(v: number | null, decimals = 2): string {
  if (v === null) return "—"
  if (v === 99) return "∞"
  if (v === -99) return "−∞"
  return v.toFixed(decimals)
}

function fmtScore(v: number): string {
  return `${Math.round(v)}`
}

function fmtPnl(v: number): string {
  const abs = Math.abs(v).toFixed(0)
  return v < 0 ? `-${abs} €` : `+${abs} €`
}

function diff(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null
  // Un écart impliquant un sentinel (∞ / −∞) n'a pas de delta numérique sensé
  if (Math.abs(a) === 99 || Math.abs(b) === 99) return null
  return a - b
}

// ── Spinner ──────────────────────────────────────────────────────────────

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

// ── Composant principal ──────────────────────────────────────────────────

export default function WeeklyEvolution({ plan }: Props) {
  const [data, setData] = useState<WeeklyEvolutionResponse | null>(null)
  const [loading, setLoading] = useState(true)

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
        const res = await fetch(`/api/weekly-evolution?token=${token}`)
        const json = await res.json()
        if (!active) return
        setData(res.ok ? json : null)
      } catch {
        if (active) setData(null)
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
        <h1 className="text-2xl font-bold text-primary">Évolution semaine</h1>
        <Spinner />
      </div>
    )
  }

  const weeksActiveCount = data?.weeksActiveCount ?? 0
  const trajectory = data?.trajectory ?? []
  const current = data?.current ?? null
  const gapWeeks = data?.gapWeeks ?? 0
  const terms = weeksActiveCount + (current ? 1 : 0)

  if (terms === 0) {
    return (
      <div className="w-full space-y-6 pb-12">
        <h1 className="text-2xl font-bold text-primary">Évolution semaine</h1>
        <div className="card p-6 text-center text-sm text-secondary">
          Aucun trade disponible.
        </div>
      </div>
    )
  }

  const actual = current ?? trajectory[trajectory.length - 1]
  const previous = current ? trajectory[trajectory.length - 1] : trajectory[trajectory.length - 2]
  const hasComparison = terms >= 2 && !!actual && !!previous

  return (
    <div className="w-full space-y-6 pb-12">
      <h1 className="text-2xl font-bold text-primary">Évolution semaine</h1>

      <VerdictCard
        weeksActiveCount={weeksActiveCount}
        trajectory={trajectory}
        actual={actual}
        previous={hasComparison ? previous! : null}
        terms={terms}
      />

      {weeksActiveCount >= 2 && (
        <TrajectoryCard trajectory={trajectory} gapWeeks={gapWeeks} />
      )}

      {hasComparison && (
        <FaceAFaceCard
          actual={actual}
          previous={previous!}
          gapWeeks={gapWeeks}
        />
      )}

      {hasComparison && (
        <ProgressPersistCards
          actual={actual}
          previous={previous!}
          trajectoryFirst={trajectory[0]}
          trajectoryLast={trajectory[trajectory.length - 1]}
        />
      )}

      {weeksActiveCount >= 2 && (
        <BiasTrendCard trajectory={trajectory} />
      )}

      {current && <CurrentWeekCard current={current} />}
    </div>
  )
}

// ── Verdict ──────────────────────────────────────────────────────────────

type Candidate = {
  label: string
  delta: number | null
  direction: Direction
  format: (d: number | null) => string
}

function buildCandidates(actual: WeekPoint, previous: WeekPoint): Candidate[] {
  return [
    {
      label: "Psychologie",
      delta: actual.scores.psycho - previous.scores.psycho,
      direction: "up",
      format: (d) => fmtDelta(d, 0),
    },
    {
      label: "Risque",
      delta: actual.scores.risk - previous.scores.risk,
      direction: "up",
      format: (d) => fmtDelta(d, 0),
    },
    {
      label: "Prop Firm",
      delta: actual.scores.propFirm - previous.scores.propFirm,
      direction: "up",
      format: (d) => fmtDelta(d, 0),
    },
    {
      label: "Win Rate",
      delta: diff(actual.metrics.winRate, previous.metrics.winRate),
      direction: "up",
      format: (d) => fmtDelta(d, 1, "%"),
    },
    {
      label: "Profit Factor",
      delta: null,
      direction: "up",
      format: (d) => fmtDelta(d, 2),
    },
    {
      label: "Risk/Reward",
      delta: null,
      direction: "up",
      format: (d) => fmtDelta(d, 2),
    },
    {
      label: "Max Drawdown",
      delta: diff(actual.metrics.maxDrawdownPct, previous.metrics.maxDrawdownPct),
      direction: "down",
      format: (d) => fmtDelta(d, 1, "%"),
    },
  ]
}

function VerdictCard({
  weeksActiveCount,
  trajectory,
  actual,
  previous,
  terms,
}: {
  weeksActiveCount: number
  trajectory: WeekPoint[]
  actual: WeekPoint
  previous: WeekPoint | null
  terms: number
}) {
  let verdictLabel: string | null = null
  let verdictClass = ""
  let netDeltas: { psycho: number; risk: number; propFirm: number } | null = null

  if (weeksActiveCount >= 2 && trajectory.length >= 2) {
    const first = trajectory[0]
    const last = trajectory[trajectory.length - 1]
    netDeltas = {
      psycho: last.scores.psycho - first.scores.psycho,
      risk: last.scores.risk - first.scores.risk,
      propFirm: last.scores.propFirm - first.scores.propFirm,
    }
    const sum = netDeltas.psycho + netDeltas.risk + netDeltas.propFirm
    if (sum > 0) {
      verdictLabel = "Tu progresses"
      verdictClass = "text-cyan"
    } else if (sum < 0) {
      verdictLabel = "Tu régresses"
      verdictClass = "text-red"
    } else {
      verdictLabel = "Tu stagnes"
      verdictClass = "text-orange"
    }
  }

  const candidates = previous ? buildCandidates(actual, previous) : []
  const nonZero = candidates
    .filter((c) => c.delta !== null && c.delta !== 0)
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))
    .slice(0, 4)

  const lastPoint = weeksActiveCount >= 2 ? trajectory[trajectory.length - 1] : null

  return (
    <div className="space-y-4">
      {verdictLabel && (
        <h2 className={`text-xl font-bold ${verdictClass}`}>
          {verdictLabel}
          <span className="text-sm font-normal text-secondary">
            {" "}sur tes {weeksActiveCount} dernières semaines
          </span>
        </h2>
      )}

      {terms >= 2 && (
        nonZero.length > 0 ? (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {nonZero.map((c, i) => (
              <span
                key={c.label}
                className={`font-mono ${deltaClass(c.delta, c.direction)}`}
              >
                {i === 0 && <span className="font-sans text-secondary">Cette semaine · </span>}
                {c.label} {c.format(c.delta)}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-sm text-secondary">
            Aucun écart notable. La régularité est une signature.
          </p>
        )
      )}

      {terms < 2 && (
        <p className="text-sm text-secondary">
          Ton évolution se révèle à partir de ta 2ᵉ semaine.
        </p>
      )}

      {weeksActiveCount >= 2 && lastPoint && netDeltas ? (
        <div className="grid grid-cols-3 gap-3">
          <ScoreTile label="Psychologie" value={lastPoint.scores.psycho} delta={netDeltas.psycho} />
          <ScoreTile label="Risque" value={lastPoint.scores.risk} delta={netDeltas.risk} />
          <ScoreTile label="Prop Firm" value={lastPoint.scores.propFirm} delta={netDeltas.propFirm} />
        </div>
      ) : terms < 2 ? (
        <div className="grid grid-cols-3 gap-3">
          <ScoreTile label="Psychologie" value={actual.scores.psycho} />
          <ScoreTile label="Risque" value={actual.scores.risk} />
          <ScoreTile label="Prop Firm" value={actual.scores.propFirm} />
        </div>
      ) : null}
    </div>
  )
}

function ScoreTile({ label, value, delta }: { label: string; value: number; delta?: number }) {
  return (
    <div className="rounded-xl bg-hover p-3 text-center md:p-4">
      <p className="text-xs text-secondary md:text-sm">{label}</p>
      <p className={`font-mono text-lg font-bold md:text-2xl ${scoreClass(value)}`}>
        {fmtScore(value)}
      </p>
      {delta !== undefined && (
        <p className={`font-mono text-xs ${deltaClass(delta, "up")}`}>
          {fmtDelta(delta, 0)}
        </p>
      )}
    </div>
  )
}

// ── Trajectoire ───────────────────────────────────────────────────────────

function TrajectoryCard({ trajectory, gapWeeks }: { trajectory: WeekPoint[]; gapWeeks: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const n = trajectory.length
  const width = 1000
  const height = 280
  const padLeft = 28
  const padRight = 16
  const padTop = 16
  const padBottom = 36
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const xFor = (i: number) => padLeft + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yFor = (v: number) => padTop + plotH - (v / 100) * plotH

  const updateActive = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = ((clientX - rect.left) / rect.width) * width
    const ratio = n > 1 ? (relX - padLeft) / plotW : 0
    const idx = Math.round(ratio * (n - 1))
    setActiveIndex(Math.max(0, Math.min(n - 1, idx)))
  }

  const gridLines = [0, 25, 50, 75, 100]

  const labelStep = Math.max(1, Math.ceil(n / 4))

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-primary">Trajectoire</h2>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full touch-none focus:outline-none"
        tabIndex={0}
        role="img"
        aria-label="Trajectoire des scores sur les semaines complètes"
        onMouseMove={(e) => updateActive(e.clientX)}
        onMouseLeave={() => setActiveIndex(null)}
        onTouchStart={(e) => updateActive(e.touches[0].clientX)}
        onTouchMove={(e) => updateActive(e.touches[0].clientX)}
      >
        {/* Grille */}
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={yFor(g)}
              y2={yFor(g)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={4} y={yFor(g) + 4} fill="var(--secondary)" fontSize={11} className="font-mono">
              {g}
            </text>
          </g>
        ))}

        {/* Guide vertical */}
        {activeIndex !== null && (
          <line
            x1={xFor(activeIndex)}
            x2={xFor(activeIndex)}
            y1={padTop}
            y2={height - padBottom}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}

        {/* Courbes */}
        {SERIES.map((s) => {
          const points = trajectory.map((p, i) => `${xFor(i)},${yFor(p.scores[s.key])}`).join(" L ")
          return (
            <path key={s.key} d={`M ${points}`} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          )
        })}

        {/* Points */}
        {SERIES.map((s) =>
          trajectory.map((p, i) => (
            <circle
              key={`${s.key}-${i}`}
              cx={xFor(i)}
              cy={yFor(p.scores[s.key])}
              r={activeIndex === i ? 4 : 2.5}
              fill={s.color}
            />
          ))
        )}

        {/* Libellés d'axe — desktop (tous) */}
        <g className="hidden md:block">
          {trajectory.map((p, i) => (
            <text
              key={`label-${i}`}
              x={xFor(i)}
              y={height - 12}
              fill="var(--secondary)"
              fontSize={11}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className="font-mono"
            >
              {p.label}
            </text>
          ))}
        </g>

        {/* Libellés d'axe — mobile (éclaircis, ~4 max) */}
        <g className="md:hidden">
          {trajectory.map((p, i) => {
            if (i % labelStep !== 0 && i !== n - 1) return null
            return (
              <text
                key={`label-m-${i}`}
                x={xFor(i)}
                y={height - 12}
                fill="var(--secondary)"
                fontSize={11}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                className="font-mono"
              >
                {p.label}
              </text>
            )
          })}
        </g>
      </svg>

      {activeIndex !== null && trajectory[activeIndex] && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-hover p-3 text-sm">
          <span className="text-secondary">{trajectory[activeIndex].label}</span>
          {SERIES.map((s) => (
            <span key={s.key} className="font-mono" style={{ color: s.color }}>
              {s.label} {fmtScore(trajectory[activeIndex].scores[s.key])}
            </span>
          ))}
          <span className="text-secondary">{trajectory[activeIndex].tradeCount} tr</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {SERIES.map((s) => {
          const lastValue = trajectory[trajectory.length - 1].scores[s.key]
          return (
            <div key={s.key} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-secondary">{s.label}</span>
              <span className={`font-mono font-bold ${scoreClass(lastValue)}`}>{fmtScore(lastValue)}</span>
            </div>
          )
        })}
      </div>

      {gapWeeks > 0 && (
        <p className="text-xs text-secondary md:hidden">
          {gapWeeks} semaine{gapWeeks > 1 ? "s" : ""} sans activité
        </p>
      )}
    </div>
  )
}

// ── Semaine actuelle vs précédente ──────────────────────────────────────────

function FaceAFaceCard({
  actual,
  previous,
  gapWeeks,
}: {
  actual: WeekPoint
  previous: WeekPoint
  gapWeeks: number
}) {
  type Row = {
    label: string
    prevValue: string
    actualValue: string
    prevClass: string
    actualClass: string
    delta: number | null
    deltaFormat: (d: number | null) => string
    direction: Direction
  }

  const rows: Row[] = [
    {
      label: "Psychologie",
      prevValue: fmtScore(previous.scores.psycho),
      actualValue: fmtScore(actual.scores.psycho),
      prevClass: scoreClass(previous.scores.psycho),
      actualClass: scoreClass(actual.scores.psycho),
      delta: actual.scores.psycho - previous.scores.psycho,
      deltaFormat: (d) => fmtDelta(d, 0),
      direction: "up",
    },
    {
      label: "Risque",
      prevValue: fmtScore(previous.scores.risk),
      actualValue: fmtScore(actual.scores.risk),
      prevClass: scoreClass(previous.scores.risk),
      actualClass: scoreClass(actual.scores.risk),
      delta: actual.scores.risk - previous.scores.risk,
      deltaFormat: (d) => fmtDelta(d, 0),
      direction: "up",
    },
    {
      label: "Prop Firm Readiness",
      prevValue: fmtScore(previous.scores.propFirm),
      actualValue: fmtScore(actual.scores.propFirm),
      prevClass: scoreClass(previous.scores.propFirm),
      actualClass: scoreClass(actual.scores.propFirm),
      delta: actual.scores.propFirm - previous.scores.propFirm,
      deltaFormat: (d) => fmtDelta(d, 0),
      direction: "up",
    },
    {
      label: "Win Rate",
      prevValue: fmtPct(previous.metrics.winRate),
      actualValue: fmtPct(actual.metrics.winRate),
      prevClass: winRateClass(previous.metrics.winRate),
      actualClass: winRateClass(actual.metrics.winRate),
      delta: diff(actual.metrics.winRate, previous.metrics.winRate),
      deltaFormat: (d) => fmtDelta(d, 1, "%"),
      direction: "up",
    },
    {
      label: "Profit Factor",
      prevValue: fmtRatio(previous.metrics.profitFactor),
      actualValue: fmtRatio(actual.metrics.profitFactor),
      prevClass: profitFactorClass(previous.metrics.profitFactor),
      actualClass: profitFactorClass(actual.metrics.profitFactor),
      delta: null,
      deltaFormat: (_d) => "—",
      direction: "up",
    },
    {
      label: "Risk/Reward",
      prevValue: fmtRatio(previous.metrics.riskReward),
      actualValue: fmtRatio(actual.metrics.riskReward),
      prevClass: riskRewardClass(previous.metrics.riskReward),
      actualClass: riskRewardClass(actual.metrics.riskReward),
      delta: null,
      deltaFormat: (_d) => "—",
      direction: "up",
    },
    {
      label: "Max Drawdown",
      prevValue: fmtPct(previous.metrics.maxDrawdownPct),
      actualValue: fmtPct(actual.metrics.maxDrawdownPct),
      prevClass: drawdownClass(previous.metrics.maxDrawdownPct),
      actualClass: drawdownClass(actual.metrics.maxDrawdownPct),
      delta: diff(actual.metrics.maxDrawdownPct, previous.metrics.maxDrawdownPct),
      deltaFormat: (d) => fmtDelta(d, 1, "%"),
      direction: "down",
    },
  ]

  const scoreRows = rows.slice(0, 3)
  const ratioRows = rows.slice(3)
  const COL = "1fr 1fr 1fr 1fr"

  // Scroll horizontal : sur mobile le tableau (min-w) dépasse l'écran.
  // Position initiale = contenu centré → les colonnes dernière + actuelle
  // (les deux du milieu) sont cadrées au centre, label accessible à gauche,
  // Δ à droite. Sur desktop le tableau tient en entier → scrollLeft reste 0.
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-primary">Évolution</h2>

      {/* ── Tableau unique (desktop), scrollable horizontalement sur mobile ── */}
      <div
        ref={scrollRef}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="min-w-[640px]">
        {/* En-têtes : date + libellé identiques des deux côtés, alignés à droite */}
        <div className="mb-3 grid items-end gap-x-4" style={{ gridTemplateColumns: COL }}>
          <span />
          <div className="text-right">
            <p className="text-sm text-secondary">{previous.label} · dernière</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary">{actual.label} · actuelle</p>
          </div>
          <span className="text-right text-sm text-secondary">Δ</span>
        </div>

        {/* Scores — zebra sur index global continu */}
        {scoreRows.map((row, i) => (
          <div
            key={row.label}
            className={`grid items-center gap-x-4 rounded-md px-1 py-2${i % 2 === 0 ? " bg-hover" : ""}`}
            style={{ gridTemplateColumns: COL }}
          >
            <span className="text-sm text-secondary">{row.label}</span>
            <span className={`text-right font-mono font-bold ${row.prevClass}`}>{row.prevValue}</span>
            <span className={`text-right font-mono font-bold ${row.actualClass}`}>{row.actualValue}</span>
            <span className={`text-right font-mono ${deltaClass(row.delta, row.direction)}`}>
              {row.deltaFormat(row.delta)}
            </span>
          </div>
        ))}

        {/* Ratios — zebra continu depuis l'index des scores ; filet de séparation
            posé sur la frontière (1re ligne), sans écart vertical autour */}
        {ratioRows.map((row, i) => (
          <div
            key={row.label}
            className={`grid items-center gap-x-4 rounded-md px-1 py-2${
              (i + scoreRows.length) % 2 === 0 ? " bg-hover" : ""
            }${i === 0 ? " border-t border-border" : ""}`}
            style={{ gridTemplateColumns: COL }}
          >
            <span className="text-sm text-secondary">{row.label}</span>
            <span className={`text-right font-mono font-bold ${row.prevClass}`}>{row.prevValue}</span>
            <span className={`text-right font-mono font-bold ${row.actualClass}`}>{row.actualValue}</span>
            <span className={`text-right font-mono ${deltaClass(row.delta, row.direction)}`}>
              {row.deltaFormat(row.delta)}
            </span>
          </div>
        ))}

        {/* Pied : trades + PnL en contexte sous leurs colonnes respectives */}
        <div className="mt-3 grid gap-x-4 px-1" style={{ gridTemplateColumns: COL }}>
          <span />
          <span className="text-right text-sm text-secondary">
            {previous.tradeCount} trades · {fmtPnl(previous.pnlTotal)}
          </span>
          <span className="text-right text-sm text-secondary">
            {actual.tradeCount} trades · {fmtPnl(actual.pnlTotal)}
          </span>
          <span />
        </div>
        </div>
      </div>

      {gapWeeks > 0 && (
        <p className="mt-4 text-xs text-secondary">
          {gapWeeks} semaine{gapWeeks > 1 ? "s" : ""} sans activité
        </p>
      )}
    </div>
  )
}

// ── Ce qui progresse / Ce qui persiste ──────────────────────────────────────

function ProgressPersistCards({
  actual,
  previous,
  trajectoryFirst,
  trajectoryLast,
}: {
  actual: WeekPoint
  previous: WeekPoint
  trajectoryFirst: WeekPoint
  trajectoryLast: WeekPoint
}) {
  const candidates = buildCandidates(actual, previous)

  const progressing = candidates
    .filter((c) => c.delta !== null && c.delta !== 0)
    .filter((c) => (c.direction === "up" ? c.delta! > 0 : c.delta! < 0))
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))
    .slice(0, 4)

  const persistingBiases = BIAS_KEYS
    .map((key) => ({
      key,
      label: BIAS_LABELS[key],
      frequency: trajectoryLast.biases[key] ?? 0,
      delta: (trajectoryLast.biases[key] ?? 0) - (trajectoryFirst.biases[key] ?? 0),
    }))
    .filter((b) => b.frequency > 0 && b.delta >= 0)
    .sort((a, b) => b.frequency - a.frequency)

  const persistingMetrics = candidates
    .filter((c) => c.delta !== null && c.delta !== 0)
    .filter((c) => (c.direction === "up" ? c.delta! < 0 : c.delta! > 0))
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))

  const persistingItems: { key: string; node: React.ReactNode }[] = [
    ...persistingBiases.map((b) => ({
      key: `bias-${b.key}`,
      node: (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-primary">{b.label}</span>
          <span className="font-mono text-sm text-red">{b.frequency}%</span>
        </div>
      ),
    })),
    ...persistingMetrics.map((c) => ({
      key: `metric-${c.label}`,
      node: (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-primary">{c.label}</span>
          <span className={`font-mono text-sm ${deltaClass(c.delta, c.direction)}`}>
            {c.format(c.delta)}
          </span>
        </div>
      ),
    })),
  ].slice(0, 4)

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-cyan">Ce qui progresse</h2>
        {progressing.length > 0 ? (
          <div className="space-y-2">
            {progressing.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-2">
                <span className="text-sm text-primary">{c.label}</span>
                <span className="font-mono text-sm text-cyan">{c.format(c.delta)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary">Aucun écart notable.</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-red">Ce qui persiste</h2>
        {persistingItems.length > 0 ? (
          <div className="space-y-2">
            {persistingItems.map((item) => (
              <div key={item.key}>{item.node}</div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary">Aucun écart notable.</p>
        )}
      </div>
    </div>
  )
}

// ── Biais récurrents ─────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const width = 120
  const height = 32
  const n = values.length
  const max = Math.max(100, ...values)
  const xFor = (i: number) => (n === 1 ? width / 2 : (i / (n - 1)) * width)
  const yFor = (v: number) => height - (v / max) * height
  const points = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" L ")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-full" aria-hidden="true">
      <path d={`M ${points}`} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function BiasTrendCard({ trajectory }: { trajectory: WeekPoint[] }) {
  const first = trajectory[0]
  const last = trajectory[trajectory.length - 1]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-primary">Biais récurrents</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {BIAS_KEYS.map((key) => {
          const values = trajectory.map((p) => p.biases[key] ?? 0)
          const currentValue = last.biases[key] ?? 0
          const delta = currentValue - (first.biases[key] ?? 0)
          const sparkColor = delta > 0 ? "var(--red)" : "var(--cyan)"
          const sparkValues = currentValue === 0 ? values.map(() => 0) : values
          return (
            <div key={key} className="rounded-xl bg-hover p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm text-primary">{BIAS_LABELS[key]}</span>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-primary">{currentValue}%</span>
                  {currentValue === 0 ? (
                    delta < 0 ? <span className="text-xs text-secondary">résolu</span> : null
                  ) : (
                    <span className={deltaClass(delta, "down")}>{fmtDelta(delta, 0, "%")}</span>
                  )}
                </div>
              </div>
              <Sparkline values={sparkValues} color={sparkColor} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Semaine en cours ─────────────────────────────────────────────────────

function CurrentWeekCard({ current }: { current: WeekPoint }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-primary">Semaine en cours</h2>

      <div className="flex items-center gap-2 text-sm text-blue">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue" />
        <span>En cours · {current.tradeCount} trades</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ScoreTile label="Psychologie" value={current.scores.psycho} />
        <ScoreTile label="Risque" value={current.scores.risk} />
        <ScoreTile label="Prop Firm" value={current.scores.propFirm} />
      </div>

      <p className="text-sm text-secondary">
        Semaine partielle · PnL {fmtPnl(current.pnlTotal)}
      </p>
    </div>
  )
}
