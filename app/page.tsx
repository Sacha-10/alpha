"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Brain,
  BarChart2,
  Target,
  TrendingUp,
  ChevronRight,
  Check,
  Zap,
} from "lucide-react";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const viewOnce = { once: true } as const;

const MARQUEE =
  "Compatible avec Binance · MT4 · MT5 · TradingView · FTMO · MyForexFunds · The Funded Trader · E8 Funding";

/** 31 points = jour 0 → jour 30, courbe equity réaliste (creux / rebonds). */
const MOCK_EQUITY = [
  100, 98.2, 95.1, 92.4, 89.8, 87.2, 84.5, 86.1, 88.7, 91.3, 89.6, 87.9, 85.4,
  88.2, 92.8, 96.4, 94.1, 90.7, 87.3, 84.9, 87.5, 91.2, 95.6, 99.1, 97.4, 101.2,
  104.8, 102.5, 106.3, 109.1, 112.4,
];

const MOCK_CHART = (() => {
  const w = 560;
  const h = 128;
  const padX = 8;
  const padY = 10;
  const min = Math.min(...MOCK_EQUITY);
  const max = Math.max(...MOCK_EQUITY);
  const span = max - min || 1;
  const n = MOCK_EQUITY.length;
  const xs = MOCK_EQUITY.map((_, i) => padX + (i / (n - 1)) * (w - 2 * padX));
  const ys = MOCK_EQUITY.map(
    (v) => padY + (1 - (v - min) / span) * (h - 2 * padY)
  );
  const lineD = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(" ");
  const areaD = `${lineD} L ${xs[n - 1].toFixed(1)} ${h - padY} L ${padX} ${h - padY} Z`;
  const markerKinds: Record<number, "low" | "high"> = {
    6: "low",
    14: "high",
    19: "low",
    30: "high",
  };
  const markers = [6, 14, 19, 30].map((i) => ({
    i,
    x: xs[i],
    y: ys[i],
    kind: markerKinds[i]!,
  }));
  return { w, h, lineD, areaD, markers };
})();

function HeroDashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewOnce}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-16 max-w-4xl [perspective:1000px]"
    >
      <div
        className="overflow-hidden rounded-[var(--radius)] border p-5 shadow-[0_0_60px_rgba(45,111,255,0.14),0_24px_48px_rgba(0,0,0,0.35)] md:p-6"
        style={{
          backgroundColor: "#12121A",
          borderColor: "#1E2035",
          transform: "rotateX(5deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Header chart */}
        <div className="relative mb-5 flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "#1E2035" }}>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "#8892AA" }}>
              Courbe d&apos;equity
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-white">
              30 jours
            </p>
          </div>
          <motion.div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              backgroundColor: "rgba(0, 229, 176, 0.12)",
              color: "#00E5B0",
              border: "1px solid rgba(0, 229, 176, 0.35)",
            }}
            animate={{
              scale: [1, 1.04, 1],
              boxShadow: [
                "0 0 0 0 rgba(0, 229, 176, 0.25)",
                "0 0 0 8px rgba(0, 229, 176, 0)",
                "0 0 0 0 rgba(0, 229, 176, 0)",
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ backgroundColor: "#00E5B0" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: "#00E5B0" }}
              />
            </span>
            IA Active
          </motion.div>
        </div>

        {/* Chart SVG */}
        <div
          className="relative overflow-hidden rounded-lg"
          style={{
            background: "linear-gradient(180deg, rgba(45,111,255,0.06) 0%, transparent 45%)",
            border: "1px solid #1E2035",
          }}
        >
          <svg
            viewBox={`0 0 ${MOCK_CHART.w} ${MOCK_CHART.h}`}
            className="h-auto w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <linearGradient id="heroEqStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2D6FFF" />
                <stop offset="100%" stopColor="#00E5FF" />
              </linearGradient>
              <linearGradient id="heroEqFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2D6FFF" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#00E5FF" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#12121A" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1={8}
                y1={20 + i * 28}
                x2={MOCK_CHART.w - 8}
                y2={20 + i * 28}
                stroke="#1E2035"
                strokeWidth="0.5"
                strokeDasharray="3 5"
              />
            ))}
            <motion.path
              d={MOCK_CHART.areaD}
              fill="url(#heroEqFill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            <motion.path
              d={MOCK_CHART.lineD}
              fill="none"
              stroke="url(#heroEqStroke)"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ pathLength: { duration: 1.85, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.3 } }}
            />
            {MOCK_CHART.markers.map((m, idx) => (
              <motion.circle
                key={m.i}
                cx={m.x}
                cy={m.y}
                r={m.kind === "low" ? 3.5 : 3}
                fill={m.kind === "low" ? "#FF3D57" : "#00E5FF"}
                stroke="#12121A"
                strokeWidth={1.5}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.1 + idx * 0.12, type: "spring", stiffness: 380, damping: 22 }}
              />
            ))}
          </svg>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Win Rate", value: "68%", accent: "#00E5FF" },
            { label: "Profit Factor", value: "1,84", accent: "#2D6FFF" },
            { label: "Max Drawdown", value: "4,2%", accent: "#FF3D57" },
            { label: "PnL", value: "+2 847 €", accent: "#00E5B0" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewOnce}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.45 }}
              className="rounded-lg p-3.5 font-mono"
              style={{
                backgroundColor: "rgba(18, 18, 26, 0.9)",
                border: "1px solid #1E2035",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <p className="text-[10px] font-sans font-medium uppercase tracking-wider" style={{ color: "#8892AA" }}>
                {s.label}
              </p>
              <p
                className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-white"
                style={{ textShadow: `0 0 24px ${s.accent}33` }}
              >
                <span style={{ color: s.accent }}>{s.value}</span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* Biais */}
        <div className="mt-5 border-t pt-4" style={{ borderColor: "#1E2035" }}>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "#8892AA" }}>
            Biais détectés
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Revenge Trading", level: "CRITIQUE", fg: "#FFB4B4", bg: "rgba(255, 61, 87, 0.12)", border: "rgba(255, 61, 87, 0.35)" },
              { name: "FOMO", level: "ÉLEVÉ", fg: "#FFD89A", bg: "rgba(255, 180, 80, 0.1)", border: "rgba(255, 180, 80, 0.35)" },
              { name: "Overtrading", level: "MOYEN", fg: "#C8D4E8", bg: "rgba(45, 111, 255, 0.1)", border: "rgba(45, 111, 255, 0.35)" },
            ].map((b, i) => (
              <motion.span
                key={b.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewOnce}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: b.bg,
                  border: `1px solid ${b.border}`,
                  color: b.fg,
                }}
              >
                <span className="font-semibold text-white/95">{b.name}</span>
                <span className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: b.fg }}>
                  {b.level}
                </span>
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const billing = annual ? "annual" : "monthly";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-primary">
      {/* Fond : grille + radial */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        aria-hidden
      >
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="landing-grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-border"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#landing-grid)" />
        </svg>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45, 111, 255, 0.22), transparent 55%)",
        }}
        aria-hidden
      />

      {/* NAVBAR */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 border-b bg-background/80 backdrop-blur-md transition-colors ${
          scrolled ? "border-border" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp
              className="h-7 w-7 shrink-0"
              style={{ color: "#2D6FFF" }}
              aria-hidden
            />
            <span className="text-lg font-bold text-white">Alpha</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-secondary md:flex">
            <a
              href="#fonctionnalites"
              className="transition-colors hover:text-primary"
            >
              Fonctionnalités
            </a>
            <a
              href="#tarifs"
              className="transition-colors hover:text-primary"
            >
              Tarifs
            </a>
            <Link href="/demo" className="transition-colors hover:text-primary">
              Démo
            </Link>
          </nav>
          <GoogleAuthButton
            label="Commencer gratuitement"
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 !border-transparent shadow-blue hover:!opacity-90"
          />
        </div>
      </header>

      <main className="relative z-10 pt-24">
        {/* HERO */}
        <motion.section
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={viewOnce}
          transition={fadeInUp.transition}
          className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-28 md:pt-16"
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue/10 px-4 py-2 text-sm font-medium text-blue"
              animate={{
                opacity: [0.82, 1, 0.82],
                scale: [1, 1.035, 1],
                boxShadow: [
                  "0 0 0 0 rgba(45, 111, 255, 0)",
                  "0 0 28px 0 rgba(45, 111, 255, 0.28)",
                  "0 0 0 0 rgba(45, 111, 255, 0)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Zap className="h-4 w-4 shrink-0" aria-hidden />
              Journal de Trading propulsé par l&apos;IA
            </motion.div>
            <h1 className="text-5xl font-bold leading-tight text-primary">
              Arrêtez de perdre de l&apos;argent sur les{" "}
              <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">
                mêmes erreurs
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-secondary">
              Notre IA analyse vos trades et identifie exactement pourquoi vous
              sous-performez — avant votre prochaine session.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="btn-primary inline-flex items-center gap-2"
              >
                Analyser mes trades
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/demo" className="btn-outline inline-flex items-center gap-2">
                Voir la démo
                <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
              </Link>
            </div>
          </div>

          <HeroDashboardMockup />
        </motion.section>

        {/* SOCIAL PROOF */}
        <motion.section
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={viewOnce}
          transition={fadeInUp.transition}
          aria-label="Plateformes compatibles"
          className="border-y border-border py-4 text-secondary"
        >
          <div className="overflow-hidden">
            <div className="animate-landing-marquee whitespace-nowrap">
              <span className="inline-block shrink-0 px-10 text-sm">{MARQUEE}</span>
              <span className="inline-block shrink-0 px-10 text-sm" aria-hidden>
                {MARQUEE}
              </span>
            </div>
          </div>
        </motion.section>

        {/* FONCTIONNALITÉS */}
        <motion.section
          id="fonctionnalites"
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={viewOnce}
          transition={fadeInUp.transition}
          className="mx-auto max-w-6xl scroll-mt-28 px-6 py-20 md:py-28"
        >
          <h2 className="mx-auto mb-14 max-w-3xl text-center text-3xl font-bold text-primary md:text-4xl">
            Tout ce dont vous avez besoin pour progresser
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Brain className="h-8 w-8 text-blue" aria-hidden />,
                title: "Profil Psychologique",
                body: "L'IA détecte le Revenge Trading, l'Overtrading et vos biais émotionnels dans votre historique de trades.",
              },
              {
                icon: <BarChart2 className="h-8 w-8 text-cyan" aria-hidden />,
                title: "Statistiques Avancées",
                body: "Win Rate, Sharpe Ratio, Drawdown, meilleures sessions — tout analysé automatiquement en secondes.",
              },
              {
                icon: <Target className="h-8 w-8 text-blue" aria-hidden />,
                title: "Plan d'Action Personnalisé",
                body: "Recevez 3 actions prioritaires pour corriger vos erreurs et améliorer votre performance immédiatement.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={fadeInUp.initial}
                whileInView={fadeInUp.animate}
                viewport={viewOnce}
                transition={{ ...fadeInUp.transition, delay: i * 0.1 }}
                className="card hover:glow-blue p-6"
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* TARIFS */}
        <motion.section
          id="tarifs"
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={viewOnce}
          transition={fadeInUp.transition}
          className="mx-auto max-w-6xl scroll-mt-28 px-6 pb-24 md:pb-32"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary md:text-4xl">
              Des tarifs simples et transparents
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span
                className={`text-sm font-medium ${
                  !annual ? "text-primary" : "text-secondary"
                }`}
              >
                Mensuel
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                onClick={() => setAnnual((v) => !v)}
                className={`relative h-9 w-16 rounded-full border transition-colors ${
                  annual
                    ? "border-blue bg-blue/20"
                    : "border-border bg-card"
                }`}
              >
                <span
                  className={`absolute top-1 h-7 w-7 rounded-full bg-blue transition-transform ${
                    annual ? "left-8" : "left-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  annual ? "text-primary" : "text-secondary"
                }`}
              >
                Annuel
              </span>
              {annual ? (
                <span className="rounded-full bg-green/15 px-3 py-1 text-xs font-semibold text-green">
                  Économisez 20%
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {/* Starter */}
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={viewOnce}
              transition={{ ...fadeInUp.transition, delay: 0 }}
              className="card flex flex-col p-8"
            >
              <h3 className="text-lg font-bold text-primary">Starter</h3>
              <p className="mt-1 text-sm text-secondary">1 analyse par semaine</p>
              <p className="mt-6 font-mono text-4xl font-bold text-primary">
                {annual ? "23" : "29"}€
                <span className="text-lg font-normal text-secondary">
                  /mois
                </span>
              </p>
              {annual ? (
                <p className="mt-1 text-xs text-secondary">facturé à l&apos;année</p>
              ) : null}
              <ul className="mt-8 flex flex-col gap-3 text-sm text-secondary">
                {[
                  "4 analyses par mois",
                  "Rapport IA complet",
                  "Profil psychologique",
                  "Export PDF",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-green"
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href={`/api/create-checkout?plan=starter&billing=${billing}`}
                className="btn-primary mt-8 inline-flex w-full items-center justify-center gap-2 text-center"
              >
                Commencer
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={viewOnce}
              transition={{ ...fadeInUp.transition, delay: 0.1 }}
              className="card relative flex flex-col border-2 border-blue p-8 glow-blue"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue px-3 py-1 text-xs font-semibold text-white">
                Le plus populaire
              </span>
              <h3 className="text-lg font-bold text-primary">Pro</h3>
              <p className="mt-1 text-sm text-secondary">
                1 analyse par jour ouvré
              </p>
              <p className="mt-6 font-mono text-4xl font-bold text-primary">
                {annual ? "63" : "79"}€
                <span className="text-lg font-normal text-secondary">
                  /mois
                </span>
              </p>
              {annual ? (
                <p className="mt-1 text-xs text-secondary">facturé à l&apos;année</p>
              ) : null}
              <ul className="mt-8 flex flex-col gap-3 text-sm text-secondary">
                {[
                  "24 analyses par mois",
                  "Tout Starter inclus",
                  "Historique 6 mois",
                  "Comparaison semaine/semaine",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-green"
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href={`/api/create-checkout?plan=pro&billing=${billing}`}
                className="btn-primary mt-8 inline-flex w-full items-center justify-center gap-2 text-center"
              >
                Commencer
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.div>

            {/* Elite */}
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={viewOnce}
              transition={{ ...fadeInUp.transition, delay: 0.2 }}
              className="card flex flex-col p-8"
            >
              <h3 className="text-lg font-bold text-primary">Elite</h3>
              <p className="mt-1 text-sm text-secondary">
                Pour les traders professionnels
              </p>
              <p className="mt-6 font-mono text-4xl font-bold text-primary">
                {annual ? "159" : "199"}€
                <span className="text-lg font-normal text-secondary">
                  /mois
                </span>
              </p>
              {annual ? (
                <p className="mt-1 text-xs text-secondary">facturé à l&apos;année</p>
              ) : null}
              <ul className="mt-8 flex flex-col gap-3 text-sm text-secondary">
                {[
                  "Analyses illimitées",
                  "Tout Pro inclus",
                  "Score Prop Firm Readiness",
                  "Accès API",
                  "Support prioritaire",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-green"
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href={`/api/create-checkout?plan=elite&billing=${billing}`}
                className="btn-primary mt-8 inline-flex w-full items-center justify-center gap-2 text-center"
              >
                Commencer
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* FOOTER */}
        <motion.footer
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={viewOnce}
          transition={fadeInUp.transition}
          className="border-t border-border"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 text-sm text-secondary md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp
                className="h-6 w-6 shrink-0"
                style={{ color: "#2D6FFF" }}
                aria-hidden
              />
              <span className="font-bold text-white">Alpha</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/legal/privacy" className="hover:text-primary">
                Confidentialité
              </Link>
              <Link href="/legal/terms" className="hover:text-primary">
                CGU
              </Link>
              <a href="mailto:contact@alpha.app" className="hover:text-primary">
                Contact
              </a>
            </nav>
            <p className="text-center md:text-right">
              © 2026 Alpha. Tous droits réservés.
            </p>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
