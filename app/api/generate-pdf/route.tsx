import { NextRequest } from 'next/server';
import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { AiAnalysisResult } from '@/lib/tradingAnalysisTypes';

const C = {
  bg: '#0A0A0F',
  card: '#0F1117',
  hover: '#12141E',
  border: '#1E2035',
  text: '#F0F4FF',
  muted: '#8892AA',
  blue: '#2D6FFF',
  green: '#00E5B0',
  red: '#FF3D57',
  cyan: '#00B8D9',
} as const;

const st = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingHorizontal: 40,
    paddingVertical: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.text,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  logoText: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.blue },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 11, color: C.text, marginBottom: 2 },
  headerDate: { fontSize: 9, color: C.muted },
  // Card
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'solid',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
  // Scores
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreBox: { alignItems: 'center', flex: 1, paddingVertical: 4 },
  scoreNum: { fontSize: 28, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  scoreMax: { fontSize: 10, color: C.muted, marginBottom: 3 },
  scoreLabel: { fontSize: 8, color: C.muted, textAlign: 'center' },
  // Stats grid
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  statCell: { width: '25%', paddingRight: 6, paddingBottom: 6 },
  statInner: { backgroundColor: C.hover, borderRadius: 5, padding: 8 },
  statLabel: { fontSize: 7, color: C.muted, marginBottom: 3 },
  statValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  // Bias
  biasItem: { backgroundColor: C.hover, borderRadius: 5, padding: 8, marginBottom: 5 },
  biasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  biasLeft: { flexDirection: 'row', alignItems: 'center' },
  biasName: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginRight: 6 },
  biasFreq: { fontSize: 7, color: C.muted },
  biasBadge: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  biasBadgeText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },
  biasDesc: { fontSize: 8, color: C.muted, marginBottom: 2 },
  biasEvidence: { fontSize: 7, color: C.muted, fontFamily: 'Helvetica-Oblique' },
  domBias: { fontSize: 9, color: C.muted, marginBottom: 8 },
  // Session
  sessionWrap: { flexDirection: 'row', marginBottom: 8 },
  sessBox: { flex: 1, backgroundColor: C.hover, borderRadius: 5, padding: 8, alignItems: 'center', marginRight: 6 },
  sessBoxLast: { flex: 1, backgroundColor: C.hover, borderRadius: 5, padding: 8, alignItems: 'center' },
  sessName: { fontSize: 8, color: C.muted, marginBottom: 5 },
  barTrack: { width: '100%', height: 4, backgroundColor: C.bg, borderRadius: 2, marginBottom: 5 },
  barFill: { height: 4, borderRadius: 2 },
  sessValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  sessionInsight: { fontSize: 8, color: C.muted, fontFamily: 'Helvetica-Oblique' },
  // Patterns
  patternWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  patternCell: { width: '50%', paddingRight: 6, paddingBottom: 6 },
  patternInner: { backgroundColor: C.hover, borderRadius: 5, padding: 8 },
  patternLabel: { fontSize: 7, color: C.muted, marginBottom: 3 },
  patternValue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  // Prop firm
  propBadge: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 8 },
  propBadgeText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  propMeta: { fontSize: 8, color: C.muted, marginBottom: 8 },
  obsRow: { flexDirection: 'row', marginBottom: 3 },
  obsBullet: { fontSize: 8, color: C.red, marginRight: 5, width: 8 },
  obsText: { fontSize: 8, color: C.muted, flex: 1 },
  // Action plan
  actionItem: {
    flexDirection: 'row',
    backgroundColor: C.hover,
    borderRadius: 5,
    padding: 8,
    marginBottom: 5,
  },
  actionNum: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#2D6FFF44', width: 24, marginRight: 8 },
  actionBody: { flex: 1 },
  actionMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  actionBadge: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, marginRight: 6 },
  actionBadgeText: { fontSize: 7 },
  actionTimeframe: { fontSize: 7, color: C.muted },
  actionTitle: { fontSize: 9, color: C.text, marginBottom: 2 },
  actionImpact: { fontSize: 7, color: C.muted },
  // Coach IA
  coachCard: {
    backgroundColor: '#0D1529',
    borderWidth: 1,
    borderColor: '#2D6FFF4D',
    borderStyle: 'solid',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  coachTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  coachQuote: { fontSize: 9, color: C.muted, fontFamily: 'Helvetica-Oblique', lineHeight: 1.6, marginBottom: 8 },
  coachSig: { fontSize: 9, color: C.blue, fontFamily: 'Helvetica-Bold' },
  // Footer
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.muted },
});

