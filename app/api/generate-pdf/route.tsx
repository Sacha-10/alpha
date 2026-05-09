import { NextRequest } from 'next/server';
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import type { AiAnalysisResult } from '@/lib/tradingAnalysisTypes';

const PW = 595.28;
const PH = 841.89;
const ML = 40;
const CW = PW - ML * 2;

type RGB = ReturnType<typeof rgb>;

const hx = (h: string): RGB =>
  rgb(parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255);

const C = {
  bg:     hx('#0A0A0F'),
  card:   hx('#0F1117'),
  hover:  hx('#12141E'),
  border: hx('#1E2035'),
  text:   hx('#F0F4FF'),
  muted:  hx('#8892AA'),
  blue:   hx('#2D6FFF'),
  green:  hx('#00E5B0'),
  red:    hx('#FF3D57'),
  cyan:   hx('#00B8D9'),
  darkBlue: hx('#0D1529'),
};

const norm = (s: number) => Math.min(100, Math.max(0, s > 0 && s <= 1 ? s * 100 : s));
const sCol = (s: number): RGB => { const n = norm(s); return n > 60 ? C.green : n >= 40 ? C.cyan : C.red; };
const pRate = (v: number) => (v <= 1 ? v * 100 : v).toFixed(1);

function wrap(text: string, maxW: number, sz: number, font: PDFFont): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const t = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(t, sz) > maxW && line) { lines.push(line); line = word; }
    else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// Coordinate helpers: yTop = distance from page top
const textY = (yTop: number, sz: number) => PH - yTop - sz;
const rectY = (yTop: number, h: number) => PH - yTop - h;

function drawT(pg: PDFPage, text: string, x: number, yTop: number, sz: number, font: PDFFont, color = C.text, opacity = 1) {
  pg.drawText(text, { x, y: textY(yTop, sz), size: sz, font, color, opacity });
}

function drawR(pg: PDFPage, x: number, yTop: number, w: number, h: number, color: RGB, border?: RGB, opacity = 1) {
  pg.drawRectangle({ x, y: rectY(yTop, h), width: w, height: h, color, borderColor: border, borderWidth: border ? 1 : undefined, opacity });
}

function drawL(pg: PDFPage, x1: number, y1: number, x2: number, y2: number, color: RGB) {
  pg.drawLine({ start: { x: x1, y: PH - y1 }, end: { x: x2, y: PH - y2 }, color, thickness: 0.5 });
}

interface Ctx { doc: PDFDocument; pg: PDFPage; y: number; R: PDFFont; B: PDFFont; O: PDFFont }

function addPage(ctx: Ctx) {
  ctx.pg = ctx.doc.addPage([PW, PH]);
  ctx.pg.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: C.bg });
  ctx.y = 36;
}

function need(ctx: Ctx, h: number) { if (ctx.y + h > PH - 40) addPage(ctx); }

// ─── Sections ─────────────────────────────────────────────────────────────────

function drawHeader(ctx: Ctx, date: string) {
  const { pg, B, R } = ctx;
  const y = ctx.y;
  drawT(pg, 'AlphaTradeX', ML, y, 18, B, C.blue);
  drawT(pg, "Rapport d'analyse", ML + 330, y, 11, R);
  drawT(pg, date, ML + 330, y + 15, 9, R, C.muted);
  ctx.y += 32;
  drawL(pg, ML, ctx.y, ML + CW, ctx.y, C.border);
  ctx.y += 20;
}

