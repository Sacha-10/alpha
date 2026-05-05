"use client";

import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Check, Flame, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr'

type BillingMode = "monthly" | "yearly";

type Plan = {
  name: string;
  hook: string;
  subhook: string;
  yearlySavings: string;
  highlighted?: boolean;
  ctaBg: string;
  prices: {
    monthly: { opening: string; openingStriked: string; normal: string };
    yearly: { opening: string; openingStriked: string; normal: string };
  };
  features: Array<{ label: string; included: boolean }>;
};

const plans: Plan[] = [
  {
    name: "PRO",
    hook: "Structurer ses décisions.",
    subhook: "Analyser ses trades avec méthode.",
    yearlySavings: "Économisez 60€",
    ctaBg: "bg-[#1E2035]",
    prices: {
      monthly: { opening: "24.5€/mois", openingStriked: "49.5€/mois", normal: "49.5€/mois" },
      yearly: { opening: "19.5€/mois", openingStriked: "474€/an", normal: "39.5€/mois" },
    },
    features: [
      { label: "4 analyses par mois", included: true },
      { label: "Analyse IA complète GPT-5.4", included: true },
      { label: "Export PDF de vos analyses", included: true },
      { label: "Historique de vos analyses", included: false },
      { label: "Évolution hebdomadaire de performance", included: false },
      { label: "Résumé hebdomadaire de performance", included: false },
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
    yearlySavings: "Économisez 120€",
    highlighted: true,
    ctaBg: "bg-[#2D6FFF]",
    prices: {
      monthly: { opening: "49.5€/mois", openingStriked: "99.5€/mois", normal: "99.5€/mois" },
      yearly: { opening: "39.5€/mois", openingStriked: "954€/an", normal: "79.5€/mois" },
    },
    features: [
      { label: "24 analyses par mois", included: true },
      { label: "Analyse IA complète GPT-5.4", included: true },
      { label: "Export PDF de vos analyses", included: true },
      { label: "Historique de vos analyses sur 6 mois", included: true },
      { label: "Évolution hebdomadaire de performance", included: true },
      { label: "Résumé hebdomadaire de performance", included: true },
      { label: "Support prioritaire", included: false },
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
    yearlySavings: "Économisez 240€",
    ctaBg: "bg-[#1E2035]",
    prices: {
      monthly: { opening: "99.5€/mois", openingStriked: "199.5€/mois", normal: "199.5€/mois" },
      yearly: { opening: "79.5€/mois", openingStriked: "1914€/an", normal: "159.5€/mois" },
    },
    features: [
      { label: "Analyses illimitées", included: true },
      { label: "Analyse IA complète GPT-5.4", included: true },
      { label: "Export PDF de vos analyses", included: true },
      { label: "Historique de vos analyses illimité", included: true },
      { label: "Évolution hebdomadaire de performance", included: true },
      { label: "Résumé hebdomadaire de performance", included: true },
      { label: "Support prioritaire", included: true },
      { label: "Score Prop Firm Readiness", included: true },
      { label: "Détection prédictive de vos setups", included: true },
      { label: "Alertes Telegram de vos setups", included: true },
      { label: "Accès API", included: true },
    ],
  },
];

const faqItems = [
  {
    q: "Mes données sont-elles sécurisées ?",
    r: "Oui vos données sont chiffrées et privées. Vous pouvez les supprimer lorsque vous le souhaitez.",
  },
  {
    q: "Puis-je changer ou résilier mon plan ?",
    r: "Oui vous pouvez changer ou résilier votre plan lorsque vous le souhaitez.",
  },
  {
    q: "Comment fonctionne l'accès anticipé ?",
    r: "L'accès anticipé permet de rejoindre la plateforme à un prix préférentiel. Ce prix est verrouillé à vie pour les 200 premiers membres.",
  },
  {
    q: "Quels formats de trades sont compatibles ?",
    r: "Compatible à MT4, MT5, Binance, Bybit, TradingView, FTMO et FundedNext.",
  },
  {
    q: "À qui s'adresse la plateforme ?",
    r: "Aux traders qui souhaitent analyser, structurer et améliorer leurs performances de manière claire et efficace.",
  },
];

export default function PricingPage() {
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");
  const router = useRouter();
  const handleCheckout = async (planName: string) => {
    const planKey = planName === "PRO" ? "pro" : planName === "PREMIUM" ? "premium" : "elite";
    const billing = billingMode === "yearly" ? "annual" : "monthly";

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/')
      return
    }

    router.push(`/api/create-checkout?plan=${planKey}&billing=${billing}&token=${session.access_token}`)
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans text-[#F0F4FF]">
      <Navbar />

      <main className="px-6 pb-20 pt-32">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2D6FFF] bg-[#2D6FFF]/10 px-4 py-2 text-sm font-medium text-[#2D6FFF]">
            <Flame className="h-4 w-4 shrink-0" aria-hidden />
            <span>Accès anticipé - Places limitées</span>
          </div>
          <p className="mt-2 text-center text-sm text-[#8892AA]">Réservé aux 200 premiers membres.</p>

          <div className="mt-8 inline-flex items-center rounded-full border border-[#1E2035] bg-[#12121A] p-1 text-sm">
            <button
              type="button"
              onClick={() => setBillingMode("monthly")}
              className={`rounded-full px-4 py-2 transition-colors ${
                billingMode === "monthly" ? "bg-[#1E2035] text-[#F0F4FF]" : "text-[#8892AA]"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBillingMode("yearly")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
                billingMode === "yearly" ? "bg-[#1E2035] text-[#F0F4FF]" : "text-[#8892AA]"
              }`}
            >
              Annuel
              <span className="rounded-full bg-[#2D6FFF] px-2 py-0.5 text-xs font-semibold text-[#F0F4FF]">
                Économisez 20%
              </span>
            </button>
          </div>

          <h1 className="mt-10 text-center text-4xl font-bold leading-tight md:text-5xl">
            Analysez vos trades. Améliorez vos performances.
          </h1>
          <p className="mt-4 max-w-3xl text-center text-lg text-[#8892AA]">
            Prenez vos décisions en fonctions de vos données, pas de vos émotions.
          </p>

          <section className="w-full py-20">
            <div className="flex w-full flex-col gap-6 md:flex-row md:items-end">
              {plans.map((plan) => {
                const currentPrices = billingMode === "monthly" ? plan.prices.monthly : plan.prices.yearly;
                return (
                  <div key={plan.name} className="w-full md:flex-1" style={plan.highlighted ? { marginBottom: '-4px' } : undefined}>
                    {plan.highlighted ? (
                      <div className="rounded-xl" style={{ position: 'relative', background: 'linear-gradient(180deg, #2D6FFF 0%, #00E5FF 100%)', padding: '48px 4px 4px 4px' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="font-semibold text-white">Le plus populaire</span>
                        </div>
                        <article className="relative overflow-hidden rounded-xl border border-[#1E2035] bg-[#12121A] p-6">
                          {billingMode === "yearly" && (
                            <span
                              className="absolute rounded-full bg-[#2D6FFF] px-3 py-1 text-xs font-semibold text-white"
                              style={{ top: 16, right: 16 }}
                            >
                              {plan.yearlySavings}
                            </span>
                          )}
                          <h2 className="text-2xl font-bold">{plan.name}</h2>
                          <p className="mt-2 text-[#F0F4FF]">{plan.hook}</p>
                          <p className="text-sm text-[#8892AA]">{plan.subhook}</p>
                          <div className="mt-6 rounded-lg border border-[#1E2035] bg-[#0A0A0F] p-4">
                            <p className="text-xs uppercase tracking-wide text-[#8892AA]">Accès anticipé (à vie)</p>
                            <p className="mt-2 text-3xl font-bold text-[#F0F4FF]">{currentPrices.opening}</p>
                            <p className="mt-1 text-sm text-[#8892AA] line-through">{currentPrices.openingStriked}</p>
                            <p className="mt-4 text-sm text-[#8892AA]">
                              Prix public (à venir) :{" "}
                              <span className="font-semibold text-[#F0F4FF]">{currentPrices.normal}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCheckout(plan.name)}
                            className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold text-[#F0F4FF] transition-opacity hover:opacity-90 ${plan.ctaBg}`}
                          >
                            Commencer
                          </button>
                          <ul className="mt-6 space-y-3">
                            {plan.features.map((feature) => (
                              <li key={feature.label} className="flex items-start gap-2 text-sm">
                                {feature.included ? (
                                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6FFF]" aria-hidden />
                                ) : (
                                  <X className="mt-0.5 h-4 w-4 shrink-0 text-[#8892AA]" aria-hidden />
                                )}
                                <span className={feature.included ? "text-[#F0F4FF]" : "text-[#8892AA]"}>{feature.label}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      </div>
                    ) : (
                      <article className="relative overflow-hidden rounded-xl border border-[#1E2035] bg-[#12121A] p-6">
                        {billingMode === "yearly" && (
                          <span
                            className="absolute rounded-full bg-[#2D6FFF] px-3 py-1 text-xs font-semibold text-white"
                            style={{ top: 16, right: 16 }}
                          >
                            {plan.yearlySavings}
                          </span>
                        )}
                        <h2 className="text-2xl font-bold">{plan.name}</h2>
                        <p className="mt-2 text-[#F0F4FF]">{plan.hook}</p>
                        <p className="text-sm text-[#8892AA]">{plan.subhook}</p>

                        <div className="mt-6 rounded-lg border border-[#1E2035] bg-[#0A0A0F] p-4">
                          <p className="text-xs uppercase tracking-wide text-[#8892AA]">Accès anticipé (à vie)</p>
                          <p className="mt-2 text-3xl font-bold text-[#F0F4FF]">{currentPrices.opening}</p>
                          <p className="mt-1 text-sm text-[#8892AA] line-through">{currentPrices.openingStriked}</p>
                          <p className="mt-4 text-sm text-[#8892AA]">
                            Prix public (à venir) :{" "}
                            <span className="font-semibold text-[#F0F4FF]">{currentPrices.normal}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCheckout(plan.name)}
                          className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold text-[#F0F4FF] transition-opacity hover:opacity-90 ${plan.ctaBg}`}
                        >
                          Commencer
                        </button>

                        <ul className="mt-6 space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature.label} className="flex items-start gap-2 text-sm">
                              {feature.included ? (
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6FFF]" aria-hidden />
                              ) : (
                                <X className="mt-0.5 h-4 w-4 shrink-0 text-[#8892AA]" aria-hidden />
                              )}
                              <span className={feature.included ? "text-[#F0F4FF]" : "text-[#8892AA]"}>{feature.label}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="w-full py-20">
            <h3 className="text-center text-3xl font-bold">Questions fréquentes</h3>
            <div className="mt-10 space-y-4">
              {faqItems.map((item) => (
                <details key={item.q} className="rounded-xl border border-[#1E2035] bg-[#12121A] p-5">
                  <summary className="cursor-pointer list-none text-lg font-semibold text-[#F0F4FF]">{item.q}</summary>
                  <p className="mt-3 text-[#8892AA]">{item.r}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="w-full rounded-2xl bg-[#0A0A0F] px-6 py-16 text-center md:py-20">
            <h2 className="text-2xl font-bold text-[#F0F4FF] md:text-3xl">Votre première analyse IA offerte.</h2>
            <p className="mx-auto mt-6 max-w-lg text-[#8892AA]">Aucune inscription requise.</p>
            <Link
              href="/analysis"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#2D6FFF] px-8 py-3 text-lg font-semibold text-[#F0F4FF] transition-opacity hover:opacity-90"
            >
              Essayez l&apos;analyse gratuite
            </Link>
            <p className="mx-auto mt-4 max-w-lg text-sm text-[#8892AA]">Démonstration immédiate.</p>
          </section>
        </div>
      </main>

      <div className="border-t border-[#1E2035] px-6 py-10">
        <Footer />
      </div>
    </div>
  );
}

