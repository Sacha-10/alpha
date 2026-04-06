'use client'

import { useState } from 'react'
import { demoTrades } from '@/lib/demoTrades'
import TradeReport from '@/components/TradeReport'
import { motion } from 'framer-motion'

export default function DemoPage() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [used, setUsed] = useState(false)

  async function handleDemo() {
    console.log('[demo] handleDemo() entrée')
    setLoading(true)
    setError('')
    try {
      const url = `${window.location.origin}/api/analyze-demo`
      const payload = { trades: demoTrades }
      const body = JSON.stringify(payload)

      console.log('[demo] Avant fetch', {
        url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        tradesCount: demoTrades.length,
        bodyLengthChars: body.length,
      })

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })

      console.log('[demo] Après fetch', {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur inconnue')
        if (res.status === 429) setUsed(true)
      } else {
        setReport(data)
      }
    } catch (err) {
      console.error('[demo] Erreur réseau ou lecture réponse', err)
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background 
      text-primary p-8 max-w-6xl mx-auto">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">
          Découvrez ce que l&apos;IA trouve dans un compte 
          de trading réel
        </h1>
        <p className="text-secondary text-xl mb-2">
          Analyse basée sur 120 trades réels anonymisés
        </p>
        <p className="text-secondary text-sm">
          1 analyse démo gratuite — sans inscription requise
        </p>
      </motion.div>

      {!report && !used && (
        <div className="text-center">
          <button
            onClick={handleDemo}
            disabled={loading}
            className="btn-primary text-xl px-12 py-4 
              disabled:opacity-50"
          >
            {loading 
              ? 'Analyse en cours...' 
              : 'Générer mon analyse IA gratuite'}
          </button>
          {loading && (
            <div className="mt-6">
              <div className="w-full bg-card rounded-full 
                h-2 max-w-md mx-auto overflow-hidden">
                <motion.div
                  className="h-full bg-blue rounded-full"
                  animate={{ width: ['0%', '90%'] }}
                  transition={{ duration: 8 }}
                />
              </div>
              <p className="text-secondary mt-3 text-sm">
                L&apos;IA analyse les patterns psychologiques...
              </p>
            </div>
          )}
          {error && (
            <p className="text-red mt-4">{error}</p>
          )}
        </div>
      )}

      {used && (
        <div className="card p-8 text-center max-w-lg 
          mx-auto">
          <p className="text-xl mb-4">
            Vous avez déjà utilisé votre analyse démo.
          </p>
          <p className="text-secondary mb-6">
            Créez un compte pour analyser vos propres 
            trades et obtenir votre rapport personnalisé.
          </p>
          <a href="/dashboard" className="btn-primary">
            Commencer — 29€/mois
          </a>
        </div>
      )}

      {report && (
        <>
          <TradeReport report={report} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-8 text-center mt-12 
              border-blue glow-blue"
          >
            <h2 className="text-2xl font-bold mb-3">
              Vous avez découvert votre analyse IA.
            </h2>
            <p className="text-secondary mb-6 text-lg">
              Importez maintenant vos propres trades 
              pour obtenir votre analyse personnalisée.
            </p>
            <a href="/dashboard" 
              className="btn-primary text-lg px-8 py-3">
              Commencer — 29€/mois
            </a>
          </motion.div>
        </>
      )}
    </main>
  )
}
