"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const platforms = [
  {
    name: "MetaTrader 4",
    steps: [
      "Ouvrez MetaTrader 4",
      'Cliquez sur "Historique du compte" en bas de l\'écran',
      "Clic droit → \"Tout l'historique\"",
      'Clic droit → "Enregistrer en rapport (détaillé)"',
      "Sauvegardez le fichier .csv sur votre bureau",
    ],
  },
  {
    name: "MetaTrader 5",
    steps: [
      "Ouvrez MetaTrader 5",
      'Allez dans "Boîte à outils" → "Historique"',
      "Sélectionnez la période souhaitée",
      'Clic droit → "Exporter en CSV"',
      "Sauvegardez le fichier sur votre bureau",
    ],
  },
  {
    name: "Binance",
    steps: [
      "Connectez-vous à Binance",
      'Allez dans "Ordres" → "Historique des trades"',
      "Sélectionnez la période",
      'Cliquez sur "Exporter"',
      "Téléchargez le fichier CSV",
    ],
  },
  {
    name: "TradingView",
    steps: [
      "Ouvrez votre stratégie dans TradingView",
      'Allez dans "Strategy Tester" en bas',
      'Cliquez sur l\'onglet "Liste des trades"',
      "Cliquez sur l'icône d'export CSV",
      "Téléchargez le fichier",
    ],
  },
];

export default function ExportGuide({
  onClose,
}: {
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            Comment exporter vos trades
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-primary text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {platforms.map((p, i) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setActive(i)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                active === i
                  ? "bg-blue text-white"
                  : "bg-hover text-secondary hover:text-primary"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <ol className="space-y-3">
          {platforms[active].steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue/20 text-blue text-sm flex items-center justify-center flex-shrink-0 font-mono font-bold">
                {i + 1}
              </span>
              <span className="text-secondary text-sm pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </motion.div>
    </motion.div>
  );
}
