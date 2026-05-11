"use client";

import { getSupabaseClient } from "@/lib/supabase";
import { detectAndParse } from "@/lib/parseCSV";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import TradeReport from "@/components/TradeReport";
import UploadZone from "@/components/UploadZone";
import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes";
import {
  Bell,
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
  Target,
  TrendingUp,
  Webhook,
} from "lucide-react";

const SESSION_KEY_REPORT = "atx_last_report";
const SESSION_KEY_LEFT = "atx_analyses_left";
const SESSION_KEY_LIMIT = "atx_analyses_limit";

const LogoSvg = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 600 600"
    style={{ borderRadius: "8px", flexShrink: 0 }}
    aria-hidden
  >
    <rect width="600" height="600" rx="125" ry="125" fill="#0A0A0F" />
    <svg
      x="75"
      y="75"
      width="450"
      height="450"
      viewBox="0 0 24 24"
      fill="#0A0A0F"
      stroke="#2D6FFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  </svg>
);

type DashboardView =
  | "nouvelle-analyse"
  | "mon-analyse"
  | "historique"
  | "journal-analyses"
  | "evolution"
  | "resume-hebdomadaire"
  | "prop-firm-score"
  | "detection-predictive"
  | "alertes-telegram"
  | "acces-api"
  | "support";
type SectionKey = "analyse" | "performance" | "signaux" | "aide" | "compte";

function normalizeApiError(message: unknown): string {
  if (typeof message !== "string") return "Erreur d'analyse.";
  return message.replace(/\s+/g, " ").trim();
}

function EmptyFeaturePage({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Icon className="h-12 w-12 text-secondary opacity-30" aria-hidden />
      <h2 className="mt-6 text-xl font-bold text-primary">{title}</h2>
    </div>
  );
}

