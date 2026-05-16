"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { detectAndParse } from '@/lib/parseCSV'
import { Upload, ChevronLeft, ChevronRight, Download, X } from 'lucide-react'

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

type DayData = {
  date: string
  trades: TradeRow[]
  pnl: number
  winCount: number
  lossCount: number
}

type PeriodData = {
  label: string
  dateStart: string
  dateEnd: string
  trades: TradeRow[]
  pnl: number
  winCount: number
  lossCount: number
}

type Props = {
  userId: string
  plan: string | null
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Lu','Ma','Me','Je','Ve','Sa','Di']

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

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  return monday.toISOString().split('T')[0]
}

function getWeekLabel(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T12:00:00')
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `Du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
}

export default function TradeJournal({ userId, plan }: Props) {
  const supabase = getSupabaseClient()

  const getDateMin = () => {
    if (plan === 'pro') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    if (plan === 'premium') return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    return new Date('2026-01-01')
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  const [trades, setTrades] = useState<TradeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [dateFrom, setDateFrom] = useState(sevenDaysAgoStr)
  const [dateTo, setDateTo] = useState(todayStr)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; pnl: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)

  const minNav = { year: 2026, month: 0 }
  const maxNav = { year: new Date().getFullYear(), month: 11 }

  const loadTrades = useCallback(async () => {
    setLoading(true)
    const dateMin = getDateMin()
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .gte('opened_at', dateMin.toISOString())
      .order('opened_at', { ascending: true })
    setTrades(data || [])
    setLoading(false)
  }, [userId, plan])

  useEffect(() => { loadTrades() }, [loadTrades])

  useEffect(() => {
    if (!importSuccess) return
    const t = setTimeout(() => setImportSuccess(null), 10000)
    return () => clearTimeout(t)
  }, [importSuccess])

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
      setImportSuccess(`${data.count} trades importés avec succès.`)
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

  const dayDataList: DayData[] = Object.entries(dayMap).map(([date, ts]) => ({
    date,
    trades: ts,
    pnl: ts.reduce((s, t) => s + (t.profit || 0), 0),
    winCount: ts.filter(t => (t.profit || 0) > 0).length,
    lossCount: ts.filter(t => (t.profit || 0) < 0).length,
  })).sort((a, b) => a.date.localeCompare(b.date))

  const weekMap: Record<string, TradeRow[]> = {}
  filteredTrades.forEach(t => {
    if (!t.opened_at) return
    const key = getWeekKey(t.opened_at.split('T')[0])
    if (!weekMap[key]) weekMap[key] = []
    weekMap[key].push(t)
  })
  const weekDataList: PeriodData[] = Object.entries(weekMap).map(([monday, ts]) => {
    const sunday = new Date(monday + 'T12:00:00')
    sunday.setDate(sunday.getDate() + 6)
    return {
      label: getWeekLabel(monday),
      dateStart: monday,
      dateEnd: sunday.toISOString().split('T')[0],
      trades: ts,
      pnl: ts.reduce((s, t) => s + (t.profit || 0), 0),
      winCount: ts.filter(t => (t.profit || 0) > 0).length,
      lossCount: ts.filter(t => (t.profit || 0) < 0).length,
    }
  }).sort((a, b) => a.dateStart.localeCompare(b.dateStart))

  const monthMap: Record<string, TradeRow[]> = {}
  filteredTrades.forEach(t => {
    if (!t.opened_at) return
    const key = t.opened_at.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = []
    monthMap[key].push(t)
  })
  const monthDataList: PeriodData[] = Object.entries(monthMap).map(([key, ts]) => {
    const [y, m] = key.split('-').map(Number)
    const lastD = new Date(y, m, 0).getDate()
    return {
      label: `${MONTHS_FR[m - 1]} ${y}`,
      dateStart: `${key}-01`,
      dateEnd: `${key}-${lastD}`,
      trades: ts,
      pnl: ts.reduce((s, t) => s + (t.profit || 0), 0),
      winCount: ts.filter(t => (t.profit || 0) > 0).length,
      lossCount: ts.filter(t => (t.profit || 0) < 0).length,
    }
  }).sort((a, b) => a.dateStart.localeCompare(b.dateStart))

  const yearMap: Record<string, TradeRow[]> = {}
  filteredTrades.forEach(t => {
    if (!t.opened_at) return
    const key = t.opened_at.slice(0, 4)
    if (!yearMap[key]) yearMap[key] = []
    yearMap[key].push(t)
  })
  const yearDataList: PeriodData[] = Object.entries(yearMap).map(([year, ts]) => ({
    label: year,
    dateStart: `${year}-01-01`,
    dateEnd: `${year}-12-31`,
    trades: ts,
    pnl: ts.reduce((s, t) => s + (t.profit || 0), 0),
    winCount: ts.filter(t => (t.profit || 0) > 0).length,
    lossCount: ts.filter(t => (t.profit || 0) < 0).length,
  })).sort((a, b) => a.dateStart.localeCompare(b.dateStart))

  const totalPnl = filteredTrades.reduce((s, t) => s + (t.profit || 0), 0)
  const totalTrades = filteredTrades.length
  const winRate = totalTrades > 0 ? Math.round((filteredTrades.filter(t => (t.profit || 0) > 0).length / totalTrades) * 100) : 0
  const bestDay = dayDataList.length > 0 ? dayDataList.reduce((a, b) => a.pnl > b.pnl ? a : b) : null
  const worstDay = dayDataList.length > 0 ? dayDataList.reduce((a, b) => a.pnl < b.pnl ? a : b) : null

  const cumulPoints: { date: string; cumul: number }[] = []
  let cumul = 0
  dayDataList.forEach(d => {
    cumul += d.pnl
    cumulPoints.push({ date: d.date, cumul })
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
  const goToday = () => setCurrentMonth({ year: today.getFullYear(), month: today.getMonth() })

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

  const PeriodRow = ({ p }: { p: PeriodData }) => {
    const wr = p.trades.length > 0 ? Math.round((p.winCount / p.trades.length) * 100) : 0
    return (
      <div className={`card rounded p-4 flex items-center justify-between gap-4 border ${p.pnl > 0 ? 'border-green/30 bg-green/5' : p.pnl < 0 ? 'border-red/30 bg-red/5' : 'border-border'}`}>
        <div>
          <p className="text-sm font-semibold text-primary">{p.label}</p>
          <p className="text-xs text-secondary mt-0.5">{p.trades.length} trade{p.trades.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-secondary uppercase tracking-wide">Win rate</p>
            <p className="text-sm font-bold text-primary">{wr}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-secondary uppercase tracking-wide">PnL</p>
            <p className={`text-sm font-bold ${p.pnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(p.pnl)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">

      {/* EN-TÊTE */}
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Journal de trades</h1>
        {firstTradeDate && lastTradeDate && (
          <p className="text-sm text-secondary mt-1">Du {firstTradeDate} au {lastTradeDate}</p>
        )}
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
        <div className="flex items-center">
          {(['day','week','month','year'] as const).flatMap((v, i) => [
            ...(i > 0 ? [<span key={`sep-${v}`} className="text-secondary mx-2">·</span>] : []),
            <button key={v} onClick={() => setView(v)} className={`text-sm transition-colors ${view === v ? 'text-primary font-semibold' : 'text-secondary hover:text-primary'}`}>
              {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : v === 'month' ? 'Mois' : 'Année'}
            </button>
          ])}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} min="2026-01-01" max={dateTo} onChange={e => setDateFrom(e.target.value)} className="bg-transparent border-none text-secondary text-sm focus:text-primary outline-none cursor-pointer" />
          <span className="text-secondary">→</span>
          <input type="date" value={dateTo} min={dateFrom} max={`${new Date().getFullYear()}-12-31`} onChange={e => setDateTo(e.target.value)} className="bg-transparent border-none text-secondary text-sm focus:text-primary outline-none cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="btn-outline flex items-center gap-2 text-sm px-3 py-1.5">
            <Upload className="h-4 w-4" />
            Importer
          </button>
          <span className="text-secondary">·</span>
          <button onClick={exportCSV} className="btn-outline flex items-center gap-2 text-sm px-3 py-1.5">
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* BARRE DE CONTRÔLES — Mobile */}
      <div ref={mobileDropdownRef} className="flex md:hidden items-center justify-between gap-2 mb-6 relative">
        <div className="flex items-center">
          <button onClick={() => setMobileDropdownOpen(o => !o)} className="text-sm text-primary font-medium">
            {view === 'day' ? 'Jour' : view === 'week' ? 'Semaine' : view === 'month' ? 'Mois' : 'Année'} ›
          </button>
        </div>
        {mobileDropdownOpen && (
          <div className="absolute top-0 left-0 right-0 bg-card border border-border rounded-xl z-50 flex items-center justify-center gap-2 px-3 py-2">
            {(['day','week','month','year'] as const).flatMap((v, i) => [
              ...(i > 0 ? [<span key={`sep-${v}`} className="text-secondary">·</span>] : []),
              <button key={v} onClick={() => { setView(v); setMobileDropdownOpen(false) }} className={`text-sm ${view === v ? 'text-primary font-semibold' : 'text-secondary'}`}>
                {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : v === 'month' ? 'Mois' : 'Année'}
              </button>
            ])}
          </div>
        )}
        <div className="flex items-center gap-1">
          <input type="date" value={dateFrom} min="2026-01-01" max={dateTo} onChange={e => setDateFrom(e.target.value)} className="bg-transparent border-none text-secondary text-xs focus:text-primary outline-none cursor-pointer" />
          <span className="text-secondary text-xs">→</span>
          <input type="date" value={dateTo} min={dateFrom} max={`${new Date().getFullYear()}-12-31`} onChange={e => setDateTo(e.target.value)} className="bg-transparent border-none text-secondary text-xs focus:text-primary outline-none cursor-pointer" />
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

              <div className="grid grid-cols-7 mb-2">
                {DAYS_FR.map(d => (
                  <div key={d} className="text-center text-xs text-secondary py-1">{d}</div>
                ))}
              </div>

              {calWeeks.map((week, wi) => {
                const weekTrades = week.flatMap(({ date }) => dayMap[date] || [])
                const weekPnl = weekTrades.reduce((s, t) => s + (t.profit || 0), 0)
                const weekWins = weekTrades.filter(t => (t.profit || 0) > 0).length
                const weekWr = weekTrades.length > 0 ? Math.round((weekWins / weekTrades.length) * 100) : 0
                return (
                  <div key={wi}>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {week.map(({ date, inMonth }) => {
                        const day = dayMap[date]
                        const pnl = day ? day.reduce((s, t) => s + (t.profit || 0), 0) : null
                        const isSelected = selectedDay === date
                        const isToday = date === todayStr
                        return (
                          <div
                            key={date}
                            onClick={() => inMonth && setSelectedDay(isSelected ? null : date)}
                            className={`
                              rounded p-1.5 min-h-[64px] border cursor-pointer transition-all
                              ${!inMonth ? 'opacity-40' : ''}
                              ${isSelected ? 'ring-2 ring-blue' : ''}
                              ${pnl !== null && pnl > 0 ? 'bg-green/10 border-green/30' : pnl !== null && pnl < 0 ? 'bg-red/10 border-red/30' : 'bg-card border-border'}
                              ${inMonth ? 'hover:border-blue/50' : 'cursor-default'}
                            `}
                          >
                            <p className={`text-xs font-medium ${isToday ? 'text-blue' : 'text-secondary'}`}>{new Date(date + 'T12:00:00').getDate()}</p>
                            {pnl !== null && (
                              <>
                                <p className={`text-xs font-bold mt-0.5 ${pnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(pnl)}</p>
                                <p className="text-xs text-secondary">{day?.length} trade{day?.length !== 1 ? 's' : ''}</p>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {weekTrades.length > 0 && (
                      <div className={`col-span-7 rounded px-3 py-1.5 mb-2 flex items-center justify-between border ${weekPnl >= 0 ? 'bg-green/5 border-green/20' : 'bg-red/5 border-red/20'}`}>
                        <span className="text-xs text-secondary">{weekTrades.length} trade{weekTrades.length !== 1 ? 's' : ''} · {weekWr}% win rate</span>
                        <span className={`text-xs font-bold ${weekPnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(weekPnl)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* VUE SEMAINE */}
          {view === 'week' && (
            <div className="space-y-2 mb-6">
              {weekDataList.length === 0 ? (
                <div className="card rounded p-8 text-center text-secondary">Aucun trade sur cette période.</div>
              ) : weekDataList.map((p, i) => <PeriodRow key={i} p={p} />)}
            </div>
          )}

          {/* VUE MOIS */}
          {view === 'month' && (
            <div className="space-y-2 mb-6">
              {monthDataList.length === 0 ? (
                <div className="card rounded p-8 text-center text-secondary">Aucun trade sur cette période.</div>
              ) : monthDataList.map((p, i) => <PeriodRow key={i} p={p} />)}
            </div>
          )}

          {/* VUE ANNÉE */}
          {view === 'year' && (
            <div className="space-y-2 mb-6">
              {yearDataList.length === 0 ? (
                <div className="card rounded p-8 text-center text-secondary">Aucun trade sur cette période.</div>
              ) : yearDataList.map((p, i) => <PeriodRow key={i} p={p} />)}
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
                    <div key={t.id} className="card rounded p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">{t.symbol || '--'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${t.side === 'Long' ? 'bg-green/20 text-green' : 'bg-red/20 text-red'}`}>{t.side || '--'}</span>
                        <span className="text-xs text-secondary">{formatTime(t.opened_at)} → {formatTime(t.closed_at)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-secondary">
                        <span>{t.entry ?? '--'} → {t.exit ?? '--'}</span>
                        <span>Vol. {t.volume ?? '--'}</span>
                        <span className={`font-bold text-sm ${(t.profit || 0) >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(t.profit || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COURBE PNL CUMULÉ */}
          {cumulPoints.length > 1 && (
            <div className="card rounded p-4 mb-6 relative">
              <p className="text-xs text-secondary uppercase tracking-wide mb-3">PnL cumulé</p>
              <svg ref={svgRef} width="100%" height="120" style={{ overflow: 'visible' }}
                onMouseLeave={() => setTooltip(null)}
                onMouseMove={e => {
                  if (!svgRef.current || cumulPoints.length < 2) return
                  const rect = svgRef.current.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const w = rect.width
                  const idx = Math.round((x / w) * (cumulPoints.length - 1))
                  const pt = cumulPoints[Math.max(0, Math.min(idx, cumulPoints.length - 1))]
                  const minP = Math.min(...cumulPoints.map(p => p.cumul))
                  const maxP = Math.max(...cumulPoints.map(p => p.cumul))
                  const range = maxP - minP || 1
                  const py = 10 + ((maxP - pt.cumul) / range) * 100
                  setTooltip({ x: (idx / (cumulPoints.length - 1)) * w, y: py, date: pt.date, pnl: pt.cumul })
                }}
              >
                {(() => {
                  const minP = Math.min(...cumulPoints.map(p => p.cumul))
                  const maxP = Math.max(...cumulPoints.map(p => p.cumul))
                  const range = maxP - minP || 1
                  const n = cumulPoints.length
                  const pts = cumulPoints.map((p, i) => `${(i / (n - 1)) * 100}%,${10 + ((maxP - p.cumul) / range) * 100}`)
                  const polyline = pts.join(' ')
                  const area = `0,110 ${polyline} 100%,110`
                  return (
                    <>
                      <defs>
                        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2D6FFF" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#2D6FFF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={area} fill="url(#pnlGrad)" />
                      <polyline points={polyline} fill="none" stroke="#2D6FFF" strokeWidth="2" strokeLinejoin="round" />
                      {tooltip && (
                        <>
                          <circle cx={`${(cumulPoints.findIndex(p => p.date === tooltip.date) / (n-1)) * 100}%`} cy={tooltip.y} r="4" fill="#2D6FFF" />
                          <line x1={`${(cumulPoints.findIndex(p => p.date === tooltip.date) / (n-1)) * 100}%`} y1="0" x2={`${(cumulPoints.findIndex(p => p.date === tooltip.date) / (n-1)) * 100}%`} y2="120" stroke="#2D6FFF" strokeWidth="1" strokeDasharray="4" />
                        </>
                      )}
                    </>
                  )
                })()}
              </svg>
              {tooltip && (
                <div className="absolute pointer-events-none bg-card border border-border rounded px-3 py-2 text-xs text-primary" style={{ left: Math.min(tooltip.x, 200), top: tooltip.y - 40, transform: 'translateX(-50%)' }}>
                  <p className="text-secondary">{tooltip.date}</p>
                  <p className={`font-bold ${tooltip.pnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(tooltip.pnl)}</p>
                </div>
              )}
            </div>
          )}

          {/* STATISTIQUES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card rounded p-4">
              <p className="text-xs text-secondary uppercase tracking-wide mb-1">PnL total</p>
              <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>{formatPnl(totalPnl)}</p>
            </div>
            <div className="card rounded p-4">
              <p className="text-xs text-secondary uppercase tracking-wide mb-1">Win rate</p>
              <p className="text-2xl font-bold text-primary">{winRate}%</p>
            </div>
            <div className="card rounded p-4">
              <p className="text-xs text-secondary uppercase tracking-wide mb-1">Meilleur jour</p>
              <p className="text-lg font-bold text-green">{bestDay ? formatPnl(bestDay.pnl) : '--'}</p>
              {bestDay && <p className="text-xs text-secondary mt-1">{bestDay.date}</p>}
            </div>
            <div className="card rounded p-4">
              <p className="text-xs text-secondary uppercase tracking-wide mb-1">Pire jour</p>
              <p className="text-lg font-bold text-red">{worstDay ? formatPnl(worstDay.pnl) : '--'}</p>
              {worstDay && <p className="text-xs text-secondary mt-1">{worstDay.date}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
