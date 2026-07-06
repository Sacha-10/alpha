"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Check, Flame, X, ArrowRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from '@/lib/supabase';
import { PLANS, DISABLED_PLANS, isUnlimited, getPlanMonths, planRank, type PlanKey } from '@/lib/plans';

// Prix « accès anticipé » et nombre d'analyses dérivés de la source de vérité.
// Les prix barrés / publics restent du contenu marketing (non vendable).
const perMonth = (n: number) => `${n}€/mois`;
const perYear = (n: number) => `${n}€/an`;
const analysesLabel = (limit: number) =>
  isUnlimited(limit) ? "Analyses illimitées" : `${limit} analyses/mois`;

// Fenêtre d'historique des analyses, formatée depuis getPlanMonths
// (aucune durée en dur ici).
const historyLabel = (plan: PlanKey) => {
  const months = getPlanMonths(plan);
  if (months === null) return "Historique de vos analyses (illimité)";
  const window = months % 12 === 0 ? `${months / 12} an` : `${months} mois`;
  return `Historique de vos analyses (${window})`;
};

type BillingMode = "monthly" | "yearly";

type Plan = {
  name: string;
  hook: string;
  subhook: string;
  yearlySavings: string;
  highlighted?: boolean;
  ctaBg: string;
  prices: {
    // Vue mensuelle : prix early access mensuel + prix public mensuel.
    monthly: { opening: string; public: string };
    // Vue annuelle : prix early mensualisé, total annuel plein (barré),
    // total annuel réduit, prix public mensualisé.
    yearly: { opening: string; annualFull: string; annualTotal: string; public: string };
  };
  features: Array<{ label: string; included: boolean }>;
};

type FaqItem = {
  question: string;
  answer: string;
};

type RevealSectionProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
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
    <details className="card rounded overflow-hidden transition-colors duration-200">
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

