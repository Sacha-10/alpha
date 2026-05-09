import { NextRequest } from 'next/server';
import type { AiAnalysisResult } from '@/lib/tradingAnalysisTypes';

const C = {
  bg:       '#0A0A0F',
  card:     '#0F1117',
  hover:    '#12141E',
  border:   '#1E2035',
  text:     '#F0F4FF',
  muted:    '#8892AA',
  blue:     '#2D6FFF',
  green:    '#00E5B0',
  red:      '#FF3D57',
  cyan:     '#00B8D9',
  darkBlue: '#0D1529',
};

const norm = (s: number) => Math.min(100, Math.max(0, s > 0 && s <= 1 ? s * 100 : s));
const scoreColor = (s: number) => { const n = norm(s); return n > 60 ? C.green : n >= 40 ? C.cyan : C.red; };
const displayRate = (v: number) => (v <= 1 ? v * 100 : v).toFixed(1);

function severityColor(sev: string): string {
  if (sev === 'CRITIQUE' || sev === 'ÉLEVÉ') return C.red;
  if (sev === 'MOYEN') return C.cyan;
  return C.green;
}

function scoreCircle(score: number, label: string): string {
  const capped = norm(score);
  const color = scoreColor(score);
  const dashArray = `${(capped * 2.83).toFixed(1)} 283`;
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="position:relative;width:96px;height:96px;">
        <svg viewBox="0 0 100 100" style="width:96px;height:96px;transform:rotate(-90deg);">
          <circle cx="50" cy="50" r="45" fill="none" stroke="${C.border}" stroke-width="8"/>
          <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="8"
                  stroke-dasharray="${dashArray}" stroke-linecap="round"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
                    font-family:monospace;font-size:14px;font-weight:bold;color:${color};">
          ${Math.round(capped)}/100
        </div>
      </div>
      <span style="font-size:13px;color:${C.muted};text-align:center;">${label}</span>
    </div>`;
}

function card(title: string, content: string, bg = C.card): string {
  return `
    <div style="background:${bg};border:1px solid ${C.border};border-radius:12px;padding:24px;margin-bottom:24px;">
      <h2 style="margin:0 0 20px 0;font-size:18px;font-weight:bold;color:${C.text};">${title}</h2>
      ${content}
    </div>`;
}

function generateHtml(report: AiAnalysisResult, date: string): string {
  const s = report.globalStats;
  const psych = report.psychologicalProfile;
  const risk = report.riskManagement;
  const prop = report.propFirmReadiness;
  const patterns = report.performancePatterns;
  const session = report.sessionAnalysis;

  const winRateNum = s.winRate <= 1 ? s.winRate * 100 : s.winRate;
  const ddNum = s.maxDrawdownPercent <= 1 ? s.maxDrawdownPercent * 100 : s.maxDrawdownPercent;

  // ── Scores ──────────────────────────────────────────────────────────────────
  const scoresHtml = `
    <div style="display:flex;justify-content:space-around;padding:8px 0;">
      ${scoreCircle(psych.overallScore, 'Score psychologique')}
      ${scoreCircle(risk.score, 'Gestion du risque')}
      ${scoreCircle(prop.score, 'Prop Firm Readiness')}
    </div>`;

  // ── Stats ───────────────────────────────────────────────────────────────────
  const keyStats = [
    { label: 'Win Rate',       value: `${displayRate(s.winRate)}%`,      color: winRateNum >= 50 ? C.green : C.red },
    { label: 'Profit Factor',  value: s.profitFactor.toFixed(2),         color: s.profitFactor >= 1 ? C.green : C.red },
    { label: 'Max Drawdown',   value: `${displayRate(s.maxDrawdownPercent)}%`, color: ddNum > 20 ? C.red : C.muted },
    { label: 'PnL Total',      value: s.totalPnL < 0 ? `-${Math.abs(s.totalPnL).toFixed(0)}€` : `+${s.totalPnL.toFixed(0)}€`, color: s.totalPnL >= 0 ? C.green : C.red },
    { label: 'Trades Total',   value: String(s.totalTrades),             color: C.text },
    { label: 'Sharpe Ratio',   value: s.sharpeRatio.toFixed(2),          color: s.sharpeRatio >= 1 ? C.green : C.red },
    { label: 'Risk/Reward',    value: s.avgRiskReward.toFixed(2),        color: s.avgRiskReward >= 1 ? C.green : C.red },
    { label: 'Durée moyenne',  value: String(s.avgTradeDuration ?? '-'), color: C.text },
  ];
  const statsHtml = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
      ${keyStats.map(st => `
        <div style="background:${C.hover};border-radius:12px;padding:16px;">
          <p style="margin:0 0 4px 0;font-size:12px;color:${C.muted};">${st.label}</p>
          <p style="margin:0;font-family:monospace;font-size:18px;font-weight:bold;color:${st.color};">${st.value}</p>
        </div>`).join('')}
    </div>`;

  // ── Psychological profile ────────────────────────────────────────────────────
  const biasesHtml = `
    <p style="margin:0 0 16px 0;color:${C.muted};">
      Biais dominant : <span style="color:${C.red};font-weight:600;">${psych.dominantBias}</span>
    </p>
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${psych.biases.map(bias => {
        const sevCol = severityColor(String(bias.severity));
        return `
          <div style="background:${C.hover};border-radius:12px;padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-weight:bold;color:${C.text};">${bias.name}</span>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:12px;color:${C.muted};">${bias.frequency}× détecté</span>
                <span style="background:${sevCol}33;color:${sevCol};border:1px solid ${sevCol}4D;
                             border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600;">${bias.severity}</span>
              </div>
            </div>
            <p style="margin:0 0 8px 0;font-size:13px;color:${C.muted};">${bias.description}</p>
            <p style="margin:0;font-size:11px;font-style:italic;color:${C.muted};">&ldquo;${bias.evidence}&rdquo;</p>
          </div>`;
      }).join('')}
    </div>`;

  // ── Sessions ─────────────────────────────────────────────────────────────────
  const sessionsData = [
    { name: 'London',   rate: session.londonWinRate },
    { name: 'New York', rate: session.newYorkWinRate },
    { name: 'Tokyo',    rate: session.tokyoWinRate },
  ];
  const sessionsHtml = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px;">
      ${sessionsData.map(sess => {
        const rv = parseFloat(displayRate(sess.rate));
        const col = rv < 40 ? C.red : rv <= 60 ? C.cyan : C.green;
        return `
          <div style="background:${C.hover};border-radius:12px;padding:16px;text-align:center;">
            <p style="margin:0 0 8px 0;font-size:13px;color:${C.muted};">${sess.name}</p>
            <div style="height:8px;background:${C.bg};border-radius:999px;margin-bottom:8px;">
              <div style="height:100%;width:${Math.min(100, rv)}%;background:${col};border-radius:999px;"></div>
            </div>
            <p style="margin:0;font-family:monospace;font-weight:bold;color:${col};">${displayRate(sess.rate)}%</p>
          </div>`;
      }).join('')}
    </div>
    <p style="font-size:13px;font-style:italic;color:${C.muted};">${session.insight}</p>`;

  // ── Patterns ─────────────────────────────────────────────────────────────────
  const patternItems = [
    { label: 'Meilleur jour',    value: patterns.bestDayOfWeek,  color: C.green },
    { label: 'Pire jour',        value: patterns.worstDayOfWeek, color: C.red },
    { label: 'Meilleure heure',  value: patterns.bestTimeOfDay,  color: C.green },
    { label: 'Pire heure',       value: patterns.worstTimeOfDay, color: C.red },
    { label: 'Meilleur symbole', value: `${patterns.bestSymbol.symbol} (${displayRate(patterns.bestSymbol.winRate)}%)`, color: C.green },
    { label: 'Pire symbole',     value: `${patterns.worstSymbol.symbol} (${displayRate(patterns.worstSymbol.winRate)}%)`, color: C.red },
  ];
  const patternsHtml = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
      ${patternItems.map(p => `
        <div style="background:${C.hover};border-radius:12px;padding:16px;">
          <p style="margin:0 0 4px 0;font-size:12px;color:${C.muted};">${p.label}</p>
          <p style="margin:0;font-family:monospace;font-weight:bold;color:${p.color};">${p.value}</p>
        </div>`).join('')}
    </div>`;

  // ── Prop firm ─────────────────────────────────────────────────────────────────
  const passColor = prop.wouldPassFTMO ? C.green : C.red;
  const propHtml = `
    <div style="margin-bottom:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <span style="background:${passColor}33;color:${passColor};border-radius:999px;padding:8px 16px;font-weight:bold;">
        ${prop.wouldPassFTMO ? '✓ Passerait le challenge FTMO' : '✗ Ne passerait pas encore le challenge FTMO'}
      </span>
      <span style="color:${C.muted};">Temps estimé : ${prop.estimatedTimeToReady}</span>
    </div>
    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
      ${prop.mainObstacles.map(obs => `
        <li style="display:flex;gap:8px;font-size:13px;color:${C.muted};">
          <span style="color:${C.red};">✗</span>${obs}
        </li>`).join('')}
    </ul>`;

  // ── Action plan ───────────────────────────────────────────────────────────────
  const catColors: Record<string, string> = {
    Psychologie: C.red,
    Risque:      C.cyan,
    Stratégie:   C.blue,
    Timing:      C.cyan,
  };
  const actionHtml = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${report.actionPlan.map(item => {
        const catColor = catColors[item.category] ?? C.muted;
        return `
          <div style="display:flex;gap:16px;background:${C.hover};border-radius:12px;padding:16px;">
            <span style="font-family:monospace;font-size:32px;font-weight:bold;color:${C.blue};opacity:0.3;line-height:1;">${item.priority}</span>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                <span style="background:${catColor}33;color:${catColor};border-radius:999px;padding:2px 8px;font-size:11px;">${item.category}</span>
                <span style="font-size:11px;color:${C.muted};">${item.timeframe}</span>
              </div>
              <p style="margin:0 0 4px 0;font-weight:500;color:${C.text};">${item.action}</p>
              <p style="margin:0;font-size:13px;color:${C.muted};">Impact : ${item.expectedImpact}</p>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  // ── Coach ─────────────────────────────────────────────────────────────────────
  const coachHtml = `
    <p style="font-size:16px;font-style:italic;line-height:1.6;color:${C.muted};margin:0 0 16px 0;">
      &ldquo;${report.personalizedInsight}&rdquo;
    </p>
    <p style="margin:0;font-weight:500;color:${C.blue};">— Votre coach IA trading</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      background: ${C.bg};
      color: ${C.text};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div style="max-width:900px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;
                margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid ${C.border};">
      <div>
        <h1 style="margin:0;font-size:24px;font-weight:bold;color:${C.blue};">AlphaTradeX</h1>
        <p style="margin:4px 0 0 0;font-size:13px;color:${C.muted};">Rapport d&apos;analyse</p>
      </div>
      <p style="margin:0;font-size:12px;color:${C.muted};">${date}</p>
    </div>

    ${card('Votre performance globale', scoresHtml)}
    ${card('Statistiques clés', statsHtml)}
    ${card('Votre profil psychologique', biasesHtml)}
    ${card('Performance par session', sessionsHtml)}
    ${card('Vos patterns de performance', patternsHtml)}
    ${card('Êtes-vous prêt pour une prop firm ?', propHtml)}
    ${card("Votre plan d&apos;action personnalisé", actionHtml)}
    ${card("L&apos;avis de votre coach IA", coachHtml, C.darkBlue)}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid ${C.border};
                display:flex;justify-content:space-between;">
      <span style="font-size:11px;color:${C.muted};">Généré par AlphaTradeX &bull; alphatradex.ai</span>
      <span style="font-size:11px;color:${C.muted};">${date}</span>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { report } = await req.json() as { report: AiAnalysisResult };
    const date = new Date().toLocaleDateString('fr-FR');
    const html = generateHtml(report, date);

    // Dynamic import to keep bundle size in check and avoid issues in edge runtime
    let browser;
    if (process.env.NODE_ENV === 'production') {
      const chromium = (await import('@sparticuz/chromium')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      const puppeteer = (await import('puppeteer-core')).default;
      const executablePath =
        process.env.CHROME_PATH ||
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();

    const filename = `alphatradex-rapport-${date.replace(/\//g, '-')}.pdf`;
    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[generate-pdf] CRASH:', err);
    return new Response(
      JSON.stringify({ error: 'PDF generation failed', detail: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
