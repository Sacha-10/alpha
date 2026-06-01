"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes";
import { TradeReportBody } from "./TradeReportBody";

interface Props {
  report: AiAnalysisResult;
  analysesUsed?: number;
  analysesLimit?: number;
}

export default function TradeReport({
  report,
  analysesUsed,
  analysesLimit,
}: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report,
          screenWidth: window.innerWidth < 640 ? window.innerWidth : 1200,
        }),
      });
      if (!res.ok) {
        throw new Error("Erreur lors de la génération du PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `alphatradex-rapport-${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("[PDF] échec:", err);
      setPdfError(
        err instanceof Error ? err.message : "Téléchargement PDF impossible",
      );
    } finally {
      setPdfLoading(false);
    }
  }

  const limit = analysesLimit ?? 0;
  const used = analysesUsed ?? 0;
  const usedPct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isAtLimit = limit > 0 && used >= limit;

  return (
    <div className="space-y-6">
      {analysesUsed !== undefined && limit < 999999 && (
        <div className="card flex items-center justify-between p-6">
          <span className="text-secondary">Analyses utilisées</span>
          <div className="flex items-center gap-3">
            <div className="h-2 w-32 rounded-full bg-hover">
              <div
                className={`h-full rounded-full ${isAtLimit ? "bg-red" : "bg-blue"}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <span className="font-mono text-primary">
              {used}/{limit}
            </span>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <TradeReportBody report={report} />
      </motion.div>

      <div className="pb-8 text-center">
        {pdfError && <p className="mb-3 text-sm text-red">{pdfError}</p>}
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="btn-primary inline-flex items-center gap-2"
        >
          {pdfLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exporter
            </>
          )}
        </button>
      </div>
    </div>
  );
}
