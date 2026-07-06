"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { detectAndParse } from '@/lib/parseCSV'
import { APP_LAUNCH } from '@/lib/plans'
import { Upload, ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'

type TradeRow = {
  id: string
  opened_at: string | null
  closed_at: string | null
  symbol: string | null
  side: string | null
  entry: number | null
  exit: number | null
  volume: number | null
  profit: number | null
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Lu','Ma','Me','Je','Ve','Sa','Di']

// Message d'import (affichage pur) : une seule phrase par import, choisie par
// dominance count > skipped > duplicates. Accord singulier/pluriel sur X.
type ImportKind = 'imported' | 'retention' | 'duplicates'
const IMPORT_MS: Record<ImportKind, number> = {
  imported: 5000,
  retention: 10000,
  duplicates: 7000,
}
function importMessage(kind: ImportKind, x: number): string {
  const one = x === 1
  if (kind === 'imported') {
    return one
      ? 'Votre trade a été importé.'
      : `Vos ${x} trades ont été importés.`
  }
  if (kind === 'duplicates') {
    return one
      ? "Le trade présent sur votre journal n'a pas été importé."
      : `Les ${x} trades présents sur votre journal n'ont pas été importés.`
  }
  // retention
  return one
    ? "Le trade qui a précédé votre inscription n'a pas été importé (votre historique débute à votre date d'inscription)."
    : `Les ${x} trades qui ont précédé votre inscription n'ont pas été importés (votre historique débute à votre date d'inscription).`
}

type DateRangePickerProps = {
  dateFrom: string
  dateTo: string
  onChangeDateFrom: (val: string) => void
  onChangeDateTo: (val: string) => void
}

function DateRangePicker({ dateFrom, dateTo, onChangeDateFrom, onChangeDateTo }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'from' | 'to'>('from')
  const [pending, setPending] = useState<string | null>(null)

  const todayLocal = new Date()
  const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth()+1).padStart(2,'0')}-${String(todayLocal.getDate()).padStart(2,'0')}`

  const initialMonth = dateFrom ? new Date(dateFrom + 'T12:00:00') : todayLocal
  const [calMonth, setCalMonth] = useState({ year: initialMonth.getFullYear(), month: initialMonth.getMonth() })

  const formatDisplay = (val: string) =>
    val ? `${val.slice(8,10)}/${val.slice(5,7)}/${val.slice(0,4)}` : '--/--/----'

  const localStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const firstDay = new Date(calMonth.year, calMonth.month, 1)
  const lastDay = new Date(calMonth.year, calMonth.month + 1, 0)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1

  const calDays: { date: string; inMonth: boolean }[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(firstDay)
    d.setDate(d.getDate() - i - 1)
    calDays.push({ date: localStr(d), inMonth: false })
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    calDays.push({ date: localStr(new Date(calMonth.year, calMonth.month, i)), inMonth: true })
  }
  const remaining = 7 - (calDays.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDay)
      d.setDate(d.getDate() + i)
      calDays.push({ date: localStr(d), inMonth: false })
    }
  }

  const handleDayClick = (date: string) => {
    if (step === 'from') {
      setPending(date)
      setStep('to')
    } else {
      let from = pending!
      let to = date
      if (to < from) [from, to] = [to, from]
      onChangeDateFrom(from)
      onChangeDateTo(to)
      setOpen(false)
      setStep('from')
      setPending(null)
    }
  }

  const handleOpenChange = (o: boolean) => {
    if (o && dateFrom) {
      const d = new Date(dateFrom + 'T12:00:00')
      setCalMonth({ year: d.getFullYear(), month: d.getMonth() })
    }
    if (!o) {
      setStep('from')
      setPending(null)
    }
    setOpen(o)
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button className="text-secondary text-sm hover:text-primary cursor-pointer bg-transparent border-none outline-none flex items-center gap-2">
          <span>{formatDisplay(dateFrom)}</span>
          <span>·</span>
          <span>{formatDisplay(dateTo)}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          style={{ background: '#12121A', border: '1px solid #1E2035', borderRadius: '12px', padding: '16px', zIndex: 50 }}
          sideOffset={8}
          align="center"
          side="bottom"
          avoidCollisions={true}
          collisionPadding={8}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCalMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })}
              className="p-1 text-sm text-primary hover:text-blue cursor-pointer"
            >&lt;</button>
            <span className="text-sm font-semibold text-primary">{MONTHS_FR[calMonth.month]} {calMonth.year}</span>
            <button
              onClick={() => setCalMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })}
              className="p-1 text-sm text-primary hover:text-blue cursor-pointer"
            >&gt;</button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-xs text-secondary py-1 w-8">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map(({ date, inMonth }) => {
              const isFromSelected = step === 'from' ? date === dateFrom : date === pending
              const isToSelected = step === 'from' && date === dateTo
              const inRange = step === 'from' && date > dateFrom && date < dateTo
              const isToday = date === todayStr
              return (
                <button
                  key={date}
                  onClick={() => { if (inMonth) handleDayClick(date) }}
                  className={[
                    'w-10 h-6 text-xs rounded-xl flex items-center justify-center',
                    !inMonth ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#1A1A28]',
                    isFromSelected || isToSelected ? 'text-white' : isToday ? 'text-blue' : 'text-secondary',
                    inRange ? 'bg-blue/15' : '',
                  ].filter(Boolean).join(' ')}
                  style={(isFromSelected || isToSelected) ? { background: '#2D6FFF' } : undefined}
                >
                  {new Date(date + 'T12:00:00').getDate()}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-secondary text-center mt-3">Clic 1 &gt; date début · Clic 2 &gt; date fin</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function formatPnl(pnl: number): string {
  return (pnl >= 0 ? '+' : '') + pnl.toFixed(2) + '€'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function TradeJournal() {
  // La rétention (fenêtre de données accessibles) est désormais appliquée
  // CÔTÉ SERVEUR (/api/trades) depuis le plan réel + la date d'inscription.
  // Le composant ne fait que filtrer l'affichage via le sélecteur de dates.
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  // Défaut du sélecteur : du 1er jour du mois en cours jusqu'à aujourd'hui.
  const firstOfMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const [trades, setTrades] = useState<TradeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [importSuccessMs, setImportSuccessMs] = useState(5000)
  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [view, setView] = useState<'day' | 'month'>('day')
  const [dateFrom, setDateFrom] = useState(firstOfMonthStr)
  const [dateTo, setDateTo] = useState(todayStr)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)

  // Plancher de navigation du calendrier : unique source = APP_LAUNCH (01/2026).
  const minNav = { year: APP_LAUNCH.getUTCFullYear(), month: APP_LAUNCH.getUTCMonth() }
  const maxNav = { year: new Date().getFullYear(), month: 11 }

  const loadTrades = useCallback(async () => {
    setLoading(true)
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    // Pas de dateMin : la fenêtre de rétention est plafonnée côté serveur.
    const res = await fetch(`/api/trades?token=${token}`)
    const json = await res.json()
    if (!res.ok) {
      setTrades([])
    } else {
      setTrades(json.trades ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadTrades() }, [loadTrades])

  useEffect(() => {
    if (!importSuccess) return
    const t = setTimeout(() => setImportSuccess(null), importSuccessMs)
    return () => clearTimeout(t)
  }, [importSuccess, importSuccessMs])

  useEffect(() => {
    if (!importError) return
    const t = setTimeout(() => setImportError(null), 10000)
    return () => clearTimeout(t)
  }, [importError])

  useEffect(() => {
    if (!mobileDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target as Node)) {
        setMobileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileDropdownOpen])

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setImportError('Seuls les fichiers CSV sont acceptés.')
      return
    }
    setImporting(true)
    setImportError(null)
    setImportSuccess(null)
    try {
      const parsed = await detectAndParse(file)
      const res = await fetch('/api/import-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: parsed })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'import.')
      // Dominance : ce qui a été ajouté prime ; sinon la rétention prime sur les
      // doublons. Une seule phrase, X = le nombre de la catégorie concernée.
      const count = data.count ?? 0
      const skipped = data.skipped ?? 0
      const duplicates = data.duplicates ?? 0
      let kind: ImportKind | null = null
      let x = 0
      if (count > 0) { kind = 'imported'; x = count }
      else if (skipped > 0) { kind = 'retention'; x = skipped }
      else if (duplicates > 0) { kind = 'duplicates'; x = duplicates }
      // count = skipped = duplicates = 0 : aucun message (cas inatteignable sur
      // une réponse 200 — un fichier vide est déjà rejeté en amont par la route).
      if (kind) {
        setImportSuccessMs(IMPORT_MS[kind])
        setImportSuccess(importMessage(kind, x))
      }
      await loadTrades()
    } catch (err: any) {
      setImportError(err.message || 'Erreur lors de l\'import.')
    } finally {
      setImporting(false)
    }
  }

  const filteredTrades = trades.filter(t => {
    if (!t.opened_at) return false
    const d = t.opened_at.split('T')[0]
    return d >= dateFrom && d <= dateTo
  })

  const dayMap: Record<string, TradeRow[]> = {}
  filteredTrades.forEach(t => {
    if (!t.opened_at) return
    const d = t.opened_at.split('T')[0]
    if (!dayMap[d]) dayMap[d] = []
    dayMap[d].push(t)
  })

  const monthMap: Record<string, TradeRow[]> = {}
  filteredTrades.forEach(t => {
    if (!t.opened_at) return
    const key = t.opened_at.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = []
    monthMap[key].push(t)
  })


  const firstDay = new Date(currentMonth.year, currentMonth.month, 1)
  const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const localStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const calDays: { date: string; inMonth: boolean }[] = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(firstDay)
    d.setDate(d.getDate() - i - 1)
    calDays.push({ date: localStr(d), inMonth: false })
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(currentMonth.year, currentMonth.month, i)
    calDays.push({ date: localStr(d), inMonth: true })
  }
  const remaining = 7 - (calDays.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDay)
      d.setDate(d.getDate() + i)
      calDays.push({ date: localStr(d), inMonth: false })
    }
  }

  const calWeeks: { date: string; inMonth: boolean }[][] = []
  for (let i = 0; i < calDays.length; i += 7) {
    calWeeks.push(calDays.slice(i, i + 7))
  }

  const canPrev = currentMonth.year > minNav.year || (currentMonth.year === minNav.year && currentMonth.month > minNav.month)
  const canNext = currentMonth.year < maxNav.year || (currentMonth.year === maxNav.year && currentMonth.month < maxNav.month)

  const prevMonth = () => {
    if (!canPrev) return
    setCurrentMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })
  }
  const nextMonth = () => {
    if (!canNext) return
    setCurrentMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })
  }
  const goToday = () => {
    setCurrentMonth({ year: today.getFullYear(), month: today.getMonth() })
    setCurrentYear(today.getFullYear())
  }

  const canPrevYear = currentYear > minNav.year
  const canNextYear = currentYear < maxNav.year
  const prevYear = () => { if (canPrevYear) setCurrentYear(y => y - 1) }
  const nextYear = () => { if (canNextYear) setCurrentYear(y => y + 1) }

  const exportCSV = () => {
    const headers = ['Date ouverture','Date fermeture','Symbole','Côté','Entry','Exit','Volume','Profit']
    const rows = filteredTrades.map(t => [t.opened_at||'',t.closed_at||'',t.symbol||'',t.side||'',t.entry??'',t.exit??'',t.volume??'',t.profit??''])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alphatradex-trades-${dateFrom}-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allSorted = [...trades].sort((a, b) => (a.opened_at||'').localeCompare(b.opened_at||''))
  const firstTradeDate = allSorted[0]?.opened_at?.split('T')[0]
  const lastTradeDate = allSorted[allSorted.length - 1]?.opened_at?.split('T')[0]
  const selectedDayTrades = selectedDay ? (dayMap[selectedDay] || []) : []

  // Données panneau semaine
  const selectedWeekDays = selectedWeek ? calWeeks.find(w => w[0].date === selectedWeek) : null
  const selectedWeekTrades = selectedWeekDays ? selectedWeekDays.flatMap(({ date }) => dayMap[date] || []) : []
  const selectedWeekPnl = selectedWeekTrades.reduce((s, t) => s + (t.profit || 0), 0)
  const selectedWeekWins = selectedWeekTrades.filter(t => (t.profit || 0) > 0).length
  const selectedWeekWr = selectedWeekTrades.length > 0 ? Math.round((selectedWeekWins / selectedWeekTrades.length) * 100) : 0
  const selectedWeekDayStats = selectedWeekDays
    ? selectedWeekDays
        .map(({ date }) => ({ date, pnl: (dayMap[date] || []).reduce((s, t) => s + (t.profit || 0), 0), count: (dayMap[date] || []).length }))
        .filter(d => d.count > 0)
    : []
  const selectedWeekBestDay = selectedWeekDayStats.length > 0 ? selectedWeekDayStats.reduce((a, b) => a.pnl > b.pnl ? a : b) : null
  const selectedWeekWorstDay = selectedWeekDayStats.length > 0 ? selectedWeekDayStats.reduce((a, b) => a.pnl < b.pnl ? a : b) : null

  // Données panneau mois
  const selectedMonthTrades = selectedMonth ? (monthMap[selectedMonth] || []) : []
  const selectedMonthPnl = selectedMonthTrades.reduce((s, t) => s + (t.profit || 0), 0)
  const selectedMonthWins = selectedMonthTrades.filter(t => (t.profit || 0) > 0).length
  const selectedMonthWr = selectedMonthTrades.length > 0 ? Math.round((selectedMonthWins / selectedMonthTrades.length) * 100) : 0
  const selectedMonthDayMapLocal: Record<string, TradeRow[]> = {}
  selectedMonthTrades.forEach(t => {
    if (!t.opened_at) return
    const d = t.opened_at.split('T')[0]
    if (!selectedMonthDayMapLocal[d]) selectedMonthDayMapLocal[d] = []
    selectedMonthDayMapLocal[d].push(t)
  })
  const selectedMonthDayStats = Object.entries(selectedMonthDayMapLocal).map(([date, ts]) => ({
    date,
    pnl: ts.reduce((s, t) => s + (t.profit || 0), 0),
  }))
  const selectedMonthBestDay = selectedMonthDayStats.length > 0 ? selectedMonthDayStats.reduce((a, b) => a.pnl > b.pnl ? a : b) : null
  const selectedMonthWorstDay = selectedMonthDayStats.length > 0 ? selectedMonthDayStats.reduce((a, b) => a.pnl < b.pnl ? a : b) : null

  return (
    <div className="w-full">

      {/* EN-TÊTE */}
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary">Journal de trades</h1>
      </div>

      {/* TOASTS */}
      {importError && (
        <div className="flex items-center justify-between gap-3 bg-red/10 border border-red/30 text-red rounded-lg px-4 py-3 text-sm mb-6">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="shrink-0 hover:opacity-70 transition-opacity"><X className="h-4 w-4" /></button>
        </div>
      )}
      {importSuccess && (
        <div className="flex items-center justify-between gap-3 bg-green/10 border border-green/30 text-green rounded-lg px-4 py-3 text-sm mb-6">
          <span>{importSuccess}</span>
          <button onClick={() => setImportSuccess(null)} className="shrink-0 hover:opacity-70 transition-opacity"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* BARRE DE CONTRÔLES — Desktop */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('day')} className={`text-sm transition-colors ${view === 'day' ? 'text-primary font-semibold' : 'text-secondary hover:text-primary'}`}>Jour</button>
          <span className="text-secondary">·</span>
          <button onClick={() => setView('month')} className={`text-sm transition-colors ${view === 'month' ? 'text-primary font-semibold' : 'text-secondary hover:text-primary'}`}>Mois</button>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChangeDateFrom={setDateFrom}
            onChangeDateTo={setDateTo}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="text-sm text-secondary hover:text-primary cursor-pointer">
            Importer
          </button>
          <span className="text-secondary">·</span>
          <button onClick={exportCSV} className="text-sm text-secondary hover:text-primary cursor-pointer">
            Exporter
          </button>
        </div>
      </div>

      {/* BARRE DE CONTRÔLES — Mobile */}
      <div ref={mobileDropdownRef} className="flex md:hidden items-center justify-between gap-2 mb-6 relative">
        <div className="flex items-center">
          <button onClick={() => setMobileDropdownOpen(o => !o)} className="text-sm text-primary font-medium">
            {view === 'day' ? 'Jour' : 'Mois'} ›
          </button>
        </div>
        {mobileDropdownOpen && (
          <div className="absolute top-0 left-0 right-0 bg-card border border-border rounded-xl z-50 flex items-center justify-center gap-2 px-3 py-2">
            <button onClick={() => { setView('day'); setMobileDropdownOpen(false) }} className={`text-sm ${view === 'day' ? 'text-primary font-semibold' : 'text-secondary'}`}>Jour</button>
            <span className="text-secondary">·</span>
            <button onClick={() => { setView('month'); setMobileDropdownOpen(false) }} className={`text-sm ${view === 'month' ? 'text-primary font-semibold' : 'text-secondary'}`}>Mois</button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChangeDateFrom={setDateFrom}
            onChangeDateTo={setDateTo}
          />
        </div>
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-secondary hover:text-primary cursor-pointer" onClick={() => fileInputRef.current?.click()} />
          <span className="text-secondary">·</span>
          <Download className="h-4 w-4 text-secondary hover:text-primary cursor-pointer" onClick={exportCSV} />
        </div>
      </div>

      {loading ? (
        <div className="card rounded p-8 text-center text-secondary">Chargement...</div>
      ) : (
        <>
          {/* VUE JOUR — CALENDRIER */}
          {view === 'day' && (
            <div className="card rounded p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} disabled={!canPrev} className={`p-2 rounded border border-border ${canPrev ? 'text-primary hover:border-blue' : 'text-secondary opacity-40 cursor-not-allowed'}`}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={goToday} className="text-xs text-secondary border border-border rounded px-3 py-1 hover:border-blue hover:text-primary transition-colors">Today</button>
                  <span className="text-primary font-semibold">{MONTHS_FR[currentMonth.month]} {currentMonth.year}</span>
                </div>
                <button onClick={nextMonth} disabled={!canNext} className={`p-2 rounded border border-border ${canNext ? 'text-primary hover:border-blue' : 'text-secondary opacity-40 cursor-not-allowed'}`}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-8 mb-2">
                {DAYS_FR.map(d => (
                  <div key={d} className="text-center text-xs text-secondary py-1">{d}</div>
                ))}
                <div />
              </div>

              {calWeeks.map((week, wi) => {
                const weekTrades = week.flatMap(({ date }) => dayMap[date] || [])
                const weekPnl = weekTrades.reduce((s, t) => s + (t.profit || 0), 0)
                const weekWins = weekTrades.filter(t => (t.profit || 0) > 0).length
                const weekWr = weekTrades.length > 0 ? Math.round((weekWins / weekTrades.length) * 100) : 0
                const weekKey = week[0].date
                const isWeekSelected = selectedWeek === weekKey
                return (
                  <div key={wi} className="grid grid-cols-8 gap-1 mb-1">
                    {week.map(({ date, inMonth }) => {
                      const day = dayMap[date]
                      const pnl = day ? day.reduce((s, t) => s + (t.profit || 0), 0) : null
                      const isSelected = selectedDay === date
                      const isToday = date === todayStr
                      return (
                        <div
                          key={date}
                          onClick={() => {
                            if (!inMonth) return
                            setSelectedDay(isSelected ? null : date)
                            setSelectedWeek(null)
                          }}
                          className={[
                            'rounded p-1.5 min-h-[64px] border transition-all',
                            !inMonth ? 'opacity-40 cursor-default' : 'cursor-pointer',
                            isSelected ? 'ring-2 ring-blue' : '',
                            pnl !== null && pnl > 0 ? 'bg-green/10 border-green/30' : pnl !== null && pnl < 0 ? 'bg-red/10 border-red/30' : 'bg-card border-border',
                            inMonth && !isSelected ? 'hover:border-blue/50' : '',
                          ].join(' ')}
                        >
                          <p className={`text-xs font-medium ${isToday ? 'text-blue' : 'text-secondary'}`}>{new Date(date + 'T12:00:00').getDate()}</p>
                          {pnl !== null && (
                            <>
                              <p className={`text-xs font-bold mt-0.5 hidden md:block ${pnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(pnl)}</p>
                              <p className="text-xs text-secondary hidden md:block">{day?.length} trade{day?.length !== 1 ? 's' : ''}</p>
                            </>
                          )}
                        </div>
                      )
                    })}
                    <div
                      onClick={() => { setSelectedWeek(isWeekSelected ? null : weekKey); setSelectedDay(null) }}
                      className={[
                        'rounded p-1.5 min-h-[64px] border cursor-pointer transition-all',
                        weekTrades.length > 0 ? (weekPnl > 0 ? 'bg-green/10 border-green/30' : weekPnl < 0 ? 'bg-red/10 border-red/30' : 'bg-card border-border') : 'bg-card border-border',
                        isWeekSelected ? 'ring-2 ring-blue' : 'hover:border-blue/50',
                      ].join(' ')}
                    >
                      <p className={`text-xs font-bold hidden md:block ${weekTrades.length > 0 ? (weekPnl >= 0 ? 'text-green' : 'text-red') : 'text-secondary'}`}>{formatPnl(weekPnl)}</p>
                      <p className="text-xs text-secondary hidden md:block">{weekTrades.length} trade{weekTrades.length !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-secondary hidden md:block">{weekWr}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* VUE MOIS */}
          {view === 'month' && (
            <div className="card rounded p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevYear} disabled={!canPrevYear} className={`p-2 rounded border border-border ${canPrevYear ? 'text-primary hover:border-blue' : 'text-secondary opacity-40 cursor-not-allowed'}`}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={goToday} className="text-xs text-secondary border border-border rounded px-3 py-1 hover:border-blue hover:text-primary transition-colors">Today</button>
                  <span className="text-primary font-semibold">{currentYear}</span>
                </div>
                <button onClick={nextYear} disabled={!canNextYear} className={`p-2 rounded border border-border ${canNextYear ? 'text-primary hover:border-blue' : 'text-secondary opacity-40 cursor-not-allowed'}`}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }, (_, mi) => {
                  const key = `${currentYear}-${String(mi + 1).padStart(2, '0')}`
                  const ts = monthMap[key] || []
                  const pnl = ts.reduce((s, t) => s + (t.profit || 0), 0)
                  const wins = ts.filter(t => (t.profit || 0) > 0).length
                  const wr = ts.length > 0 ? Math.round((wins / ts.length) * 100) : 0
                  const isCurrentMonth = currentYear === today.getFullYear() && mi === today.getMonth()
                  const hasData = ts.length > 0
                  const isSelected = selectedMonth === key
                  return (
                    <div
                      key={mi}
                      onClick={() => setSelectedMonth(isSelected ? null : key)}
                      className={[
                        'border rounded p-3 cursor-pointer transition-all min-h-[92px]',
                        hasData ? (pnl > 0 ? 'bg-green/10 border-green/30' : pnl < 0 ? 'bg-red/10 border-red/30' : 'bg-card border-border') : 'bg-card border-border opacity-40',
                        isSelected ? 'ring-2 ring-blue' : hasData ? 'hover:border-blue/50' : '',
                      ].join(' ')}
                    >
                      <p className={`text-xs font-semibold ${isCurrentMonth ? 'text-blue' : 'text-secondary'}`}>{String(mi + 1).padStart(2, '0')}</p>
                      {hasData && <p className={`text-xs font-bold mt-1 hidden md:block ${pnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(pnl)}</p>}
                      <p className="text-xs text-secondary hidden md:block">{ts.length} trade{ts.length !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-secondary hidden md:block">{wr}%</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PANNEAU DÉTAIL JOUR */}
          {selectedDay && view === 'day' && (
            <div className="card rounded p-6 mb-6">
              <h2 className="text-lg font-semibold text-primary mb-4">{formatDate(selectedDay + 'T12:00:00')}</h2>
              {selectedDayTrades.length === 0 ? (
                <p className="text-secondary text-sm">Aucun trade ce jour.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTrades.map(t => (
                    <div key={t.id} className="card rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">{t.symbol || '--'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.side === 'BUY' ? 'bg-green/20 text-green' : 'bg-red/20 text-red'}`}>{t.side || '--'}</span>
                        <span className="text-xs text-secondary">{formatTime(t.opened_at)} · {formatTime(t.closed_at)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-secondary">
                        <span>{t.entry ?? '--'} · {t.exit ?? '--'}</span>
                        <span>Vol. {t.volume ?? '--'}</span>
                        <span className={`font-bold text-sm ${(t.profit || 0) >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(t.profit || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANNEAU STATISTIQUES SEMAINE */}
          {selectedWeek && view === 'day' && (
            <div className="card rounded p-6 mb-6">
              <h2 className="text-lg font-semibold text-primary mb-4">Semaine du {selectedWeek}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">PnL total</p>
                  <p className={`text-xl font-bold ${selectedWeekPnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(selectedWeekPnl)}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">Trades</p>
                  <p className="text-xl font-bold text-primary">{selectedWeekTrades.length}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">Win rate</p>
                  <p className="text-xl font-bold text-primary">{selectedWeekWr}%</p>
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">Meilleur jour</p>
                  <p className={`text-lg font-bold ${selectedWeekBestDay ? (selectedWeekBestDay.pnl >= 0 ? 'text-green' : 'text-red') : 'text-primary'}`}>{selectedWeekBestDay ? formatPnl(selectedWeekBestDay.pnl) : '--'}</p>
                  {selectedWeekBestDay && <p className="text-xs text-secondary mt-1">{selectedWeekBestDay.date}</p>}
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">Pire jour</p>
                  <p className={`text-lg font-bold ${selectedWeekWorstDay ? (selectedWeekWorstDay.pnl >= 0 ? 'text-green' : 'text-red') : 'text-primary'}`}>{selectedWeekWorstDay ? formatPnl(selectedWeekWorstDay.pnl) : '--'}</p>
                  {selectedWeekWorstDay && <p className="text-xs text-secondary mt-1">{selectedWeekWorstDay.date}</p>}
                </div>
              </div>
            </div>
          )}

          {/* PANNEAU STATISTIQUES MOIS */}
          {selectedMonth && view === 'month' && (
            <div className="card rounded p-6 mb-6">
              <h2 className="text-lg font-semibold text-primary mb-4">
                {MONTHS_FR[parseInt(selectedMonth.split('-')[1]) - 1]} {selectedMonth.split('-')[0]}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">PnL total</p>
                  <p className={`text-xl font-bold ${selectedMonthPnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(selectedMonthPnl)}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">Trades</p>
                  <p className="text-xl font-bold text-primary">{selectedMonthTrades.length}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">Win rate</p>
                  <p className="text-xl font-bold text-primary">{selectedMonthWr}%</p>
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">Meilleur jour</p>
                  <p className={`text-lg font-bold ${selectedMonthBestDay ? (selectedMonthBestDay.pnl >= 0 ? 'text-green' : 'text-red') : 'text-primary'}`}>{selectedMonthBestDay ? formatPnl(selectedMonthBestDay.pnl) : '--'}</p>
                  {selectedMonthBestDay && <p className="text-xs text-secondary mt-1">{selectedMonthBestDay.date}</p>}
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase tracking-wide mb-1">Pire jour</p>
                  <p className={`text-lg font-bold ${selectedMonthWorstDay ? (selectedMonthWorstDay.pnl >= 0 ? 'text-green' : 'text-red') : 'text-primary'}`}>{selectedMonthWorstDay ? formatPnl(selectedMonthWorstDay.pnl) : '--'}</p>
                  {selectedMonthWorstDay && <p className="text-xs text-secondary mt-1">{selectedMonthWorstDay.date}</p>}
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  )
}