function normalizeScore(score: number): number {
  const n = score > 0 && score <= 1 ? score * 100 : score;
  return Math.min(100, Math.max(0, n));
}

function scoreColor(score: number): string {
  const n = normalizeScore(score);
  return n > 60 ? C.green : n >= 40 ? C.cyan : C.red;
}

function displayRate(v: number): string {
  return v <= 1 ? (v * 100).toFixed(1) : v.toFixed(1);
}

function severityColors(severity: string): { bg: string; color: string } {
  if (severity === 'CRITIQUE' || severity === 'ÉLEVÉ') return { bg: '#FF3D5733', color: C.red };
  if (severity === 'MOYEN') return { bg: '#00B8D933', color: C.cyan };
  return { bg: '#00E5B033', color: C.green };
}

function categoryColors(category: string): { bg: string; color: string } {
  if (category === 'Psychologie') return { bg: '#FF3D5733', color: C.red };
  if (category === 'Risque' || category === 'Timing') return { bg: '#00B8D933', color: C.cyan };
  if (category === 'Stratégie') return { bg: '#2D6FFF33', color: C.blue };
  return { bg: '#8892AA33', color: C.muted };
}

function sessionBarColor(rate: number): string {
  if (rate < 40) return C.red;
  if (rate <= 60) return C.cyan;
  return C.green;
}

