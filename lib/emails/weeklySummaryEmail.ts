// ── Template email « Résumé semaine » (HTML autonome, table-based, styles
//    INLINE en hex). Même DONNÉE que la page : les formateurs textuels sont
//    importés de weeklyFormat (sorties identiques) ; seules les couleurs sont
//    converties en hex (§15). Le traitement « première semaine » (pas de
//    ligne de mouvements, pas de repli) s'applique aussi ici. ──

import { fmtPnl, fmtPct, fmtRatio, fmtScore, fmtDelta } from '@/lib/weeklyFormat'
import { NO_BIAS_TEXT, type WeeklySummaryData } from '@/lib/weeklySummary'

// ── Couleurs (hex, mêmes seuils que les classes Tailwind de la page) ──

function scoreHex(v: number): string {
  if (v > 60) return '#00E5FF'
  if (v >= 40) return '#FFB800'
  return '#FF3D57'
}
function winRateHex(v: number | null): string {
  if (v === null) return '#8892AA'
  return v >= 50 ? '#00E5FF' : '#FF3D57'
}
function profitFactorHex(v: number | null): string {
  if (v === null) return '#8892AA'
  return v >= 1 ? '#00E5FF' : '#FF3D57'
}
function drawdownHex(v: number | null): string {
  if (v === null) return '#8892AA'
  return v > 10 ? '#FF3D57' : '#00E5FF'
}
function deltaHex(delta: number | null, direction: 'up' | 'down'): string {
  if (delta === null || delta === 0) return '#8892AA'
  const good = direction === 'up' ? delta > 0 : delta < 0
  return good ? '#00E5FF' : '#FF3D57'
}
function toneHex(tone: string): string {
  if (tone === 'good') return '#00E5FF'
  if (tone === 'bad') return '#FF3D57'
  if (tone === 'neutral') return '#FFB800'
  return '#F0F4FF'
}
function pnlHex(v: number): string {
  return v < 0 ? '#FF3D57' : '#00E5FF'
}
function severityHex(sev: string): string {
  if (sev === 'CRITIQUE' || sev === 'ÉLEVÉ') return '#FF3D57'
  if (sev === 'MOYEN') return '#FFB800'
  return '#00E5FF'
}

// ── Briques de rendu ──

function valueHtml(text: string, color: string): string {
  return `<div style="color:${color};font-size:24px;font-weight:700;font-family:'SFMono-Regular',Consolas,monospace;margin-top:4px;">${text}</div>`
}

function deltaHtml(text: string, color: string): string {
  return `<div style="color:${color};font-size:12px;font-family:'SFMono-Regular',Consolas,monospace;margin-top:2px;">${text}</div>`
}

// Réserve la hauteur d'une ligne de Δ sur les cartes qui n'en affichent pas,
// pour que les 8 cartes aient exactement la même hauteur (avec ou sans Δ).
const EMPTY_DELTA = `<div style="font-size:12px;margin-top:2px;visibility:hidden;">&nbsp;</div>`