const plans: Plan[] = [
  {
    name: "PRO",
    hook: "Structurer ses décisions.",
    subhook: "Analyser ses trades avec méthode.",
    yearlySavings: "-20%",
    ctaBg: "bg-[#1E2035]",
    prices: {
      monthly: { opening: perMonth(PLANS.pro.monthly), public: perMonth(PLANS.pro.publicMonthly) },
      yearly: {
        opening: perMonth(PLANS.pro.annualPerMonth),
        annualFull: perYear(PLANS.pro.annualFull),
        annualTotal: perYear(PLANS.pro.annual),
        public: perMonth(PLANS.pro.publicAnnualPerMonth),
      },
    },
    features: [
      { label: analysesLabel(PLANS.pro.limit), included: true },
      { label: "Analyses IA GPT-5.4", included: true },
      { label: "Export PDF", included: true },
      { label: "Journal de vos trades (1 mois)", included: true },
      { label: "Historique de vos analyses", included: false },
      { label: "Évolution hebdomadaire", included: false },
      { label: "Résumé hebdomadaire", included: false },
      { label: "Support prioritaire", included: false },
      { label: "Score Prop Firm Readiness", included: false },
      { label: "Détection prédictive de vos setups", included: false },
      { label: "Alertes Telegram de vos setups", included: false },
      { label: "Accès API", included: false },
    ],
  },
  {
    name: "PREMIUM",
    hook: "Optimiser sa régularité.",
    subhook: "Améliorer ses performances avec régularité.",
    yearlySavings: "-20%",
    highlighted: true,
    ctaBg: "bg-[#2D6FFF]",
    prices: {
      monthly: { opening: perMonth(PLANS.premium.monthly), public: perMonth(PLANS.premium.publicMonthly) },
      yearly: {
        opening: perMonth(PLANS.premium.annualPerMonth),
        annualFull: perYear(PLANS.premium.annualFull),
        annualTotal: perYear(PLANS.premium.annual),
        public: perMonth(PLANS.premium.publicAnnualPerMonth),
      },
    },
    features: [
      { label: analysesLabel(PLANS.premium.limit), included: true },
      { label: "Analyses IA GPT-5.4", included: true },
      { label: "Export PDF", included: true },
      { label: "Journal de vos trades (1 an)", included: true },
      { label: historyLabel("premium"), included: true },
      { label: "Évolution hebdomadaire", included: true },
      { label: "Résumé hebdomadaire", included: true },
      { label: "Support prioritaire", included: true },
      { label: "Score Prop Firm Readiness", included: false },
      { label: "Détection prédictive de vos setups", included: false },
      { label: "Alertes Telegram de vos setups", included: false },
      { label: "Accès API", included: false },
    ],
  },
  {
    name: "ÉLITE",
    hook: "Maîtriser son exécution.",
    subhook: "Exécuter ses décisions avec précision.",
    yearlySavings: "-20%",
    ctaBg: "bg-[#1E2035]",
    prices: {
      monthly: { opening: perMonth(PLANS.elite.monthly), public: perMonth(PLANS.elite.publicMonthly) },
      yearly: {
        opening: perMonth(PLANS.elite.annualPerMonth),
        annualFull: perYear(PLANS.elite.annualFull),
        annualTotal: perYear(PLANS.elite.annual),
        public: perMonth(PLANS.elite.publicAnnualPerMonth),
      },
    },
    features: [
      { label: analysesLabel(PLANS.elite.limit), included: true },
      { label: "Analyses IA GPT-5.4", included: true },
      { label: "Export PDF", included: true },
      { label: "Journal de vos trades (illimité)", included: true },
      { label: historyLabel("elite"), included: true },
      { label: "Évolution hebdomadaire", included: true },
      { label: "Résumé hebdomadaire", included: true },
      { label: "Support prioritaire", included: true },
      { label: "Score Prop Firm Readiness", included: true },
      { label: "Détection prédictive de vos setups", included: true },
      { label: "Alertes Telegram de vos setups", included: true },
      { label: "Accès API", included: true },
    ],
  },
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
      "Les exports CSV de MT4, MT5, Binance, Bybit, TradingView, FTMO et FundedNext. Guide d'export disponible sur la page Aide.",
  },
  {
    question: "Comment fonctionne l'accès anticipé ?",
    answer:
      "Les 200 premiers membres vont rejoindre la plateforme à prix préférentiel. Vous ne serez jamais rebasculé sur le prix public, quelle que soit l'évolution de la plateforme. Ce prix est verrouillé à vie.",
  },
  {
    question: "Puis-je changer ou résilier mon plan ?",
    answer:
      "Depuis votre compte, à tout moment. Upgrade immédiat, facturé au prorata. Downgrade et résiliation effectifs à votre prochaine date de souscription. Sans condition ni pénalité.",
  },
  {
    question: "À qui s'adresse AlphaTradeX ?",
    answer:
      "Aux traders qui exigent la vérité sur leur exécution. Pas aux débutants en quête de formation.",
  },
];

