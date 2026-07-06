import type { Trade } from './parseMT4'

// Fenêtres alignées sur la référence métier (sessionOf, lib/openai.ts) :
// Asian 00-07 UTC / London 07-14 UTC / New York 14-24 UTC. Avec ces bornes,
// 'Other' est inatteignable (24 h couvertes) — conservé comme repli défensif.
// Source unique pour TOUS les parseurs CSV : toute évolution des fenêtres
// se fait ici (et dans sessionOf, qui vit avec ses propres libellés).
export function getSession(date: Date): Trade['session'] {
  const hour = date.getUTCHours()
  if (hour >= 7 && hour < 14) return 'London'
  if (hour >= 14) return 'New York'
  if (hour >= 0 && hour < 7) return 'Asian'
  return 'Other'
}