function drawScores(ctx: Ctx, psychScore: number, riskScore: number, propScore: number) {
  const H = 85;
  need(ctx, H + 12);
  const y = ctx.y;
  drawR(ctx.pg, ML, y, CW, H, C.card, C.border);
  drawT(ctx.pg, 'Performance globale', ML + 14, y + 14, 12, ctx.B);

  const items = [
    { s: psychScore, label: 'Score psychologique' },
    { s: riskScore,  label: 'Gestion du risque' },
    { s: propScore,  label: 'Prop Firm Readiness' },
  ];
  const colW = CW / 3;
  for (let i = 0; i < 3; i++) {
    const { s, label } = items[i];
    const n = norm(s);
    const col = sCol(s);
    const cx = ML + i * colW;
    const scoreStr = String(Math.round(n));
    const sw = ctx.B.widthOfTextAtSize(scoreStr, 26);
    drawT(ctx.pg, scoreStr, cx + (colW - sw) / 2, y + 30, 26, ctx.B, col);
    const mxW = ctx.R.widthOfTextAtSize('/100', 9);
    drawT(ctx.pg, '/100', cx + (colW - mxW) / 2, y + 56, 9, ctx.R, C.muted);
    const lw = ctx.R.widthOfTextAtSize(label, 8);
    drawT(ctx.pg, label, cx + (colW - lw) / 2, y + 68, 8, ctx.R, C.muted);
  }
  ctx.y += H + 12;
}

function drawStats(ctx: Ctx, gs: AiAnalysisResult['globalStats']) {
  const winN = gs.winRate <= 1 ? gs.winRate * 100 : gs.winRate;
  const ddN  = gs.maxDrawdownPercent <= 1 ? gs.maxDrawdownPercent * 100 : gs.maxDrawdownPercent;
  const stats = [
    { label: 'Win Rate',      val: `${pRate(gs.winRate)}%`,                                                          col: winN >= 50 ? C.green : C.red },
    { label: 'Profit Factor', val: gs.profitFactor.toFixed(2),                                                       col: gs.profitFactor >= 1 ? C.green : C.red },
    { label: 'Max Drawdown',  val: `${pRate(gs.maxDrawdownPercent)}%`,                                               col: ddN > 20 ? C.red : C.muted },
    { label: 'PnL Total',     val: gs.totalPnL < 0 ? `-${Math.abs(gs.totalPnL).toFixed(0)}€` : `+${gs.totalPnL.toFixed(0)}€`, col: gs.totalPnL >= 0 ? C.green : C.red },
    { label: 'Trades Total',  val: String(gs.totalTrades),                                                           col: C.text },
    { label: 'Sharpe Ratio',  val: gs.sharpeRatio.toFixed(2),                                                        col: gs.sharpeRatio >= 1 ? C.green : C.red },
    { label: 'Risk/Reward',   val: gs.avgRiskReward.toFixed(2),                                                      col: gs.avgRiskReward >= 1 ? C.green : C.red },
    { label: 'Duree moy.',    val: String(gs.avgTradeDuration ?? '-'),                                               col: C.text },
  ];
  const H = 106;
  need(ctx, H + 12);
  const y = ctx.y;
  drawR(ctx.pg, ML, y, CW, H, C.card, C.border);
  drawT(ctx.pg, 'Statistiques cles', ML + 14, y + 14, 12, ctx.B);

  const cellW = CW / 4;
  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const cx = ML + col * cellW + 6;
    const cy = y + 34 + row * 33;
    drawR(ctx.pg, cx, cy, cellW - 12, 28, C.hover);
    drawT(ctx.pg, stats[i].label, cx + 6, cy + 5,  7,  ctx.R, C.muted);
    drawT(ctx.pg, stats[i].val,   cx + 6, cy + 14, 11, ctx.B, stats[i].col);
  }
  ctx.y += H + 12;
}

