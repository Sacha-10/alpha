"use client";

import { getSupabaseClient } from "@/lib/supabase";
import { detectAndParse } from "@/lib/parseCSV";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import TradeReport from "@/components/TradeReport";
import UploadZone from "@/components/UploadZone";
import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes";

const SESSION_KEY_REPORT = "atx_last_report";
const SESSION_KEY_LEFT = "atx_analyses_left";
const SESSION_KEY_LIMIT = "atx_analyses_limit";

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

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-left font-semibold text-primary"
          >
            Alpha — Tableau de bord
          </button>
          <div className="flex flex-wrap items-center gap-3">
            {subscriptionPlan ? (
              // BUG 5 — Header shows plan name + Offres/Factures only, no counter
              <div className="flex flex-col items-end gap-0.5 text-sm">
                <span className="font-medium capitalize text-primary">{subscriptionPlan}</span>
                {analysesResetDate && (
                  <span className="text-secondary">Prochain cycle le {formatResetDate(analysesResetDate)}</span>
                )}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => router.push('/pricing')}
                    className="text-secondary hover:text-primary"
                  >
                    Offres
                  </button>
                  <span className="text-secondary">·</span>
                  <a
                    href="/api/customer-portal"
                    className="text-secondary hover:text-primary"
                  >
                    Factures
                  </a>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="rounded-lg bg-blue px-4 py-2 text-sm font-medium text-primary hover:bg-blue/85"
              >
                Voir les plans
              </button>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-background"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        {showSuccessBanner ? (
          <div className={`flex items-center justify-between rounded-lg border border-green/35 bg-green/10 px-4 py-3 text-sm text-green transition-opacity duration-500 ${bannerVisible ? "opacity-100" : "opacity-0"}`}>
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
          <h1 className="text-2xl font-bold text-primary">Analyser mes trades</h1>
          <p className="text-sm text-secondary">
            Envoyez un CSV : nous détectons MT4, MT5, Binance, Bybit, TradingView, FTMO et FundedNext, puis
            appelons le modèle{" "}
            <span className="font-mono text-primary">gpt-5.4</span>.
          </p>
          <UploadZone loading={loading} onAnalyze={onAnalyzeFile} />
        </section>

        {error ? (
          <p className="text-sm text-red" role="alert">
            {error}
          </p>
        ) : null}

        {analysis ? (
          <TradeReport
            report={analysis}
            analysesLeft={analysesLeft}
            analysesLimit={analysesLimit}
          />
        ) : null}
      </main>
    </div>
  );
}
