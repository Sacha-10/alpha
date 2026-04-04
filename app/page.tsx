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

const MARQUEE =
  "Compatible avec Binance · MT4 · MT5 · TradingView · FTMO · MyForexFunds · The Funded Trader · E8 Funding";

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
        <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-28 md:pt-16">
          <motion.div
            initial={fadeInUp.initial}
            whileInView={fadeInUp.animate}
            viewport={{ once: true }}
            transition={fadeInUp.transition}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue/10 px-4 py-2 text-sm font-medium text-blue"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
          </motion.div>

          <motion.div
            initial={fadeInUp.initial}
            whileInView={fadeInUp.animate}
            viewport={{ once: true }}
            transition={{ ...fadeInUp.transition, delay: 0.15 }}
            className="mx-auto mt-16 max-w-4xl [perspective:1000px]"
          >
            <div
              className="card overflow-hidden p-6 shadow-card md:p-8"
              style={{ transform: "rotateX(5deg)" }}
            >
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-4">
                <p className="text-sm font-semibold text-primary">
                  Aperçu tableau de bord
                </p>
                <span className="rounded-full bg-blue/15 px-3 py-1 text-xs font-medium text-blue">
                  Live
                </span>
              </div>
              <div className="grid gap-3 font-mono text-sm sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Win Rate", value: "52,4 %", tone: "text-green" },
                  { label: "Profit Factor", value: "1,18", tone: "text-cyan" },
                  { label: "Drawdown", value: "6,2 %", tone: "text-red" },
                  { label: "Sharpe Ratio", value: "0,87", tone: "text-primary" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="rounded-lg border border-border bg-background/80 p-4"
                  >
                    <p className="text-xs text-secondary">{row.label}</p>
                    <p className={`mt-2 text-lg font-semibold tabular-nums ${row.tone}`}>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-secondary">
                Revenge Trading, Overtrading, FOMO — détectés automatiquement sur
                votre historique.
              </p>
            </div>
          </motion.div>
        </section>

        {/* SOCIAL PROOF */}
        <motion.div
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={{ once: true }}
          transition={fadeInUp.transition}
          className="border-y border-border py-4 text-secondary"
        >
          <div className="overflow-hidden">
            <div className="animate-landing-marquee flex w-max whitespace-nowrap">
              <span className="px-8 text-sm">{MARQUEE}</span>
              <span className="px-8 text-sm" aria-hidden>
                {MARQUEE}
              </span>
            </div>
          </div>
        </motion.div>

        {/* FONCTIONNALITÉS */}
        <section
          id="fonctionnalites"
          className="mx-auto max-w-6xl scroll-mt-28 px-6 py-20 md:py-28"
        >
          <motion.h2
            initial={fadeInUp.initial}
            whileInView={fadeInUp.animate}
            viewport={{ once: true }}
            transition={fadeInUp.transition}
            className="mx-auto mb-14 max-w-3xl text-center text-3xl font-bold text-primary md:text-4xl"
          >
            Tout ce dont vous avez besoin pour progresser
          </motion.h2>
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
                viewport={{ once: true }}
                transition={{ ...fadeInUp.transition, delay: i * 0.08 }}
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
        </section>

        {/* TARIFS */}
        <section
          id="tarifs"
          className="mx-auto max-w-6xl scroll-mt-28 px-6 pb-24 md:pb-32"
        >
          <motion.div
            initial={fadeInUp.initial}
            whileInView={fadeInUp.animate}
            viewport={{ once: true }}
            transition={fadeInUp.transition}
            className="text-center"
          >
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
          </motion.div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {/* Starter */}
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={{ once: true }}
              transition={{ ...fadeInUp.transition, delay: 0.05 }}
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
              viewport={{ once: true }}
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
              viewport={{ once: true }}
              transition={{ ...fadeInUp.transition, delay: 0.15 }}
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
        </section>

        {/* FOOTER */}
        <footer className="border-t border-border">
          <motion.div
            initial={fadeInUp.initial}
            whileInView={fadeInUp.animate}
            viewport={{ once: true }}
            transition={fadeInUp.transition}
            className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 text-sm text-secondary md:flex-row md:justify-between"
          >
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
          </motion.div>
        </footer>
      </main>
    </div>
  );
}