export function getWeeklySummaryEmail(params: {
  summary: WeeklySummaryData
  appUrl: string
  unsubscribeUrl: string
}): { subject: string; preheader: string; html: string } {
  const { summary, appUrl, unsubscribeUrl } = params
  const { verdict, movements, regularityFlag, scores, values, bias, hasBaseline } = summary

  const subject = `Ton résumé · ${summary.weekRangeLabel}`
  const preheader = `${verdict.label} — PnL ${fmtPnl(values.pnl.value ?? 0)}`

  // Verdict + ligne de mouvements
  let verdictBlock = `<div style="color:${toneHex(verdict.tone)};font-size:16px;font-weight:600;">${verdict.label}</div>`
  if (hasBaseline) {
    if (movements.length > 0) {
      const frags = movements
        .map((m, i) => {
          const prefix = i === 0 ? `<span style="color:#8892AA;">Cette semaine · </span>` : ''
          return `<span style="color:${deltaHex(m.delta, m.direction)};font-family:'SFMono-Regular',Consolas,monospace;">${prefix}${m.label} ${m.formatted}</span>`
        })
        .join(' ')
      verdictBlock += `<div style="font-size:14px;margin-top:12px;line-height:1.8;">${frags}</div>`
    } else if (regularityFlag) {
      verdictBlock += `<div style="color:#8892AA;font-size:13px;margin-top:12px;">Aucun écart notable. La régularité est une signature.</div>`
    }
  }

  // Cellule unique réutilisable (50% chacune, deux par rangée), miroir de la page.
  const cell = (label: string, vHtml: string, dHtml: string) =>
    `<td width="50%" style="padding:6px;" valign="top"><div style="background:#1A1A28;border-radius:12px;padding:14px;text-align:center;height:100%;"><div style="color:#8892AA;font-size:14px;">${label}</div>${vHtml}${dHtml}</div></td>`

  const scoreDelta = (d: number | null) =>
    hasBaseline ? deltaHtml(fmtDelta(d, 0), deltaHex(d, 'up')) : EMPTY_DELTA
  const psychoV = scores.psycho.value ?? 0
  const riskV = scores.risk.value ?? 0
  const propFirmV = scores.propFirm.value ?? 0
  const pnlVal = values.pnl.value ?? 0

  // 8 cartes en 4 rangées de 2 (même ordre que la page).
  const cardsRows = `<tr>
    ${cell('Psychologie', valueHtml(fmtScore(psychoV), scoreHex(psychoV)), scoreDelta(scores.psycho.delta))}
    ${cell('Risque', valueHtml(fmtScore(riskV), scoreHex(riskV)), scoreDelta(scores.risk.delta))}
  </tr>
  <tr>
    ${cell('Prop Firm', valueHtml(fmtScore(propFirmV), scoreHex(propFirmV)), scoreDelta(scores.propFirm.delta))}
    ${cell('Win Rate', valueHtml(fmtPct(values.winRate.value), winRateHex(values.winRate.value)), hasBaseline ? deltaHtml(fmtDelta(values.winRate.delta, 1, '%'), deltaHex(values.winRate.delta, 'up')) : EMPTY_DELTA)}
  </tr>
  <tr>
    ${cell('Profit Factor', valueHtml(fmtRatio(values.profitFactor.value), profitFactorHex(values.profitFactor.value)), EMPTY_DELTA)}
    ${cell('Risk/Reward', valueHtml(fmtRatio(values.riskReward.value), profitFactorHex(values.riskReward.value)), EMPTY_DELTA)}
  </tr>
  <tr>
    ${cell('Max Drawdown', valueHtml(fmtPct(values.maxDrawdown.value), drawdownHex(values.maxDrawdown.value)), hasBaseline ? deltaHtml(fmtDelta(values.maxDrawdown.delta, 1, '%'), deltaHex(values.maxDrawdown.delta, 'down')) : EMPTY_DELTA)}
    ${cell('PnL', valueHtml(fmtPnl(pnlVal), pnlHex(pnlVal)), EMPTY_DELTA)}
  </tr>`

  const firstWeekNote = !hasBaseline
    ? `<div style="color:#8892AA;font-size:12px;margin-top:12px;">Première semaine analysée. Pas encore de moyenne pour te situer.</div>`
    : ''

  // Biais
  let biasBlock: string
  if (bias.has) {
    const sevColor = severityHex(bias.severity)
    biasBlock = `<div style="background:#1A1A28;border-radius:12px;padding:16px;">
      <div style="margin-bottom:8px;">
        <span style="color:#FF3D57;font-size:14px;font-weight:700;">${bias.label}</span>
        <span style="display:inline-block;margin-left:8px;color:${sevColor};font-size:11px;font-weight:700;letter-spacing:0.05em;">${bias.severity}</span>
        <span style="color:#8892AA;font-size:13px;margin-left:8px;font-family:'SFMono-Regular',Consolas,monospace;">${bias.frequency}%</span>
      </div>
      <div style="color:#F0F4FF;font-size:14px;line-height:1.6;">${bias.description}</div>
    </div>`
  } else {
    biasBlock = `<div style="background:#1A1A28;border-radius:12px;padding:16px;">
      <div style="color:#F0F4FF;font-size:14px;line-height:1.6;">${NO_BIAS_TEXT}</div>
    </div>`
  }

  const leverBlock = `<div style="background:#1A1A28;border-radius:12px;padding:16px;">
    <div style="color:#F0F4FF;font-size:14px;line-height:1.6;">${bias.lever}</div>
  </div>`

  const sectionTitle = (t: string) =>
    `<div style="color:#F0F4FF;font-size:20px;font-weight:700;margin:32px 0 12px;">${t}</div>`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AlphaTradeX</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0A0A0F;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">

          <!-- LOGO -->
          <tr>
            <td style="padding-top:0;padding-bottom:40px;">
              <img src="https://alphatradex.ai/logo.png" width="44" height="44" alt="AlphaTradeX" style="border-radius:8px;"/>
            </td>
          </tr>

          <!-- LIGNE BLEUE -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#2D6FFF,transparent);"></div>
            </td>
          </tr>

          <tr>
            <td>
              <div style="color:#F0F4FF;font-size:24px;font-weight:700;">Résumé semaine</div>
              <div style="color:#8892AA;font-size:16px;margin-top:4px;">${summary.weekRangeLabel}</div>
            </td>
          </tr>

          <tr><td>${sectionTitle('Le verdict de la semaine')}</td></tr>
          <tr><td>${verdictBlock}</td></tr>

          <tr><td>${sectionTitle('Tes valeurs de la semaine')}</td></tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:-6px;">${cardsRows}</table>
              ${firstWeekNote}
            </td>
          </tr>

          <tr><td>${sectionTitle('Le biais de la semaine')}</td></tr>
          <tr><td>${biasBlock}</td></tr>

          <tr><td>${sectionTitle('Ton levier pour la semaine')}</td></tr>
          <tr><td>${leverBlock}</td></tr>

          <tr>
            <td style="padding-top:32px;">
              <div style="color:#8892AA;font-size:12px;">Semaine ISO ${summary.isoWeek} · ${summary.tradeCount} trades · recalculé à la volée</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:32px;">
              <a href="${appUrl}/dashboard?view=resume-hebdomadaire" style="display:inline-block;background:#2D6FFF;color:#F0F4FF;font-size:14px;font-weight:600;letter-spacing:0.06em;text-decoration:none;padding:14px 36px;border-radius:12px;">Voir mon espace</a>
            </td>
          </tr>

          <!-- LIGNE GRISE -->
          <tr>
            <td style="padding-top:32px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#1E2035,transparent);"></div>
            </td>
          </tr>

          <tr>
            <td style="padding-top:32px;">
              <div style="color:#8892AA;font-size:12px;line-height:1.7;">
                <a href="${unsubscribeUrl}" style="color:#8892AA;text-decoration:underline;">Ne plus recevoir le résumé semaine</a><br/>
                Tu te désinscris juste de ton email - ton accès à AlphaTradeX reste activé.
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:32px;">
              <div style="color:#8892AA;font-size:11px;letter-spacing:0.08em;">© 2026 AlphaTradeX &nbsp;·&nbsp; <a href="https://alphatradex.ai/legal/confidentialite" style="color:#8892AA;text-decoration:none;">Confidentialité</a></div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, preheader, html }
}
