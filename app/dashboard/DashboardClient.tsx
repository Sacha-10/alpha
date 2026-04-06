"use client";

import { getSupabaseClient } from "@/lib/supabase";
import { detectAndParse } from "@/lib/parseCSV";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  function subscribe() {
    setCheckoutLoading(true);
    setError(null);
    window.location.href = new URL(
      "/api/create-checkout?plan=starter",
      window.location.origin
    ).href;
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
          <Link href="/" className="font-semibold text-slate-100">
            Alpha — Tableau de bord
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => subscribe()}
              disabled={checkoutLoading}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {checkoutLoading ? "Redirection…" : "S’abonner (EUR)"}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-border px-4 py-2 text-sm text-slate-300 hover:bg-background"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        {checkout === "success" || paymentSuccess ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Paiement confirmé. Merci ! Vos prochaines analyses seront
            disponibles selon votre offre.
          </p>
        ) : null}
        {checkout === "cancel" ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Paiement annulé. Vous pouvez réessayer quand vous voulez.
          </p>
        ) : null}

        <section className="space-y-4">
          <h1 className="text-2xl font-bold text-white">Analyser mes trades</h1>
          <p className="text-sm text-slate-400">
            Envoyez un CSV : nous détectons MT4, Binance ou TradingView, puis
            appelons le modèle{" "}
            <span className="font-mono text-slate-300">gpt-4o</span>.
          </p>
          <UploadZone loading={loading} onAnalyze={onAnalyzeFile} />
        </section>

        {error ? (
          <p className="text-sm text-rose-400" role="alert">
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