function TradingReportPDF({ report, date }: { report: AiAnalysisResult; date: string }) {
  const gs = report.globalStats;
  const psych = report.psychologicalProfile;
  const risk = report.riskManagement;
  const prop = report.propFirmReadiness;
  const patterns = report.performancePatterns;
  const session = report.sessionAnalysis;

  const sess = session as Record<string, unknown>;
  const tokyoRate =
    typeof sess.tokyoWinRate === 'number' ? sess.tokyoWinRate
    : typeof sess.asianWinRate === 'number' ? sess.asianWinRate
    : 30;

  const winRateNum = gs.winRate <= 1 ? gs.winRate * 100 : gs.winRate;
  const ddNum = gs.maxDrawdownPercent <= 1 ? gs.maxDrawdownPercent * 100 : gs.maxDrawdownPercent;

  const keyStats = [
    { label: 'Win Rate', value: `${displayRate(gs.winRate)}%`, color: winRateNum >= 50 ? C.green : C.red },
    { label: 'Profit Factor', value: gs.profitFactor.toFixed(2), color: gs.profitFactor >= 1 ? C.green : C.red },
    { label: 'Max Drawdown', value: `${displayRate(gs.maxDrawdownPercent)}%`, color: ddNum > 20 ? C.red : C.muted },
    {
      label: 'PnL Total',
      value: gs.totalPnL < 0 ? `-${Math.abs(gs.totalPnL).toFixed(0)} EUR` : `+${gs.totalPnL.toFixed(0)} EUR`,
      color: gs.totalPnL >= 0 ? C.green : C.red,
    },
    { label: 'Trades Total', value: String(gs.totalTrades), color: C.text },
    { label: 'Sharpe Ratio', value: gs.sharpeRatio.toFixed(2), color: gs.sharpeRatio >= 1 ? C.green : C.red },
    { label: 'Risk/Reward', value: gs.avgRiskReward.toFixed(2), color: gs.avgRiskReward >= 1 ? C.green : C.red },
    { label: 'Duree moyenne', value: gs.avgTradeDuration, color: C.text },
  ];

  const sessions = [
    { name: 'London', rate: session.londonWinRate },
    { name: 'New York', rate: session.newYorkWinRate },
    { name: 'Tokyo', rate: tokyoRate },
  ];

  const patternItems = [
    { label: 'Meilleur jour', value: patterns.bestDayOfWeek, color: C.green },
    { label: 'Pire jour', value: patterns.worstDayOfWeek, color: C.red },
    { label: 'Meilleure heure', value: patterns.bestTimeOfDay, color: C.green },
    { label: 'Pire heure', value: patterns.worstTimeOfDay, color: C.red },
    { label: 'Meilleur symbole', value: `${patterns.bestSymbol.symbol} (${displayRate(patterns.bestSymbol.winRate)}%)`, color: C.green },
    { label: 'Pire symbole', value: `${patterns.worstSymbol.symbol} (${displayRate(patterns.worstSymbol.winRate)}%)`, color: C.red },
  ];

  return (
    <Document>
      <Page size="A4" style={st.page}>
        {/* HEADER */}
        <View style={st.header}>
          <Text style={st.logoText}>AlphaTradeX</Text>
          <View style={st.headerRight}>
            <Text style={st.headerTitle}>{"Rapport d'analyse"}</Text>
            <Text style={st.headerDate}>{date}</Text>
          </View>
        </View>

        {/* 1. PERFORMANCE GLOBALE */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Performance globale</Text>
          <View style={st.scoreRow}>
            {[
              { score: psych.overallScore, label: 'Score psychologique' },
              { score: risk.score, label: 'Gestion du risque' },
              { score: prop.score, label: 'Prop Firm Readiness' },
            ].map((item, i) => {
              const n = normalizeScore(item.score);
              const color = scoreColor(item.score);
              return (
                <View key={i} style={st.scoreBox}>
                  <Text style={[st.scoreNum, { color }]}>{Math.round(n)}</Text>
                  <Text style={st.scoreMax}>/100</Text>
                  <Text style={st.scoreLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2. STATISTIQUES CLES */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Statistiques cles</Text>
          <View style={st.statsWrap}>
            {keyStats.map((stat, i) => (
              <View key={i} style={st.statCell}>
                <View style={st.statInner}>
                  <Text style={st.statLabel}>{stat.label}</Text>
                  <Text style={[st.statValue, { color: stat.color }]}>{stat.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. PROFIL PSYCHOLOGIQUE */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Profil psychologique</Text>
          <Text style={st.domBias}>
            Biais dominant :{' '}
            <Text style={{ color: C.red, fontFamily: 'Helvetica-Bold' }}>{psych.dominantBias}</Text>
          </Text>
          {psych.biases.map((bias, i) => {
            const sc = severityColors(bias.severity);
            return (
              <View key={i} style={st.biasItem} wrap={false}>
                <View style={st.biasRow}>
                  <View style={st.biasLeft}>
                    <Text style={st.biasName}>{bias.name}</Text>
                    <Text style={st.biasFreq}>{bias.frequency}x detecte</Text>
                  </View>
                  <View style={[st.biasBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[st.biasBadgeText, { color: sc.color }]}>{bias.severity}</Text>
                  </View>
                </View>
                <Text style={st.biasDesc}>{bias.description}</Text>
                <Text style={st.biasEvidence}>{'"'}{bias.evidence}{'"'}</Text>
              </View>
            );
          })}
        </View>

        {/* 4. PERFORMANCE PAR SESSION */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Performance par session</Text>
          <View style={st.sessionWrap}>
            {sessions.map((s, i) => {
              const rv = Number(displayRate(s.rate));
              const color = sessionBarColor(rv);
              const isLast = i === sessions.length - 1;
              return (
                <View key={i} style={isLast ? st.sessBoxLast : st.sessBox}>
                  <Text style={st.sessName}>{s.name}</Text>
                  <View style={st.barTrack}>
                    <View
                      style={[st.barFill, { width: `${Math.min(100, rv)}%`, backgroundColor: color }]}
                    />
                  </View>
                  <Text style={[st.sessValue, { color }]}>{displayRate(s.rate)}%</Text>
                </View>
              );
            })}
          </View>
          <Text style={st.sessionInsight}>{session.insight}</Text>
        </View>

        {/* 5. PATTERNS DE PERFORMANCE */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Patterns de performance</Text>
          <View style={st.patternWrap}>
            {patternItems.map((p, i) => (
              <View key={i} style={st.patternCell}>
                <View style={st.patternInner}>
                  <Text style={st.patternLabel}>{p.label}</Text>
                  <Text style={[st.patternValue, { color: p.color }]}>{p.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 6. PROP FIRM READINESS */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Prop Firm Readiness</Text>
          <View style={[st.propBadge, { backgroundColor: prop.wouldPassFTMO ? '#00E5B033' : '#FF3D5733' }]}>
            <Text style={[st.propBadgeText, { color: prop.wouldPassFTMO ? C.green : C.red }]}>
              {prop.wouldPassFTMO
                ? 'Passerait le challenge FTMO'
                : 'Ne passerait pas encore le challenge FTMO'}
            </Text>
          </View>
          <Text style={st.propMeta}>
            Score : {Math.round(normalizeScore(prop.score))}/100  •  Temps estime : {prop.estimatedTimeToReady}
          </Text>
          {prop.mainObstacles.map((obs, i) => (
            <View key={i} style={st.obsRow}>
              <Text style={st.obsBullet}>x</Text>
              <Text style={st.obsText}>{obs}</Text>
            </View>
          ))}
        </View>

        {/* 7. PLAN D'ACTION */}
        <View style={st.card}>
          <Text style={st.cardTitle}>{"Plan d'action personnalise"}</Text>
          {report.actionPlan.map((item, i) => {
            const cc = categoryColors(item.category);
            return (
              <View key={i} style={st.actionItem} wrap={false}>
                <Text style={st.actionNum}>{item.priority}</Text>
                <View style={st.actionBody}>
                  <View style={st.actionMeta}>
                    <View style={[st.actionBadge, { backgroundColor: cc.bg }]}>
                      <Text style={[st.actionBadgeText, { color: cc.color }]}>{item.category}</Text>
                    </View>
                    <Text style={st.actionTimeframe}>{item.timeframe}</Text>
                  </View>
                  <Text style={st.actionTitle}>{item.action}</Text>
                  <Text style={st.actionImpact}>Impact : {item.expectedImpact}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 8. COACH IA */}
        <View style={st.coachCard}>
          <Text style={st.coachTitle}>{"L'avis de votre coach IA"}</Text>
          <Text style={st.coachQuote}>{'"'}{report.personalizedInsight}{'"'}</Text>
          <Text style={st.coachSig}>-- Votre coach IA trading</Text>
        </View>

        {/* FOOTER */}
        <View style={st.footer}>
          <Text style={st.footerText}>Genere par AlphaTradeX  •  alphatradex.ai</Text>
          <Text style={st.footerText}>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function POST(req: NextRequest) {
  try {
    console.log('[generate-pdf] Parsing request body...');
    const body = (await req.json()) as { report: AiAnalysisResult };
    console.log('[generate-pdf] Body parsed, report keys:', Object.keys(body.report ?? {}));
    const date = new Date().toLocaleDateString('fr-FR');
    console.log('[generate-pdf] Building PDF component...');
    const element = <TradingReportPDF report={body.report} date={date} />;
    console.log('[generate-pdf] Calling renderToBuffer...');
    const nodeBuffer = await renderToBuffer(element);
    console.log('[generate-pdf] renderToBuffer done, size:', nodeBuffer.length);
    const buffer = new Uint8Array(nodeBuffer);
    const filename = `alphatradex-rapport-${date.replace(/\//g, '-')}.pdf`;
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[generate-pdf] CRASH:', err);
    if (err instanceof Error) {
      console.error('[generate-pdf] message:', err.message);
      console.error('[generate-pdf] stack:', err.stack);
    }
    return new Response(JSON.stringify({ error: 'PDF generation failed', detail: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
