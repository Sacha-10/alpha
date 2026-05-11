"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

interface Props {
  loading?: boolean;
  onFileChange?: (file: File | null) => void;
}

export default function UploadZone({ loading = false, onFileChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
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
    onFileChange?.(f);
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
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          loading
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer"
        } ${
          dragging
            ? "border-blue bg-blue/5 shadow-blue"
            : file
              ? "border-green bg-green/5"
              : "border-border bg-card hover:border-blue/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!loading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={loading ? undefined : handleDrop}
        onClick={() => {
          if (!loading) inputRef.current?.click();
        }}
        whileHover={loading ? undefined : { scale: 1.01 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          disabled={loading}
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
              <Upload className="h-10 w-10 text-secondary mx-auto mb-4" />
              <p className="text-primary text-lg font-semibold mb-2">
                Importez votre CSV
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CheckCircle2 className="h-10 w-10 text-green mx-auto mb-4" />
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
    </div>
  );
}
