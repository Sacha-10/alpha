"use client";

import { getSupabaseClient } from "@/lib/supabase";
import { detectAndParse } from "@/lib/parseCSV";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import LogoSvg from "@/components/LogoSvg";
import TradeReport from "@/components/TradeReport";
import TradeJournal from "@/components/TradeJournal";
import AnalysisHistory from "@/components/AnalysisHistory";
import WeeklyEvolution from "@/components/WeeklyEvolution";
import WeeklySummary from "@/components/WeeklySummary";
import type { AiAnalysisResult } from "@/lib/tradingAnalysisTypes";
import { isUnlimited, hasActiveAccess, isPremiumOrAbove, normalizePlan, getPlanLabel } from "@/lib/plans";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  Headphones,
  History,
  Lock,
  Menu,
  Radar,
  Receipt,
  ScanLine,
  ScrollText,
  Target,
  TrendingUp,
  Upload,
  Webhook,
} from "lucide-react";

const SESSION_KEY_REPORT = "atx_last_report";

type DashboardView =
  | "nouvelle-analyse"
  | "mon-analyse"
  | "historique"
  | "journal-analyses"
  | "evolution"
  | "resume-hebdomadaire"
  | "prop-firm-score"
  | "detection-predictive"
  | "alertes-telegram"
  | "acces-api"
  | "support";
type SectionKey = "analyse" | "performance" | "signaux" | "aide" | "compte";

function normalizeApiError(message: unknown): string {
  if (typeof message !== "string") return "Erreur d'analyse.";
  return message.replace(/\s+/g, " ").trim();
}

function SectionLabel({
  children,
  isOpen,
  onToggle,
}: {
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between px-2 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-secondary"
    >
      <span>{children}</span>
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
        aria-hidden
      />
    </button>
  );
}

