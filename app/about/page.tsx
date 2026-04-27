"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Shield, Brain, Target } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type RevealSectionProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

type TimelineStep = {
  year: string;
  title: string;
  description: string;
};

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
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

  return { ref, visible };
}

function RevealSection({ children, delay = 0, className = "" }: RevealSectionProps) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transitionDuration: "700ms",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const truthCards = [
  {
    title: "Votre edge existe.",
    body: "Sans données décryptées vous tradez une croyance pas un système.",
  },
  {
    title: "Votre exposition vous dépasse.",
    body: "Sans mesure précise votre risque géré coûte plus que vos pires pertes.",
  },
  {
    title: "Votre journal vous condamne.",
    body: "Sans analyse impartiale vous invalidez vos conclusions.",
  },
  {
    title: "Votre exécution révèle.",
    body: "Sans mirror calibré votre profil psychologique trade à votre place.",
  },
];

const stats = [
  { value: "< 60s", label: "Pour analyser votre historique" },
  { value: "4", label: "Plateformes compatibles" },
  { value: "200", label: "Traders en accès anticipé" },
  { value: "2", label: "Prop Firms compatibles" },
];

const principles = [
  {
    icon: Brain,
    color: "#2D6FFF",
    number: "01",
    title: "La donnée pas l'intuition",
    body: "Votre sentiment ne vaut rien. Votre historique révèle la seule réalité.",
  },
  {
    icon: Shield,
    color: "#00E5FF",
    number: "02",
    title: "La discipline comme edge",
    body: "Les traders d'élite ne tradent pas mieux. AlphaTradeX est leur système.",
  },
  {
    icon: Target,
    color: "#00E5B0",
    number: "03",
    title: "L'exécution pas la théorie",
    body: "Vos trades vos patterns vos biais exposés. Exécutable en 24h.",
  },
];

const timeline: TimelineStep[] = [
  {
    year: "2022",
    title: "Les premières pertes évitables.",
    description: "Pas un manque de stratégie. Un manque de lucidité.",
  },
  {
    year: "2023",
    title: "La conviction qu'un mirror devait exister.",
    description: "Aucun modèle ne lisait un trader avec une précision chirurgicale.",
  },
  {
    year: "2025",
    title: "L'IA surpasse les experts.",
    description: "Un modèle capable de décrypter un trader depuis son historique de trades.",
  },
  {
    year: "2026",
    title: "AlphaTradeX — Accès anticipé.",
    description: "200 places. Phase 0 en cours.",
  },
];