function drawSession(ctx: Ctx, session: AiAnalysisResult['sessionAnalysis']) {
  const insightLines = wrap(String(session.insight ?? ''), CW - 28, 8, ctx.O);
  const H = 72 + Math.min(insightLines.length, 2) * 10;
  need(ctx, H + 12);
  const y = ctx.y;
  drawR(ctx.pg, ML, y, CW, H, C.card, C.border);
  drawT(ctx.pg, 'Performance par session', ML + 14, y + 14, 12, ctx.B);

  const sessions = [
    { name: 'London',   rate: session.londonWinRate },
    { name: 'New York', rate: session.newYorkWinRate },
    { name: 'Tokyo',    rate: typeof session.tokyoWinRate === 'number' ? session.tokyoWinRate : 30 },
  ];
  const colW = CW / 3;
  for (let i = 0; i < 3; i++) {
    const { name, rate } = sessions[i];
    const rv = parseFloat(pRate(rate));
    const col = rv < 40 ? C.red : rv <= 60 ? C.cyan : C.green;
    const cx = ML + i * colW;
    const nw = ctx.R.widthOfTextAtSize(name, 9);
    drawT(ctx.pg, name, cx + (colW - nw) / 2, y + 34, 9, ctx.R, C.muted);
    const bx = cx + 12; const bw = colW - 24;
    drawR(ctx.pg, bx, y + 48, bw, 4, C.bg);
    drawR(ctx.pg, bx, y + 48, bw * Math.min(100, rv) / 100, 4, col);
    const valStr = `${pRate(rate)}%`;
    const vw = ctx.B.widthOfTextAtSize(valStr, 11);
    drawT(ctx.pg, valStr, cx + (colW - vw) / 2, y + 56, 11, ctx.B, col);
  }
  for (let i = 0; i < Math.min(insightLines.length, 2); i++) {
    drawT(ctx.pg, insightLines[i], ML + 14, y + 72 + i * 10, 8, ctx.O, C.muted);
  }
  ctx.y += H + 12;
}

function drawPatterns(ctx: Ctx, patterns: AiAnalysisResult['performancePatterns']) {
  const items = [
    { label: 'Meilleur jour',    val: String(patterns.bestDayOfWeek ?? ''),  col: C.green },
    { label: 'Pire jour',        val: String(patterns.worstDayOfWeek ?? ''), col: C.red },
    { label: 'Meilleure heure',  val: String(patterns.bestTimeOfDay ?? ''),  col: C.green },
    { label: 'Pire heure',       val: String(patterns.worstTimeOfDay ?? ''), col: C.red },
    { label: 'Meilleur symbole', val: `${patterns.bestSymbol?.symbol ?? ''} (${pRate(patterns.bestSymbol?.winRate ?? 0)}%)`, col: C.green },
    { label: 'Pire symbole',     val: `${patterns.worstSymbol?.symbol ?? ''} (${pRate(patterns.worstSymbol?.winRate ?? 0)}%)`, col: C.red },
  ];
  const H = 96;
  need(ctx, H + 12);
  const y = ctx.y;
  drawR(ctx.pg, ML, y, CW, H, C.card, C.border);
  drawT(ctx.pg, 'Patterns de performance', ML + 14, y + 14, 12, ctx.B);

  const cellW = CW / 3;
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const cx = ML + col * cellW + 6;
    const cy = y + 34 + row * 32;
    drawR(ctx.pg, cx, cy, cellW - 12, 27, C.hover);
    drawT(ctx.pg, items[i].label, cx + 6, cy + 5,  7,  ctx.R, C.muted);
    drawT(ctx.pg, items[i].val,   cx + 6, cy + 14, 10, ctx.B, items[i].col);
  }
  ctx.y += H + 12;
}

