"use client";

import { getSupabaseClient } from "@/lib/supabase";
import { detectAndParse } from "@/lib/parseCSV";
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
  BrainCircuit,
  CalendarCheck,
  Code2,
  CreditCard,
  FileText,
  History,
  Lock,
  Radar,
  Receipt,
  Target,
  TrendingUp,
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
  | "evolution"
  | "resume-hebdomadaire"
  | "prop-firm-score"
  | "detection-predictive"
  | "alertes-telegram"
  | "acces-api";

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

  const runAnalyze = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysesLeft(undefined);
    setAnalysesLimit(undefined);
    setHasSessionReport(false);
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

  const onAnalyzeFile = useCallback(
    (file: File) => {
      void runAnalyze(file);
    },
    [runAnalyze]
  );

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

  const psychScoreRaw = analysis
    ? analysis.psychologicalProfile.overallScore <= 1
      ? analysis.psychologicalProfile.overallScore * 100
      : analysis.psychologicalProfile.overallScore
    : null;
  const lastPsychScore =
    psychScoreRaw !== null ? Math.round(psychScoreRaw) : null;
  const psychScoreColor =
    lastPsychScore === null
      ? "text-secondary"
      : lastPsychScore > 60
        ? "text-green"
        : lastPsychScore >= 40
          ? "text-cyan"
          : "text-red";

  const lastWinRate = analysis
    ? analysis.globalStats.winRate <= 1
      ? analysis.globalStats.winRate * 100
      : analysis.globalStats.winRate
    : null;
  const lastPnl = analysis?.globalStats.totalPnL ?? null;

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function SectionLabel({ children }: { children: ReactNode }) {
    return (
      <p className="px-2 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary">
        {children}
      </p>
    );
  }

  function SidebarNavRow({
    icon: Icon,
    label,
    active = false,
    locked = false,
    lockPlanLabel,
    onSelect,
  }: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    active?: boolean;
    locked?: boolean;
    lockPlanLabel?: string;
    onSelect?: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={() => {
          if (locked) {
            router.push("/pricing");
            return;
          }
          onSelect?.();
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
    if (mainView === "evolution") {
      return <EmptyFeaturePage icon={TrendingUp} title="Évolution" />;
    }
    if (mainView === "resume-hebdomadaire") {
      return <EmptyFeaturePage icon={CalendarCheck} title="Résumé hebdomadaire" />;
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
      return <EmptyFeaturePage icon={Code2} title="Accès API" />;
    }

    // nouvelle-analyse
    return (
      <>
        <div>
          <h1 className="text-2xl font-bold text-primary">Nouvelle analyse</h1>
          <p className="mt-1 text-sm text-secondary">Importez votre historique CSV</p>
        </div>

        <div className="mx-auto mt-8 w-full max-w-xl">
          <UploadZone loading={loading} onAnalyze={onAnalyzeFile} />
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red" role="alert">
            {error}
          </p>
        ) : null}

        {hasSessionReport && analysis ? (
          <section className="mt-12">
            <h2 className="mb-4 text-sm font-semibold text-primary">Dernière analyse</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-secondary">Score psychologique</p>
                <p className={`mt-2 font-mono text-2xl font-bold ${psychScoreColor}`}>
                  {lastPsychScore ?? "--"}/100
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-secondary">Win rate</p>
                <p className="mt-2 font-mono text-2xl font-bold text-cyan">
                  {lastWinRate !== null ? `${lastWinRate.toFixed(1)}%` : "--"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-secondary">PnL total</p>
                <p
                  className={`mt-2 font-mono text-2xl font-bold ${
                    lastPnl !== null && lastPnl < 0 ? "text-red" : "text-green"
                  }`}
                >
                  {lastPnl !== null
                    ? `${lastPnl < 0 ? "-" : "+"}${Math.abs(lastPnl).toFixed(0)}€`
                    : "--"}
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-primary">
      <header className="h-14 shrink-0 border-b border-border bg-card">
        <div className="flex h-full items-center justify-between px-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-left"
          >
            <LogoSvg />
            <span className="font-semibold text-primary">AlphaTradeX</span>
          </button>
          <div className="flex items-center gap-2">
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
      </header>

      <div className="flex h-[calc(100vh-56px)] min-h-0">
        <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-card px-4 py-5">
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            <SectionLabel>Analyse</SectionLabel>
            <SidebarNavRow
              icon={BrainCircuit}
              label="Nouvelle analyse"
              active={mainView === "nouvelle-analyse"}
              onSelect={() => setMainView("nouvelle-analyse")}
            />
            {hasSessionReport ? (
              <SidebarNavRow
                icon={FileText}
                label="Mon analyse"
                active={mainView === "mon-analyse"}
                onSelect={() => setMainView("mon-analyse")}
              />
            ) : null}
            <SidebarNavRow
              icon={History}
              label="Historique"
              locked={historiqueLocked}
              lockPlanLabel="Premium"
              active={mainView === "historique"}
              onSelect={() => setMainView("historique")}
            />

            <SectionLabel>Performance</SectionLabel>
            <SidebarNavRow
              icon={TrendingUp}
              label="Évolution"
              locked={evolutionLocked}
              lockPlanLabel="Premium"
              active={mainView === "evolution"}
              onSelect={() => setMainView("evolution")}
            />
            <SidebarNavRow
              icon={CalendarCheck}
              label="Résumé hebdomadaire"
              locked={resumeLocked}
              lockPlanLabel="Premium"
              active={mainView === "resume-hebdomadaire"}
              onSelect={() => setMainView("resume-hebdomadaire")}
            />
            <SidebarNavRow
              icon={Target}
              label="Prop Firm Score"
              locked={propFirmLocked}
              lockPlanLabel="Elite"
              active={mainView === "prop-firm-score"}
              onSelect={() => setMainView("prop-firm-score")}
            />

            <SectionLabel>Signaux</SectionLabel>
            <SidebarNavRow
              icon={Radar}
              label="Détection prédictive"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "detection-predictive"}
              onSelect={() => setMainView("detection-predictive")}
            />
            <SidebarNavRow
              icon={Bell}
              label="Alertes Telegram"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "alertes-telegram"}
              onSelect={() => setMainView("alertes-telegram")}
            />
            <SidebarNavRow
              icon={Code2}
              label="Accès API"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "acces-api"}
              onSelect={() => setMainView("acces-api")}
            />

            <SectionLabel>Compte</SectionLabel>
            <SidebarNavRow
              icon={CreditCard}
              label="Offres"
              onSelect={() => router.push("/pricing")}
            />
            <a
              href="/api/customer-portal"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary transition-all duration-150 hover:bg-hover hover:text-primary"
            >
              <Receipt className="h-4 w-4 shrink-0" />
              Factures
            </a>
          </div>

          {showQuotaCard ? (
            <div className="mt-auto shrink-0 rounded-xl border border-border bg-background p-4 pt-6">
              <p className="mb-2 text-xs text-secondary">Analyses utilisées</p>
              <div className="h-1 w-full rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-[#2D6FFF]"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between gap-2">
                <span className="font-mono text-xs text-primary">
                  {analysesUsed}/{analysesLimit}
                </span>
                <span className="text-xs text-secondary">{cycleLabel}</span>
              </div>
            </div>
          ) : null}
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#0A0A0F] p-8">
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

          <div
            className={`flex min-h-0 flex-1 flex-col ${mainView === "nouvelle-analyse" ? "space-y-6" : ""}`}
          >
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
