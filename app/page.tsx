"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import LogoSvg from "@/components/LogoSvg";
import { RevealSection } from "@/components/RevealSection";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BrainCircuit,
  ChevronDown,
  Menu,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Upload,
  UserCircle,
  X,
} from "lucide-react";

// Bannière affichée quand le callback d'authentification renvoie vers
// /?error=account_creation_failed (échec de création de la ligne users).
// Overlay absolu ancré sur le <main> (relative), hors flux par défaut :
// empreinte de layout nulle, le hero (items-center dans min-h-screen)
// reste strictement immobile quand elle est absente.
// Rythme : la bannière se cale HERO_RHYTHM_GAP (24px) au-dessus de
// l'eyebrow — le même écart que eyebrow→titre (fusion des marges
// mb-4/mt-6 → 24px) — à tout viewport. Son top est calculé depuis la
// position naturelle de l'eyebrow (getBoundingClientRect neutralisé du
// translateY d'apparition du RevealSection et de l'espaceur courant),
// plafonné à BANNER_MIN_TOP (88px : l'ancien ancrage top-16 + mt-6),
// jamais un pixel sous la navbar (~69px desktop / ~73px mobile). Quand
// 88px ne suffit pas (petits viewports, texte sur 2 lignes), un espaceur
// en flux AVANT le hero pousse la section entière : l'eyebrow retrouve
// ses 24px et tout ce qui suit descend d'autant — l'espace bas du hero →
// « Tableau de bord » est préservé au pixel (pas de compression du
// coussin de centrage). Recalcul au resize, au chargement des polices et
// quand la bannière ou le bloc hero changent de hauteur (ResizeObserver) ;
// le calcul soustrait l'espaceur courant, donc idempotent — pas
// d'oscillation. Même largeur effective que la navbar (les deux : parent
// px-6 + conteneur max-w-[1200px]), donc alignée au pixel sur le logo et
// le bouton. z-10 : au-dessus des fonds opaques des sections (les
// RevealSection, transformées, peignent après elle), sous la navbar
// (z-50). Pilotée par l'URL : toute navigation la fait disparaître.
// Fermeture via la croix ou auto-dismiss à 10 s ; les deux retirent le
// paramètre de l'URL (router.replace) pour qu'un refresh ne la réaffiche
// pas. useSearchParams impose un boundary <Suspense> sur une page
// prérendue.
const HERO_RHYTHM_GAP = 24;
const BANNER_MIN_TOP = 88;

