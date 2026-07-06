// ── Token signé (HMAC-SHA256 avec UNSUBSCRIBE_SECRET) pour les liens de
//    désinscription email. L'id utilisateur n'apparaît jamais en clair dans
//    l'URL : il est encodé (base64url) puis scellé par une signature non
//    devinable. UNSUBSCRIBE_SECRET est fourni hors code (Vercel + local) ;
//    repli temporaire sur CRON_SECRET tant que la variable n'est pas posée,
//    pour ne pas invalider les liens déjà émis. ──

import crypto from 'crypto'

function hmac(payload: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.CRON_SECRET ?? ''
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

export function makeUnsubToken(userId: string): string {
  const payload = Buffer.from(userId, 'utf8').toString('base64url')
  return `${payload}.${hmac(payload)}`
}

export function verifyUnsubToken(token: string | null | undefined): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, sig] = parts
  const expected = hmac(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const id = Buffer.from(payload, 'base64url').toString('utf8')
    return id || null
  } catch {
    return null
  }
}