function drawPsych(ctx: Ctx, psych: AiAnalysisResult['psychologicalProfile']) {
  const biasH = 62;
  const H = 46 + psych.biases.length * biasH + 8;
  need(ctx, Math.min(H + 12, PH - 80));
  const y = ctx.y;
  drawR(ctx.pg, ML, y, CW, H, C.card, C.border);
  drawT(ctx.pg, 'Profil psychologique', ML + 14, y + 14, 12, ctx.B);
  drawT(ctx.pg, `Biais dominant : ${psych.dominantBias ?? 'N/A'}`, ML + 14, y + 30, 9, ctx.R, C.muted);

  for (let i = 0; i < psych.biases.length; i++) {
    const bias = psych.biases[i];
    const by = y + 46 + i * biasH;
    if (by + biasH > y + H) break;
    const sev = bias.severity;
    const isHigh = sev === 'CRITIQUE' || sev === 'ÉLEVÉ';
    const sevBgCol = isHigh ? C.red : sev === 'MOYEN' ? C.cyan : C.green;
    const sevTxtCol = isHigh ? C.red : sev === 'MOYEN' ? C.cyan : C.green;

    drawR(ctx.pg, ML + 14, by, CW - 28, biasH - 4, C.hover);
    drawT(ctx.pg, String(bias.name ?? ''), ML + 20, by + 6, 9, ctx.B);
    drawT(ctx.pg, `${String(bias.frequency)}x detecte`, ML + 20 + ctx.B.widthOfTextAtSize(String(bias.name ?? ''), 9) + 6, by + 7, 7, ctx.R, C.muted);

    const badgeText = String(sev ?? '');
    const bw = ctx.B.widthOfTextAtSize(badgeText, 7) + 10;
    drawR(ctx.pg, ML + CW - 28 - bw - 14, by + 5, bw, 13, sevBgCol, undefined, 0.2);
    drawT(ctx.pg, badgeText, ML + CW - 28 - bw - 14 + 5, by + 8, 7, ctx.B, sevTxtCol);

    const descLines = wrap(String(bias.description ?? ''), CW - 50, 8, ctx.R);
    drawT(ctx.pg, descLines[0] ?? '', ML + 20, by + 22, 8, ctx.R, C.muted);
    const evLines = wrap(`"${bias.evidence ?? ''}"`, CW - 50, 7, ctx.O);
    drawT(ctx.pg, evLines[0] ?? '', ML + 20, by + 34, 7, ctx.O, C.muted);
  }
  ctx.y += H + 12;
}

function drawProp(ctx: Ctx, prop: AiAnalysisResult['propFirmReadiness']) {
  const H = 72 + prop.mainObstacles.length * 18 + 10;
  need(ctx, H + 12);
  const y = ctx.y;
  drawR(ctx.pg, ML, y, CW, H, C.card, C.border);
  drawT(ctx.pg, 'Prop Firm Readiness', ML + 14, y + 14, 12, ctx.B);

  const passText = prop.wouldPassFTMO ? 'Passerait le challenge FTMO' : 'Ne passerait pas encore le challenge FTMO';
  const passCol  = prop.wouldPassFTMO ? C.green : C.red;
  const bw = ctx.B.widthOfTextAtSize(passText, 9) + 20;
  drawR(ctx.pg, ML + 14, y + 30, bw, 18, passCol, undefined, 0.2);
  drawT(ctx.pg, passText, ML + 24, y + 33, 9, ctx.B, passCol);

  drawT(ctx.pg, `Score : ${Math.round(norm(prop.score))}/100  •  Temps estime : ${prop.estimatedTimeToReady ?? ''}`, ML + 14, y + 54, 8, ctx.R, C.muted);

  for (let i = 0; i < prop.mainObstacles.length; i++) {
    const oy = y + 68 + i * 18;
    drawT(ctx.pg, 'x', ML + 14, oy, 8, ctx.B, C.red);
    drawT(ctx.pg, String(prop.mainObstacles[i] ?? ''), ML + 26, oy, 8, ctx.R, C.muted);
  }
  ctx.y += H + 12;
}