export default function PricingPage() {
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('users')
        .select('subscription_plan, subscription_status')
        .eq('id', session.user.id)
        .single();
      if (data) {
        setCurrentPlan(data.subscription_plan ?? null);
        setSubscriptionStatus(data.subscription_status ?? null);
      }
    }
    void fetchPlan();
  }, [supabase]);

  const handleCheckout = async (planName: string) => {
    const planKey = toPlanKey(planName);
    const billing = billingMode === "yearly" ? "annual" : "monthly";

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/');
      return;
    }

    router.push(`/api/create-checkout?plan=${planKey}&billing=${billing}&token=${session.access_token}`);
  };

  // Mapping libellé d'affichage → clé de plan (l'« ÉLITE » accentué n'est pas
  // normalisable par normalizePlan, d'où ce mapping dédié côté présentation).
  const toPlanKey = (name: string) =>
    name === "PRO" ? "pro" : name === "PREMIUM" ? "premium" : "elite";

  const renderCTA = (p: Plan) => {
    const key = toPlanKey(p.name);
    const ctaClass = `mt-6 w-full rounded-lg px-4 py-3 font-semibold text-primary transition-opacity hover:opacity-90 ${p.ctaBg}`;
    // Plan désactivé à la vente (cf. DISABLED_PLANS) : bouton neutralisé, SANS
    // onClick → aucune redirection Stripe. Apparence STRICTEMENT identique à un
    // bouton actif (même fond ctaBg, même opacité, même curseur) : seul le texte
    // change. disabled:opacity-100 neutralise tout grisage auto lié à `disabled`.
    // Réactivation = retirer le plan de DISABLED_PLANS (aucune autre modif ici).
    if (DISABLED_PLANS.includes(key)) {
      return (
        <button type="button" disabled className={`${ctaClass} disabled:opacity-100`}>
          En cours de mise à niveau
        </button>
      );
    }
    if (subscriptionStatus !== 'active' || !currentPlan) {
      return (
        <button type="button" onClick={() => handleCheckout(p.name)} className={ctaClass}>
          Commencer
        </button>
      );
    }
    if (currentPlan === key && subscriptionStatus === 'active') {
      return (
        <button type="button" className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold text-primary cursor-default ${p.ctaBg}`}>
          Plan actuel
        </button>
      );
    }
    if (planRank(key) > planRank(currentPlan)) {
      return (
        <button type="button" onClick={() => handleCheckout(p.name)} className={ctaClass}>
          Upgrader
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleCheckout(p.name)}
        className="mt-6 bg-card text-secondary hover:text-primary rounded-lg px-4 py-3 font-medium w-full text-center"
      >
        Downgrader
      </button>
    );
  };

  // Rend un prix "{montant}€/mois" à la façon TraderSync : montant en gros
  // (taille héritée du parent), suffixe d'unité "/mois" discret (text-lg =
  // taille qu'avait le total annuel réduit). Gain de largeur → le prix
  // mensualisé et le total annuel barré tiennent sur une seule ligne (mobile).
  const renderMonthlyPrice = (value: string) => {
    const idx = value.indexOf("/");
    const amount = idx === -1 ? value : value.slice(0, idx); // ex. "19.6€"
    const unit = idx === -1 ? "" : value.slice(idx); // ex. "/mois"
    return (
      <>
        {amount}
        {unit && <span className="text-lg">{unit}</span>}
      </>
    );
  };

  // Bloc prix — structure distincte par mode de facturation.
  //  · Mensuel : prix early mensuel + prix public mensuel.
  //  · Annuel  : prix early mensualisé (avec le total annuel plein barré à
  //    droite de la même ligne) + total annuel réduit + prix public mensualisé.
  const renderPriceBox = (p: Plan) => (
    <div className="mt-6 rounded-lg border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-secondary">Accès anticipé (à vie)</p>
      {billingMode === "monthly" ? (
        <>
          <p className="mt-2 text-4xl font-bold text-primary">{renderMonthlyPrice(p.prices.monthly.opening)}</p>
          <p className="mt-4 text-sm text-secondary">
            Prix public (à venir) :{" "}
            <span className="font-semibold text-primary">{p.prices.monthly.public}</span>
          </p>
        </>
      ) : (
        <>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="text-4xl font-bold text-primary">{renderMonthlyPrice(p.prices.yearly.opening)}</p>
            <p className="text-sm text-secondary line-through">{p.prices.yearly.annualFull}</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-primary">{p.prices.yearly.annualTotal}</p>
          <p className="mt-4 text-sm text-secondary">
            Prix public (à venir) :{" "}
            <span className="font-semibold text-primary">{p.prices.yearly.public}</span>
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />

      <main className="overflow-x-clip">
        <section className="min-h-screen pt-16 flex items-center justify-center px-6 text-center">
          <div className="mx-auto max-w-[1200px] pb-10 pt-10 md:pb-0 md:pt-0">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-6">Prix</p>
              <h1 className="text-center text-5xl font-bold leading-tight md:text-7xl">
                Analysez vos trades.<br />Améliorez vos performances.
              </h1>
              <div className="mx-auto mt-10 h-px w-12 bg-blue" />
              <p className="mx-auto mt-8 max-w-[520px] text-lg leading-relaxed text-secondary">
                Prenez vos décisions en fonction de vos données, pas de vos émotions.
              </p>
            </RevealSection>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-[1200px] flex flex-col items-center">
            <RevealSection className="text-center w-full">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Nos plans</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Votre niveau.<br />Votre plan.
              </h2>
            </RevealSection>

            <RevealSection delay={80} className="mt-10 flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue bg-blue/10 px-4 py-2 text-sm font-medium text-blue">
                <Flame className="h-4 w-4 shrink-0" aria-hidden />
                <span>Accès anticipé · Places limitées</span>
              </div>
              <p className="text-sm text-secondary">Réservé aux 200 premiers membres.</p>
              <div className="inline-flex items-center rounded-full border border-border bg-card p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setBillingMode("monthly")}
                  className={`rounded-full px-4 py-2 transition-colors ${
                    billingMode === "monthly" ? "bg-background text-primary" : "text-secondary"
                  }`}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setBillingMode("yearly")}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
                    billingMode === "yearly" ? "bg-background text-primary" : "text-secondary"
                  }`}
                >
                  Annuel
                  <span className="rounded-full bg-blue text-primary px-2 py-0.5 text-xs font-semibold">
                    -20%
                  </span>
                </button>
              </div>
            </RevealSection>

            <div className="w-full flex flex-col gap-5 md:flex-row md:items-end mt-10">
              {plans.map((plan, index) => {
                return (
                  <RevealSection key={plan.name} delay={index * 80} className="w-full md:flex-1">
                    <div style={plan.highlighted ? { marginBottom: '-4px' } : undefined}>
                      {plan.highlighted ? (
                        <div className="rounded-xl" style={{ position: 'relative', background: 'linear-gradient(180deg, #2D6FFF 0%, #00E5FF 100%)', padding: '48px 4px 4px 4px' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="font-semibold text-white">Le plus populaire</span>
                          </div>
                          <article className="relative overflow-hidden rounded-xl border border-border bg-card p-8">
                            {billingMode === "yearly" && (
                              <span
                                className="absolute rounded-full bg-blue text-primary px-3 py-1 text-xs font-semibold"
                                style={{ top: 16, right: 16 }}
                              >
                                {plan.yearlySavings}
                              </span>
                            )}
                            <h2 className="text-2xl font-bold">{plan.name}</h2>
                            <p className="mt-2 text-primary">{plan.hook}</p>
                            <p className="text-sm text-secondary">{plan.subhook}</p>
                            {renderPriceBox(plan)}
                            {renderCTA(plan)}
                            <ul className="mt-6 space-y-3">
                              {plan.features.map((feature) => (
                                <li key={feature.label} className="flex items-start gap-2 text-sm">
                                  {feature.included ? (
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue" aria-hidden />
                                  ) : (
                                    <X className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                                  )}
                                  <span className={feature.included ? "text-primary" : "text-secondary"}>{feature.label}</span>
                                </li>
                              ))}
                            </ul>
                          </article>
                        </div>
                      ) : (
                        <article className="relative overflow-hidden rounded-xl border border-border bg-card p-8 hover:border-blue transition-colors duration-200">
                          {billingMode === "yearly" && (
                            <span
                              className="absolute rounded-full bg-blue text-primary px-3 py-1 text-xs font-semibold"
                              style={{ top: 16, right: 16 }}
                            >
                              {plan.yearlySavings}
                            </span>
                          )}
                          <h2 className="text-2xl font-bold">{plan.name}</h2>
                          <p className="mt-2 text-primary">{plan.hook}</p>
                          <p className="text-sm text-secondary">{plan.subhook}</p>

                          {renderPriceBox(plan)}

                          {renderCTA(plan)}

                          <ul className="mt-6 space-y-3">
                            {plan.features.map((feature) => (
                              <li key={feature.label} className="flex items-start gap-2 text-sm">
                                {feature.included ? (
                                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue" aria-hidden />
                                ) : (
                                  <X className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                                )}
                                <span className={feature.included ? "text-primary" : "text-secondary"}>{feature.label}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      )}
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Questions fréquentes</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl md:text-5xl font-bold text-primary">
                Ce que les traders sérieux veulent savoir.
              </h2>
            </RevealSection>

            <div className="mt-12 max-w-[800px] mx-auto space-y-5">
              {faqItems.map((item, index) => (
                <RevealSection key={item.question} delay={index * 40}>
                  <AccordionItem question={item.question} answer={item.answer} />
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-28 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Commencer</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Votre mirror.<br />Sans filtre.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed text-secondary">
                Votre historique. 60 secondes. La vérité.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/analysis" className="btn-primary inline-flex items-center gap-2">
                  Analyse gratuite
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
              <p className="mt-6 text-xs text-secondary">Accès anticipé · 200 places · Prix public à venir · Sans carte bancaire</p>
            </RevealSection>
          </div>
        </section>
      </main>

      <RevealSection className="border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md">
        <Footer />
      </RevealSection>

      <style>{`
        details[open] summary svg {
          transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
}
