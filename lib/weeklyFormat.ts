// ── Formateurs + classes de couleur partagés (page Évolution, page Résumé,
//    email Résumé). Aucune dépendance React : uniquement des strings
//    (classes Tailwind ou texte). Corps repris à l'identique de
//    components/WeeklyEvolution.tsx pour garantir des sorties identiques. ──

export const BIAS_LABELS: Record<string, string> = {
  revenge_trading: "Revenge trading",
  direction_bias: "Biais directionnel",
  session_bias: "Surexposition session",
  overtrading: "Overtrading",
  loss_extension: "Extension des pertes",
  confirmation_bias: "Biais de confirmation",
  position_sizing_bias: "Biais de taille de position",
}

export type Direction = "up" | "down"

// ── Couleurs / formats (seuils EXACTS de l'analyse membre) ──────────────────

export function scoreClass(score: number): string {
  if (score > 60) return "text-cyan"
  if (score >= 40) return "text-orange"
  return "text-red"
}

export function scoreVar(score: number): string {
  if (score > 60) return "var(--cyan)"
  if (score >= 40) return "var(--orange)"
  return "var(--red)"
}

export function winRateClass(v: number | null): string {
  if (v === null) return "text-secondary"
  return v >= 50 ? "text-cyan" : "text-red"
}

export function profitFactorClass(v: number | null): string {
  if (v === null) return "text-secondary"
  return v >= 1 ? "text-cyan" : "text-red"
}

export function riskRewardClass(v: number | null): string {
  if (v === null) return "text-secondary"
  return v >= 1 ? "text-cyan" : "text-red"
}

export function drawdownClass(v: number | null): string {
  if (v === null) return "text-secondary"
  return v > 10 ? "text-red" : "text-cyan"
}

export function deltaClass(delta: number | null, direction: Direction): string {
  if (delta === null || delta === 0) return "text-secondary"
  const good = direction === "up" ? delta > 0 : delta < 0
  return good ? "text-cyan" : "text-red"
}

export function fmtDelta(delta: number | null, decimals = 1, suffix = ""): string {
  if (delta === null) return "—"
  if (delta === 0) return `0${suffix}`
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toFixed(decimals)}${suffix}`
}

export function fmtPct(v: number | null, decimals = 1): string {
  return v === null ? "—" : `${v.toFixed(decimals)}%`
}

export function fmtRatio(v: number | null, decimals = 2): string {
  if (v === null) return "—"
  if (v === 99) return "∞"
  if (v === -99) return "−∞"
  return v.toFixed(decimals)
}

export function fmtScore(v: number): string {
  return `${Math.round(v)}`
}

export function fmtPnl(v: number): string {
  const abs = Math.abs(v).toFixed(0)
  // Format unifié « 123€ » sans espace (même rendu que TradeReportBody,
  // AnalysisHistory et le PDF).
  return v < 0 ? `-${abs}€` : `+${abs}€`
}

export function diff(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null
  // Un écart impliquant un sentinel (∞ / −∞) n'a pas de delta numérique sensé
  if (Math.abs(a) === 99 || Math.abs(b) === 99) return null
  return a - b
}
