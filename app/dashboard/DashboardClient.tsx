"use client";

import { getSupabaseClient } from "@/lib/supabase";
import { detectAndParse } from "@/lib/parseCSV";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import TradeReport from "@/components/TradeReport";
import UploadZone from "@/components/UploadZone";
import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes";

function normalizeApiError(message: unknown): string {
  if (typeof message !== "string") return "Erreur d’analyse.";
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
  const [analysesUsed, setAnalysesUsed] = useState<number | null>(null);
  const [dbAnalysesLimit, setDbAnalysesLimit] = useState<number | null>(null);
  const [analysesResetDate, setAnalysesResetDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("subscription_plan, analyses_used, analyses_limit, analyses_reset_date")
        .eq("id", user.id)
        .single();
      if (data) {
        setSubscriptionPlan(data.subscription_plan ?? null);
        setAnalysesUsed(data.analyses_used ?? null);
        setDbAnalysesLimit(data.analyses_limit ?? null);
        setAnalysesResetDate(data.analyses_reset_date ?? null);
      }
    }
    void fetchUserData();
  }, [supabase]);

  const runAnalyze = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysesLeft(undefined);
    setAnalysesLimit(undefined);
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
        analysesLeft: left,
        analysesLimit: limit,
        ...report
      } = data as {
        analysesLeft: number;
        analysesLimit: number;
      } & AiAnalysisResult;

      setAnalysis(report);
      setAnalysesLeft(left);
      setAnalysesLimit(limit);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Réseau indisponible."
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
              <div className="flex flex-col items-end gap-0.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize text-primary">{subscriptionPlan}</span>
                </div>
                <span className="text-secondary">
                  {analysesUsed ?? "–"} / {dbAnalysesLimit ?? "–"} analyses utilisées
                </span>
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
        {checkout === "success" || paymentSuccess ? (
          <p className="rounded-lg border border-green/35 bg-green/10 px-4 py-3 text-sm text-green">
            Paiement confirmé. Merci ! Vos prochaines analyses seront
            disponibles selon votre offre.
          </p>
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