export default function DashboardClient() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");
  const paymentSuccess = searchParams.get("success") === "true";

  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [analysesLeft, setAnalysesLeft] = useState<number | undefined>();
  const [analysesLimit, setAnalysesLimit] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [analysesResetDate, setAnalysesResetDate] = useState<string | null>(null);

  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentSuccess || checkout === "success");
  const [bannerVisible, setBannerVisible] = useState(true);

  const [mainView, setMainView] = useState<DashboardView>("nouvelle-analyse");

  const [hasSessionReport, setHasSessionReport] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadZoneKey, setUploadZoneKey] = useState(0);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    analyse: false,
    performance: false,
    signaux: false,
    aide: false,
    compte: false,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // BUG 2 — Restore last report from sessionStorage on mount
  useEffect(() => {
    try {
      const savedReport = sessionStorage.getItem(SESSION_KEY_REPORT);
      if (savedReport) {
        setAnalysis(JSON.parse(savedReport) as AiAnalysisResult);
        setHasSessionReport(true);
      }
    } catch {
      // ignore corrupted sessionStorage
    }
  }, []);

  useEffect(() => {
    if (!showSuccessBanner) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    url.searchParams.delete("checkout");
    window.history.replaceState({}, "", url.toString());
    const autoHide = setTimeout(() => {
      setBannerVisible(false);
      setTimeout(() => setShowSuccessBanner(false), 500);
    }, 10000);
    return () => clearTimeout(autoHide);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // BUG 3 & 4 — fetchUserData as standalone function, called on mount and after analysis
  const fetchUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("subscription_plan, analyses_used, analyses_limit, analyses_reset_date")
      .eq("id", user.id)
      .single();
    if (data) {
      setSubscriptionPlan(data.subscription_plan ?? null);
      setAnalysesResetDate(data.analyses_reset_date ?? null);
      // BUG 4 — analysesLeft always derived from Supabase, never local calc
      if (data.analyses_limit != null && data.analyses_used != null) {
        const left = Math.max(0, data.analyses_limit - data.analyses_used);
        setAnalysesLeft(left);
        setAnalysesLimit(data.analyses_limit);
        // Sync sessionStorage so refresh shows correct count
        sessionStorage.setItem(SESSION_KEY_LEFT, String(left));
        sessionStorage.setItem(SESSION_KEY_LIMIT, String(data.analyses_limit));
      }
    }
  }, [supabase]);

  useEffect(() => {
    void fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const runAnalyze = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysesLeft(undefined);
    setAnalysesLimit(undefined);
    setHasSessionReport(false);
    setPendingFile(null);
    setUploadZoneKey((k) => k + 1);
    setMainView((prev) => (prev === "mon-analyse" ? "nouvelle-analyse" : prev));
    // BUG 2 — Clear sessionStorage when user uploads a new file
    sessionStorage.removeItem(SESSION_KEY_REPORT);
    sessionStorage.removeItem(SESSION_KEY_LEFT);
    sessionStorage.removeItem(SESSION_KEY_LIMIT);
    try {
      const trades = await detectAndParse(file);
      if (!trades.length) {
        setError("Aucun trade trouvé dans le fichier.");
        return;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(normalizeApiError(data.error));
        return;
      }

      const {
        analysesLeft: _left,
        analysesLimit: _limit,
        ...report
      } = data as {
        analysesLeft: number;
        analysesLimit: number;
      } & AiAnalysisResult;

      setAnalysis(report);
      setHasSessionReport(true);
      // BUG 2 — Save report to sessionStorage
      sessionStorage.setItem(SESSION_KEY_REPORT, JSON.stringify(report));

      // BUG 3 & 4 — Refetch from Supabase to get authoritative counts
      await fetchUserData();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Réseau indisponible."
      );
    } finally {
      setLoading(false);
    }
  }, [fetchUserData]);

  function formatResetDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const analysesUsed =
    analysesLimit !== undefined && analysesLeft !== undefined
      ? Math.max(0, analysesLimit - analysesLeft)
      : undefined;
  const normalizedPlan = (subscriptionPlan ?? "").toLowerCase();
  const isPro = normalizedPlan === "pro";
  const isElite = normalizedPlan === "elite";
  const planLabel = subscriptionPlan
    ? subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)
    : "Pro";
  const cycleLabel = analysesResetDate
    ? `Cycle · ${formatResetDate(analysesResetDate)}`
    : "Cycle · --/--";
  const progressWidth =
    analysesUsed !== undefined && analysesLimit && analysesLimit > 0
      ? Math.min(100, (analysesUsed / analysesLimit) * 100)
      : 0;

  const showQuotaCard =
    analysesUsed !== undefined &&
    analysesLimit !== undefined &&
    analysesLimit < 999999;

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function SectionLabel({
    children,
    sectionKey,
  }: {
    children: ReactNode;
    sectionKey: SectionKey;
  }) {
    const isOpen = openSections[sectionKey];
    return (
      <button
        type="button"
        onClick={() =>
          setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))
        }
        className="flex w-full items-center justify-between px-2 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary"
      >
        <span>{children}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
    );
  }

  function SidebarNavRow({
    icon: Icon,
    label,
    active = false,
    locked = false,
    lockPlanLabel,
    lockedPath = "/pricing",
    onSelect,
    onAfterNavigate,
  }: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    active?: boolean;
    locked?: boolean;
    lockPlanLabel?: string;
    lockedPath?: string;
    onSelect?: () => void;
    onAfterNavigate?: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={() => {
          if (locked) {
            router.push(lockedPath);
            onAfterNavigate?.();
            return;
          }
          onSelect?.();
          onAfterNavigate?.();
        }}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
          locked
            ? "cursor-not-allowed opacity-40"
            : active
              ? "border border-[#2D6FFF25] bg-[#2D6FFF15] text-primary"
              : "cursor-pointer text-secondary hover:bg-hover hover:text-primary"
        }`}
        title={locked && lockPlanLabel ? `Disponible sur plan ${lockPlanLabel}` : undefined}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </span>
        {locked ? <Lock className="h-4 w-4 shrink-0 text-secondary" /> : null}
      </button>
    );
  }

  const historiqueLocked = isPro;
  const evolutionLocked = isPro;
  const resumeLocked = isPro;
  const propFirmLocked = !isElite;
  const signauxLocked = !isElite;

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  function renderQuotaCard() {
    if (!showQuotaCard) return null;
    return (
      <div className="sticky bottom-0 z-10 w-full shrink-0 border-t border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-secondary">Analyses restantes</span>
          <span className="font-mono text-xs text-primary">
            {analysesUsed}/{analysesLimit}
          </span>
        </div>
        <div className="h-1 w-full bg-[#1E2035]">
          <div
            className="h-full bg-[#2D6FFF]"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>
    );
  }

  function renderSidebarAccordion(closeMobile?: () => void) {
    return (
      <div className="space-y-1">
        <SectionLabel sectionKey="analyse">Analyse</SectionLabel>
        {openSections.analyse ? (
          <>
            <SidebarNavRow
              icon={ScanLine}
              label="Nouvelle analyse"
              active={mainView === "nouvelle-analyse"}
              onSelect={() => setMainView("nouvelle-analyse")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={ScrollText}
              label="Journal analyses"
              active={mainView === "journal-analyses"}
              onSelect={() => setMainView("journal-analyses")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={History}
              label="Historique"
              locked={historiqueLocked}
              lockPlanLabel="Premium"
              active={mainView === "historique"}
              onSelect={() => setMainView("historique")}
              onAfterNavigate={closeMobile}
            />
          </>
        ) : null}

        <SectionLabel sectionKey="performance">Performance</SectionLabel>
        {openSections.performance ? (
          <>
            <SidebarNavRow
              icon={TrendingUp}
              label="Évolution semaine"
              locked={evolutionLocked}
              lockPlanLabel="Premium"
              active={mainView === "evolution"}
              onSelect={() => setMainView("evolution")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={CalendarCheck}
              label="Résumé semaine"
              locked={resumeLocked}
              lockPlanLabel="Premium"
              active={mainView === "resume-hebdomadaire"}
              onSelect={() => setMainView("resume-hebdomadaire")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={Target}
              label="Prop Firm Score"
              locked={propFirmLocked}
              lockPlanLabel="Elite"
              active={mainView === "prop-firm-score"}
              onSelect={() => setMainView("prop-firm-score")}
              onAfterNavigate={closeMobile}
            />
          </>
        ) : null}

        <SectionLabel sectionKey="signaux">Signaux</SectionLabel>
        {openSections.signaux ? (
          <>
            <SidebarNavRow
              icon={Radar}
              label="Détection prédictive"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "detection-predictive"}
              onSelect={() => setMainView("detection-predictive")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={Bell}
              label="Alertes Telegram"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "alertes-telegram"}
              onSelect={() => setMainView("alertes-telegram")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={Webhook}
              label="Accès API"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "acces-api"}
              onSelect={() => setMainView("acces-api")}
              onAfterNavigate={closeMobile}
            />
          </>
        ) : null}

        <SectionLabel sectionKey="aide">Aide</SectionLabel>
        {openSections.aide ? (
          <SidebarNavRow
            icon={Headphones}
            label="Support prioritaire"
            active={mainView === "support"}
            locked={isPro}
            lockPlanLabel="Premium"
            lockedPath="/help"
            onSelect={() => setMainView("support")}
            onAfterNavigate={closeMobile}
          />
        ) : null}

        <SectionLabel sectionKey="compte">Compte</SectionLabel>
        {openSections.compte ? (
          <>
            <SidebarNavRow
              icon={CreditCard}
              label="Offres"
              onSelect={() => router.push("/pricing")}
              onAfterNavigate={closeMobile}
            />
            <a
              href="/api/customer-portal"
              onClick={() => closeMobile?.()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary transition-all duration-150 hover:bg-hover hover:text-primary"
            >
              <Receipt className="h-4 w-4 shrink-0" />
              Factures
            </a>
          </>
        ) : null}
      </div>
    );
  }

  function renderMainContent() {
    if (mainView === "mon-analyse") {
      if (!analysis) {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center text-secondary">
            <p className="text-sm">Aucun rapport à afficher.</p>
          </div>
        );
      }
      return (
        <TradeReport
          report={analysis}
          analysesLeft={analysesLeft}
          analysesLimit={analysesLimit}
        />
      );
    }

    if (mainView === "historique") {
      return <EmptyFeaturePage icon={History} title="Historique" />;
    }
    if (mainView === "journal-analyses") {
      return <EmptyFeaturePage icon={ScrollText} title="Journal analyses" />;
    }
    if (mainView === "evolution") {
      return <EmptyFeaturePage icon={TrendingUp} title="Évolution semaine" />;
    }
    if (mainView === "resume-hebdomadaire") {
      return <EmptyFeaturePage icon={CalendarCheck} title="Résumé semaine" />;
    }
    if (mainView === "prop-firm-score") {
      return <EmptyFeaturePage icon={Target} title="Prop Firm Score" />;
    }
    if (mainView === "detection-predictive") {
      return <EmptyFeaturePage icon={Radar} title="Détection prédictive" />;
    }
    if (mainView === "alertes-telegram") {
      return <EmptyFeaturePage icon={Bell} title="Alertes Telegram" />;
    }
    if (mainView === "acces-api") {
      return <EmptyFeaturePage icon={Webhook} title="Accès API" />;
    }
    if (mainView === "support") {
      return <EmptyFeaturePage icon={Headphones} title="Support prioritaire" />;
    }

    // nouvelle-analyse
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-primary">Nouvelle analyse</h1>
          <p className="mt-1 text-sm text-secondary">Importez votre historique CSV</p>
        </div>
        <div className="mt-4 w-full max-w-md">
          <UploadZone
            key={uploadZoneKey}
            loading={loading}
            onFileChange={setPendingFile}
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="btn-primary py-2.5 px-6 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!pendingFile || loading}
            onClick={() => {
              if (pendingFile) void runAnalyze(pendingFile);
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                L&apos;IA analyse vos trades...
              </span>
            ) : (
              "Analyser mes trades"
            )}
          </button>
          {hasSessionReport ? (
            <button
              type="button"
              className="btn-outline py-2.5 px-6"
              onClick={() => setMainView("mon-analyse")}
            >
              Mon analyse
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-primary">
      <header className="z-20 h-14 shrink-0 border-b border-border bg-card">
        <div className="hidden h-full items-center justify-between px-4 md:flex">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex shrink-0 items-center gap-2 text-left"
          >
            <LogoSvg />
            <span className="font-semibold text-primary">AlphaTradeX</span>
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-start pl-6 md:pl-10">
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2D6FFF]"
                aria-hidden
              />
              <span className="text-xs text-secondary">IA active</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-md border border-[#2D6FFF40] bg-[#2D6FFF15] px-3 py-1 text-xs font-semibold text-blue">
              {planLabel}
            </span>
            <span className="text-xs text-secondary">{cycleLabel}</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-secondary hover:bg-hover hover:text-primary"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="relative flex h-full items-center justify-between px-4 md:hidden">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex shrink-0 items-center text-left"
            aria-label="AlphaTradeX — accueil"
          >
            <LogoSvg />
          </button>
          <Link
            href="/"
            className="absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate font-semibold text-primary"
          >
            AlphaTradeX
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="shrink-0 rounded-md border border-border p-2 text-secondary hover:bg-hover hover:text-primary"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="flex max-h-[calc(100vh-3.5rem)] shrink-0 flex-col overflow-hidden border-b border-border bg-card md:hidden">
          <div className="shrink-0 space-y-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2D6FFF]"
                  aria-hidden
                />
                <span className="text-xs text-secondary">IA active</span>
              </div>
              <span className="rounded-md border border-[#2D6FFF40] bg-[#2D6FFF15] px-3 py-1 text-xs font-semibold text-blue">
                {planLabel}
              </span>
            </div>
            <p className="text-center text-xs text-secondary">{cycleLabel}</p>
            <div className="h-px w-full bg-border" aria-hidden />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-1">
            {renderSidebarAccordion(closeMobileMenu)}
          </div>
          <div className="shrink-0 bg-card">
            <div className="h-px bg-border mx-4" aria-hidden />
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                void signOut();
              }}
              className="w-full px-4 py-3 text-left text-sm text-secondary hover:text-primary"
            >
              Déconnexion
            </button>
          </div>
          {renderQuotaCard()}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="hidden h-full w-[280px] shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            {renderSidebarAccordion()}
          </div>
          {renderQuotaCard()}
        </aside>

        <main
          className={`flex min-h-0 flex-1 flex-col bg-[#0A0A0F] p-6 ${
            mainView === "nouvelle-analyse" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div className="flex shrink-0 flex-col gap-4">
            {showSuccessBanner ? (
              <div
                className={`flex items-center justify-between rounded-lg border border-green/35 bg-green/10 px-4 py-3 text-sm text-green transition-opacity duration-500 ${bannerVisible ? "opacity-100" : "opacity-0"}`}
              >
                <span>
                  {subscriptionPlan
                    ? `Plan ${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} activé.`
                    : "Plan activé."}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBannerVisible(false);
                    setTimeout(() => setShowSuccessBanner(false), 500);
                  }}
                  className="ml-4 text-green hover:opacity-70"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
            ) : null}

            {checkout === "cancel" ? (
              <p className="rounded-lg border border-red/35 bg-red/10 px-4 py-3 text-sm text-red">
                Paiement annulé. Vous pouvez réessayer quand vous voulez.
              </p>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {mainView !== "nouvelle-analyse" && mainView !== "mon-analyse" ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                {renderMainContent()}
              </div>
            ) : (
              renderMainContent()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