function drawActions(ctx: Ctx, actions: AiAnalysisResult['actionPlan']) {
  const itemH = 56;
  const H = 28 + actions.length * itemH + 8;
  need(ctx, Math.min(H + 12, PH - 80));
  const y = ctx.y;
  drawR(ctx.pg, ML, y, CW, H, C.card, C.border);
  drawT(ctx.pg, "Plan d'action personnalise", ML + 14, y + 14, 12, ctx.B);

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const ay = y + 28 + i * itemH;
    if (ay + itemH > y + H) break;
    drawR(ctx.pg, ML + 14, ay, CW - 28, itemH - 4, C.hover);
    drawT(ctx.pg, String(action.priority), ML + 20, ay + 6, 20, ctx.B, C.blue, 0.27);

    const catCol = action.category === 'Psychologie'
      ? { bg: C.red, txt: C.red }
      : action.category === 'Risque' || action.category === 'Timing'
        ? { bg: C.cyan, txt: C.cyan }
        : action.category === 'Stratégie'
          ? { bg: C.blue, txt: C.blue }
          : { bg: C.muted, txt: C.muted };
    const catW = ctx.B.widthOfTextAtSize(String(action.category ?? ''), 7) + 10;
    drawR(ctx.pg, ML + 42, ay + 7, catW, 13, catCol.bg, undefined, 0.2);
    drawT(ctx.pg, String(action.category ?? ''), ML + 47, ay + 10, 7, ctx.B, catCol.txt);
    drawT(ctx.pg, String(action.timeframe ?? ''), ML + 42 + catW + 6, ay + 9, 7, ctx.R, C.muted);
    drawT(ctx.pg, String(action.action ?? ''), ML + 42, ay + 24, 9, ctx.R);
    drawT(ctx.pg, `Impact : ${action.expectedImpact ?? ''}`, ML + 42, ay + 37, 7, ctx.R, C.muted);
  }
  ctx.y += H + 12;
}

function drawCoach(ctx: Ctx, insight: string) {
  const insightLines = wrap(`"${insight}"`, CW - 28, 9, ctx.O);
  const H = 32 + insightLines.length * 13 + 22;
  need(ctx, H + 12);
  const y = ctx.y;
  drawR(ctx.pg, ML, y, CW, H, C.darkBlue, C.blue, 0.3);
  drawT(ctx.pg, "L'avis de votre coach IA", ML + 14, y + 14, 12, ctx.B);
  for (let i = 0; i < insightLines.length; i++) {
    drawT(ctx.pg, insightLines[i], ML + 14, y + 28 + i * 13, 9, ctx.O, C.muted);
  }
  drawT(ctx.pg, '-- Votre coach IA trading', ML + 14, y + 28 + insightLines.length * 13 + 6, 9, ctx.B, C.blue);
  ctx.y += H + 12;
}

function drawFooter(ctx: Ctx, date: string) {
  need(ctx, 30);
  const y = ctx.y + 10;
  drawL(ctx.pg, ML, y, ML + CW, y, C.border);
  drawT(ctx.pg, 'Genere par AlphaTradeX  •  alphatradex.ai', ML, y + 13, 7, ctx.R, C.muted);
  const dw = ctx.R.widthOfTextAtSize(date, 7);
  drawT(ctx.pg, date, ML + CW - dw, y + 13, 7, ctx.R, C.muted);
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { report: AiAnalysisResult };
    const report = body.report;
    const date = new Date().toLocaleDateString('fr-FR');

    const doc = await PDFDocument.create();
    const R = await doc.embedFont(StandardFonts.Helvetica);
    const B = await doc.embedFont(StandardFonts.HelveticaBold);
    const O = await doc.embedFont(StandardFonts.HelveticaOblique);

    const ctx: Ctx = { doc, pg: null as unknown as PDFPage, y: 36, R, B, O };
    addPage(ctx);

    drawHeader(ctx, date);
    drawScores(ctx, report.psychologicalProfile.overallScore, report.riskManagement.score, report.propFirmReadiness.score);
    drawStats(ctx, report.globalStats);
    drawSession(ctx, report.sessionAnalysis);
    drawPatterns(ctx, report.performancePatterns);
    drawPsych(ctx, report.psychologicalProfile);
    drawProp(ctx, report.propFirmReadiness);
    drawActions(ctx, report.actionPlan);
    drawCoach(ctx, report.personalizedInsight ?? '');
    drawFooter(ctx, date);

    const pdfBytes = await doc.save();
    const filename = `alphatradex-rapport-${date.replace(/\//g, '-')}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
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
