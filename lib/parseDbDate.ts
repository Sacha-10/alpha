// Point d'entrée UNIQUE de LECTURE des timestamps trades venus de la DB —
// pendant de parseTradeDate (lib/parseCSV/utils.ts), qui couvre l'ÉCRITURE.
//
// Règle : toute chaîne timestamp venant de la DB EST de l'UTC. Les colonnes
// opened_at/closed_at sont des `timestamp without time zone` : PostgREST les
// renvoie SANS offset ("2026-06-01T10:30:00"). Un new Date() nu interprète
// cette chaîne en heure LOCALE (navigateur du membre, ou hôte du serveur) :
// l'heure relue dérive alors de l'offset local — écriture correcte, lecture
// fausse. Ici on rétablit l'UTC en ajoutant 'Z' quand aucun offset n'est
// porté ; une chaîne déjà datée (Z ou ±hh:mm) passe telle quelle.
//
// Migration du schéma vers timestamptz = backlog (aucun changement de schéma
// ici) : ce helper garde la lecture déterministe local/prod d'ici là.
const HAS_OFFSET = /Z|[+-]\d{2}:?\d{2}$/

export function parseDbDate(raw: string): Date {
  return new Date(HAS_OFFSET.test(raw) ? raw : raw + 'Z')
}
