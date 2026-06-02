export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import type { AiAnalysisResult, BiasSeverity } from '@/lib/tradingAnalysisTypes';

// ── helpers ──────────────────────────────────────────────────────────────────

function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

function safeStr(v: unknown, fallback = '—'): string {
  if (v == null || v === 'N/A' || v === '') return fallback;
  return String(v);
}

function displayRate(v: unknown): string {
  const n = safeNum(v);
  return n <= 1 ? (n * 100).toFixed(1) : n.toFixed(1);
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── sub-renderers ─────────────────────────────────────────────────────────────

function scoreCircle(score: number, label: string): string {
  const normalized = score > 0 && score <= 1 ? score * 100 : score;
  const capped = Math.min(100, Math.max(0, normalized));
  const color =
    capped > 60 ? 'var(--cyan)' : capped >= 40 ? 'var(--orange)' : 'var(--red)';
  return `<div style="display:flex;flex-direction:column;align-items:center;">
  <div class="r-score-circle">
    <svg viewBox="0 0 100 100" style="height:100%;width:100%;transform:rotate(-90deg)">
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" stroke-width="8"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="8"
        stroke-dasharray="${capped * 2.83} 283" stroke-linecap="round"/>
    </svg>
    <span class="r-score-text" style="color:${color};">${Math.round(capped)}/100</span>
  </div>
  <span class="r-score-label">${esc(label)}</span>
</div>`;
}

function severityBadge(severity: BiasSeverity | string): string {
  const styles: Record<string, string> = {
    CRITIQUE: 'background:rgba(255,61,87,.2);color:var(--red)',
    'ÉLEVÉ':  'background:rgba(255,61,87,.2);color:var(--red)',
    MOYEN:    'background:rgba(255,184,0,.2);color:var(--orange)',
    FAIBLE:   'background:rgba(0,229,255,.2);color:var(--cyan)',
  };
  const style = styles[severity] ?? styles.FAIBLE;
  return `<span style="border-radius:9999px;padding:4px 8px;font-size:12px;font-weight:500;${style}">${esc(severity)}</span>`;
}

function sessionColors(pct: number): { bar: string; text: string } {
  if (pct < 40)  return { bar: 'var(--red)',    text: 'color:var(--red)'    };
  if (pct <= 60) return { bar: 'var(--orange)', text: 'color:var(--orange)' };
  return           { bar: 'var(--cyan)',   text: 'color:var(--cyan)'   };
}

function iconCheck(): string {
  return `<svg style="display:inline;width:16px;height:16px;vertical-align:text-bottom;margin-right:6px;color:var(--green);"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 18 4 13"/></svg>`;
}

function iconX(): string {
  return `<svg style="display:inline;width:16px;height:16px;vertical-align:text-bottom;margin-right:6px;color:var(--red);"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
}

// ── main body renderer ────────────────────────────────────────────────────────

function buildBody(report: AiAnalysisResult): string {
  const s       = report.globalStats;
  const psych   = report.psychologicalProfile;
  const risk    = report.riskManagement;
  const prop    = report.propFirmReadiness;
  const patterns = report.performancePatterns;
  const session = report.sessionAnalysis;

  const winRateRaw = safeNum(s.winRate);
  const winRateNum = winRateRaw <= 1 ? winRateRaw * 100 : winRateRaw;
  const ddRaw = safeNum(s.maxDrawdownPercent);
  const ddNum = ddRaw <= 1 ? ddRaw * 100 : ddRaw;
  const pnl = safeNum(s.totalPnL);
  const pnlStr = pnl < 0 ? `-${Math.abs(pnl).toFixed(0)}€` : `+${pnl.toFixed(0)}€`;

  const keyStats = [
    { label: 'Win Rate',       value: `${displayRate(s.winRate)}%`,            color: winRateNum >= 50              ? 'var(--cyan)' : 'var(--red)' },
    { label: 'Profit Factor',  value: safeNum(s.profitFactor).toFixed(2),      color: safeNum(s.profitFactor) >= 1  ? 'var(--cyan)' : 'var(--red)' },
    { label: 'Max Drawdown',   value: `${displayRate(s.maxDrawdownPercent)}%`, color: ddNum > 10                    ? 'var(--red)'  : 'var(--cyan)' },
    { label: 'PnL Total',      value: pnlStr,                                  color: pnl < 0                       ? 'var(--red)'  : 'var(--cyan)' },
    { label: 'Trades Total',   value: String(s.totalTrades ?? 0),              color: 'var(--primary)'              },
    { label: 'Sharpe Ratio',   value: safeNum(s.sharpeRatio).toFixed(2),       color: safeNum(s.sharpeRatio) >= 1   ? 'var(--cyan)' : 'var(--red)' },
    { label: 'Risk/Reward',    value: safeNum(s.avgRiskReward).toFixed(2),     color: safeNum(s.avgRiskReward) >= 1 ? 'var(--cyan)' : 'var(--red)' },
    { label: 'Durée moyenne',  value: safeStr(s.avgTradeDuration),             color: 'var(--primary)'              },
  ];

  const catColor: Record<string, string> = {
    Psychologie: 'background:rgba(255,61,87,.2);color:var(--red)',
    Risque:      'background:rgba(255,184,0,.2);color:var(--orange)',
    'Stratégie': 'background:rgba(255,184,0,.2);color:var(--orange)',
    Timing:      'background:rgba(0,229,255,.2);color:var(--cyan)',
  };
  const catDefault = 'background:rgba(136,146,170,.2);color:var(--secondary)';

  const tokyoRate =
    'tokyoWinRate' in session && typeof (session as Record<string, unknown>).tokyoWinRate === 'number'
      ? (session as Record<string, unknown>).tokyoWinRate as number
      : 'asianWinRate' in session && typeof (session as Record<string, unknown>).asianWinRate === 'number'
        ? (session as Record<string, unknown>).asianWinRate as number
        : 30;

  const sessions = [
    { name: 'London',   rate: safeNum(session.londonWinRate)  },
    { name: 'New York', rate: safeNum(session.newYorkWinRate) },
    { name: 'Tokyo',    rate: safeNum(tokyoRate)              },
  ];

  const perfPatterns = [
    { label: 'Meilleur jour',     value: safeStr(patterns.bestDayOfWeek),  color: 'var(--cyan)' },
    { label: 'Pire jour',         value: safeStr(patterns.worstDayOfWeek), color: 'var(--red)'  },
    { label: 'Meilleure heure',   value: safeStr(patterns.bestTimeOfDay).replace(/ UTC$/i, ''),  color: 'var(--cyan)' },
    { label: 'Pire heure',        value: safeStr(patterns.worstTimeOfDay).replace(/ UTC$/i, ''), color: 'var(--red)'  },
    {
      label: 'Meilleur symbole',
      value: patterns.bestSymbol
        ? `${safeStr(patterns.bestSymbol.symbol)} (${displayRate(patterns.bestSymbol.winRate)}%)`
        : '—',
      color: 'var(--cyan)',
    },
    {
      label: 'Pire symbole',
      value: patterns.worstSymbol
        ? `${safeStr(patterns.worstSymbol.symbol)} (${displayRate(patterns.worstSymbol.winRate)}%)`
        : '—',
      color: 'var(--red)',
    },
  ];

  return `
<div style="display:flex;flex-direction:column;gap:24px;">

  <!-- Performance globale -->
  <div>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;">Performance globale</h2>
    <div style="display:flex;justify-content:space-around;">
      ${scoreCircle(safeNum(psych.overallScore), 'Score psychologique')}
      ${scoreCircle(safeNum(risk.score), 'Gestion du risque')}
      ${scoreCircle(safeNum(prop.score), 'Prop Firm Readiness')}
    </div>
  </div>

  <!-- Statistiques clés -->
  <div>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;">Statistiques clés</h2>
    <div class="r-stat-grid">
      ${keyStats.map(st => `
      <div style="border-radius:12px;background:var(--hover);padding:16px;">
        <p style="margin:0 0 4px;font-size:14px;color:var(--secondary);">${esc(st.label)}</p>
        <p style="margin:0;font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:bold;color:${st.color};">${esc(st.value)}</p>
      </div>`).join('')}
    </div>
  </div>

  <!-- Profil psychologique -->
  <div>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;">Profil psychologique</h2>
    ${psych.dominantBias
      ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:var(--red);">${esc(psych.dominantBias)}</p>`
      : ''}
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${(psych.biases ?? []).map(bias => `
      <div style="border-radius:12px;background:var(--hover);padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
          <span style="font-weight:bold;">${esc(bias.name)}</span>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <span style="font-size:14px;color:var(--secondary);">${esc(bias.frequency)}%</span>
            ${severityBadge(bias.severity)}
          </div>
        </div>
        <p style="margin:0 0 8px;font-size:14px;color:var(--secondary);">${esc(bias.description)}</p>
        <p style="margin:0;font-size:12px;color:rgba(136,146,170,.7);">${esc(bias.evidence)}</p>
      </div>`).join('')}
    </div>
  </div>

  <!-- Performance par session -->
  <div>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;">Performance par session</h2>
    <div class="r-session-grid">
      ${sessions.map(sess => {
        const rv = Number(displayRate(sess.rate));
        const sc = sessionColors(rv);
        return `
      <div style="border-radius:12px;background:var(--hover);padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:14px;color:var(--secondary);">${esc(sess.name)}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-weight:bold;${sc.text}">${displayRate(sess.rate)}%</span>
        </div>
        <div style="height:12px;width:100%;border-radius:9999px;background:var(--background);">
          <div style="height:100%;border-radius:9999px;width:${Math.min(100, rv)}%;background:${sc.bar};"></div>
        </div>
      </div>`;
      }).join('')}
    </div>
    <p style="margin:0;font-size:14px;color:var(--secondary);">${esc(safeStr(session.insight, ''))}</p>
  </div>

  <!-- Patterns de performance -->
  <div>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;">Patterns de performance</h2>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
      ${perfPatterns.map(p => `
      <div style="border-radius:12px;background:var(--hover);padding:16px;">
        <p style="margin:0 0 4px;font-size:14px;color:var(--secondary);">${esc(p.label)}</p>
        <p class="r-pattern-val" style="color:${p.color};">${esc(p.value)}</p>
      </div>`).join('')}
    </div>
  </div>

  <!-- Prop Firm Readiness -->
  <div>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;">Prop Firm Readiness</h2>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:var(--secondary);">${esc(safeStr(prop.estimatedTimeToReady))}</p>
    <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:12px;">
      ${(prop.mainObstacles ?? []).map(obs => `
      <li style="font-size:14px;line-height:1.6;">
        ${prop.wouldPassFTMO ? iconCheck() : iconX()}
        <span style="color:${prop.wouldPassFTMO ? 'var(--primary)' : 'var(--secondary)'};">${esc(obs)}</span>
      </li>`).join('')}
    </ul>
  </div>

  <!-- Plan d'action -->
  <div>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;">Plan d&apos;action</h2>
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${(report.actionPlan ?? []).map(item => `
      <div style="border-radius:12px;background:var(--hover);padding:16px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:var(--secondary);flex-shrink:0;">${esc(item.priority)}</span>
          <span style="border-radius:9999px;padding:2px 8px;font-size:12px;font-weight:500;flex-shrink:0;${catColor[item.category] ?? catDefault}">${esc(item.category)}</span>
          <span style="font-size:12px;color:var(--secondary);">${esc(item.timeframe)}</span>
        </div>
        <p style="margin:0 0 4px;font-weight:500;">${esc(item.action)}</p>
        <p style="margin:0;font-size:14px;color:var(--secondary);">${esc(item.expectedImpact)}</p>
      </div>`).join('')}
    </div>
  </div>

  <!-- Analyste IA -->
  <div>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;">Analyste IA</h2>
    <p style="margin:0;font-size:14px;line-height:1.6;color:var(--secondary);">${esc(safeStr(report.personalizedInsight))}</p>
  </div>

</div>`;
}

// ── document builder ──────────────────────────────────────────────────────────

function buildHtml(report: AiAnalysisResult, date: string, isMobile: boolean): string {
  const body = buildBody(report);
  const bgColor = isMobile ? '#12121A' : '#0A0A0F';

  const head = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  >
  <style>
    :root {
      --background: #0A0A0F;
      --card:       #12121A;
      --hover:      #1A1A28;
      --blue:       #2D6FFF;
      --cyan:       #00E5FF;
      --orange:     #FFB800;
      --red:        #FF3D57;
      --green:      #00E5B0;
      --primary:    #F0F4FF;
      --secondary:  #8892AA;
      --border:     #1E2035;
    }
    @page { margin: 0; }
    *, *::before, *::after { box-sizing: border-box; }
    *::-webkit-scrollbar { display: none; width: 0; height: 0; }
    * { scrollbar-width: none; }
    html {
      background-color: ${bgColor};
      overflow: hidden;
    }
    body {
      margin: 0;
      padding: ${isMobile ? '16px 12px' : '24px'};
      background-color: ${bgColor};
      color: #F0F4FF;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      overflow: hidden;
    }
    /* ── responsive classes ───────────────────────────── */
    .r-score-circle {
      position: relative;
      height: 80px;
      width: 80px;
    }
    .r-score-text {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px; font-weight: bold; line-height: 1.1;
    }
    .r-score-label {
      margin-top: 8px; font-size: 12px; color: var(--secondary);
      text-align: center; width: 96px;
    }
    .r-stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .r-session-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .r-pattern-val {
      margin: 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px; font-weight: bold;
      word-break: break-word;
    }
    @media (min-width: 640px) {
      .r-score-circle { height: 96px; width: 96px; }
      .r-score-text { font-size: 18px; }
      .r-score-label { width: auto; white-space: nowrap; }
      .r-session-grid { grid-template-columns: repeat(3, 1fr); }
      .r-pattern-val { font-size: 16px; }
    }
    @media (min-width: 768px) {
      .r-stat-grid { grid-template-columns: repeat(4, 1fr); }
    }
  </style>
</head>`;

  return `${head}
<body>
  <div style="width:100%;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;
                padding-bottom:16px;border-bottom:1px solid #1E2035;margin-bottom:32px;">
      <div>
        <h1 style="margin:0;font-size:24px;font-weight:bold;color:#2D6FFF;">AlphaTradeX</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#8892AA;">Rapport d'analyse</p>
      </div>
      <p style="margin:0;font-size:12px;color:#8892AA;">${date}</p>
    </div>

    ${body}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1E2035;
                display:flex;justify-content:space-between;">
      <span style="font-size:11px;color:#8892AA;">Généré par AlphaTradeX &bull; alphatradex.ai</span>
      <span style="font-size:11px;color:#8892AA;">${date}</span>
    </div>
  </div>
</body>
</html>`;
}

// ── route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { report, screenWidth: rawWidth } = await req.json() as { report: AiAnalysisResult; screenWidth?: number };
    const screenWidth = Math.round(Math.max(320, Math.min(3840, rawWidth ?? 1200)));
    const isMobile = screenWidth < 640;
    const viewportWidth = isMobile ? screenWidth : 1200;
    const date = new Date().toLocaleDateString('fr-FR');
    const html = buildHtml(report, date, isMobile);

    let browser;
    if (process.env.NODE_ENV === 'production') {
      const chromium = (await import('@sparticuz/chromium')).default;
      const puppeteer = (await import('puppeteer-core')).default;
      let execPath: string | undefined = process.env.CHROMIUM_PATH;
      if (!execPath) {
        try {
          execPath = await chromium.executablePath();
        } catch {
          // path.dirname(__filename) is undefined on some Vercel runtimes
        }
      }
      if (!execPath) {
        throw new Error(
          'Chromium executable path is undefined. ' +
          'Set the CHROMIUM_PATH environment variable on Vercel.',
        );
      }
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: viewportWidth, height: 720 },
        executablePath: execPath,
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
    await page.emulateMediaType('screen');
    await page.setViewport({ width: viewportWidth, height: 720 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);

    // overflow:hidden on html/body means no scrollbar can ever appear and affect layout.
    // scrollHeight reports full content height regardless of overflow setting.
    const contentHeight = await page.evaluate(() => {
      void document.body.offsetHeight;
      return document.documentElement.scrollHeight;
    });

    const pdfBuffer = await page.pdf({
      width: `${viewportWidth}px`,
      height: `${contentHeight}px`,
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
      JSON.stringify({
        error: 'PDF generation failed',
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