const platforms = ["MT4", "MT5", "Binance", "TradingView", "FTMO", "MyForexFunds"];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />

      <main>
        <section className="px-6 pb-28 pt-40 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-secondary">À propos</p>
              <h1 className="mx-auto mt-6 max-w-[900px] text-5xl font-bold leading-[1.1] text-primary md:text-7xl">
                Vous aviez les données.
                <br />
                Personne n&apos;avait encore décrypté vos biais.
              </h1>
              <div className="mx-auto mt-10 h-px w-12 bg-blue" />
              <p className="mx-auto mt-8 max-w-[520px] text-lg leading-relaxed text-secondary">
                Plusieurs milliers de trades et une multitude de patterns invisibles. Un compte qui soldait les
                erreurs que vous n&apos;aviez jamais anticipé.
              </p>
            </RevealSection>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1200px] text-center">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Le problème</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Les bons traders ont une stratégie.
              </h2>
              <p className="mx-auto mt-6 max-w-[480px] text-base leading-relaxed text-secondary">
                Aucun n&apos;a de mirror. AlphaTradeX est ce mirror.
              </p>
            </RevealSection>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {truthCards.map((item, index) => (
                <RevealSection key={item.title} delay={index * 80}>
                  <article className="card rounded p-7 transition-colors duration-200 hover:border-blue">
                    <h3 className="mb-2 text-sm font-semibold text-primary">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-secondary">{item.body}</p>
                  </article>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">En chiffres</p>
              <h2 className="mt-4 text-4xl font-bold text-primary">
                Les métriques.
                <br />
                Pas de promesse.
              </h2>
            </RevealSection>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((item, index) => (
                <RevealSection key={item.label} delay={index * 70}>
                  <article className="card rounded p-8 text-center transition-colors duration-200 hover:border-blue">
                    <p className="block w-full whitespace-nowrap font-mono text-4xl font-bold text-primary sm:whitespace-normal">{item.value}</p>
                    {item.value === "< 60s" ? (
                      <p className="mt-2 w-full text-sm text-secondary">
                        <span className="hidden sm:inline">Pour analyser votre historique</span>
                        <span className="sm:hidden">Pour analyser<br />votre historique</span>
                      </p>
                    ) : (
                      <p className="mt-2 w-full text-sm text-secondary">{item.label}</p>
                    )}
                  </article>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Nos convictions</p>
              <h2 className="mt-4 text-4xl font-bold text-primary">
                Trois principes.
                <br />
                Zéro compromis.
              </h2>
            </RevealSection>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {principles.map((item, index) => {
                const Icon = item.icon;
                return (
                  <RevealSection key={item.number} delay={index * 90}>
                    <article className="card rounded p-8 transition-colors duration-200 hover:border-blue">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl border"
                        style={{
                          backgroundColor: `${item.color}15`,
                          borderColor: `${item.color}30`,
                        }}
                      >
                        <Icon className="h-6 w-6" style={{ color: item.color }} aria-hidden />
                      </div>
                      <p className="mb-1 mt-5 font-mono text-xs tracking-widest text-secondary">{item.number}</p>
                      <h3 className="mb-3 text-lg font-bold text-primary">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-secondary">{item.body}</p>
                    </article>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-[1200px] items-start gap-16 md:grid-cols-2">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Genèse</p>
              <h2 className="mt-4 text-4xl font-bold text-primary">
                Né de la frustration.
                <br />
                Forgé avec rigueur.
              </h2>
              <p className="mt-6 max-w-[400px] text-base leading-relaxed text-secondary">
                Pas une slide deck. Un mirror pensé par un trader pour les traders.
              </p>
            </RevealSection>

            <div>
              {timeline.map((item, index) => {
                const isLast = index === timeline.length - 1;
                return (
                  <RevealSection key={item.year} delay={index * 90}>
                    <div className="flex gap-5">
                      <div className="flex flex-col items-center">
                        <span className="mt-[7px] h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#2D6FFF]" />
                        {!isLast ? <span className="mt-2 min-h-[44px] w-px bg-border" /> : null}
                      </div>
                      <div className="pb-6">
                        <p className="font-mono text-xs tracking-widest text-secondary">{item.year}</p>
                        <h3 className="mt-1 text-sm font-semibold text-primary">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-secondary">{item.description}</p>
                      </div>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-[1200px] items-center gap-16 md:grid-cols-2">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Le fondateur</p>
              <h2 className="mt-4 text-4xl font-bold text-primary">
                Un trader.
                <br />
                Pas un entrepreneur.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-secondary">
                AlphaTradeX n&apos;est pas né dans un bureau. Il est né d&apos;un compte en drawdown et de la certitude
                qu&apos;un mirror devait exister.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#2D6FFF,#00E5FF)" }}
                >
                  S
                </div>
                <div>
                  <p className="font-semibold text-primary">Sacha — Fondateur d&apos;AlphaTradeX</p>
                  <p className="mt-1 text-sm text-secondary">Trader depuis 2022</p>
                </div>
              </div>
            </RevealSection>

            <RevealSection delay={120}>
              <article className="card space-y-5 rounded p-8" style={{ borderLeft: "3px solid #2D6FFF" }}>
                <p className="text-sm leading-relaxed text-secondary">
                  Ma stratégie était solide. Mon exécution me coûtait mes comptes. Mes sessions, mes revenge trades,
                  mes over trades, mes symboles toxiques.
                </p>
                <p className="text-sm leading-relaxed text-secondary">
                  Chaque trade était sur MetaTrader. Plusieurs semaines d&apos;analyse qu&apos;un analyste IA exécute en
                  moins d&apos;une minute.
                </p>
                <p className="text-sm font-semibold text-primary">Un trader sérieux mérite un mirror sans concession.</p>
              </article>
            </RevealSection>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Compatibilité</p>
              <h2 className="mt-4 text-4xl font-bold text-primary">
                Vos plateformes.
                <br />
                Notre analyse.
              </h2>
              <p className="mx-auto mt-4 max-w-[400px] text-sm text-secondary">
                Votre historique importé. Vos biais exposés.
              </p>
            </RevealSection>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              {platforms.map((platform, index) => (
                <RevealSection key={platform} delay={index * 60}>
                  <div className="card cursor-default rounded px-7 py-3 font-mono text-sm font-semibold text-primary transition-colors duration-200 hover:border-blue">
                    {platform}
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-28 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <h2 className="text-4xl font-bold text-primary md:text-5xl">
                Votre mirror.
                <br />
                Sans filtre.
              </h2>
              <p className="mx-auto mt-6 max-w-[400px] text-lg text-secondary">
                Votre historique. 60 secondes. La vérité.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link href="/demo" className="btn-primary inline-flex items-center gap-2">
                  Analyse gratuite
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link href="/pricing" className="btn-outline inline-flex items-center gap-2">
                  Voir les plans
                </Link>
              </div>
              <p className="mt-6 text-xs text-secondary">
                Accès anticipé · 200 places · Prix public à venir · Sans carte bancaire
              </p>
            </RevealSection>
          </div>
        </section>
      </main>

      <section className="border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md">
        <Footer />
      </section>
    </div>
  );
}
