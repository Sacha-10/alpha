"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Brain,
  BrainCircuit,
  CheckCircle2,
  FileDown,
  HelpCircle,
  Info,
  Menu,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Upload,
  UserCircle,
  X,
} from "lucide-react";

type RevealProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

function RevealSection({ id, className = "", children }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {children}
    </section>
  );
}

function ServiceCard({
  icon,
  title,
  body,
  delayMs,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  delayMs: number;
}) {
  return (
    <article
      className="card rounded p-7 transition-all duration-200 hover:border-blue hover:glow-blue"
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className="mb-5">{icon}</div>
      <h3 className="text-xl font-semibold text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-secondary">{body}</p>
    </article>
  );
}

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const connectGoogle = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);
      setShowTop(y > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!mobileMenuRef.current) return;
      if (!mobileMenuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [mobileOpen]);

  const closeMobileMenu = () => setMobileOpen(false);

  const scrollTopSmooth = () =>
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  const handleBrandClick = () => {
    if (pathname === "/") {
      scrollTopSmooth();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-primary">
      <div className="pointer-events-none absolute inset-0 z-0 min-h-full opacity-40" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.6"
                className="text-border"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 min-h-full" aria-hidden>
        <div className="fixed left-1/2 top-[35%] h-80 w-80 -translate-x-1/2 rounded-full bg-blue/20 blur-3xl" />
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${
          scrolled ? "border-border bg-background" : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={handleBrandClick}
            className="flex items-center gap-2 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            aria-label="TonSaaS — retour en haut"
          >
            <TrendingUp className="h-7 w-7 shrink-0 text-blue" aria-hidden />
            <span className="text-lg font-bold text-primary">TonSaaS</span>
          </button>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
              className="text-secondary transition-colors duration-200 hover:text-primary"
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => router.push("/demo")}
              className="text-secondary transition-colors duration-200 hover:text-primary"
            >
              Analyse Gratuite
            </button>
            <button
              type="button"
              onClick={() => router.push("/pricing")}
              className="text-secondary transition-colors duration-200 hover:text-primary"
            >
              Prix
            </button>
            <button type="button" className="text-secondary transition-colors duration-200 hover:text-primary">
              À propos
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-secondary transition-colors duration-200 hover:text-primary"
            >
              <HelpCircle className="h-4 w-4" aria-hidden />
              Aide
            </button>
          </nav>

          <button
            type="button"
            onClick={() => void connectGoogle()}
            className="hidden items-center gap-2 rounded bg-blue px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-blue/90 md:inline-flex"
          >
            <UserCircle className="h-4 w-4" aria-hidden />
            S&apos;inscrire
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded border border-border bg-card p-2 text-secondary md:hidden"
            aria-label={mobileOpen ? "Fermer menu" : "Ouvrir menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        <div
          ref={mobileMenuRef}
          className={`mx-4 overflow-hidden rounded border border-border bg-card transition-all duration-200 ease-out md:hidden ${
            mobileOpen ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-2 p-4">
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              }}
              className="text-left text-secondary transition-colors duration-200 hover:text-primary"
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                router.push("/demo");
              }}
              className="text-left text-secondary transition-colors duration-200 hover:text-primary"
            >
              Analyse Gratuite
            </button>
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                router.push("/pricing");
              }}
              className="text-left text-secondary transition-colors duration-200 hover:text-primary"
            >
              Prix
            </button>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="text-left text-secondary transition-colors duration-200 hover:text-primary"
            >
              À propos
            </button>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="text-left text-secondary transition-colors duration-200 hover:text-primary"
            >
              Aide
            </button>
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                void connectGoogle();
              }}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded bg-blue px-4 py-2 font-semibold text-primary transition-all duration-200 hover:bg-blue/90"
            >
              <UserCircle className="h-4 w-4" aria-hidden />
              S&apos;inscrire
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-28">
        <RevealSection className="mx-auto max-w-6xl px-6 pb-20 pt-10 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-secondary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue" />
            Journal de trading propulsé par l&apos;IA
          </div>

          <h1 className="mx-auto mt-8 max-w-4xl text-balance text-4xl font-bold leading-tight text-primary md:text-6xl">
            Arrêtez de perdre de l&apos;argent sur des{" "}
            <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">erreurs</span>
            <br />
            que vous répétez encore.
          </h1>

          <p className="mx-auto mt-6 max-w-[600px] text-lg text-secondary">
            Notre IA analyse vos trades et identifie exactement pourquoi vous sous-performez avant votre prochaine
            session.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => void connectGoogle()}
              className="inline-flex items-center gap-2 rounded bg-blue px-6 py-3 font-semibold text-primary transition-all duration-200 hover:bg-blue/90"
            >
              <UserCircle className="h-5 w-5" aria-hidden />
              S&apos;inscrire
            </button>
            <button
              type="button"
              onClick={() => router.push("/demo")}
              className="inline-flex items-center gap-2 rounded border border-border bg-transparent px-6 py-3 font-semibold text-primary transition-all duration-200 hover:border-blue"
            >
              Analyse Gratuite
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mx-auto mt-14 max-w-5xl [perspective:1000px]">
            <div className="card glow-blue rounded p-6 [transform:rotateX(5deg)]">
              <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                <p className="text-sm text-secondary">Tableau de bord trading premium</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-green/40 bg-green/10 px-2 py-1 text-xs text-green">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  IA Active
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded border border-border bg-background/50 p-4">
                  <p className="text-xs text-secondary">Rendement</p>
                  <p className="mt-2 font-mono text-2xl text-primary">+2 847€</p>
                </div>
                <div className="rounded border border-border bg-background/50 p-4">
                  <p className="text-xs text-secondary">Win Rate</p>
                  <p className="mt-2 font-mono text-2xl text-cyan">68%</p>
                </div>
                <div className="rounded border border-border bg-background/50 p-4">
                  <p className="text-xs text-secondary">Drawdown</p>
                  <p className="mt-2 font-mono text-2xl text-green">4.2%</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-xs text-secondary md:grid-cols-3">
                <span className="inline-flex items-center gap-1 rounded border border-border bg-background/40 px-3 py-2">
                  <Upload className="h-4 w-4 text-blue" aria-hidden />
                  Importer
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-border bg-background/40 px-3 py-2">
                  <BrainCircuit className="h-4 w-4 text-cyan" aria-hidden />
                  Analyse IA
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-border bg-background/40 px-3 py-2">
                  <FileDown className="h-4 w-4 text-green" aria-hidden />
                  Rapport
                </span>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="border-y border-border bg-card/60 py-4">
          <div className="overflow-hidden text-secondary">
            <div className="animate-landing-marquee whitespace-nowrap">
              {[
                "Plébiscité par des traders sur",
                "Binance",
                "MT4",
                "MT5",
                "TradingView",
                "FTMO",
                "MyForexFunds",
                "Plébiscité par des traders sur",
                "Binance",
                "MT4",
                "MT5",
                "TradingView",
                "FTMO",
                "MyForexFunds",
              ].map((item, index) => (
                <span key={`${item}-${index}`} className="inline-flex items-center px-6 text-sm">
                  {index % 2 === 1 ? <span className="mx-3 h-1.5 w-1.5 rounded-full bg-blue" /> : null}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection id="services" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold text-primary md:text-4xl">Tout ce dont vous avez besoin pour trader à votre meilleur niveau</h2>
          <p className="mt-3 text-center text-secondary">Finie l&apos;approximation. Place à la clarté.</p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <ServiceCard
              icon={<BrainCircuit className="h-8 w-8 text-blue" aria-hidden />}
              title="Avantage psychologique"
              body="L&apos;IA détecte le Revenge trading, l&apos;overtrading et vos schémas émotionnels sur tout votre historique"
              delayMs={0}
            />
            <ServiceCard
              icon={<BarChart3 className="h-8 w-8 text-cyan" aria-hidden />}
              title="Statistiques approfondies"
              body="Win rate, Sharpe ratio, Drawdown, Profit factor : chaque métrique qui compte vraiment, dans une vue claire"
              delayMs={100}
            />
            <ServiceCard
              icon={<BellRing className="h-8 w-8 text-green" aria-hidden />}
              title="Alertes sur les schémas"
              body="Soyez averti lorsque vous êtes sur le point de répéter votre erreur la plus coûteuse, avant d&apos;entrer en position"
              delayMs={200}
            />
          </div>
        </RevealSection>

        <RevealSection id="analyse" className="bg-card/30 px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">Découvrez ce que l&apos;IA révèle en 60 secondes</h2>
          <p className="mt-2 text-secondary">Aucune inscription requise</p>
          <button
            type="button"
            onClick={() => router.push("/demo")}
            className="mx-auto mt-8 inline-flex items-center gap-2 rounded bg-blue px-7 py-3 font-semibold text-primary transition-all duration-200 hover:bg-blue/90"
          >
            Analyse Gratuite
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
          <p className="mx-auto mt-4 max-w-sm text-sm text-secondary">
            Importez votre export MT4, MT5, Binance ou TradingView
          </p>
        </RevealSection>
      </main>

      <RevealSection className="border-t border-border px-6 py-10">
        <footer className="mx-auto flex max-w-6xl flex-col gap-8 text-secondary md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue" aria-hidden />
              <span className="font-bold text-primary">TonSaaS</span>
            </div>
            <p className="mt-2 text-sm">Votre avantage IA sur les marchés</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <button type="button" className="inline-flex items-center gap-1 hover:text-primary">
              <Info className="h-4 w-4" aria-hidden />
              À propos
            </button>
            <button type="button" className="inline-flex items-center gap-1 hover:text-primary">
              <HelpCircle className="h-4 w-4" aria-hidden />
              Aide
            </button>
            <a href="mailto:contact@tondomaine.ai" className="hover:text-primary">
              contact@tondomaine.ai
            </a>
          </div>
        </footer>
        <p className="mx-auto mt-8 max-w-6xl text-sm text-secondary">© 2026 TonSaaS. Conçu pour les traders exigeants.</p>
      </RevealSection>

      <div className="pointer-events-none fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`pointer-events-auto inline-flex items-center justify-center rounded border border-border bg-card p-2 text-secondary transition-all duration-200 hover:text-primary ${
            showTop ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
          aria-label="Retour en haut"
        >
          <ArrowRight className="h-5 w-5 -rotate-90" aria-hidden />
        </button>
      </div>

      <div className="hidden">
        <Brain className="h-4 w-4" />
        <ShieldCheck className="h-4 w-4" />
        <Trophy className="h-4 w-4" />
      </div>
    </div>
  );
}
