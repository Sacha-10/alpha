'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Upload, Brain, FileText, ScrollText } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { demoTrades } from '@/lib/demoTrades'
import TradeReport from '@/components/TradeReport'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { RevealSection } from '@/components/RevealSection'
import type { AiAnalysisResult } from '@/lib/tradingAnalysisTypes'

const SESSION_KEY = 'atx_demo_report'

const steps = [
  {
    icon: Upload,
    color: "#2D6FFF",
    number: "01",
    title: "L'historique du compte",
    body: "Un fichier CSV depuis MT4, MT5, Binance, Bybit, TradingView, FTMO, FundedNext. Zéro accès au compte.",
  },
  {
    icon: Brain,
    color: "#00E5FF",
    number: "02",
    title: "L'IA décrypte les trades",
    body: "Les patterns, les biais, les sessions, le profil psychologique. Chaque donnée analysée, résultat en moins de 60 secondes.",
  },
  {
    icon: FileText,
    color: "#00E5B0",
    number: "03",
    title: "Le mirror sans filtre",
    body: "Les forces, les failles, le plan d'action exportable en PDF. Chaque insight priorisé, exécutable en moins de 24h.",
  },
];

export default function DemoPage() {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<AiAnalysisResult | null>(null)
  const [error, setError] = useState<string>('')
  const [used, setUsed] = useState(false)
  const [view, setView] = useState<'analyse' | 'rapport'>('analyse')
  const prevViewRef = useRef<'analyse' | 'rapport'>('analyse')

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) { setReport(JSON.parse(saved)) }
    } catch {
      // ignore corrupted sessionStorage
    }
  }, [])

  useEffect(() => {
    if (view === 'rapport') {
      document.body.classList.add("hide-glow");
    } else {
      document.body.classList.remove("hide-glow");
    }
    return () => document.body.classList.remove("hide-glow");
  }, [view])

  useEffect(() => {
    const prevView = prevViewRef.current
    prevViewRef.current = view

    if (view === 'rapport') {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      if (prevView === 'rapport') {
        window.scrollTo(0, 0)
      }
    }
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [view])

  async function handleDemo() {
    setLoading(true)
    setError('')
    sessionStorage.removeItem(SESSION_KEY)
    try {
      const url = `${window.location.origin}/api/analyze-demo`
      const payload = { trades: demoTrades }
      const body = JSON.stringify(payload)

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })

      // Mapping code -> état, sans passthrough du texte serveur.
      // 429 = analyse déjà utilisée (info bleue) ; autre échec = erreur rouge.
      // Les réponses d'erreur n'ont pas de corps : on ne parse qu'au succès.
      if (!res.ok) {
        if (res.status === 429) setUsed(true)
        else setError("Une erreur est survenue. Relancez l'analyse.")
        return
      }

      const report = await res.json()
      setReport(report)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(report))
      setView('rapport')
    } catch (err) {
      console.error('[demo] Erreur réseau ou lecture réponse', err)
      setError("Une erreur est survenue. Relancez l'analyse.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />
      <main className="overflow-x-clip">

        <section className="min-h-screen pt-16 flex items-center justify-center px-6 text-center">
          <div className="mx-auto max-w-[1200px] pb-10 pt-10 md:pb-0 md:pt-0">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-6">Analyse</p>
              <h1 className="mx-auto mt-6 max-w-[900px] text-5xl font-bold leading-[1.1] text-primary md:text-7xl">
                Découvrez ce que l&apos;analyste IA révèle sur un compte de trading.
              </h1>
              <div className="mx-auto mt-10 h-px w-12 bg-blue" />
              <p className="mx-auto mt-8 max-w-[520px] text-lg leading-relaxed text-secondary">
                Analyse basée sur 120 trades.
              </p>
            </RevealSection>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-[1200px] text-center">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Comment on fonctionne</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Trois étapes.<br />Zéro friction.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed text-secondary">
                Un compte de trading transformé en mirror en moins de 60 secondes.
              </p>
            </RevealSection>
            <div className="grid md:grid-cols-3 gap-5 mt-12 text-left">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <RevealSection key={step.number} delay={index * 80}>
                    <article className="card rounded p-8 transition-colors duration-200 hover:border-blue">
                      <div
                        className="w-12 h-12 rounded-xl border flex items-center justify-center"
                        style={{ backgroundColor: `${step.color}15`, borderColor: `${step.color}30` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: step.color }} aria-hidden />
                      </div>
                      <p className="font-mono text-xs tracking-widest text-secondary mt-5 mb-1">{step.number}</p>
                      <h3 className="text-lg font-bold text-primary mb-3">{step.title}</h3>
                      <p className="text-sm text-secondary leading-relaxed">{step.body}</p>
                    </article>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Analyse gratuite</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Votre première analyse.<br />Sans inscription.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed text-secondary">
                Analyse basée sur 120 trades.
              </p>
            </RevealSection>
            <RevealSection delay={80}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleDemo}
                  disabled={loading}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  Découvrir l&apos;analyse
                  <ArrowRight size={16} aria-hidden />
                </button>
                {report && (
                  <button
                    type="button"
                    onClick={() => setView('rapport')}
                    className="btn-outline inline-flex items-center gap-2"
                  >
                    Mon analyse
                    <ScrollText size={16} aria-hidden />
                  </button>
                )}
              </div>
              {/* Zone de message unique : erreur rouge / info bleue / rien. */}
              {error ? (
                <div className="mx-auto mt-6 max-w-md rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-center text-sm text-red">
                  {error}
                </div>
              ) : used ? (
                <div className="mx-auto mt-6 max-w-md rounded-lg border border-blue/30 bg-blue/10 px-4 py-3 text-center text-sm text-blue">
                  L&apos;analyse gratuite a été utilisée. Inscrivez-vous pour analyser vos trades.
                </div>
              ) : null}
              {loading && (
                <div className="mt-8 max-w-md mx-auto">
                  <div className="w-full bg-card rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-blue rounded-full"
                      animate={{ width: ['0%', '90%'] }}
                      transition={{ duration: 8 }}
                    />
                  </div>
                  <p className="text-secondary mt-3 text-sm">L&apos;IA analyse les trades...</p>
                </div>
              )}
            </RevealSection>
          </div>
        </section>

        {view === 'rapport' && report && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              overflowY: 'auto',
              background: 'var(--background)',
            }}
          >
            <div className="mx-auto max-w-[1200px] px-6 py-10">
              <TradeReport report={report} />
            </div>
          </div>
        )}

        <section className="px-6 py-28 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Commencer</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Votre mirror.<br />Sans filtre.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed text-secondary">
                Votre historique. 60 secondes. La vérité.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/pricing" className="btn-primary inline-flex items-center gap-2">
                  Voir les plans
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
              <p className="mt-6 text-xs text-secondary">
                Accès anticipé · 200 places · Prix public à venir · Sans carte bancaire
              </p>
            </RevealSection>
          </div>
        </section>

      </main>
      <RevealSection className="border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md">
        <Footer />
      </RevealSection>
    </div>
  )
}