function SidebarNavRow({
  icon: Icon,
  label,
  active = false,
  locked = false,
  lockPlanLabel,
  lockedPath = "/pricing",
  onSelect,
  onAfterNavigate,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  locked?: boolean;
  lockPlanLabel?: string;
  lockedPath?: string;
  onSelect?: () => void;
  onAfterNavigate?: () => void;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (locked) {
          router.push(lockedPath);
          onAfterNavigate?.();
          return;
        }
        onSelect?.();
        onAfterNavigate?.();
      }}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
        locked
          ? "cursor-not-allowed opacity-40"
          : active
            ? "border border-[#2D6FFF25] bg-[#2D6FFF15] text-primary"
            : "cursor-pointer text-secondary hover:bg-hover hover:text-primary"
      }`}
      title={locked && lockPlanLabel ? `Disponible sur plan ${lockPlanLabel}` : undefined}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      {locked ? <Lock className="h-4 w-4 shrink-0 text-secondary" /> : null}
    </button>
  );
}

function EmptyFeaturePage({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <Icon className="h-12 w-12 text-secondary opacity-30" aria-hidden />
      <h2 className="mt-6 text-xl font-bold text-primary">{title}</h2>
    </div>
  );
}

export default function DashboardClient() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [analysesUsed, setAnalysesUsed] = useState<number | undefined>();
  const [analysesLimit, setAnalysesLimit] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [analysesResetDate, setAnalysesResetDate] = useState<string | null>(null);

  const [mainView, setMainView] = useState<DashboardView>("nouvelle-analyse");

  const [hasSessionReport, setHasSessionReport] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadZoneKey, setUploadZoneKey] = useState(0);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    analyse: false,
    performance: false,
    signaux: false,
    aide: false,
    compte: false,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.add("hide-glow");
    return () => document.body.classList.remove("hide-glow");
  }, []);

  // Restore last report: Supabase first (cross-device, most recent), sessionStorage as fallback.
  // Depends on userId so the Supabase fetch is guaranteed to run while the session is active.
  useEffect(() => {
    async function restoreLatestAnalysis() {
      if (!userId) {
        return; // auth not ready yet; re-triggered once fetchUserData sets userId
      }

      let tokenParam = '';
      try {
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session?.access_token) tokenParam = `?token=${session.access_token}`;
      } catch { /* silent — fetch proceeds without token, uses cookies branch */ }

      try {
        const res = await fetch(`/api/analyses${tokenParam}`);
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          const json = body as { analyses?: Array<{ id: string; report: AiAnalysisResult }> };
          const latest = json.analyses?.[0];
          if (latest?.report) {
            setAnalysis(latest.report);
            setHasSessionReport(true);
            try {
              sessionStorage.setItem(SESSION_KEY_REPORT, JSON.stringify(latest.report));
            } catch { /* ignore */ }
            return;
          }
        }
      } catch (e) {
        console.error('[DashboardClient] GET /api/analyses erreur réseau:', e);
      }

      // Fallback: use sessionStorage if Supabase fetch failed or returned no analysis.
      try {
        const saved = sessionStorage.getItem(SESSION_KEY_REPORT);
        if (saved) {
          setAnalysis(JSON.parse(saved) as AiAnalysisResult);
          setHasSessionReport(true);
        }
      } catch { /* ignore */ }
    }

    void restoreLatestAnalysis();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`analyses-insert:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'member_analyses', filter: `user_id=eq.${userId}` },
        (payload) => {
          const report = (payload.new as { report: AiAnalysisResult }).report;
          if (report) {
            setAnalysis(report);
            setHasSessionReport(true);
          }
        }
      )
      .subscribe((status, err) => {
        if (err) console.error('[Realtime] analyses subscription error:', err);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data, error } = await supabase
      .from("users")
      .select("subscription_plan, subscription_status, analyses_used, analyses_limit, analyses_reset_date")
      .eq("id", user.id)
      .single();
    if (error) console.error("[DashboardClient] échec lecture users — userId:", user.id, JSON.stringify(error));
    if (data) {
      setSubscriptionPlan(data.subscription_plan ?? null);
      setSubscriptionStatus(data.subscription_status ?? null);
      setAnalysesResetDate(data.analyses_reset_date ?? null);
      if (data.analyses_limit != null && data.analyses_used != null) {
        setAnalysesUsed(data.analyses_used);
        setAnalysesLimit(data.analyses_limit);
      }
    }
  }, [supabase]);

  useEffect(() => {
    void fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const runAnalyze = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setAnalysesUsed(undefined);
    setAnalysesLimit(undefined);
    setHasSessionReport(false);
    setPendingFile(null);
    setUploadZoneKey((k) => k + 1);
    setMainView((prev) => (prev === "mon-analyse" ? "nouvelle-analyse" : prev));
    sessionStorage.removeItem(SESSION_KEY_REPORT);
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
        analysesLeft: _left,
        analysesLimit: _limit,
        ...report
      } = data as {
        analysesLeft: number;
        analysesLimit: number;
      } & AiAnalysisResult;

      setAnalysis(report);
      setHasSessionReport(true);
      setMainView('mon-analyse');
      sessionStorage.setItem(SESSION_KEY_REPORT, JSON.stringify(report));

      await fetchUserData();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Réseau indisponible."
      );
    } finally {
      setLoading(false);
    }
  }, [fetchUserData]);

  function formatResetDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const normalizedPlan = normalizePlan(subscriptionPlan) ?? "";
  const isElite = normalizedPlan === "elite";
  const premiumOrAbove = isPremiumOrAbove(normalizedPlan);
  const planLabel = getPlanLabel(subscriptionPlan);
  const cycleLabel = analysesResetDate
    ? `Cycle · ${formatResetDate(analysesResetDate)}`
    : "Cycle · --/--";
  const progressWidth =
    analysesUsed !== undefined && analysesLimit && analysesLimit > 0
      ? Math.min(100, (analysesUsed / analysesLimit) * 100)
      : 0;

  const showQuotaCard =
    hasActiveAccess(subscriptionStatus) &&
    analysesUsed !== undefined &&
    analysesLimit !== undefined &&
    !isUnlimited(analysesLimit);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const historiqueLocked = !premiumOrAbove;
  const evolutionLocked = !premiumOrAbove;
  const resumeLocked = !premiumOrAbove;
  const propFirmLocked = !isElite;
  const signauxLocked = !isElite;
  const supportLocked = !premiumOrAbove;

  // Deep-link : ?view=<DashboardView> ouvre directement la vue (ex. bouton
  // « Voir mon espace » de l'email Résumé semaine). Même gating que la
  // sidebar (mêmes booléens) : vue verrouillée pour le plan → paramètre
  // ignoré, on reste sur nouvelle-analyse. Tant que le plan n'est pas chargé
  // tout est verrouillé ; l'effet se rejoue quand les booléens changent.
  useEffect(() => {
    const view = searchParams.get("view");
    const valid: DashboardView[] = [
      "nouvelle-analyse", "mon-analyse", "historique", "journal-analyses",
      "evolution", "resume-hebdomadaire", "prop-firm-score",
      "detection-predictive", "alertes-telegram", "acces-api", "support",
    ];
    if (!view || !(valid as string[]).includes(view)) return;
    const viewLocked: Partial<Record<DashboardView, boolean>> = {
      historique: historiqueLocked,
      evolution: evolutionLocked,
      "resume-hebdomadaire": resumeLocked,
      "prop-firm-score": propFirmLocked,
      "detection-predictive": signauxLocked,
      "alertes-telegram": signauxLocked,
      "acces-api": signauxLocked,
      support: supportLocked,
    };
    if (viewLocked[view as DashboardView]) return;
    setMainView(view as DashboardView);
  }, [searchParams, historiqueLocked, evolutionLocked, resumeLocked, propFirmLocked, signauxLocked, supportLocked]);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const toggleSection = (key: SectionKey) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  function renderQuotaCard() {
    if (!showQuotaCard) return null;
    return (
      <div className="w-full shrink-0 border-t border-border px-4 pb-5 pt-4" style={{ backgroundColor: '#12121A' }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-secondary">Analyses utilisées</span>
          <span className="font-mono text-xs text-primary">
            {analysesUsed}/{analysesLimit}
          </span>
        </div>
        <div className="h-1 w-full bg-[#1E2035]">
          <div
            className="h-full bg-[#2D6FFF]"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>
    );
  }

  function renderSidebarAccordion(closeMobile?: () => void) {
    return (
      <div className="space-y-1">
        <SectionLabel isOpen={openSections.analyse} onToggle={() => toggleSection("analyse")}>Analyse</SectionLabel>
        {openSections.analyse ? (
          <>
            <SidebarNavRow
              icon={ScanLine}
              label="Analyser vos trades"
              active={mainView === "nouvelle-analyse"}
              onSelect={() => setMainView("nouvelle-analyse")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={ScrollText}
              label="Journal de trades"
              active={mainView === "journal-analyses"}
              onSelect={() => setMainView("journal-analyses")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={History}
              label="Historique"
              locked={historiqueLocked}
              lockPlanLabel="Premium"
              active={mainView === "historique"}
              onSelect={() => setMainView("historique")}
              onAfterNavigate={closeMobile}
            />
          </>
        ) : null}

        <SectionLabel isOpen={openSections.performance} onToggle={() => toggleSection("performance")}>Performance</SectionLabel>
        {openSections.performance ? (
          <>
            <SidebarNavRow
              icon={TrendingUp}
              label="Évolution semaine"
              locked={evolutionLocked}
              lockPlanLabel="Premium"
              active={mainView === "evolution"}
              onSelect={() => setMainView("evolution")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={CalendarCheck}
              label="Résumé semaine"
              locked={resumeLocked}
              lockPlanLabel="Premium"
              active={mainView === "resume-hebdomadaire"}
              onSelect={() => setMainView("resume-hebdomadaire")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={Target}
              label="Prop Firm Score"
              locked={propFirmLocked}
              lockPlanLabel="Elite"
              active={mainView === "prop-firm-score"}
              onSelect={() => setMainView("prop-firm-score")}
              onAfterNavigate={closeMobile}
            />
          </>
        ) : null}

        <SectionLabel isOpen={openSections.signaux} onToggle={() => toggleSection("signaux")}>Signaux</SectionLabel>
        {openSections.signaux ? (
          <>
            <SidebarNavRow
              icon={Radar}
              label="Détection prédictive"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "detection-predictive"}
              onSelect={() => setMainView("detection-predictive")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={Bell}
              label="Alertes Telegram"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "alertes-telegram"}
              onSelect={() => setMainView("alertes-telegram")}
              onAfterNavigate={closeMobile}
            />
            <SidebarNavRow
              icon={Webhook}
              label="Accès API"
              locked={signauxLocked}
              lockPlanLabel="Elite"
              active={mainView === "acces-api"}
              onSelect={() => setMainView("acces-api")}
              onAfterNavigate={closeMobile}
            />
          </>
        ) : null}

        <SectionLabel isOpen={openSections.aide} onToggle={() => toggleSection("aide")}>Aide</SectionLabel>
        {openSections.aide ? (
          <SidebarNavRow
            icon={Headphones}
            label="Support prioritaire"
            active={mainView === "support"}
            locked={supportLocked}
            lockPlanLabel="Premium"
            lockedPath="/help"
            onSelect={() => setMainView("support")}
            onAfterNavigate={closeMobile}
          />
        ) : null}

        <SectionLabel isOpen={openSections.compte} onToggle={() => toggleSection("compte")}>Compte</SectionLabel>
        {openSections.compte ? (
          <>
            <SidebarNavRow
              icon={CreditCard}
              label="Offres"
              onSelect={() => router.push("/pricing")}
              onAfterNavigate={closeMobile}
            />
            <a
              href="/api/customer-portal"
              onClick={() => closeMobile?.()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary transition-all duration-150 hover:bg-hover hover:text-primary"
            >
              <Receipt className="h-4 w-4 shrink-0" />
              Factures
            </a>
          </>
        ) : null}
      </div>
    );
  }

  function renderMainContent() {
    if (mainView === "mon-analyse") {
      if (!analysis) {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center text-secondary">
            <p className="text-sm">Aucun rapport à afficher.</p>
          </div>
        );
      }
      return (
        <TradeReport
          report={analysis}
          analysesUsed={analysesUsed}
          analysesLimit={analysesLimit}
        />
      );
    }

    if (mainView === "historique") {
      return <AnalysisHistory />;
    }
    if (mainView === "journal-analyses") {
      return <TradeJournal />;
    }
    if (mainView === "evolution") {
      return <WeeklyEvolution plan={subscriptionPlan} />;
    }
    if (mainView === "resume-hebdomadaire") {
      return <WeeklySummary plan={subscriptionPlan} />;
    }
    if (mainView === "prop-firm-score") {
      return <EmptyFeaturePage icon={Target} title="Prop Firm Score" />;
    }
    if (mainView === "detection-predictive") {
      return <EmptyFeaturePage icon={Radar} title="Détection prédictive" />;
    }
    if (mainView === "alertes-telegram") {
      return <EmptyFeaturePage icon={Bell} title="Alertes Telegram" />;
    }
    if (mainView === "acces-api") {
      return <EmptyFeaturePage icon={Webhook} title="Accès API" />;
    }
    if (mainView === "support") {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="w-full">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-primary">Support prioritaire</h1>
            </div>
            <div className="border border-border rounded-xl p-8 text-center mb-6">
              <Headphones className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="font-mono text-primary text-sm font-medium">support@alphatradex.ai</p>
              <p className="text-secondary text-xs mt-1">Réservé aux membres Premium et Élite</p>
            </div>
            <div className="mt-4 w-full max-w-md mx-auto">
              <div className="flex justify-center">
                <a
                  href="mailto:support@alphatradex.ai"
                  className="btn-primary py-2.5 inline-flex items-center justify-center gap-2"
                >
                  Écrire au support prioritaire
                  <ArrowRight size={16} aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // nouvelle-analyse
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-primary">Analyser vos trades</h1>
          </div>
          <div
            key={uploadZoneKey}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer mb-6 transition-colors ${dragging ? "border-blue bg-blue/5" : pendingFile ? "border-green/50 bg-green/5" : "border-border hover:border-blue/50"}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) setPendingFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setPendingFile(f);
              }}
            />
            <Upload className="h-6 w-6 text-secondary mx-auto mb-2" />
            <p className="text-primary text-sm font-medium">Importez votre historique de trades</p>
            <p className="text-secondary text-xs mt-1">MT4 · MT5 · Binance · Bybit · TradingView · FTMO · FundedNext</p>
          </div>
          <div className="mt-4 w-full max-w-md mx-auto">
          {hasSessionReport ? (
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="btn-primary py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!pendingFile || loading}
                onClick={() => {
                  if (pendingFile) void runAnalyze(pendingFile);
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
              <button
                type="button"
                className="btn-outline py-2.5"
                onClick={() => setMainView("mon-analyse")}
              >
                Mon analyse
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                className="btn-primary py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!pendingFile || loading}
                onClick={() => {
                  if (pendingFile) void runAnalyze(pendingFile);
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
            </div>
          )}
        </div>

          {error ? (
            <p className="mt-3 text-sm text-red" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-primary">
      <header className="z-20 h-14 shrink-0 border-b border-border bg-card">
        <div className="hidden h-full items-center justify-between px-4 md:flex">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex shrink-0 items-center gap-2 text-left"
          >
            <LogoSvg size={28} />
            <span className="font-semibold text-primary">AlphaTradeX</span>
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-start pl-6 md:pl-10">
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2D6FFF]"
                aria-hidden
              />
              <span className="text-xs text-secondary">IA active</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-md border border-[#2D6FFF40] bg-[#2D6FFF15] px-3 py-1 text-xs font-semibold text-blue">
              {planLabel}
            </span>
            <span className="text-xs text-secondary">{cycleLabel}</span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-secondary hover:bg-hover hover:text-primary"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        <div className="relative flex h-full items-center justify-between px-4 md:hidden">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex shrink-0 items-center text-left"
            aria-label="AlphaTradeX · accueil"
          >
            <LogoSvg size={28} />
          </button>
          <Link
            href="/"
            className="absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate font-semibold text-primary"
          >
            AlphaTradeX
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="shrink-0 rounded-md border border-border p-2 text-secondary hover:bg-hover hover:text-primary"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="flex max-h-[calc(100vh-3.5rem)] shrink-0 flex-col overflow-hidden border-b border-border bg-card md:hidden" style={{ backgroundColor: '#12121A' }}>
          <div className="shrink-0 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2D6FFF]"
                  aria-hidden
                />
                <span className="text-xs text-secondary">IA active</span>
              </div>
              <span className="text-xs text-secondary">{cycleLabel}</span>
              <span className="rounded-md border border-[#2D6FFF40] bg-[#2D6FFF15] px-3 py-1 text-xs font-semibold text-blue">
                {planLabel}
              </span>
            </div>
            <div className="mt-3 h-px w-full bg-border" aria-hidden />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            {renderSidebarAccordion(closeMobileMenu)}
          </div>
          <div className="shrink-0 px-4 pb-4 pt-3" style={{ backgroundColor: '#12121A' }}>
            <div className="h-px bg-border" aria-hidden />
            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                void signOut();
              }}
              className="flex w-full cursor-pointer items-center rounded-lg mt-4 text-xs text-secondary transition-all duration-150 hover:bg-hover hover:text-primary"
            >
              Se déconnecter
            </button>
          </div>
          {renderQuotaCard()}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside className="hidden h-full w-[280px] shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            {renderSidebarAccordion()}
          </div>
          {renderQuotaCard()}
        </aside>

        <main
          className={`flex min-h-0 flex-1 flex-col bg-[#0A0A0F] p-6 ${
            mainView === "nouvelle-analyse" || mainView === "mon-analyse" || mainView === "journal-analyses" || mainView === "historique" || mainView === "evolution" || mainView === "resume-hebdomadaire" || mainView === "support" ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            {mainView !== "nouvelle-analyse" && mainView !== "mon-analyse" && mainView !== "journal-analyses" && mainView !== "historique" && mainView !== "evolution" && mainView !== "resume-hebdomadaire" && mainView !== "support" ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                {renderMainContent()}
              </div>
            ) : (
              renderMainContent()
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
