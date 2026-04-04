"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, type DragEvent } from "react";
import ExportGuide from "./ExportGuide";

interface Props {
  onAnalyze: (file: File) => void;
  loading: boolean;
}

export default function UploadZone({ onAnalyze, loading }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      setError(
        "Format invalide. Veuillez importer un fichier CSV."
      );
      return;
    }
    setError("");
    setFile(f);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-blue bg-blue/5 shadow-blue"
            : file
              ? "border-green bg-green/5"
              : "border-border bg-card hover:border-blue/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl mb-4">📂</div>
              <p className="text-primary text-xl font-semibold mb-2">
                Déposez votre historique de trades ici
              </p>
              <p className="text-secondary text-sm">
                Compatible MT4, MT5, Binance et TradingView
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl mb-4">✅</div>
              <p className="text-green text-xl font-semibold mb-1">
                {file.name}
              </p>
              <p className="text-secondary text-sm">
                Fichier prêt pour l&apos;analyse
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {error ? (
        <p className="text-red text-sm mt-2 text-center">{error}</p>
      ) : null}

      <div className="text-center mt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowGuide(true);
          }}
          className="text-secondary text-sm hover:text-blue underline"
        >
          Comment exporter mes trades →
        </button>
      </div>

      <button
        type="button"
        onClick={() => file && onAnalyze(file)}
        disabled={!file || loading}
        className="btn-primary w-full mt-4 text-lg py-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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

      {loading ? (
        <div className="mt-4">
          <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-blue rounded-full"
              animate={{ width: ["0%", "85%"] }}
              transition={{ duration: 10 }}
            />
          </div>
        </div>
      ) : null}

      {showGuide ? (
        <ExportGuide onClose={() => setShowGuide(false)} />
      ) : null}
    </div>
  );
}
