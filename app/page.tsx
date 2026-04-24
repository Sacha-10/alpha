"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Brain,
  BrainCircuit,
  CheckCircle2,
  FileDown,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Upload,
  UserCircle,
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
    <div className="relative min-h-screen bg-background text-primary" style={{ zIndex: 0 }}>
      <Navbar />

      <main className="relative">
        <RevealSection className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-b from-[#0A0A0F] to-[#12121A]">
          <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-4 md:pb-0 md:pt-0 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-secondary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue" />
            Propulsé par <span className="text-primary">GPT-5.4</span>
          </div>
          <h1 className="mx-auto mt-8 max-w-[1200px] text-balance md:[text-wrap:normal] text-4xl font-bold leading-tight text-primary md:text-6xl xl:text-5xl">
            Les meilleurs traders n&apos;ont pas plus travaillé.
            <br />
            Ils ont mieux{" "}
            <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">compris</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-[600px] text-lg text-secondary">
            Notre IA analyse chaque trade, chaque décision, chaque pattern pour que vous ne répétiez plus jamais les
            mêmes erreurs.
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
          </div>
        </RevealSection>

        <RevealSection className="bg-[#12121A]">
          <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-20 [perspective:1000px]">
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

        <RevealSection className="border-y border-border bg-[#0A0A0F] py-4">
          <div className="overflow-hidden text-secondary">
            <div className="animate-landing-marquee whitespace-nowrap">
              {[
                "Approuvé par les traders sur",
                "Binance",
                "MT4",
                "MT5",
                "TradingView",
                "FTMO",
                "MyForexFunds",
                "Approuvé par les traders sur",
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

        <RevealSection id="services" className="bg-[#12121A]">
          <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="text-center text-3xl font-bold text-primary md:text-4xl">
            Tout ce qu&apos;il faut pour trader au plus haut{" "}
            <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">niveau</span>.
          </h2>
          <p className="mt-3 text-center text-secondary">Passez de l&apos;instinct à la stratégie.</p>

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
          </div>
        </RevealSection>

        <RevealSection className="bg-background px-6 py-20">
          <div className="mx-auto max-w-[1200px] text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-secondary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue" />
              Technologie Exclusive
            </div>
            <h2 className="mx-auto mt-8 max-w-[1200px] text-3xl font-bold leading-tight text-primary md:text-5xl">
              Propulsé par{" "}
              <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">GPT-5.4</span>.
              <br />
              Le modèle le plus avancé d&apos;OpenAI.
            </h2>
            <p className="mx-auto mt-6 max-w-[1200px] text-lg text-secondary">
              Pendant que les autres vont passer leur temps à deviner, vous savez. Le résultat : la précision du
              modèle IA le plus avancé au monde dans chaque analyse.
            </p>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              <article className="card rounded p-7">
                <BrainCircuit className="h-8 w-8 text-blue" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">Précision Chirurgicale</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  GPT-5.4 raisonne comme un analyste senior. Il voit ce que les autres modèles ne peuvent pas voir.
                </p>
              </article>
              <article className="card rounded p-7">
                <ShieldCheck className="h-8 w-8 text-cyan" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">Fiabilité Inégalée</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  Au moins 33% moins d&apos;erreurs que les versions précédentes. Chaque analyse est vérifiée, chaque
                  décision est fondée.
                </p>
              </article>
              <article className="card rounded p-7">
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

        <RevealSection className="bg-[#12121A] px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="text-center text-3xl font-bold text-primary md:text-5xl">
              Le système que les traders{" "}
              <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">disciplinés</span>{" "}
              vont utiliser.
            </h2>
            <p className="mx-auto mt-5 max-w-[1200px] text-center text-lg text-secondary">
              Passez d&apos;un trading émotionnel à une exécution maîtrisée, mesurable et optimisée. Éliminer de
              manière définitive vos erreurs structurelles
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <article className="card rounded p-7">
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
              <article className="card rounded p-7">
                <BarChart3 className="h-8 w-8 text-cyan" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold text-primary">Des données réelles. Des décisions précises</h3>
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                  Votre analyse repose sur vos propres trades, pas sur d&apos;autres données génériques. Chaque
                  analyse est personnalisée afin de révéler ce qui fonctionne vraiment et ce qui vous freine.
                </p>
              </article>
              <article className="card rounded p-7">
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
              <article className="card rounded p-7">
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

        <RevealSection className="bg-background px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="text-center text-3xl font-bold text-primary md:text-5xl">
              Ce que les traders{" "}
              <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">sérieux</span> ont vu
              que les autres ont ignoré.
            </h2>
            <p className="mx-auto mt-5 max-w-[1200px] text-center text-lg text-secondary">
              Une lecture précise de leurs erreurs, de leurs forces et de leurs réels leviers de performance.
            </p>

            <div className="mt-12 grid gap-6 lg:grid-cols-4">
              {[
                {
                  name: "Kilian I.",
                  role: "Trader Forex - Prop Firm FTMO",
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
                  className="relative rounded border border-border bg-card p-7 transition-all duration-200 hover:border-blue"
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

        <RevealSection id="analyse" className="bg-[#12121A] px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-primary md:text-4xl">
            Ce que l&apos;IA{" "}
            <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">révèle</span> en 60
            secondes.
          </h2>
          <p className="mt-2 text-secondary">Aucune inscription requise</p>
          <button
            type="button"
            onClick={() => router.push("/demo")}
            className="mx-auto mt-8 inline-flex items-center gap-2 rounded bg-blue px-7 py-3 font-semibold text-primary transition-all duration-200 hover:bg-blue/90"
          >
            Analyse Gratuite
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
          <p className="mx-auto mt-4 max-w-sm text-sm text-secondary">Sans carte bancaire. Démonstration immédiate.</p>
        </RevealSection>
      </main>

      <RevealSection className="bg-gradient-to-b from-[#12121A] to-[#0A0A0F] px-6 py-20 text-center">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-3xl font-bold text-primary md:text-5xl">
            Rejoignez l&apos;
            <span className="bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent">élite</span> des
            traders.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-secondary">
            Chaque jour sans analyse est un jour où vos erreurs vont continuer de vous coûter.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => void connectGoogle()}
              className="inline-flex items-center gap-2 rounded bg-blue px-6 py-3 font-semibold text-primary transition-all duration-200 hover:bg-blue/90"
            >
              <UserCircle className="h-5 w-5" aria-hidden />
              S&apos;inscrire
            </button>
          </div>
          <p className="mt-4 text-sm text-secondary">Importez vos trades depuis MT4, MT5, Binance, TradingView.</p>
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

      <div className="hidden">
        <Brain className="h-4 w-4" />
        <ShieldCheck className="h-4 w-4" />
        <Trophy className="h-4 w-4" />
      </div>
    </div>
  );
}