function AccountCreationErrorBanner({
  eyebrowRef,
}: {
  eyebrowRef: React.RefObject<HTMLParagraphElement | null>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visible = searchParams.get("error") === "account_creation_failed";
  const [dismissed, setDismissed] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const [top, setTop] = useState(BANNER_MIN_TOP);
  const [spacerHeight, setSpacerHeight] = useState(0);

  const dismiss = useCallback(() => {
    setDismissed(true);
    router.replace("/", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!visible || dismissed) return;
    const timer = setTimeout(dismiss, 10_000);
    return () => clearTimeout(timer);
  }, [visible, dismissed, dismiss]);

  useLayoutEffect(() => {
    if (!visible || dismissed) return;

    const recompute = () => {
      const eyebrow = eyebrowRef.current;
      const box = boxRef.current;
      if (!eyebrow || !box) return;
      const reveal = eyebrow.closest<HTMLElement>("main > *");
      const revealTransform = reveal ? getComputedStyle(reveal).transform : "none";
      const revealShift = revealTransform === "none" ? 0 : new DOMMatrixReadOnly(revealTransform).m42;
      const currentSpacer = spacerRef.current?.offsetHeight ?? 0;
      const eyebrowNaturalTop =
        eyebrow.getBoundingClientRect().top + window.scrollY - revealShift - currentSpacer;
      const boxHeight = box.getBoundingClientRect().height;
      const wantedTop = eyebrowNaturalTop - HERO_RHYTHM_GAP - boxHeight;
      if (wantedTop >= BANNER_MIN_TOP) {
        setTop(wantedTop);
        setSpacerHeight(0);
      } else {
        setTop(BANNER_MIN_TOP);
        setSpacerHeight(BANNER_MIN_TOP + boxHeight + HERO_RHYTHM_GAP - eyebrowNaturalTop);
      }
    };

    recompute();
    window.addEventListener("resize", recompute);
    const observer = new ResizeObserver(recompute);
    if (boxRef.current) observer.observe(boxRef.current);
    if (eyebrowRef.current?.parentElement) observer.observe(eyebrowRef.current.parentElement);
    void document.fonts?.ready.then(recompute);
    return () => {
      window.removeEventListener("resize", recompute);
      observer.disconnect();
    };
  }, [visible, dismissed, eyebrowRef]);

  if (!visible || dismissed) return null;

  return (
    <>
      <div className="absolute inset-x-0 z-10 px-6" style={{ top: `${top}px` }}>
        <div
          ref={boxRef}
          className="relative mx-auto max-w-[1200px] rounded-lg border border-red/30 bg-red/10 px-12 py-3 text-center text-sm text-red"
        >
          Une erreur est survenue. Réessayez de vous connecter.
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fermer"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-red/70 transition-colors duration-200 hover:text-red"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <div ref={spacerRef} aria-hidden style={{ height: `${spacerHeight}px` }} />
    </>
  );
}

function ServiceCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="card rounded p-7 transition-colors duration-200 hover:border-blue">
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
  // Repère de rythme pour la bannière d'erreur (voir AccountCreationErrorBanner).
  const heroEyebrowRef = useRef<HTMLParagraphElement | null>(null);

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

  const DASHBOARD_DESKTOP_WIDTH = 1440;
  const DASHBOARD_MOBILE_WIDTH = 390;

  const dashboardContainerRef = useRef<HTMLDivElement | null>(null);
  const [dashboardScale, setDashboardScale] = useState(1);
  const [isMobileDashboard, setIsMobileDashboard] = useState(false);
  const [dashboardHeight, setDashboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(900);

  const updateDashboardScale = useCallback(() => {
    if (!dashboardContainerRef.current || typeof window === 'undefined') return;
    const containerWidth = dashboardContainerRef.current.offsetWidth;
    const mobile = window.innerWidth < 768;
    setIsMobileDashboard(mobile);
    const referenceWidth = mobile ? DASHBOARD_MOBILE_WIDTH : DASHBOARD_DESKTOP_WIDTH;
    const scale = containerWidth / referenceWidth;
    setDashboardScale(scale);
    setViewportHeight(window.innerHeight);
    setDashboardHeight(window.innerHeight * scale);
  }, []);

  useEffect(() => {
    updateDashboardScale();
    window.addEventListener('resize', updateDashboardScale);
    return () => window.removeEventListener('resize', updateDashboardScale);
  }, [updateDashboardScale]);

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />

      <main className="relative overflow-x-clip">
        <Suspense fallback={null}>
          <AccountCreationErrorBanner eyebrowRef={heroEyebrowRef} />
        </Suspense>
        <RevealSection className="min-h-screen pt-16 flex items-center justify-center px-6 bg-gradient-to-b from-background to-card">
          <div className="mx-auto max-w-[1200px] pb-10 pt-10 md:pb-0 md:pt-0 text-center">
          <p ref={heroEyebrowRef} className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">AlphaTradeX</p>
          <h1 className="mx-auto mt-6 max-w-[1200px] text-balance md:[text-wrap:normal] text-5xl font-bold leading-tight text-primary md:text-7xl">
            Les meilleurs traders n&apos;ont pas plus travaillé.
            <br />
            Ils ont mieux <span className="text-blue">compris</span>.
          </h1>

          <div className="mx-auto mt-10 h-px w-12 bg-blue" />

          <p className="mx-auto mt-8 max-w-[520px] leading-relaxed text-lg text-secondary">
            Notre IA analyse chaque trade, chaque décision, chaque pattern pour que vous ne répétiez plus jamais les
            mêmes erreurs.
          </p>

          </div>
        </RevealSection>

        <section className="bg-card px-6">
          <div className="mx-auto max-w-[1200px] py-20">
            <RevealSection className="text-center mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Tableau de bord</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Votre espace.<br />Notre analyse.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed text-secondary">
                Un dashboard pensé pour les traders qui exigent la précision.
              </p>
            </RevealSection>
            <RevealSection delay={120}>
            <div ref={dashboardContainerRef} className="card glow-blue rounded overflow-hidden" style={{
              position: 'relative',
              overflow: 'hidden',
              height: dashboardHeight > 0 ? `${dashboardHeight}px` : 'auto',
            }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: `scale(${dashboardScale})`,
                  transformOrigin: 'top left',
                  width: `${isMobileDashboard ? DASHBOARD_MOBILE_WIDTH : DASHBOARD_DESKTOP_WIDTH}px`,
                  height: `${viewportHeight}px`,
                }}
              >
              {/* Topbar desktop */}
              <div className="hidden md:flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
                <div className="flex items-center gap-2">
                  <LogoSvg size={28} />
                  <span className="font-semibold text-primary">AlphaTradeX</span>
                </div>
                <div className="flex min-w-0 flex-1 items-center justify-start pl-6 md:pl-10">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue" aria-hidden />
                    <span className="text-xs text-secondary">IA active</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-[#2D6FFF40] bg-[#2D6FFF15] px-3 py-1 text-xs font-semibold text-blue">Élite</span>
                  <span className="text-xs text-secondary">Cycle · 01/01</span>
                  <button type="button" className="rounded-md border border-border px-3 py-1.5 text-xs text-secondary cursor-default">Se déconnecter</button>
                </div>
              </div>
              {/* Topbar mobile */}
              <div className="relative flex md:hidden h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
                <LogoSvg size={28} />
                <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-primary">AlphaTradeX</span>
                <div className="shrink-0 rounded-md border border-border p-2 text-secondary cursor-default">
                  <Menu className="h-5 w-5" aria-hidden />
                </div>
              </div>
              {/* Body */}
              <div className="flex overflow-hidden" style={{ height: 'calc(100% - 56px)' }}>
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
                <main className="flex flex-1 flex-col items-center justify-center bg-[#0A0A0F] p-6">
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="w-full">
                      <div className="text-center mb-4">
                        <h3 className="text-2xl font-bold text-primary">Analyser vos trades</h3>
                      </div>
                      <div className="border-2 border-dashed rounded-xl p-8 text-center mb-6 w-full border-border cursor-pointer transition-colors hover:border-blue/50">
                        <Upload className="h-6 w-6 text-secondary mx-auto mb-2" aria-hidden />
                        <p className="text-primary text-sm font-medium">Importez votre historique de trades</p>
                        <p className="text-secondary text-xs mt-1">MT4 · MT5 · Binance · Bybit · TradingView · FTMO · FundedNext</p>
                      </div>
                      <div className="mt-4 w-full max-w-md mx-auto flex justify-center">
                        <button type="button" className="btn-primary py-2.5 opacity-40 cursor-default">Analyser mes trades</button>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
              </div>
            </div>
            </RevealSection>
          </div>
        </section>

        <section className="bg-background px-6">
          <div className="mx-auto max-w-[1200px] py-20 text-center">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Compatibilité</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl md:text-5xl font-bold text-primary">
                Vos plateformes.<br />Notre analyse.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-base text-secondary">
                Votre historique importé. Vos biais exposés.
              </p>
            </RevealSection>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
              {["MT4", "MT5", "Binance", "Bybit", "TradingView", "FTMO", "FundedNext"].map((platform, index) => (
                <RevealSection key={platform} delay={index * 60}>
                  <div className="card cursor-default rounded px-7 py-3 font-mono text-sm font-semibold text-primary transition-colors duration-200 hover:border-blue">
                    {platform}
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="bg-card px-6">
          <div className="mx-auto max-w-[1200px] py-20">
          <RevealSection className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">Services</p>
            <h2 className="mx-auto max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
              Tout pour trader au plus haut{" "}
              <span className="text-primary">niveau</span>.
            </h2>
            <p className="mt-4 max-w-[520px] mx-auto text-base leading-relaxed text-secondary">Passez de l&apos;instinct à la stratégie.</p>
          </RevealSection>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <RevealSection delay={0}>
              <ServiceCard
                icon={<BrainCircuit className="h-8 w-8 text-blue" aria-hidden />}
                title="Structurer ses décisions"
                body="Chaque analyse décrypte vos schémas émotionnels, mesure vos métriques au trade près et livre votre plan d&apos;action priorisé."
              />
            </RevealSection>
            <RevealSection delay={100}>
              <ServiceCard
                icon={<BarChart3 className="h-8 w-8 text-cyan" aria-hidden />}
                title="Optimiser sa régularité"
                body="Votre évolution révèle votre trajectoire chaque semaine, délivre le verdict de chacune et désigne votre levier pour la suivante."
              />
            </RevealSection>
            <RevealSection delay={200}>
              <ServiceCard
                icon={<BellRing className="h-8 w-8 text-green" aria-hidden />}
                title="Maîtriser son exécution"
                body="L&apos;IA détecte vos setups les plus légitimes, vous dévoile chacun de ces signaux et alimente vos exécutions via l&apos;API."
              />
            </RevealSection>
          </div>
          </div>
        </section>

        <section className="bg-background px-6">
          <div className="mx-auto max-w-[1200px] py-20">
            <RevealSection className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">Technologie</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl md:text-5xl font-bold leading-tight text-primary">
                Propulsé par{" "}
                <span className="text-primary">GPT-5.6 Sol</span>.
              </h2>
              <p className="mt-4 max-w-[520px] mx-auto text-base text-secondary">
                Vous savez lorsque les autres vont deviner. Le modèle IA le plus avancé d&apos;OpenAI sur chaque analyse.
              </p>
            </RevealSection>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <RevealSection delay={0}>
                <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                  <BrainCircuit className="h-8 w-8 text-blue" aria-hidden />
                  <h3 className="mt-5 text-xl font-semibold text-primary">Précision chirurgicale</h3>
                  <p className="mt-3 text-sm leading-relaxed text-secondary">
                    GPT-5.6 Sol raisonne en analyste senior et décèle ce que les autres modèles vont manquer.
                  </p>
                </article>
              </RevealSection>
              <RevealSection delay={100}>
                <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                  <ShieldCheck className="h-8 w-8 text-cyan" aria-hidden />
                  <h3 className="mt-5 text-xl font-semibold text-primary">Fiabilité inégalée</h3>
                  <p className="mt-3 text-sm leading-relaxed text-secondary">
                    Encore moins d&apos;hallucinations et aucune sur vos données. L&apos;exacte réalité sur chaque analyse.
                  </p>
                </article>
              </RevealSection>
              <RevealSection delay={200}>
                <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                  <TrendingUp className="h-8 w-8 text-green" aria-hidden />
                  <h3 className="mt-5 text-xl font-semibold text-primary">Disponibilité immédiate</h3>
                  <p className="mt-3 text-sm leading-relaxed text-secondary">
                    Analyse complète générée en 60 secondes. Vous pouvez l&apos;utiliser lorsque vous en avez
                    besoin.
                  </p>
                </article>
              </RevealSection>
            </div>
          </div>
        </section>

        <section className="bg-card px-6">
          <div className="mx-auto max-w-[1200px] py-20">
            <RevealSection className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">Système</p>
              <h2 className="mx-auto max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Le système que les traders{" "}
                <span className="text-primary">disciplinés</span>{" "}
                vont utiliser.
              </h2>
              <p className="mt-4 max-w-[520px] mx-auto text-base text-secondary">
                Passez d&apos;un trading émotionnel à une exécution maîtrisée, mesurable et optimisée. Éliminer de
                manière définitive vos erreurs structurelles
              </p>
            </RevealSection>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <RevealSection delay={0}>
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
              </RevealSection>
              <RevealSection delay={70}>
                <article className="card rounded p-7 hover:border-blue transition-colors duration-200">
                  <BarChart3 className="h-8 w-8 text-cyan" aria-hidden />
                  <h3 className="mt-5 text-xl font-semibold text-primary">Des données réelles. Des décisions précises</h3>
                  <p className="mt-3 text-sm leading-relaxed text-secondary">
                    Votre analyse repose sur vos propres trades, pas sur des données génériques.
                    Chaque analyse est personnalisée afin de révéler ce qui fonctionne vraiment
                    et ce qui vous freine.
                  </p>
                </article>
              </RevealSection>
              <RevealSection delay={140}>
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
              </RevealSection>
              <RevealSection delay={210}>
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
              </RevealSection>
            </div>
          </div>
        </section>

        <section className="bg-background px-6">
          <div className="mx-auto max-w-[1200px] py-20">
            <RevealSection className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">Témoignages</p>
              <h2 className="mx-auto max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Ce que les traders{" "}
                <span className="text-primary">sérieux</span> ont vu
                que les autres ont ignoré.
              </h2>
              <p className="mt-4 max-w-[520px] mx-auto text-base text-secondary">
                Une lecture précise de leurs erreurs, de leurs forces et de leurs réels leviers de performance.
              </p>
            </RevealSection>

            <div className="mt-12 grid gap-5 md:grid-cols-4">
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
              ].map((item, index) => (
                <RevealSection key={item.name} delay={index * 70}>
                  <article className="relative rounded border border-border bg-card p-7 hover:border-blue transition-colors duration-200">
                    <span className="absolute right-4 top-3 text-5xl font-bold text-blue/20">&ldquo;</span>
                    <p className="mb-3 text-sm tracking-widest text-blue">★★★★★</p>
                    <p className="text-sm leading-relaxed text-secondary">{item.quote}</p>
                    <p className="mt-5 text-sm font-semibold text-primary">{item.name}</p>
                    <p className="text-xs text-secondary">{item.role}</p>
                  </article>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <section id="analyse" className="bg-card px-6">
          <div className="mx-auto max-w-[1200px] py-28 text-center">
          <RevealSection>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">Analyse gratuite</p>
            <h2 className="mx-auto max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
              Ce que l&apos;IA{" "}
              <span className="text-primary">révèle</span> en 60
              secondes.
            </h2>
            <p className="mt-4 max-w-[520px] mx-auto text-base leading-relaxed text-secondary">Aucune inscription requise</p>
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
          </RevealSection>
          </div>
        </section>
      </main>

      <section className="bg-gradient-to-b from-card to-background px-6 py-28 text-center">
        <div className="mx-auto max-w-[1200px]">
          <RevealSection>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4">Commencer</p>
            <h2 className="mx-auto max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
              Rejoignez l&apos;
              <span className="text-primary">élite</span> des
              traders.
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed text-secondary">Votre historique. 60 secondes. La vérité.</p>
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
          </RevealSection>
        </div>
      </section>

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
