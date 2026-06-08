"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BellRing,
  BrainCircuit,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  Headphones,
  History,
  Lock,
  Menu,
  Radar,
  Receipt,
  ScanLine,
  ScrollText,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  UserCircle,
  Webhook,
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
      className={`relative ${className} transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <div>{children}</div>
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
      className="card rounded p-7 transition-all duration-200 hover:border-blue"
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
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [showTop, setShowTop] = useState(false);

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
      setShowTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />

      <main className="relative overflow-x-clip">
        <RevealSection className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-b from-background to-card">
          <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-4 md:pb-0 md:pt-0 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">AlphaTradeX</p>
          <h1 className="mx-auto mt-6 max-w-[1200px] text-balance md:[text-wrap:normal] text-5xl font-bold leading-tight text-primary md:text-7xl">
            Les meilleurs traders n&apos;ont pas plus travaillé.
            <br />
            Ils ont mieux <span className="text-blue">compris</span>.
          </h1>

          <div className="mx-auto mt-10 h-px w-12 bg-blue" />

          <p className="mx-auto mt-6 max-w-[520px] leading-relaxed text-lg text-secondary">
            Notre IA analyse chaque trade, chaque décision, chaque pattern pour que vous ne répétiez plus jamais les
            mêmes erreurs.
          </p>

          </div>
        </RevealSection>

        <RevealSection className="bg-card">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <div className="text-center mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Tableau de bord</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Votre espace.<br />Notre analyse.
              </h2>
              <p className="mx-auto mt-6 max-w-[480px] text-base leading-relaxed text-secondary">
                Un dashboard pensé pour les traders qui exigent la précision.
              </p>
            </div>
            <div className="card glow-blue rounded overflow-hidden" style={{ height: '520px' }}>
              {/* Topbar desktop */}
              <div className="hidden md:flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 600 600" style={{ borderRadius: '8px', flexShrink: 0 }} aria-hidden>
                    <rect width="600" height="600" rx="125" ry="125" fill="#0A0A0F" />
                    <svg x="75" y="75" width="450" height="450" viewBox="0 0 24 24" fill="#0A0A0F" stroke="#2D6FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                  </svg>
                  <span className="font-semibold text-primary text-sm">AlphaTradeX</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-start pl-6 md:pl-10">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue" aria-hidden />
                    <span className="text-xs text-secondary">IA active</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-blue/25 bg-blue/10 px-3 py-1 text-xs font-semibold text-blue">Élite</span>
                  <span className="text-xs text-secondary">Cycle · 01/01</span>
                  <button type="button" className="rounded-md border border-border px-3 py-1.5 text-xs text-secondary cursor-default">Se déconnecter</button>
                </div>
              </div>
              {/* Topbar mobile */}
              <div className="relative flex md:hidden h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 600 600" style={{ borderRadius: '8px', flexShrink: 0 }} aria-hidden>
                  <rect width="600" height="600" rx="125" ry="125" fill="#0A0A0F" />
                  <svg x="75" y="75" width="450" height="450" viewBox="0 0 24 24" fill="#0A0A0F" stroke="#2D6FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </svg>
                <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-primary text-sm">AlphaTradeX</span>
                <div className="shrink-0 rounded-md border border-border p-2 text-secondary cursor-default">
                  <Menu className="h-5 w-5" aria-hidden />
                </div>
              </div>
              {/* Body */}
              <div className="flex overflow-hidden" style={{ height: 'calc(520px - 56px)' }}>
                {/* Sidebar desktop uniquement */}
                <aside className="hidden md:flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-card">
                  <div className="flex-1 overflow-hidden px-4 py-5 space-y-1">
                    {[
                      'Analyse',
                      'Performance',
                      'Signaux',
                      'Aide',
                      'Compte',
                    ].map((label) => (
                      <div key={label} className="flex w-full items-center justify-between px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary cursor-default">
                        <span>{label}</span>
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      </div>
                    ))}
                  </div>
                </aside>
                {/* Zone principale — identique desktop et mobile */}
                <main className="flex flex-1 flex-col items-center justify-center bg-background p-6">
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="w-full">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-primary">Analyser vos trades</h3>
                      </div>
                      <div className="border-2 border-dashed rounded-xl p-8 text-center mb-6 w-full border-border opacity-40 cursor-default transition-colors">
                        <Upload className="h-6 w-6 text-secondary mx-auto mb-2" aria-hidden />
                        <p className="text-primary text-sm font-medium">Importez votre historique de trades</p>
                        <p className="text-secondary text-xs mt-1">MT4 · MT5 · Binance · Bybit · TradingView · FTMO · FundedNext</p>
                      </div>
                      <div className="flex justify-center">
                        <button type="button" className="btn-primary py-2.5 opacity-40 cursor-default">Analyser mes trades</button>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="bg-background">
          <div className="mx-auto max-w-[1200px] px-6 py-20 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Compatibilité</p>
            <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary">
              Vos plateformes.<br />Notre analyse.
            </h2>
            <p className="mx-auto mt-4 max-w-[400px] text-sm text-secondary">
              Votre historique importé. Vos biais exposés.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              {["MT4", "MT5", "Binance", "Bybit", "TradingView", "FTMO", "FundedNext"].map((platform) => (
                <div key={platform} className="card cursor-default rounded px-7 py-3 font-mono text-sm font-semibold text-primary transition-colors duration-200 hover:border-blue">
                  {platform}
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection id="services" className="bg-card">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4 text-center">Services</p>
          <h2 className="text-center text-4xl font-bold text-primary md:text-5xl">
            Tout ce qu&apos;il faut pour trader au plus haut{" "}
            <span className="text-primary">niveau</span>.
          </h2>
          <p className="mt-6 max-w-[480px] mx-auto text-base leading-relaxed text-secondary text-center">Passez de l&apos;instinct à la stratégie.</p>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
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
          </div>
        </RevealSection>

        <RevealSection className="bg-background">
          <div className="mx-auto max-w-[1200px] px-6 py-20 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4 text-center">Technologie</p>
            <h2 className="mx-auto mt-4 max-w-[700px] text-3xl font-bold leading-tight text-primary md:text-5xl">
              Propulsé par{" "}
              <span className="text-primary">GPT-5.4</span>.
              <br />
              Le modèle le plus avancé d&apos;OpenAI.
            </h2>
            <p className="mt-6 max-w-[480px] mx-auto text-lg text-secondary">
              Pendant que les autres vont passer leur temps à deviner, vous savez. Le résultat : la précision du
              modèle IA le plus avancé au monde dans chaque analyse.
            </p>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                <BrainCircuit className="h-8 w-8 text-blue" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">Précision Chirurgicale</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  GPT-5.4 raisonne comme un analyste senior. Il voit ce que les autres modèles ne peuvent pas voir.
                </p>
              </article>
              <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                <ShieldCheck className="h-8 w-8 text-cyan" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">Fiabilité Inégalée</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  Au moins 33% moins d&apos;erreurs que les versions précédentes. Chaque analyse est vérifiée, chaque
                  décision est fondée.
                </p>
              </article>
              <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                <TrendingUp className="h-8 w-8 text-green" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">Exécution immédiate</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  Analyse complète générée en moins de 60 secondes. Vous pouvez l&apos;utiliser lorsque vous en avez
                  besoin.
                </p>
              </article>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="bg-card">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4 text-center">Système</p>
            <h2 className="text-center text-4xl font-bold text-primary md:text-5xl">
              Le système que les traders{" "}
              <span className="text-primary">disciplinés</span>{" "}
              vont utiliser.
            </h2>
            <p className="mt-5 max-w-[480px] mx-auto text-center text-lg text-secondary">
              Passez d&apos;un trading émotionnel à une exécution maîtrisée, mesurable et optimisée. Éliminer de
              manière définitive vos erreurs structurelles
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                <Trophy className="h-8 w-8 text-blue" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">
                  Élaboré par les traders. Optimisé pour performer
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  Nous avons affronté les mêmes erreurs, les mêmes doutes, les mêmes pertes. Chaque fonctionnalité a
                  été mise en place afin de résoudre un problème précis. Notre seule finalité : améliorer vos
                  résultats.
                </p>
              </article>
              <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                <BarChart3 className="h-8 w-8 text-cyan" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">Des données réelles. Des décisions précises</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  Votre analyse repose sur vos propres trades, pas sur des données génériques.
                  Chaque analyse est personnalisée afin de révéler ce qui fonctionne vraiment
                  et ce qui vous freine.
                </p>
              </article>
              <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                <BrainCircuit className="h-8 w-8 text-green" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">
                  Maîtriser votre psychologie avant qu&apos;elle vous coûte.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  La majorité de vos pertes viennent de décisions émotionnelles. Notre IA identifie vos biais
                  psychologiques en temps réel, pour vous permettre une reprise totale du contrôle avant qu&apos;ils
                  impactent vos résultats.
                </p>
              </article>
              <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                <ShieldCheck className="h-8 w-8 text-blue" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">
                  Votre analyse exploitable en moins d&apos;une journée.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  Importez votre historique dans la journée. Identifiez vos patterns sur votre première analyse.
                  Tradez avec une vision solide demain.
                </p>
              </article>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="bg-background">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4 text-center">Témoignages</p>
            <h2 className="text-center text-4xl font-bold text-primary md:text-5xl">
              Ce que les traders{" "}
              <span className="text-primary">sérieux</span> ont vu
              que les autres ont ignoré.
            </h2>
            <p className="mt-5 max-w-[480px] mx-auto text-center text-lg text-secondary">
              Une lecture précise de leurs erreurs, de leurs forces et de leurs réels leviers de performance.
            </p>

            <div className="mt-12 grid gap-6 lg:grid-cols-4">
              {[
                {
                  name: "Kilian I.",
                  role: "Trader Forex - FTMO",
                  quote:
                    "Mon Win rate était bon. L'IA a révélé que mon Risk/Reward détruisait toute ma performance. Corrigé en une semaine. Financé en un mois.",
                },
                {
                  name: "Lilou O.",
                  role: "Day Trader - TradingView",
                  quote:
                    "Je tradais à l’excès. Tout le temps. Sans le savoir. L'IA a identifié mon overtrading en 30 secondes. Depuis je trade moins et gagne plus.",
                },
                {
                  name: "Alya L.",
                  role: "Trader Crypto - Binance",
                  quote:
                    "Je coupais très vite mes profits. Chaque semaine. De manière systématique. En un mois j'ai récupéré ce que j'avais perdu en six mois.",
                },
                {
                  name: "Nassim S.",
                  role: "Scalper - MT5",
                  quote:
                    "Je scalpe depuis 2 ans. L'IA a révélé que je perdais 80% de mes trades hors session London. Depuis je ne trade plus qu'aux bonnes heures.",
                },
              ].map((item) => (
                <article
                  key={item.name}
                  className="relative rounded border border-border bg-card p-7 hover:border-blue transition-colors duration-200"
                >
                  <span className="absolute right-4 top-3 text-5xl font-bold text-blue/20">&ldquo;</span>
                  <p className="mb-3 text-sm tracking-widest text-blue">★★★★★</p>
                  <p className="text-sm leading-relaxed text-secondary">{item.quote}</p>
                  <p className="mt-5 text-sm font-semibold text-primary">{item.name}</p>
                  <p className="text-xs text-secondary">{item.role}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection id="analyse" className="bg-card">
          <div className="mx-auto max-w-[1200px] px-6 py-28 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">Analyse gratuite</p>
          <h2 className="text-4xl font-bold text-primary md:text-5xl">
            Ce que l&apos;IA{" "}
            <span className="text-primary">révèle</span> en 60
            secondes.
          </h2>
          <p className="mt-6 max-w-[480px] mx-auto text-base leading-relaxed text-secondary">Aucune inscription requise</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/analysis")}
              className="btn-primary inline-flex items-center gap-2"
            >
              Analyse gratuite
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => void connectGoogle()}
              className="btn-outline inline-flex items-center gap-2"
            >
              <UserCircle className="h-5 w-5" aria-hidden />
              S&apos;inscrire
            </button>
          </div>
          <p className="mt-6 text-xs text-secondary">Sans carte bancaire. Analyse immédiate.</p>
          </div>
        </RevealSection>
      </main>

      <RevealSection className="bg-gradient-to-b from-card to-background px-6 py-28 text-center">
        <div className="mx-auto max-w-[1200px]">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">Commencer</p>
          <h2 className="text-3xl font-bold text-primary md:text-5xl">
            Rejoignez l&apos;
            <span className="text-primary">élite</span> des
            traders.
          </h2>
          <p className="mx-auto mt-6 max-w-[400px] text-lg leading-relaxed text-secondary">Votre historique. 60 secondes. La vérité.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => void connectGoogle()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <UserCircle className="h-5 w-5" aria-hidden />
              S&apos;inscrire
            </button>
            <button
              type="button"
              onClick={() => router.push("/analysis")}
              className="btn-outline inline-flex items-center gap-2"
            >
              Analyse gratuite
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <p className="mt-6 text-xs text-secondary">Accès anticipé · 200 places · Prix public à venir · Sans carte bancaire</p>
        </div>
      </RevealSection>

      <RevealSection className="border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md">
        <Footer />
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
    </div>
  );
}
