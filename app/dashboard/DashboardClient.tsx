"use client";

import { getSupabaseClient } from "@/lib/supabase";
import { detectAndParse } from "@/lib/parseCSV";
import { useRouter, useSearchParams } from "next/navigation";
import { type ComponentType, useCallback, useEffect, useState } from "react";
import TradeReport from "@/components/TradeReport";
import UploadZone from "@/components/UploadZone";
import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes";
import {
  BrainCircuit,
  CreditCard,
  FileText,
  History,
  Lock,
  Target,
  TrendingUp,
} from "lucide-react";

const SESSION_KEY_REPORT = "atx_last_report";
const SESSION_KEY_LEFT = "atx_analyses_left";
const SESSION_KEY_LIMIT = "atx_analyses_limit";

const TOP_NAV_ITEMS = ["Analyse", "Historique", "Progression"];

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

function normalizeApiError(message: unknown): string {
  if (typeof message !== "string") return "Erreur d'analyse.";
  return message.replace(/\s+/g, " ").trim();
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

  // BUG 2 — Restore last report from sessionStorage on mount
  useEffect(() => {
    try {
      const savedReport = sessionStorage.getItem(SESSION_KEY_REPORT);
      if (savedReport) {
        setAnalysis(JSON.parse(savedReport) as AiAnalysisResult);
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
  const analysesAtLimit =
    analysesUsed !== undefined &&
    analysesLimit !== undefined &&
    analysesUsed >= analysesLimit;
  const normalizedPlan = (subscriptionPlan ?? "").toLowerCase();
  const isPro = normalizedPlan === "pro";
  const isElite = normalizedPlan === "elite";
  const planLabel = subscriptionPlan
    ? subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)
    : "Pro";
  const cycleLabel = analysesResetDate
    ? `Cycle \u00B7 ${formatResetDate(analysesResetDate)}`
    : "Cycle \u00B7 --/--";
  const progressWidth =
    analysesUsed !== undefined && analysesLimit && analysesLimit > 0
      ? Math.min(100, (analysesUsed / analysesLimit) * 100)
      : 0;
  const lastPsychScore = analysis
    ? Math.round(
        analysis.psychologicalProfile.overallScore <= 1
          ? analysis.psychologicalProfile.overallScore * 100
          : analysis.psychologicalProfile.overallScore
      )
    : null;
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

  function SidebarItem({
    icon: Icon,
    label,
    active = false,
    locked = false,
    lockPlanLabel,
    href,
  }: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    active?: boolean;
    locked?: boolean;
    lockPlanLabel?: string;
    href?: string;
  }) {
    const onClick = () => {
      if (locked) {
        router.push("/pricing");
        return;
      }
      if (href) router.push(href);
    };

    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
          active
            ? "border-[#2D6FFF40] bg-[#2D6FFF15] text-primary"
            : "border-transparent bg-transparent text-secondary hover:bg-hover hover:text-primary"
        } ${locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        title={locked && lockPlanLabel ? `Disponible sur plan ${lockPlanLabel}` : undefined}
      >
        <span className="flex items-center gap-2.5">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        {locked ? <Lock className="h-3.5 w-3.5" /> : null}
      </button>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-primary">
      <header className="h-14 border-b border-border bg-card">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-left"
            >
              <LogoSvg />
              <span className="font-semibold text-primary">AlphaTradeX</span>
            </button>
            <span className="h-5 w-px bg-border" aria-hidden />
            <nav className="flex items-center gap-1">
              {TOP_NAV_ITEMS.map((item) => {
                const active = item === "Analyse";
                return (
                  <span
                    key={item}
                    className={`rounded-md px-2.5 py-1.5 text-xs ${
                      active ? "bg-hover text-primary" : "text-secondary"
                    }`}
                  >
                    {item}
                  </span>
                );
              })}
            </nav>
          </div>
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

      <div className="flex h-[calc(100vh-56px)]">
        <aside className="flex h-full w-[280px] flex-col border-r border-border bg-[#0D0D14] px-4 py-5">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                Analyse
              </p>
              <SidebarItem icon={BrainCircuit} label="Nouvelle analyse" active />
              <SidebarItem
                icon={History}
                label="Historique"
                locked={isPro}
                lockPlanLabel="Premium"
              />
            </div>

            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                Performance
              </p>
              <SidebarItem
                icon={TrendingUp}
                label="Progression"
                locked={isPro}
                lockPlanLabel="Premium"
              />
              <SidebarItem
                icon={Target}
                label="Prop Firm Score"
                locked={!isElite}
                lockPlanLabel="Elite"
              />
            </div>

            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                Compte
              </p>
              <SidebarItem icon={CreditCard} label="Offres" href="/pricing" />
              <a
                href="/api/customer-portal"
                className="flex w-full items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm text-secondary transition hover:bg-hover hover:text-primary"
              >
                <FileText className="h-4 w-4" />
                Factures
              </a>
            </div>
          </div>

          {!isElite && analysesUsed !== undefined && analysesLimit !== undefined ? (
            <div className="mt-auto rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-secondary">Analyses utilisées</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-border">
                <div
                  className={`h-full rounded-full ${analysesAtLimit ? "bg-red" : "bg-blue"}`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-xs text-primary">
                {analysesUsed}/{analysesLimit}
              </p>
              <p className="mt-1 text-xs text-secondary">{cycleLabel}</p>
            </div>
          ) : null}
        </aside>

        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="space-y-6">
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

            <section className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-primary">Nouvelle analyse</h1>
                <p className="mt-1 text-xs text-secondary">
                  MT4 · MT5 · Binance · Bybit · TradingView · FTMO · FundedNext
                </p>
              </div>
              <UploadZone loading={loading} onAnalyze={onAnalyzeFile} />
            </section>

            {error ? (
              <p className="text-sm text-red" role="alert">
                {error}
              </p>
            ) : null}

            {analysis ? (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-primary">Dernières stats</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-secondary">Score psychologique</p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-cyan">
                      {lastPsychScore ?? "--"}/100
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-secondary">Win rate</p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-green">
                      {lastWinRate !== null ? `${lastWinRate.toFixed(1)}%` : "--"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-secondary">PnL total</p>
                    <p
                      className={`mt-2 font-mono text-2xl font-semibold ${
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

            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-primary">Analyses récentes</h2>
              <p className="mt-2 text-sm text-secondary">
                Aucune analyse récente pour le moment. Vos 2 dernières analyses
                apparaîtront ici automatiquement.
              </p>
            </section>

            {analysis ? (
              <TradeReport
                report={analysis}
                analysesLeft={analysesLeft}
                analysesLimit={analysesLimit}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
