'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, ScrollText, Upload, Brain, FileText } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { demoTrades } from '@/lib/demoTrades'
import { PLANS } from '@/lib/plans'
import TradeReport from '@/components/TradeReport'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const SESSION_KEY = 'atx_demo_report'

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transitionDuration: "700ms",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const steps = [
  {
    icon: Upload,
    color: "#2D6FFF",
    number: "01",
    title: "Exportez l'historique",
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
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [used, setUsed] = useState(false)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) setReport(JSON.parse(saved))
    } catch {
      // ignore corrupted sessionStorage
    }
  }, [])

  useEffect(() => {
    if (report) {
      document.body.classList.add("hide-glow");
    } else {
      document.body.classList.remove("hide-glow");
    }
    return () => document.body.classList.remove("hide-glow");
  }, [report])

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

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur inconnue')
        if (res.status === 429) setUsed(true)
      } else {
        setReport(data)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
      }
    } catch (err) {
      console.error('[demo] Erreur réseau ou lecture réponse', err)
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <Navbar />
      <main className="overflow-x-clip">

        <section className="px-6 pt-40 pb-28 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-6">Analyse</p>
              <h1 className="mx-auto mt-6 max-w-[900px] text-5xl font-bold leading-[1.1] text-primary md:text-7xl">
                Découvrez ce que l&apos;analyste IA<br />révèle sur un compte de trading.
              </h1>
              <div className="mx-auto mt-10 h-px w-12 bg-blue" />
              <p className="mx-auto mt-8 max-w-[520px] text-lg leading-relaxed text-secondary">
                Analyse basée sur 120 trades.
              </p>
            </RevealSection>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-[1200px] text-center">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Comment on fonctionne</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Trois étapes.<br />Zéro friction.
              </h2>
              <p className="mx-auto mt-6 max-w-[480px] text-base leading-relaxed text-secondary">
                Un compte de trading transformé en mirror en moins de 60 secondes.
              </p>
            </RevealSection>
            <div className="grid md:grid-cols-3 gap-5 mt-14 text-left">
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

        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Analyse gratuite</p>
              <h2 className="mx-auto mt-4 max-w-[700px] text-4xl font-bold text-primary md:text-5xl">
                Votre première analyse.<br />Sans inscription.
              </h2>
              <p className="mx-auto mt-6 max-w-[480px] text-base leading-relaxed text-secondary">
                Analyse basée sur 120 trades.
              </p>
            </RevealSection>
            <RevealSection delay={80}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleDemo}
                  disabled={loading || used}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  Découvrir l&apos;analyse
                  <ArrowRight size={16} aria-hidden />
                </button>
                {report && (
                  <button
                    type="button"
                    onClick={() => document.getElementById('rapport')?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn-outline inline-flex items-center gap-2"
                  >
                    Mon analyse
                    <ScrollText size={16} aria-hidden />
                  </button>
                )}
              </div>
              {used && (
                <p className="mt-4 text-sm text-secondary">Analyse utilisée.</p>
              )}
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
              {error && <p className="text-red mt-4 text-sm">{error}</p>}
            </RevealSection>
            {report && (
              <div id="rapport" className="mt-16">
                <TradeReport report={report} />
              </div>
            )}
          </div>
        </section>

        <section className="px-6 py-28 text-center">
          <div className="mx-auto max-w-[1200px]">
            <RevealSection>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary">Commencer</p>
              <h2 className="mx-auto mt-4 text-4xl font-bold text-primary md:text-5xl">
                Votre mirror.<br />Sans filtre.
              </h2>
              <p className="mx-auto mt-6 max-w-[400px] text-lg leading-relaxed text-secondary">
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
      <section className="border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md">
        <Footer />
      </section>
    </div>
  )
}
