"use client";

import { useEffect, useRef, useState } from "react";
import { type LucideIcon, ArrowRight, Upload, FileText, Brain, MessageCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type RevealSectionProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

type ProcessStep = {
  icon: LucideIcon;
  color: string;
  number: string;
  title: string;
  body: string;
};

type PlatformGuide = {
  title: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
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

function AccordionItem({ question, answer }: FaqItem) {
  return (
    <details className="card rounded overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between p-6 text-sm font-semibold text-primary">
        <span>{question}</span>
        <ChevronDown
          size={16}
          className="text-secondary flex-shrink-0 transition-transform duration-200"
          aria-hidden
        />
      </summary>
      <div className="px-6 pb-6 text-sm text-secondary leading-relaxed">{answer}</div>
    </details>
  );
}

const processSteps: ProcessStep[] = [
  {
    icon: Upload,
    color: "#2D6FFF",
    number: "01",
    title: "Exportez votre historique",
    body: "Un fichier CSV depuis MT4, MT5, Binance, Bybit, TradingView, FTMO, FundedNext. Zéro accès à votre compte.",
  },
  {
    icon: Brain,
    color: "#00E5FF",
    number: "02",
    title: "L'IA décrypte vos trades",
    body: "Vos patterns, vos biais, vos sessions, votre profil psychologique. Chaque donnée analysée, résultat en moins de 60 secondes.",
  },
  {
    icon: FileText,
    color: "#00E5B0",
    number: "03",
    title: "Votre mirror sans filtre",
    body: "Vos forces, vos failles, votre plan d'action\nexportable en PDF. Chaque insight priorisé,\nexécutable en moins de 24h.",
  },
];

const platformGuides: PlatformGuide[] = [
  { title: "MT4", description: "Ctrl+T · Account History · Clic droit · Save as Report · CSV" },
  { title: "MT5", description: "Ctrl+T · History · Clic droit · Export · CSV" },
  { title: "Binance", description: "Orders · Trade History · Export Trade History · CSV" },
  { title: "Bybit", description: "Profile · Account · Data Export · Export Now · Download · CSV" },
  { title: "TradingView", description: "Panneau broker · Export Data · Balance History · Export · CSV" },
  { title: "FTMO", description: "Client Area · Metrix · Trading Journal · Export · CSV" },
  { title: "FundedNext", description: "Exportez via MT4 ou MT5. Voir étapes ci-dessus." },
];

const faqItems: FaqItem[] = [
  {
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Votre CSV est traité puis supprimé. Seul l'historique de vos analyses est conservé selon votre plan. Aucun accès à votre compte.",
  },
  {
    question: "Quels formats sont acceptés ?",
    answer:
      "Les exports CSV de MT4, MT5, Binance, Bybit, TradingView, FTMO et FundedNext. Guide d'export disponible dans la section Compatibilité ci-dessus.",
  },
  {
    question: "Puis-je tester avant de m'abonner ?",
    answer: "L'analyse gratuite reflète la qualité du service. Sans inscription ni carte bancaire.",
  },
  {
    question: "Quand mon compteur d'analyses se remet-il à zéro ?",
    answer: "Il se réinitialise chaque mois à la date de votre souscription.",
  },
  {
    question: "Puis-je changer ou résilier mon plan ?",
    answer:
      "Depuis votre compte, à tout moment. Upgrade immédiat, facturé au prorata. Downgrade et résiliation effectifs à votre prochaine date de souscription. Sans condition ni pénalité.",
  },
  {
    question: "Qu'est-ce que le score Prop Firm Readiness ?",
    answer:
      "En exclusivité sur le Plan Élite. Votre profil évalué sur les règles des Prop Firms. Drawdown max, daily loss max, profit target, consistency rule, risk/reward ratio. Toutes vos failles exposées.",
  },
  {
    question: "L'analyse fonctionne sur tous les types d'actifs ?",
    answer:
      "Sans exception sur chaque plateforme compatible. Forex, indices, matières premières, crypto, spot et futures disponibles.",
  },
  {
    question: "À qui s'adresse AlphaTradeX ?",
    answer:
      "Aux traders qui exigent la vérité sur leur exécution. Pas aux débutants en quête de formation.",
  },
  {
    question: "Mon historique est-il suffisant pour une analyse ?",
    answer:
      "Un minimum de 50 trades pour que l'IA identifie vos patterns avec précision. Plus votre volume est dense, plus les insights sont fiables.",
  },
  {
    question: "Qu'est-ce que les Alertes Telegram de vos setups ?",
    answer:
      "En exclusivité sur le Plan Élite. Vos setups identifiés par l'IA, notifiés en temps réel sur Telegram. Sans connexion requise.",
  },
];

export default function AidePage() {
  const firstPlatforms = platformGuides.slice(0, 4);
  const secondPlatforms = platformGuides.slice(4);

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />

      <main className="overflow-x-clip">
        <section className="px-6 pt-40 pb-28 text-center">
          <div className="max-w-[1200px] mx-auto">
            <RevealSection>
              <p className="font-mono text-xs tracking-[0.25em] text-secondary uppercase mb-6">Aide</p>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] text-primary mt-6 max-w-[900px] mx-auto">
                Une question.
                <br />
                Une réponse directe.
              </h1>
              <div className="w-12 h-px bg-blue mx-auto mt-10" />
              <p className="text-lg text-secondary leading-relaxed max-w-[520px] mx-auto mt-8">
                Les réponses aux questions que chaque trader sérieux se pose.
              </p>
            </RevealSection>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="max-w-[1200px] mx-auto text-center">
            <RevealSection>
              <p className="font-mono text-xs tracking-[0.25em] text-secondary uppercase">Comment on fonctionne</p>
              <h2 className="text-4xl md:text-5xl font-bold text-primary mt-4 max-w-[700px] mx-auto">
                Trois étapes.
                <br />
                Zéro friction.
              </h2>
              <p className="text-base text-secondary leading-relaxed max-w-[480px] mx-auto mt-6">
                Votre historique de trades transformé en mirror en moins de 60 secondes.
              </p>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-5 mt-14 text-left">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <RevealSection key={step.number} delay={index * 80}>
                    <article className="card rounded p-8 transition-colors duration-200 hover:border-blue">
                      <div
                        className="w-12 h-12 rounded-xl border flex items-center justify-center"
                        style={{
                          backgroundColor: `${step.color}15`,
                          borderColor: `${step.color}30`,
                        }}
                      >
                        <Icon className="h-6 w-6" style={{ color: step.color }} aria-hidden />
                      </div>
                      <p className="font-mono text-xs tracking-widest text-secondary mt-5 mb-1">{step.number}</p>
                      <h3 className="text-lg font-bold text-primary mb-3">{step.title}</h3>
                      <p className="text-sm text-secondary leading-relaxed">{step.body}</p>
                    </article>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="max-w-[1200px] mx-auto text-center">
            <RevealSection>
              <p className="font-mono text-xs tracking-[0.25em] text-secondary uppercase">Compatibilité</p>
              <h2 className="text-4xl font-bold text-primary mt-4">
                Votre plateforme.
                <br />
                Notre analyse.
              </h2>
              <p className="text-base text-secondary leading-relaxed max-w-[480px] mx-auto mt-6">
                Exportez depuis votre plateforme.
                <br />
                Analysez sur AlphaTradeX.
              </p>
            </RevealSection>

            <div className="grid md:grid-cols-4 gap-5 mt-14 text-left">
              {firstPlatforms.map((platform, index) => (
                <RevealSection key={platform.title} delay={index * 70}>
                  <article className="card rounded p-7 transition-colors duration-200 hover:border-blue">
                    <h3 className="text-sm font-semibold text-primary mb-3">{platform.title}</h3>
                    <p className="text-sm text-secondary leading-relaxed">{platform.description}</p>
                  </article>
                </RevealSection>
              ))}
            </div>

            <div className="mt-5 flex justify-center">
              <div className="grid w-full max-w-[900px] md:grid-cols-3 gap-5 text-left">
                {secondPlatforms.map((platform, index) => (
                  <RevealSection key={platform.title} delay={280 + index * 70}>
                    <article className="card rounded p-7 transition-colors duration-200 hover:border-blue">
                      <h3 className="text-sm font-semibold text-primary mb-3">{platform.title}</h3>
                      <p className="text-sm text-secondary leading-relaxed">{platform.description}</p>
                    </article>
                  </RevealSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="max-w-[1200px] mx-auto">
            <RevealSection>
              <p className="font-mono text-xs tracking-[0.25em] text-secondary uppercase text-center">Questions fréquentes</p>
              <h2 className="text-4xl font-bold text-primary mt-4 text-center">
                Ce que les traders sérieux veulent savoir.
              </h2>
            </RevealSection>

            <div className="mt-12 max-w-[800px] mx-auto space-y-4">
              {faqItems.map((item, index) => (
                <RevealSection key={item.question} delay={index * 40}>
                  <AccordionItem question={item.question} answer={item.answer} />
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <div className="max-w-[1200px] mx-auto">
            <RevealSection>
              <p className="font-mono text-xs tracking-[0.25em] text-secondary uppercase">Support</p>
              <h2 className="text-4xl font-bold text-primary mt-4">
                Une question sans réponse.
                <br />
                On intervient.
              </h2>
              <p className="text-base text-secondary leading-relaxed max-w-[480px] mx-auto mt-6">
                Une réponse humaine sous 24h.
              </p>
            </RevealSection>

            <RevealSection delay={120}>
              <div className="mt-12 max-w-[480px] mx-auto">
                <article className="card rounded p-8 text-left space-y-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle size={18} color="#2D6FFF" aria-hidden />
                    <p className="text-sm text-secondary">Du lundi au vendredi</p>
                  </div>
                  <div className="w-full h-px bg-border" />
                  <a
                    href="mailto:contact@alphatradex.ai"
                    className="btn-primary inline-flex w-full items-center justify-center gap-2 mt-2"
                  >
                    Écrire au support
                    <ArrowRight size={16} aria-hidden />
                  </a>
                </article>
              </div>
            </RevealSection>
          </div>
        </section>

        <section className="px-6 py-28 text-center">
          <div className="max-w-[1200px] mx-auto">
            <RevealSection>
              <h2 className="text-4xl md:text-5xl font-bold text-primary">
                Votre mirror.
                <br />
                Sans filtre.
              </h2>
              <p className="text-lg text-secondary mt-6 max-w-[400px] mx-auto">
                Votre historique. 60 secondes. La vérité.
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-10">
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

      <style>{`
        details[open] summary svg {
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
}
