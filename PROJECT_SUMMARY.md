# RÉSUMÉ COMPLET — AlphaTradeX (à jour au 11 juin 2026)

---

## 1. STACK ET DÉPENDANCES

### Dependencies (production)
| Package | Version |
|---|---|
| `next` | ^16.2.3 |
| `react` | ^18.3.1 |
| `react-dom` | ^18.3.1 |
| `@supabase/supabase-js` | ^2.47.10 |
| `@supabase/ssr` | ^0.10.2 |
| `@supabase/auth-helpers-nextjs` | ^0.10.0 |
| `@stripe/stripe-js` | ^5.5.0 |
| `stripe` | ^17.5.0 |
| `openai` | ^4.77.3 |
| `framer-motion` | ^11.15.0 |
| `lucide-react` | ^0.468.0 |
| `papaparse` | ^5.4.1 |
| `nextjs-toploader` | ^3.9.17 |
| `@radix-ui/react-popover` | ^1.1.15 |
| `@sparticuz/chromium` | ^148.0.0 |
| `puppeteer-core` | ^24.43.0 |
| `resend` | ^6.12.3 |

### DevDependencies
| Package | Version |
|---|---|
| `typescript` | ^5.7.2 |
| `tailwindcss` | ^3.4.17 |
| `autoprefixer` | ^10.4.20 |
| `postcss` | ^8.4.49 |
| `cross-env` | ^10.1.0 |
| `eslint` | ^8.57.1 |
| `eslint-config-next` | ^14.2.21 |
| `@types/node` | ^20.17.12 |
| `@types/react` | ^18.3.18 |
| `@types/react-dom` | ^18.3.5 |
| `@types/papaparse` | ^5.3.15 |

### Scripts npm
- `dev` → `cross-env TURBOPACK= next dev` (Turbopack désactivé explicitement)
- `dev:turbo` → `next dev --turbo`
- `build` / `start` / `lint`

---

## 2. STRUCTURE DES FICHIERS

```
alpha/
├── app/
│   ├── favicon.ico
│   ├── icon.svg
│   ├── globals.css
│   ├── layout.tsx                      ← Root layout global
│   ├── page.tsx                        ← Page d'accueil /
│   ├── api/
│   │   ├── analyze/route.ts            ← POST (auth requise, rate-limit 15s)
│   │   ├── analyze-demo/route.ts       ← POST (rate-limit par IP)
│   │   ├── analyses/route.ts           ← GET historique analyses (rétention par plan)
│   │   ├── auth/callback/route.ts      ← OAuth callback Supabase (@supabase/ssr)
│   │   ├── create-checkout/route.ts    ← Stripe checkout (GET, param token)
│   │   ├── customer-portal/route.ts    ← Portail client Stripe (GET)
│   │   ├── generate-pdf/route.tsx      ← POST export PDF (Puppeteer + @sparticuz/chromium)
│   │   ├── import-trades/route.ts      ← POST import trades bruts (table trades)
│   │   ├── trades/route.ts             ← GET trades (journal de trades)
│   │   └── webhook/route.ts            ← Webhook Stripe (3 événements + email Resend)
│   ├── about/
│   │   └── page.tsx                    ← /about (Page À propos)
│   ├── analysis/
│   │   └── page.tsx                    ← /analysis (démo libre, 1/IP)
│   ├── dashboard/
│   │   ├── page.tsx                    ← Wrapper Suspense
│   │   └── DashboardClient.tsx         ← /dashboard (protégé middleware) — shell sidebar+topbar
│   ├── help/
│   │   └── page.tsx                    ← /help (Page Aide)
│   ├── pricing/
│   │   └── page.tsx                    ← /pricing
│   └── legal/
│       ├── layout.tsx                  ← Navbar + Footer partagés
│       ├── cgu/page.tsx
│       ├── cgv/page.tsx
│       ├── confidentialite/page.tsx
│       ├── cookies/page.tsx
│       ├── mentions-legales/page.tsx
│       ├── privacy/page.tsx
│       ├── risque/page.tsx
│       └── terms/page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── CookieBanner.tsx
│   ├── Providers.tsx
│   ├── ScrollReset.tsx
│   ├── TradeReport.tsx                 ← wrapper "use client" (animations, quota, PDF)
│   ├── TradeReportBody.tsx             ← contenu pur du rapport (partagé UI)
│   ├── TradeJournal.tsx                ← journal de trades (calendrier, import/export)
│   ├── AnalysisHistory.tsx             ← historique des analyses (accordéon)
│   ├── UploadZone.tsx
│   ├── ExportGuide.tsx
│   └── GoogleAuthButton.tsx
├── lib/
│   ├── supabase.ts
│   ├── openai.ts                       ← analyzeTradesDemo + analyzeTradesMember + computeStats
│   ├── plans.ts
│   ├── demoTrades.ts
│   ├── tradingAnalysisTypes.ts
│   ├── resend.ts                       ← client Resend (RESEND_API_KEY)
│   ├── emails/
│   │   └── confirmationPaiement.ts     ← template HTML email confirmation paiement
│   └── parseCSV/
│       ├── index.ts
│       ├── types.ts
│       ├── utils.ts                    ← cleanSymbol, normalizeCSV, detectDelimiter, makeCSVParser
│       ├── parseMT4.ts
│       ├── parseTradingView.ts
│       ├── parseBinance.ts
│       ├── parseBybit.ts
│       └── parseFTMO.ts
├── styles/
│   └── theme.ts                        ← Source of truth couleurs/tokens
├── middleware.ts
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.mjs
├── .eslintrc.json
├── CLAUDE.md / AGENTS.md
└── public/
    ├── manifest.json                   ← PWA manifest
    └── file.svg, globe.svg, logo.svg, next.svg, vercel.svg, window.svg
```

---

## 3. DESIGN SYSTEM COMPLET

### Source de vérité : `styles/theme.ts`

```ts
background:      "#0A0A0F"   // fond principal
backgroundCard:  "#12121A"   // fond des cards
backgroundHover: "#1A1A28"   // fond au hover
accentBlue:      "#2D6FFF"   // couleur principale
accentCyan:      "#00E5FF"   // accent secondaire
accentRed:       "#FF3D57"   // erreurs / danger
accentOrange:    "#FFB800"   // avertissements
accentGreen:     "#00E5B0"   // succès / positif
textPrimary:     "#F0F4FF"   // texte principal
textSecondary:   "#8892AA"   // texte secondaire
border:          "#1E2035"   // bordures
borderHover:     "#2D6FFF"   // bordures au hover
borderRadius:    "12px"
transition:      "200ms ease"
shadow:          "0 0 40px rgba(45, 111, 255, 0.07)"
```

### Variables CSS — `:root` dans `globals.css`

```css
--background:     #0A0A0F
--card:           #12121A
--hover:          #1A1A28
--blue:           #2D6FFF
--cyan:           #00E5FF
--red:            #FF3D57
--orange:         #FFB800
--green:          #00E5B0
--primary:        #F0F4FF
--secondary:      #8892AA
--border:         #1E2035
--radius:         12px
--transition:     200ms ease
--shadow:         0 0 40px rgba(45, 111, 255, 0.07)
--background-rgb: 10, 10, 15
--blue-rgb:       45, 111, 255
--cyan-rgb:       0, 229, 255
--red-rgb:        255, 61, 87
--orange-rgb:     255, 184, 0
--green-rgb:      0, 229, 176
--primary-rgb:    240, 244, 255
--secondary-rgb:  136, 146, 170
--border-rgb:     30, 32, 53
```

### Tailwind — Couleurs custom (`tailwind.config.ts`)

| Token Tailwind | Valeur hex |
|---|---|
| `background` | #0A0A0F |
| `card` | #12121A |
| `hover` | #1A1A28 |
| `blue` | #2D6FFF |
| `cyan` | #00E5FF |
| `red` | #FF3D57 |
| `orange` | #FFB800 |
| `green` | #00E5B0 |
| `primary` | #F0F4FF |
| `secondary` | #8892AA |
| `border` | #1E2035 |
| `borderHover` | #2D6FFF |

### Tailwind — Fonts
```ts
sans: ["var(--font-inter)", "sans-serif"]
mono: ["var(--font-jetbrains-mono)", "monospace"]
```

### Tailwind — Border radius
```ts
DEFAULT: "12px"
```

### Tailwind — Box shadows
```ts
card: "0 0 40px rgba(45, 111, 255, 0.07)"
blue: "0 0 20px rgba(45, 111, 255, 0.3)"
```

### Récapitulatif complet de toutes les valeurs rgba bleu du projet

| Valeur | Fichier | Rôle |
|---|---|---|
| `rgba(45, 111, 255, 0.07)` | `globals.css`, `theme.ts` | `--shadow` / cards |
| `rgba(45, 111, 255, 0.15)` | `globals.css` | `.glow-blue`, `.hover:glow-blue` |
| `rgba(45, 111, 255, 0.20)` | `app/layout.tsx` | Glow radial décoratif global |
| `rgba(45, 111, 255, 0.3)` | `globals.css`, `tailwind.config.ts` | `.btn-primary:hover`, `shadow-blue` |
| `rgba(var(--blue-rgb), 0.35)` | `Providers.tsx` | NextTopLoader shadow |

### Polices

- **Inter** : weights 400, 500, 600, 700 — variable CSS `--font-inter`
- **JetBrains Mono** : weights 400, 500 — variable CSS `--font-jetbrains-mono`
- Import backup : `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap')`

### Animations

**`landing-marquee`** (`globals.css`) :
```css
@keyframes landing-marquee {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}
.animate-landing-marquee {
  display: flex;
  width: max-content;
  animation: landing-marquee 50s linear infinite;
  will-change: transform;
  backface-visibility: hidden;
}
```

**Framer Motion** :
- `TradeReport.tsx` : `initial={{ opacity:0, y:20 }}` → `animate={{ opacity:1, y:0 }}` delays 0 / 0.1 / 0.2 / 0.3 / 0.35 / 0.4 / 0.45 / 0.5s
- `analysis/page.tsx` : même pattern + barre `width:['0%','90%']` duration 8s
- `UploadZone.tsx` : `whileHover={{ scale:1.01 }}` + AnimatePresence + barre `width:['0%','85%']` duration 10s

**RevealSection** (IntersectionObserver threshold 0.15) :
```
invisible : translateY(28px) opacity-0   ← about/page.tsx, help/page.tsx
invisible : translate-y-6 opacity-0       ← page.tsx (homepage)
visible   : translateY(0) opacity-100
transition: 700ms ease-out
```
One-shot : `observer.unobserve()` après premier déclenchement.

### Transition globale sur tous les éléments
```css
*, *::before, *::after {
  transition-property: color, background-color, border-color, box-shadow, opacity;
  transition-duration: 200ms;
  transition-timing-function: ease;
}
/* Désactivée avec prefers-reduced-motion: reduce */
```

### Classes CSS utilitaires globales
```css
.card          { background: #12121A; border: 1px solid #1E2035;
                 border-radius: 12px; box-shadow: var(--shadow) }
.card:hover    { border-color: #2D6FFF }

.btn-primary   { background: #2D6FFF; color: white; border-radius: 12px;
                 padding: 12px 24px; font-weight: 600; cursor: pointer }
.btn-primary:hover { opacity: 0.9; box-shadow: 0 0 20px rgba(45,111,255,0.3) }

.btn-outline   { background: transparent; color: #F0F4FF;
                 border: 1px solid #1E2035; border-radius: 12px;
                 padding: 12px 24px; font-weight: 600; cursor: pointer }
.btn-outline:hover { border-color: #2D6FFF; color: #2D6FFF }

.glow-blue     { box-shadow: 0 0 40px rgba(45,111,255,0.15) }
.hover\:glow-blue:hover { box-shadow: 0 0 40px rgba(45,111,255,0.15) }
```

### Scrollbar custom
```css
::-webkit-scrollbar        { width: 6px; height: 6px }
::-webkit-scrollbar-track  { background: #0A0A0F }
::-webkit-scrollbar-thumb  { background: #2D6FFF; border-radius: 12px }
scrollbar-color: var(--blue) var(--background)   /* Firefox */
scrollbar-width: thin
scrollbar-gutter: stable
::selection { background: #2D6FFF; color: #F0F4FF }
```

---

## 4. COMPOSANTS

### `Navbar.tsx` — `"use client"`

**Logo SVG inline (identique dans Navbar et Footer) :**
```svg
<svg width="32" height="32" viewBox="0 0 600 600"
     style="border-radius:8px; flex-shrink:0" aria-hidden>
  <rect width="600" height="600" rx="125" ry="125" fill="#0A0A0F"/>
  <svg x="75" y="75" width="450" height="450" viewBox="0 0 24 24"
       fill="#0A0A0F" stroke="#2D6FFF" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
</svg>
```

**`<header>` :**
- `position: fixed; inset-x: 0; top: 0; z-index: 50`
- `border-b; backdrop-blur-md; transition-all duration-300`
- Scrollé (> 50px) : `border-border bg-background`
- Non scrollé : `border-transparent bg-transparent`

**Container inner :** `mx-auto flex w-full max-w-[1200px] items-center justify-between py-4`

**Logo (Link `href="/"`) :** `flex items-center gap-2 rounded text-left focus-visible:ring-2 focus-visible:ring-blue`
- Texte desktop : `hidden text-lg font-bold text-primary md:inline`
- Texte mobile centré (Link séparé) : `absolute left-1/2 -translate-x-1/2 text-lg font-bold text-primary md:hidden`

**Nav desktop :** `hidden items-center gap-8 text-sm md:flex`
- Items : `text-secondary transition-colors duration-200 hover:text-primary`
- Liens : Analyse → `/analysis` · Prix → `/pricing` · À propos → `/about` · Aide → `/help`

**Bouton auth desktop (conditionnel sur `user`) :**
- `hidden items-center gap-2 rounded bg-blue px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-blue/90 md:inline-flex`
- Icône : `<UserCircle h-4 w-4>`
- Si `user` : texte "Déconnexion" → `supabase.auth.signOut()`
- Si non connecté : texte "S'inscrire" → `supabase.auth.signInWithOAuth({ provider:"google", redirectTo:"/api/auth/callback", queryParams:{ access_type:"offline", prompt:"consent" } })`

**Auth state :** géré via `supabase.auth.getSession()` + `onAuthStateChange` dans `useEffect`
- `getSupabaseClient()` → `createBrowserClient` de `@supabase/ssr`

**Burger mobile :** `rounded border border-border bg-card p-2 text-secondary md:hidden`
- Icône : `<Menu>` fermé / `<X>` ouvert

**Menu mobile :**
- `mx-4 overflow-hidden rounded border border-border bg-card transition-all duration-200 ease-out md:hidden`
- Ouvert : `max-h-[360px] opacity-100`
- Fermé : `max-h-0 opacity-0`
- Inner : `flex flex-col gap-2 p-4`
- Liens mobiles : Analyse · Prix · À propos · Aide
- Bouton auth mobile : conditionnel (Déconnexion / S'inscrire), même logique que desktop
- Fermeture au clic extérieur via `mousedown` listener sur `document`

**États / logique :**
- `scrolled` : `window.scrollY > 50`
- `handleBrandClick` : `window.scrollTo({ top:0, behavior:"smooth" })` si sur `/`

---

### `Footer.tsx` — Server Component

```
<footer class="mx-auto flex max-w-[1200px] flex-col gap-8 text-secondary">
  Logo SVG 32x32 + "AlphaTradeX" font-bold text-primary
  "Votre analyste IA personnel sur les marchés" — mt-2 text-sm
  a[href="mailto:contact@alphatradex.ai"] — hover:text-primary
  flex flex-wrap items-center gap-4 text-sm :
    <Info h-4 w-4> Link "/about" → "À propos"
    <HelpCircle h-4 w-4> Link "/help" → "Aide"

<div class="mx-auto mt-6 flex max-w-[1200px] flex-col gap-2 text-xs text-secondary">
  Row 1 : /legal/mentions-legales · /legal/cgu · /legal/confidentialite
  Row 2 : /legal/cookies · /legal/cgv · /legal/risque

<p class="mx-auto mt-8 max-w-[1200px] text-sm text-secondary">
  © 2026 AlphaTradeX. Élaboré pour les traders sérieux.
```

---

### `CookieBanner.tsx` — `"use client"` + `createPortal`

**Décision clé :** `createPortal(…, document.body)` — échappe tout stacking context.

**Module-level flag :** `let _sessionDismissed = false`

**LocalStorage key :** `"alphatradex-cookie-consent"` → `"accepted"` | `"rejected"`

**Styles inline du conteneur :**
```
position: fixed; bottom: 12px; left: 50%
transform: translateX(-50%)
width: min(420px, calc(100% - 2rem))
backgroundColor: #12121A; border: 1px solid #1E2035
borderRadius: 12px; padding: 12px; zIndex: 9999
opacity: exiting ? 0 : 1; transition: opacity 300ms ease-out
```

**Texte :** `fontSize:0.75rem; color:#8892AA; textAlign:center; whiteSpace:nowrap`
"Nous utilisons les [cookies] pour améliorer votre expérience."

**Grille boutons :** `display:grid; gridTemplateColumns:repeat(2,1fr); gap:0.625rem; marginTop:0.625rem`

**Bouton Accepter :** `bg:#2D6FFF; color:#FFF; borderRadius:12px; padding:8px 16px; fontSize:0.75rem; fontWeight:600`

**Bouton Refuser :** `bg:transparent; border:1px solid #1E2035; color:#8892AA; borderRadius:12px; padding:8px 16px; fontSize:0.75rem; fontWeight:600`

**Animation sortie :** `exiting=true` → `opacity:0` → `setTimeout(320ms)` → `show=false`

---

### `Providers.tsx`

```ts
NextTopLoader :
  color:       "#2D6FFF"
  height:      3
  shadow:      "0 0 12px rgba(var(--blue-rgb), 0.35)"
  speed:       250
  showSpinner: false
```

---

### `ScrollReset.tsx`

- `history.scrollRestoration = 'manual'` au montage
- Reset scroll sur chaque `pathname` : `scrollingElement`, `documentElement`, `body`, `window.scrollTo(0,0)`
- Triple safety : `setTimeout(0)` + `rAF` + `rAF` imbriqué
- Retourne `null`

---

### `TradeReportBody.tsx` — contenu pur du rapport (extrait de `TradeReport.tsx`)

`export function TradeReportBody({ report }: { report: AiAnalysisResult })` — composant de présentation pur (sans `"use client"`-only logic, sans animation, sans bouton). Extrait pour être la **source de vérité unique** de la mise en page du rapport, partagée entre :
- `TradeReport.tsx` (UI live, wrapper animé)
- `AnalysisHistory.tsx` (rendu inline dans l'accordéon historique)
- (anciennement aussi `app/api/generate-pdf/route.tsx` via `renderToStaticMarkup` — cette route a depuis été reconstruite en générateur HTML autonome, voir §6 PDF)

**Helpers exportés :** `safeNum(v, fallback=0)`, `safeStr(v, fallback="—")`, `displayRate(v)` (×100 si `v <= 1`, sinon valeur brute, formaté `.toFixed(1)`).

**`ScoreCircle` (interne) :** SVG viewBox 100×100, cercle r=45, stroke 8px, normalisation `score*100` si `0 < score <= 1`
- `> 60` → `var(--cyan)` / `>= 40` → `var(--orange)` / `< 40` → `var(--red)`
- Texte centré `font-mono text-sm sm:text-lg font-bold`, label `mt-2 text-xs text-secondary`

**`SeverityBadge` (interne) :**
- CRITIQUE / ÉLEVÉ : `bg-red/20 text-red`
- MOYEN : `bg-orange/20 text-orange`
- FAIBLE : `bg-cyan/20 text-cyan`

**`sessionPctColorClasses(pct)` (interne) :**
- `< 40` → `var(--red)` / `text-red`
- `<= 60` → `var(--orange)` / `text-orange`
- `> 60` → `var(--cyan)` / `text-cyan`

**Sections (`space-y-6`) :**

| # | Titre | Contenu |
|---|---|---|
| 1 | Performance globale | 3 `ScoreCircle` : Score psychologique, Gestion du risque, Prop Firm Readiness — `flex justify-around` |
| 2 | Statistiques clés | `grid grid-cols-2 md:grid-cols-4 gap-4`, cards `rounded-xl bg-hover p-4` : Win Rate, Profit Factor, Max Drawdown (`text-red` si >10% sinon `text-cyan`), PnL Total (`text-red`/`text-cyan`), Trades Total (`text-primary`), Sharpe Ratio, Risk/Reward, Durée moyenne (`text-primary`) |
| 3 | Profil psychologique | `dominantBias` en `text-red`, puis liste de `biases[]` — cards `rounded-xl bg-hover p-4` avec nom, fréquence %, `SeverityBadge`, description, evidence (`text-secondary/70`) |
| 4 | Performance par session | `grid sm:grid-cols-3`, London / New York / Tokyo (fallback `asianWinRate` → `tokyoRate` par défaut 30) — barre `h-3 rounded-full` colorée via `sessionPctColorClasses`, `session.insight` en dessous |
| 5 | Patterns de performance | `grid grid-cols-2 gap-4` : Meilleur/Pire jour, Meilleure/Pire heure (suffixe " UTC" retiré), Meilleur/Pire symbole (`symbole (winRate%)`) — `text-cyan`/`text-red` |
| 6 | Prop Firm Readiness | `estimatedTimeToReady` + liste `mainObstacles[]` avec icône `Check`(vert)/`X`(rouge) selon `wouldPassFTMO`, texte `text-primary`/`text-secondary` |
| 7 | Plan d'action | `actionPlan[]` — cards `rounded-xl bg-hover p-4`, badge catégorie coloré : Psychologie `bg-red/20 text-red`, Risque/Stratégie `bg-orange/20 text-orange`, Timing `bg-cyan/20 text-cyan` |
| 8 | Analyste IA | `personalizedInsight`, `text-sm text-secondary` |

---

### `TradeReport.tsx` — wrapper `"use client"`

`export default function TradeReport({ report, analysesUsed?, analysesLimit? })` — ajoute par-dessus `TradeReportBody` :

1. **Quota bar** (si `analysesUsed !== undefined && limit < 999999`) : `card flex items-center justify-between p-6` — barre `h-2 w-32 rounded-full bg-hover`, remplissage `bg-red` si `isAtLimit` sinon `bg-blue`, texte `font-mono text-primary` `{used}/{limit}`.
2. **Animation unique** : `motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}` enveloppant `<TradeReportBody report={report} />` (une seule animation globale, plus de delays par section).
3. **Bouton Export PDF** (`handleDownloadPdf`) :
   - `POST /api/generate-pdf` avec `{ report, screenWidth: window.innerWidth < 640 ? window.innerWidth : 1200 }`
   - Réponse → `blob` → `URL.createObjectURL` → `<a download="alphatradex-rapport-{yyyy-mm-dd}.pdf">` cliqué puis retiré, `revokeObjectURL` après 1s
   - États `pdfLoading` (spinner + "Génération en cours...") / `pdfError` (`text-red`)
   - Bouton `btn-primary` avec icône `Download` (lucide), texte "Exporter"

---

### `TradeJournal.tsx` — Journal de trades

Reçoit `plan: string | null`. Affiche l'historique de trades importés (table `trades`) sous forme de calendrier avec vues Jour/Mois, sélecteur de plage de dates et import/export CSV.

**Chargement (`loadTrades`) :**
- `dateMin` selon le plan (`getDateMin()`) : `pro` → 30 derniers jours · `premium` → 365 derniers jours · `elite`/null → depuis `2026-01-01`
- `GET /api/trades?dateMin=...&token=...` (token = access token Supabase)

**Vues (`view: 'day' | 'month'`) :**
- Toggle desktop : texte "Jour · Mois", actif `text-primary font-semibold`, inactif `text-secondary hover:text-primary`
- Toggle mobile : bouton dropdown `"{label} ›"` → panneau `absolute ... bg-card border border-border rounded-xl z-50`, fermeture au clic extérieur

**`DateRangePicker`** (`@radix-ui/react-popover`) :
- Plage par défaut : 7 derniers jours
- Trigger : `text-secondary text-sm hover:text-primary` — affiche `DD/MM/YYYY · DD/MM/YYYY`
- Popover : `background:#12121A; border:1px solid #1E2035; border-radius:12px; padding:16px`
- Header mois : `< {Mois Année FR} >` (`MONTHS_FR`)
- Grille jours `grid-cols-7`, cellules `w-10 h-6 text-xs rounded-xl` :
  - Sélection début/fin : fond `#2D6FFF`, texte blanc
  - Aujourd'hui (non sélectionné) : `text-blue`
  - Plage intermédiaire : `bg-blue/15`
  - Hors mois : `opacity-40 cursor-not-allowed`
- Sélection en 2 clics (`step: 'from' | 'to'`), auto-swap si `to < from`
- Hint : "Clic 1 > date début · Clic 2 > date fin"

**Import / Export :**
- Import : input `.csv` → `detectAndParse` (parseCSV partagé) → `POST /api/import-trades { trades }` → toast succès `"${count} trades importés avec succès."` (`bg-green/10 border-green/30 text-green`) ou erreur (`bg-red/10 border-red/30 text-red`), auto-dismiss 10s, bouton `X` (lucide)
- Export : `exportCSV()` — CSV français (`Date ouverture, Date fermeture, Symbole, Côté, Entry, Exit, Volume, Profit`), téléchargé `alphatradex-trades-{dateFrom}-{dateTo}.csv`
- Barre desktop : toggle vue (gauche) · `DateRangePicker` (centre) · "Importer · Exporter" (droite, texte)
- Barre mobile : dropdown vue (gauche) · `DateRangePicker` (centre) · icônes `Upload`/`Download` (droite)

**Vue Jour — calendrier mensuel** (`card rounded p-4 mb-6`) :
- Header : `ChevronLeft`/`ChevronRight` mois, bouton "Today", label mois/année
- Grille `grid-cols-8` : 7 colonnes jours (`DAYS_FR = ['Lu','Ma','Me','Je','Ve','Sa','Di']`) + 1 colonne résumé hebdo
- Cellule jour (`min-h-[64px]`) : fond `bg-green/10 border-green/30` si PnL ≥ 0, `bg-red/10 border-red/30` si < 0, sinon `bg-card border-border` ; sélection `ring-2 ring-blue` ; numéro du jour `text-blue` si aujourd'hui sinon `text-secondary` ; PnL et nb trades `hidden md:block`
- Cellule résumé semaine (8e colonne) : même logique de couleur, PnL total + nb trades + win rate (`hidden md:block`)

**Vue Mois — grille annuelle** (`grid-cols-4 gap-2`, 12 tuiles `min-h-[92px]`) : header avec nav année + "Today" ; mois courant `text-blue`, sinon `text-secondary` ; couleur selon PnL identique à la vue Jour ; `opacity-40` si pas de données

**Panneaux de détail** (`card rounded p-6 mb-6`) :
- Détail jour : liste de trades (`card rounded p-4`) — symbole (`font-bold`), badge côté (`bg-green/20 text-green` Long / `bg-red/20 text-red` Short), heures, entry/exit/volume, PnL `text-green`/`text-red`
- Détail semaine / mois : grille `grid-cols-2 md:grid-cols-3 gap-4` — PnL total, Trades, Win rate, Meilleur jour, Pire jour

**Convention couleur PnL :** `text-green` (≥0) / `text-red` (<0) — `formatPnl` → `(pnl>=0?'+':'')+pnl.toFixed(2)+'€'`

---

### `AnalysisHistory.tsx` — Historique des analyses

Liste les analyses passées de l'utilisateur (`GET /api/analyses`, auth cookie), chacune dépliable vers le `TradeReport` complet.

- État chargement : titre "Historique" + spinner `animate-spin text-secondary`
- État vide : titre "Historique" + overlay `fixed inset-0 top-14 left-0 md:left-[280px]` centré, `pointer-events-none`, "Aucune analyse disponible." (`text-secondary text-sm`)
- Liste : `space-y-3`, items `motion.div` (`initial opacity:0,y:12 → animate opacity:1,y:0`, `delay: i*0.04`), `card overflow-hidden`
- Header item (bouton toggle) : date formatée `DD/MM/YYYY` (`text-secondary`) + PnL `font-mono font-semibold` (**`text-cyan`** si ≥0, `text-red` si <0 — convention différente de `TradeJournal`) + `ChevronUp`/`ChevronDown`
- Expansion : `AnimatePresence` — `height:0→auto, opacity:0→1`, 250ms easeInOut, `border-t border-border`, contenu = `<TradeReport report={a.report} />` (sans props quota)
- Un seul item ouvert à la fois (`expandedId`)

---

## 5. PAGES

> Redesign global (mai-juin 2026) : toutes les pages marketing (`/`, `/pricing`, `/about`, `/help`, `/analysis`) ont été alignées sur un même langage visuel — hero `min-h-screen pt-16 flex items-center justify-center px-6` avec wrapper `mx-auto max-w-[1200px] pb-10 pt-10 md:pb-0 md:pt-0 text-center`, eyebrow `font-mono text-xs uppercase tracking-[0.25em] text-secondary`, H1 `text-5xl font-bold leading-tight text-primary md:text-7xl`, H2 `text-4xl font-bold text-primary md:text-5xl` (`mx-auto mt-4 max-w-[700px]`), sous-titres `max-w-[520px] mx-auto text-base text-secondary`, sections `px-6 py-20` (CTA finales `py-28 text-center`), grilles `grid gap-5 md:grid-cols-{2,3,4}`, et **reveal par élément** : chaque carte/élément d'une grille est enveloppé individuellement dans son propre `<RevealSection delay={i * N}>` (N ∈ {0,40,60,70,80,90,100,140,200,210}) plutôt que la grille entière. Toutes les pages se terminent par une section "Commencer" (eyebrow) + `<RevealSection className="border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md"><Footer /></RevealSection>`.

### `/` — `app/page.tsx` — `"use client"`

Wrapper : `min-h-screen bg-background text-primary` · `<main className="relative overflow-x-clip">`

#### Section 1 — Hero
- `RevealSection className="min-h-screen pt-16 flex items-center justify-center px-6 bg-gradient-to-b from-background to-card"`
- Eyebrow : `font-mono text-xs uppercase tracking-[0.25em] text-secondary mb-4` — "AlphaTradeX"
- H1 : `mx-auto mt-6 max-w-[1200px] text-balance md:[text-wrap:normal] text-5xl font-bold leading-tight text-primary md:text-7xl`
  - "Les meilleurs traders n'ont pas plus travaillé.<br/>Ils ont mieux **compris**."
  - "compris" : `<span className="text-blue">` (seul accent bleu de toute la page)
- Séparateur : `mx-auto mt-10 h-px w-12 bg-blue`
- P : `mx-auto mt-8 max-w-[520px] leading-relaxed text-lg text-secondary` — "Notre IA analyse chaque trade, chaque décision, chaque pattern pour que vous ne répétiez plus jamais les mêmes erreurs."
- **Pas de CTA dans le hero** — les CTA sont reportés dans les sections "Analyse gratuite" et "Commencer"

#### Section 2 — "Tableau de bord" (mockup dashboard, `bg-card`)
- Eyebrow "Tableau de bord" + H2 "Votre espace.<br/>Notre analyse." + sous-titre "Un dashboard pensé pour les traders qui exigent la précision."
- `<div ref={dashboardContainerRef} className="card glow-blue rounded overflow-hidden">`, hauteur inline `dashboardHeight`px
- **Scaling viewport** (identique au dashboard Élite réel) :
  - Constantes `DASHBOARD_DESKTOP_WIDTH = 1440`, `DASHBOARD_MOBILE_WIDTH = 390`
  - `updateDashboardScale()` : `isMobileDashboard = window.innerWidth < 768`, `scale = containerWidth / (1440 ou 390)`, `viewportHeight = window.innerHeight`, `dashboardHeight = viewportHeight * scale`
  - Contenu interne : `position:absolute; transform: scale(${scale}); transformOrigin:'top left'`, largeur fixe 1440/390px, hauteur `${viewportHeight}px` — recalculé au `resize`
- Mockup reproduit le dashboard réel : topbar desktop (logo, "AlphaTradeX", point pulsant "IA active", badge "Élite", "Cycle · 01/01", bouton "Se déconnecter" désactivé) + topbar mobile, sidebar desktop (Analyse/Performance/Signaux/Aide/Compte + `ChevronDown`), zone principale "Analyser vos trades" avec drop zone et bouton "Analyser mes trades" désactivé

#### Section 3 — "Compatibilité" (`bg-background`)
- Eyebrow "Compatibilité" + H2 "Vos plateformes.<br/>Notre analyse." + "Votre historique importé. Vos biais exposés."
- `mt-12 flex flex-wrap items-center justify-center gap-5` — 7 pills `card rounded px-7 py-3 font-mono text-sm font-semibold` : MT4 · MT5 · Binance · Bybit · TradingView · FTMO · FundedNext, chacune `<RevealSection delay={index * 60}>`

#### Section 4 — "Services" (`id="services"`, `bg-card`)
- Eyebrow "Services" + H2 "Tout ce qu'il faut pour trader au plus haut **niveau**." (span `text-primary`) + "Passez de l'instinct à la stratégie."
- `mt-12 grid gap-5 md:grid-cols-3` — `ServiceCard` :
  - `BrainCircuit` (text-blue) "Avantage psychologique" — delay 0
  - `BarChart3` (text-cyan) "Statistiques approfondies" — delay 100
  - `BellRing` (text-green) "Alertes sur les schémas" — delay 200

#### Section 5 — "Technologie" (`bg-background`)
- Eyebrow "Technologie" + H2 "Propulsé par **GPT-5.4**." + texte sur la précision du modèle
- `mt-12 grid gap-5 md:grid-cols-3` — 3 `article.card.rounded.p-7.hover:border-blue` :
  - `BrainCircuit` (blue) "Précision Chirurgicale" — delay 0
  - `ShieldCheck` (cyan) "Fiabilité Inégalée" ("Au moins 33% moins d'erreurs que les versions précédentes.") — delay 100
  - `TrendingUp` (green) "Exécution immédiate" (analyse < 60s) — delay 200

#### Section 6 — "Système" (`bg-card`)
- Eyebrow "Système" + H2 "Le système que les traders **disciplinés** vont utiliser." + texte sur l'exécution maîtrisée
- `mt-12 grid gap-5 md:grid-cols-2` — 4 `article.card.rounded.p-7` :
  - `Trophy` (blue) "Élaboré par les traders. Optimisé pour performer" — delay 0
  - `BarChart3` (cyan) "Des données réelles. Des décisions précises" — delay 70
  - `BrainCircuit` (green) "Maîtriser votre psychologie avant qu'elle vous coûte." — delay 140
  - `ShieldCheck` (blue) "Votre analyse exploitable en moins d'une journée." — delay 210

#### Section 7 — "Témoignages" (`bg-background`)
- Eyebrow "Témoignages" + H2 "Ce que les traders **sérieux** ont vu que les autres ont ignoré."
- `mt-12 grid gap-5 md:grid-cols-4` — `article.relative.rounded.border.border-border.bg-card.p-7.hover:border-blue`
  - Guillemet `absolute right-4 top-3 text-5xl font-bold text-blue/20` + étoiles `text-blue` (★★★★★)
  - 4 traders (`delay: index * 70`) : Kilian I. (FTMO) · Lilou O. (TradingView) · Alya L. (Binance) · Nassim S. (MT5) — citations mises à jour (Risk/Reward, overtrading, coupe de profits, session London)

#### Section 8 — "Analyse gratuite" (`id="analyse"`, `bg-card`, `py-28`)
- Eyebrow "Analyse gratuite" + H2 "Ce que l'IA **révèle** en 60 secondes." + "Aucune inscription requise"
- 2 boutons : "Analyse gratuite" (`btn-primary` + `ArrowRight`) → `/analysis` · "S'inscrire" (`btn-outline` + `UserCircle`) → `connectGoogle()`
- Note : "Sans carte bancaire. Analyse immédiate."

#### Section 9 — "Commencer" (hors `<main>`, `bg-gradient-to-b from-card to-background py-28`)
- Eyebrow "Commencer" + H2 "Rejoignez l'**élite** des traders." + "Votre historique. 60 secondes. La vérité."
- 2 boutons : "S'inscrire" (`btn-primary`) → `connectGoogle()` · "Analyse gratuite" (`btn-outline`) → `/analysis`
- Note : "Accès anticipé · 200 places · Prix public à venir · Sans carte bancaire"

#### Footer + bouton retour en haut
- `<RevealSection className="border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md"><Footer /></RevealSection>`
- Bouton fixe `pointer-events-none fixed bottom-6 right-6 z-50`, visible si `scrollY > 300` (`translate-y-0 opacity-100` sinon `translate-y-3 opacity-0`), `<ArrowRight h-5 w-5 -rotate-90>`

---

### `/pricing` — `app/pricing/page.tsx` — `"use client"`

Redesign aligné `/about`/`/help` : même hero (`min-h-screen pt-16 ...`), eyebrow "Tarifs", H1 "Analysez vos trades.<br/>Améliorez vos performances."

#### Badge accès anticipé
`inline-flex items-center gap-2 rounded-full border border-[#2D6FFF] bg-[#2D6FFF]/10 px-4 py-2 text-sm font-medium text-[#2D6FFF]`
`<Flame h-4 w-4>` + "Accès anticipé - Places limitées"
Sous-texte : `text-sm text-[#8892AA]` — "Réservé aux 200 premiers membres."

#### Toggle mensuel/annuel
- Wrapper : `mt-8 inline-flex items-center rounded-full border border-[#1E2035] bg-[#12121A] p-1 text-sm`
- Actif : `rounded-full px-4 py-2 bg-[#1E2035] text-[#F0F4FF]`
- Inactif : `text-[#8892AA]`
- Badge économie : `rounded-full bg-[#2D6FFF] px-2 py-0.5 text-xs font-semibold text-[#F0F4FF]` — "Économisez 20%"

#### Checkout — `handleCheckout(planName)` (fonctionnel)
```ts
async function handleCheckout(planName: string) {
  const planKey = planName === "PRO" ? "pro" : planName === "PREMIUM" ? "premium" : "elite"
  const billing = billingMode === "yearly" ? "annual" : "monthly"
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { router.push('/'); return }
  router.push(`/api/create-checkout?plan=${planKey}&billing=${billing}&token=${session.access_token}`)
}
```

#### Tableau des plans (inchangé, conforme à `lib/plans.ts`)

| | PRO | PREMIUM | ÉLITE |
|---|---|---|---|
| Hook | "Structurer ses décisions." | "Optimiser sa régularité." | "Maîtriser son exécution." |
| Mensuel opening | 24.5€/mois | 49.5€/mois | 99.5€/mois |
| Mensuel barré | 49.5€/mois | 99.5€/mois | 199.5€/mois |
| Annuel opening | 19.5€/mois | 39.5€/mois | 79.5€/mois |
| Annuel barré | 474€/an | 954€/an | 1914€/an |
| Économies annuel | 60€ | 120€ | 240€ |
| CTA bg | `bg-[#1E2035]` | `bg-[#2D6FFF]` | `bg-[#1E2035]` |
| Highlighted | non | **oui** | non |

#### PREMIUM — wrapper spécial
- `style={{ marginBottom: '-4px' }}` sur le div parent
- Gradient : `linear-gradient(180deg, #2D6FFF 0%, #00E5FF 100%)` `padding: 48px 4px 4px 4px`
- Label : `font-semibold text-white` centré dans le bandeau 48px
- Article inner : `relative overflow-hidden rounded-xl border border-[#1E2035] bg-[#12121A] p-6`

#### Bloc prix interne
`mt-6 rounded-lg border border-[#1E2035] bg-[#0A0A0F] p-4`
- Label : `text-xs uppercase tracking-wide text-[#8892AA]` — "Accès anticipé (à vie)"
- Prix principal : `mt-2 text-3xl font-bold text-[#F0F4FF]`
- Prix barré : `mt-1 text-sm text-[#8892AA] line-through`
- Prix public : `mt-4 text-sm text-[#8892AA]` — "Prix public (à venir) : {normal}"

#### Features par plan
```
PRO (3/11 incluses)     : 4 analyses/mois, Analyse IA GPT-5.4, Export PDF,
                           Historique✗, Évolution hebdo✗, Résumé hebdo✗,
                           Support prio✗, Score Prop Firm✗, Détection prédictive✗,
                           Alertes Telegram✗, API✗
PREMIUM (6/11 incluses) : 24 analyses/mois, Analyse IA GPT-5.4, Export PDF,
                           Historique 6 mois✓, Évolution hebdo✓, Résumé hebdo✓,
                           Support prio✗, Score Prop Firm✗, Détection prédictive✗,
                           Alertes Telegram✗, API✗
ÉLITE (11/11 incluses)  : Analyses illimitées + TOUTES les features
```

#### CTA dynamique (`renderCTA`)
- Pas d'abonnement actif (`subscriptionStatus !== 'active' || !currentPlan`) → bouton **"Commencer"** → `handleCheckout(p.name)`
- Plan identique au plan actuel → "Plan actuel"
- Plan supérieur → "Upgrader"
- Plan inférieur → "Downgrader" (hauteur identique aux autres CTA)

#### FAQ (5 questions, ordre actuel)
`details.rounded-xl.border.border-[#1E2035].bg-[#12121A].p-5` — H2 section "Ce que les traders sérieux veulent savoir."
1. Mes données sont-elles en sécurité ?
2. Quels formats sont acceptés ?
3. Comment fonctionne l'accès anticipé ?
4. Puis-je changer ou résilier mon plan ?
5. À qui s'adresse AlphaTradeX ?

#### CTA démo
`w-full rounded-2xl bg-[#0A0A0F] px-6 py-16 text-center md:py-20`
Link → `/analysis` : `rounded-lg bg-[#2D6FFF] px-8 py-3 text-lg font-semibold hover:opacity-90`

---

### `/analysis` — `app/analysis/page.tsx` — `"use client"`

Redesign "rapport pleine page" aligné `/about`/`/help`/`/pricing`. `SESSION_KEY = 'atx_demo_report'` (sessionStorage) — restaure le rapport au montage (try/catch sur données corrompues).

**State `view: 'analyse' | 'rapport'`** (avec `prevViewRef`) :
- `view === 'rapport'` → `document.documentElement.style.overflow = 'hidden'` + `document.body.style.overflow = 'hidden'` (verrouille le scroll)
- Sortie de `'rapport'` → reset overflow + `window.scrollTo(0,0)`
- `document.body.classList` `"hide-glow"` togglé selon présence de `report` (masque le glow radial)

#### Section 1 — Hero
- Eyebrow "Analyse" + H1 `text-5xl font-bold leading-[1.1] text-primary md:text-7xl` : "Découvrez ce que l'analyste IA révèle sur un compte de trading."
- Séparateur `h-px w-12 bg-blue` + sous-texte "Analyse basée sur 120 trades."

#### Section 2 — "Comment on fonctionne"
- H2 "Trois étapes.<br/>Zéro friction." + `grid md:grid-cols-3 gap-5`, steps numérotés **01/02/03** :
  - **01** `Upload` (`#2D6FFF`) "L'historique du compte" — "Un fichier CSV depuis MT4, MT5, Binance, Bybit, TradingView, FTMO, FundedNext. Zéro accès au compte."
  - **02** `Brain` (`#00E5FF`) "L'IA décrypte les trades"
  - **03** `FileText` (`#00E5B0`) "Le mirror sans filtre"

#### Section 3 — "Analyse gratuite" (action)
- H2 "Votre première analyse.<br/>Sans inscription." + sous-texte "Analyse basée sur 120 trades."
- Bouton "Découvrir l'analyse" (`handleDemo`, disabled si `loading || used`) — `POST /api/analyze-demo { trades: demoTrades }`, succès → stocke dans `sessionStorage[SESSION_KEY]` + `view = 'rapport'`, `429` → `used = true`
- Bouton **"Mon analyse"** (affiché seulement si `report` existe) — icône `ScrollText`, `onClick={() => setView('rapport')}` : ré-ouvre la vue rapport pleine page (combiné à la restauration sessionStorage au montage → le rapport survit à un refresh)
- Si `used` : "Analyse utilisée." en `text-red`
- Si `loading` : barre `motion.div` `width: 0%→90%` sur 8s + "L'IA analyse les trades..."

#### Vue rapport pleine page (overlay, `view === 'rapport'`)
```
position: fixed; inset: 0; zIndex: 50; overflowY: 'auto'; background: var(--background)
└── div.mx-auto.max-w-[1200px].px-6.py-10
    └── <TradeReport report={report} />
```

#### Section 4 — "Commencer" (CTA finale)
- H2 "Votre mirror.<br/>Sans filtre." + bouton "Voir les plans" (`Link` → `/pricing`) + disclaimer accès anticipé

---

### `/dashboard` — `app/dashboard/DashboardClient.tsx` — `"use client"`

Protégé par `middleware.ts` (`@supabase/ssr`). Redesign complet : **shell app** avec sidebar fixe + topbar, vues commutées en interne (`mainView`) sans navigation de page.

#### Layout général
```tsx
<div className="flex h-screen flex-col overflow-hidden bg-background text-primary">
  <header className="z-20 h-14 shrink-0 border-b border-border bg-card">...</header>
  {mobileMenuOpen && <div className="...md:hidden">...</div>}
  <div className="flex min-h-0 flex-1">
    <aside className="hidden h-full w-[280px] shrink-0 flex-col border-r border-border bg-card md:flex">...</aside>
    <main className="flex min-h-0 flex-1 flex-col bg-[#0A0A0F] p-6 ...">...</main>
  </div>
</div>
```
- App shell plein écran (`h-screen overflow-hidden`), pas de scroll de page — seules certaines zones internes scrollent.
- Sidebar desktop fixe **280px** (`w-[280px]`), masquée sous `md`.
- `app/dashboard/page.tsx` : wrapper `Suspense` (requis pour `useSearchParams`), fallback "Chargement du tableau de bord…".

#### Topbar desktop (`h-14`, `hidden md:flex`)
- **Gauche** : logo SVG 28×28 (identique Navbar/Footer) + "AlphaTradeX" → `/`
- **Centre** : indicateur **"IA active"** — point `h-1.5 w-1.5 animate-pulse rounded-full bg-[#2D6FFF]` + `text-xs text-secondary`
- **Droite** : badge plan `rounded-md border border-[#2D6FFF40] bg-[#2D6FFF15] px-3 py-1 text-xs font-semibold text-blue` (`{Plan}`, capitalisé, défaut "Pro") · `cycleLabel` "Cycle · DD/MM" (`formatResetDate(analysesResetDate)`, ou "--/--") · bouton "Se déconnecter" (`border border-border ... hover:bg-hover hover:text-primary`)

#### Topbar mobile (`md:hidden`)
- Gauche : logo seul (`aria-label="AlphaTradeX — accueil"`)
- Centre : `<Link href="/">AlphaTradeX</Link>` centré absolu (`absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate`)
- Droite : burger `Menu` (lucide) → toggle `mobileMenuOpen`

#### Menu mobile (panneau sous le header, `md:hidden`)
`flex max-h-[calc(100vh-3.5rem)] flex-col overflow-hidden border-b border-border bg-card` (`#12121A`)
1. Bloc haut : indicateur "IA active" + `cycleLabel` + badge plan, sur une ligne, séparateur `h-px bg-border`
2. Zone scrollable : accordéon de navigation (`renderSidebarAccordion`)
3. Bloc bas : séparateur + bouton "Se déconnecter"
4. `renderQuotaCard()` en bas si applicable
- `useEffect` sur `matchMedia("(min-width: 768px)")` — ferme le menu automatiquement en passant en desktop

#### Sidebar / accordéon de navigation (`renderSidebarAccordion`, partagé desktop+mobile)

`SectionLabel` : bouton toggle par section, `font-mono text-[10px] uppercase tracking-[0.15em] text-secondary`, `ChevronDown` rotate 180° si ouvert. **Toutes les sections sont fermées par défaut** (`openSections`).

| Section | Items (icône — libellé → vue) | Verrouillage |
|---|---|---|
| **Analyse** | `ScanLine` Analyser vos trades → `nouvelle-analyse` | — |
| | `ScrollText` Journal de trades → `journal-analyses` | — |
| | `History` Historique → `historique` | si **Pro** (label "Premium") |
| **Performance** | `TrendingUp` Évolution semaine → `evolution` | si **Pro** ("Premium") |
| | `CalendarCheck` Résumé semaine → `resume-hebdomadaire` | si **Pro** ("Premium") |
| | `Target` Prop Firm Score → `prop-firm-score` | si **non Élite** ("Elite") |
| **Signaux** | `Radar` Détection prédictive → `detection-predictive` | si non Élite |
| | `Bell` Alertes Telegram → `alertes-telegram` | si non Élite |
| | `Webhook` Accès API → `acces-api` | si non Élite |
| **Aide** | `Headphones` Support prioritaire → `support` | si Pro (redirige vers `/help` au lieu de `/pricing`) |
| **Compte** | `CreditCard` Offres → `/pricing` | — |
| | `Receipt` Factures → `<a href="/api/customer-portal">` | — |

Item actif : `border border-[#2D6FFF25] bg-[#2D6FFF15] text-primary`. Item verrouillé : `opacity-40 cursor-not-allowed` + icône `Lock`, `title="Disponible sur plan {Plan}"`, navigue vers `/pricing` (ou `/help`).

#### Carte quota (`renderQuotaCard`)
Affichée si `analysesLimit < 999999` (masquée pour Élite illimité), en bas de la sidebar/menu mobile :
```tsx
<div className="border-t border-border px-4 pb-5 pt-4" style={{ backgroundColor: '#12121A' }}>
  Analyses utilisées        {analysesUsed}/{analysesLimit}
  <div className="h-1 w-full bg-[#1E2035]"><div className="h-full bg-[#2D6FFF]" style={{ width: `${progressWidth}%` }} /></div>
</div>
```

#### Zone principale (`<main>`)
- Scrollable (`overflow-y-auto`) uniquement pour `nouvelle-analyse`, `mon-analyse`, `journal-analyses`, `historique` ; sinon `overflow-hidden`.
- Bandeaux en haut : succès paiement (`bg-green/10 border-green/35 text-green`, auto-dismiss 10s avec fade) + annulation (`bg-red/10 border-red/35 text-red`)

**Vues (`mainView: DashboardView`) :**
| Vue | Contenu |
|---|---|
| `nouvelle-analyse` (défaut) | Drop zone CSV + bouton "Analyser mes trades" (+ "Mon analyse" si un rapport existe en session) |
| `mon-analyse` | `<TradeReport report={analysis} analysesUsed analysesLimit />` ou "Aucun rapport à afficher." |
| `historique` | `<AnalysisHistory />` |
| `journal-analyses` | `<TradeJournal plan={subscriptionPlan} />` |
| `evolution`, `resume-hebdomadaire`, `prop-firm-score`, `detection-predictive`, `alertes-telegram`, `acces-api`, `support` | `<EmptyFeaturePage icon title />` — icône `h-12 w-12 text-secondary opacity-30` + titre `mt-6 text-xl font-bold text-primary` (placeholders, backend non implémenté) |

**Vue "Analyser vos trades" (`nouvelle-analyse`) :**
- H1 centré "Analyser vos trades"
- Drop zone : `border-2 border-dashed rounded-xl p-8 text-center cursor-pointer mb-6` — `border-blue bg-blue/5` (drag) / `border-green/50 bg-green/5` (fichier prêt) / `border-border hover:border-blue/50` (idle), `<input accept=".csv">` caché, icône `Upload`, "Importez votre historique de trades" + plateformes
- Boutons (`max-w-md` centré) : "Analyser mes trades" (`btn-primary`, disabled tant que pas de fichier, spinner + "L'IA analyse vos trades..." pendant le chargement) ; si un rapport existe déjà en session, **second bouton "Mon analyse"** (`btn-outline py-2.5`) → `mainView = "mon-analyse"`
- Erreurs : `text-red`, `role="alert"`

#### Synchronisation cross-device des analyses
- `restoreLatestAnalysis()` (au montage, une fois `userId` connu) : `GET /api/analyses?token=...` → `analyses[0]` (la plus récente, tous appareils confondus) → `analysis` state + cache `sessionStorage["atx_last_report"]`. Fallback sur `sessionStorage` si l'appel échoue.
- **Supabase Realtime** : canal `analyses-insert:${userId}` sur `postgres_changes` `INSERT` de `public.analyses` (`user_id=eq.${userId}`) — met à jour `analysis` en direct si une nouvelle analyse est insérée depuis un autre appareil/onglet.

#### Autres comportements
- `document.body.classList.add("hide-glow")` au montage (retiré au démontage) — désactive le glow radial global sur le dashboard
- `signOut()` → `supabase.auth.signOut()` puis `router.push("/")` + `router.refresh()`
- État chargé via `users` table : `subscription_plan, analyses_used, analyses_limit, analyses_reset_date`

---

### `/about` — `app/about/page.tsx` — `"use client"`

Layout aligné `/pricing`/`/help` (hero `min-h-screen pt-16 ...`). Eyebrow "À propos", H1 `text-5xl font-bold leading-[1.1] text-primary md:text-7xl max-w-[900px]` : "Vous aviez les données.<br/>Personne n'avait encore décrypté vos biais."

| Section | Contenu |
|---|---|
| **Hero** | voir ci-dessus |
| **Le problème** | 4 "truth cards" en grille : edge / exposition / journal / exécution |
| **En chiffres** | 4 stats `grid-cols-2 sm:2 md:4` : `<60s` / `5` plateformes / `200` traders / `2` Prop Firms |
| **Nos convictions** | 3 principes numérotés **01-03** |
| **Genèse** | timeline 2 colonnes avec ligne verticale : 2022 / 2023 / 2025 / 2026 — entrée 2026 : "AlphaTradeX — Accès anticipé." / "200 places. Phase 0 en cours." |
| **Le fondateur** | "Sacha — Fondateur d'AlphaTradeX", "Trader depuis 2022" — citation, `border-l: 3px solid #2D6FFF` |
| **Compatibilité** | 7 pill-cards : MT4 · MT5 · Binance · Bybit · TradingView · FTMO · FundedNext |
| **CTA final ("Commencer")** | 2 boutons : "Analyse gratuite" (primary) → `/analysis` + "Voir les plans" (outline) → `/pricing` |

H2 sizing uniforme `text-4xl font-bold text-primary md:text-5xl`, reveal par élément (`RevealSection delay={i*N}`), grilles `gap-5`.

---

### `/help` — `app/help/page.tsx` — `"use client"`

Layout aligné `/about`/`/pricing`. Eyebrow "Aide", H1 `text-5xl font-bold leading-[1.1] text-primary md:text-7xl` : "Une question.<br/>Une réponse directe."

| Section | Contenu |
|---|---|
| **Hero** | voir ci-dessus |
| **Comment on fonctionne** | 3 steps numérotés **01-03**, identiques en structure à `/analysis` mais en "vous" : "Exportez votre historique" / "L'IA décrypte vos trades" / "Votre mirror sans filtre" |
| **Compatibilité** | 7 plateformes en 4+3, instructions d'export par plateforme |
| **FAQ** | 10 questions `<details>/<summary>` (`AccordionItem`, `ChevronDown` rotate 180°) |
| **Support** | Card `MessageCircle`(blue) + `mailto:contact@alphatradex.ai` + "Écrire au support" |
| **CTA final ("Commencer")** | 2 boutons : "Analyse gratuite" + "Voir les plans" |

**Guides d'export par plateforme :**
| Plateforme | Instructions |
|---|---|
| MT4 | Ctrl+T · Account History · Clic droit · Save as Report · CSV |
| MT5 | Ctrl+T · History · Clic droit · Export · CSV |
| Binance | Orders · Trade History · Export Trade History · CSV |
| Bybit | Profile · Account · Data Export · Export Now · Download · CSV |
| TradingView | Panneau broker · Export Data · Balance History · Export · CSV |
| FTMO | Client Area · Metrix · Trading Journal · Export · CSV |
| FundedNext | Via MT4 ou MT5 |

**FAQ (10 questions, ordre actuel) :**
1. Mes données sont-elles en sécurité ?
2. Quels formats sont acceptés ?
3. Puis-je tester avant de m'abonner ?
4. Quand mon compteur d'analyses se remet-il à zéro ?
5. Puis-je changer ou résilier mon plan ?
6. Qu'est-ce que le score Prop Firm Readiness ? (Élite uniquement)
7. L'analyse fonctionne sur tous les types d'actifs ?
8. À qui s'adresse AlphaTradeX ?
9. Mon historique est-il suffisant pour une analyse ? (volume minimum 50 trades)
10. Qu'est-ce que les Alertes Telegram de vos setups ? (Élite uniquement)

---

### Pages légales (`/legal/*`)

Layout : `relative min-h-screen bg-background font-sans text-primary z-index:0`
Footer dans : `section.relative.border-t.border-border.bg-background/80.px-6.py-10.backdrop-blur-md`

Structure commune :
- Main : `mx-auto max-w-[800px] px-6 py-20 pt-28`
- H1 : `mb-3 text-3xl font-bold tracking-tight text-primary md:text-4xl`
- Sections : `rounded border border-border bg-card p-6 md:p-8` dans `mt-10 space-y-10`
- H2 : `mb-2 text-xl font-semibold text-primary`
- Texte : `mt-4 text-sm leading-relaxed text-secondary`

Routes : `/legal/mentions-legales` · `/legal/cgu` · `/legal/cgv` · `/legal/confidentialite` · `/legal/cookies` · `/legal/risque` · `/legal/terms`

---

## 6. DÉCISIONS TECHNIQUES

### `overflow-x: clip` sur `<html>` uniquement
```css
html {
  overflow-x: clip;    /* ne crée pas de stacking context (≠ hidden) */
  overflow-y: auto;
}
body {
  overflow-x: visible; /* évite le double scrollport sur iOS */
  overflow-y: visible;
}
```
Raison : deux `overflow-y: auto` créaient deux zones défilantes — scroll bloqué, thumb pleine hauteur, restauration sur le mauvais élément.

### `createPortal` pour CookieBanner
Rendu dans `document.body` → échappe tout stacking context. `z-index: 9999` > Navbar `z-50`.

### Module-level `_sessionDismissed`
Variable hors composant React. Survit aux navigations SPA (remounts) sans rechargement complet.

### Glow radial global (`layout.tsx`)
```
position:fixed; top:50%; left:50%; transform:translate(-50%,-50%)
width:600px; height:600px; border-radius:50%
background: radial-gradient(circle, rgba(45,111,255,0.20) 0%, transparent 70%)
pointer-events:none; z-index:1; aria-hidden
```
Présent sur toutes les pages via Root Layout.
`body.hide-glow .radial-glow { display: none; }` (`globals.css`) — `DashboardClient` ajoute la classe `hide-glow` sur `<body>` au montage (et la retire au démontage) pour désactiver le glow sur le dashboard.

### Mécanisme `.hydrated` — fix flash blanc iOS Safari (remplace l'ancienne règle de transition globale)
```css
html.hydrated *, html.hydrated *::before, html.hydrated *::after {
  transition-property: color, background-color, border-color, box-shadow, opacity;
  transition-duration: 200ms;
  transition-timing-function: ease;
}
html.hydrated, html.hydrated body { transition: none; }
```
- `app/layout.tsx` injecte 2 scripts inline :
  1. Dans `<head>`, avant tout paint : `document.documentElement.classList.remove('hydrated')` — bloque toute transition CSS pendant le 1er rendu.
  2. Dans `<body>` : `requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('hydrated')))` — réactive les transitions seulement après le 1er vrai paint (double rAF).
- Raison : sur iOS Safari, les transitions actives pendant l'hydratation provoquaient un flash blanc visible avant l'application du thème sombre. `<html>` a aussi `style={{ backgroundColor: '#0A0A0F', colorScheme: 'dark' }}` inline + `<meta name="theme-color" content="#0A0A0F">` et `<meta name="color-scheme" content="dark">` pour forcer le fond sombre dès le 1er paint, avant tout CSS/JS.
- `history.scrollRestoration = 'manual'` est désactivé via un 3ᵉ script inline dans `<head>`, en complément de `ScrollReset`.

### Génération de PDF — `app/api/generate-pdf/route.tsx` (Puppeteer + `@sparticuz/chromium`)

Remplace l'ancien `window.print()`. Endpoint `POST /api/generate-pdf { report, screenWidth }` (appelé depuis `TradeReport.tsx`), `maxDuration = 60`, `dynamic = 'force-dynamic'`.

- **HTML auto-suffisant** : `buildHtml()` construit une chaîne HTML complète (`<!DOCTYPE html>...`) avec les variables CSS du thème dupliquées en `:root` (`--background`, `--card`, `--hover`, `--blue`, `--cyan`, `--orange`, `--red`, `--green`, `--primary`, `--secondary`, `--border`), police Inter/JetBrains Mono via Google Fonts, `@page { margin: 0 }`, et `*::-webkit-scrollbar { display: none }` + `scrollbar-width: none` pour masquer les scrollbars dans le rendu.
- **`buildBody()`** : reproduit en HTML brut (chaînes de template, pas de JSX/`renderToStaticMarkup`) les 8 sections de `TradeReportBody.tsx` — réimplémente `safeNum`/`safeStr`/`displayRate`/`scoreCircle`/`severityBadge`/`sessionColors`/icônes Check/X en fonctions locales identiques (mêmes seuils de couleur).
- **Responsive `isMobile`** : `screenWidth < 640` → grilles 2 colonnes / score circles 80px / textes réduits, sinon 4 colonnes / 96px (mêmes breakpoints que `TradeReportBody`).
- **Lancement du navigateur** :
  - Production (`NODE_ENV === 'production'`) : `@sparticuz/chromium` (`chromium.args`, `chromium.executablePath()`) + `puppeteer-core`, `headless: true`, `defaultViewport: { width: viewportWidth, height: 720 }`
  - Dev local : `puppeteer-core` avec `executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'`, `args: ['--no-sandbox', '--disable-setuid-sandbox']`
- **Rendu** : `page.setContent(html, { waitUntil: 'networkidle0' })` → `page.evaluate(() => document.fonts.ready)` → `contentHeight = max(scrollHeight document/body)` → `page.pdf({ width: '${viewportWidth}px', height: '${contentHeight}px', printBackground: true, margin: 0 })` — un PDF d'une seule page à la taille exacte du contenu.
- Réponse : `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="alphatradex-rapport-DD-MM-YYYY.pdf"`.
- `next.config.mjs` : `serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium']` + `outputFileTracingIncludes: { '/api/generate-pdf': ['./node_modules/@sparticuz/chromium/**/*'] }` (sinon le binaire Chromium n'est pas inclus dans le bundle serverless Vercel).

### Email transactionnel — Resend (`lib/resend.ts`, `lib/emails/confirmationPaiement.ts`)
- Déclenché dans `app/api/webhook/route.ts` sur `checkout.session.completed` (après mise à jour de `users`) — envoie un email de confirmation de paiement via l'API Resend (`RESEND_API_KEY`).
- `lib/emails/confirmationPaiement.ts` génère le HTML de l'email (template autonome, même charte que le PDF : couleurs `--blue`/`--cyan`/dark theme).

### `analyzeTradesDemo` vs `analyzeTradesMember` + `computeStats()` — `lib/openai.ts`

Le générateur d'analyse est désormais scindé en deux chemins :

- **`analyzeTradesDemo(trades, targets?)`** (route `/api/analyze-demo`) : 100% LLM (`gpt-5.4`, `temperature: 0.7`, `max_completion_tokens: 4000`). Le `DEMO_SYSTEM_PROMPT` impose des règles strictes pour générer un rapport JSON complet et crédible à partir de données factices/randomisées : `totalTrades` toujours 120, PnL toujours négatif (-1000€ à -250€), Win Rate 45-65%, scores 25-75 (jamais identiques), sessions London 55-70% / New York 40-55% / Tokyo 25-40% (jamais 0%), sévérité des biais selon `frequency` (FAIBLE 20-30 / MOYEN 35-45 / ÉLEVÉ 50-60 / CRITIQUE 65-75), `dominantBias` et `estimatedTimeToReady` toujours des phrases complètes, tutoiement systématique, variation d'une analyse à l'autre (`RÈGLE VARIATIONS`).
- **`analyzeTradesMember(trades)`** (route `/api/analyze`) : **déterministe** — `computeStats(trades)` calcule toutes les valeurs numériques côté serveur (aucune hallucination possible), puis le LLM (`MEMBER_SYSTEM_PROMPT`, `temperature: 0.6`, `max_completion_tokens: 3000`) ne génère que du **contenu qualitatif** (`sessionInsight`, `dominantBias`, `description`/`evidence` par biais, `consecutiveLossesPattern`, `holdingTimeAnalysis`, `riskIssues`, `mainObstacles`, `estimatedTimeToReady`, `actionPlan`, `personalizedInsight`) à partir du bloc `STATS PRÉCALCULÉES`. La fusion finale associe chaque `biasPatterns[i]` (calculé) à son contenu LLM via `patternKey`.

**`computeStats()` — formules clés :**
- **Drawdown** : equity curve chronologique (trades triés par `openTime`), `maxDrawdownAbs` = pic-creux max en valeur absolue, `maxDrawdownPct` = ratio creux/pic max.
- **Sharpe ratio** : `(avgPnL / stdDevPnL) * sqrt(n)`.
- **Sessions** : `London` = 07h-14h UTC, `New York` = 14h-00h UTC, `Tokyo` = 00h-07h UTC (basé sur `openTime.getUTCHours()`).
- **Meilleur/pire jour** : Win Rate par jour de semaine, seuil minimum 3 trades (sinon fallback = jour avec le plus de trades).
- **Meilleure/pire heure** : tranches de 2h UTC, seuil minimum 2 trades.
- **Scores** (toujours 0-100, formules pondérées) :
  - `psychoScore` = `winRate*0.4 + min(profitFactor/3,1)*20 + max(0,1-maxDrawdownPct/25)*20 + regularityScore*0.2` (régularité = écart-type du PnL journalier normalisé)
  - `riskScore` = `max(0,1-maxDrawdownPct/15)*40 + min(max(sharpe,0)/2.5,1)*30 + min(riskReward/3,1)*30`
  - `propFirmScore` = `max(0,1-maxDrawdownPct/10)*40 + min(winRate/70,1)*30 + min(profitFactor/2,1)*30`
- **`wouldPassFTMO`** : `maxDrawdownPct < 10 && winRate > 50 && profitFactor > 1 && worstDayLossPct < 5 && totalTrades >= 10` — `worstDayLossPct` = pire PnL journalier en % du PnL brut total (proxy "règle de consistance" FTMO).
- **7 patterns de biais détectés algorithmiquement** (`biasPatterns[]`, `frequency`/`severity` calculés via `severityOf()` : <25 FAIBLE / <50 MOYEN / <75 ÉLEVÉ / ≥75 CRITIQUE) :
  1. `revenge_trading` — trade ouvert dans les 60min après une perte
  2. `direction_bias` — écart Win Rate BUY/SELL > 15%
  3. `session_bias` — pire session avec taux de perte > 55% et exposition ≥ 1% des trades
  4. `overtrading` — jours avec ≥ 2× la médiane de trades/jour ET ≥ 5 trades
  5. `loss_extension` — durée moyenne des pertes > 1.5× durée moyenne des gains
  6. `confirmation_bias` — trade dans le même sens après ≥ 3 gains consécutifs dans ce sens
  7. `position_sizing_bias` — lot moyen des perdants > 1.1× lot moyen des gagnants

### Historique des analyses — table `analyses` + rétention par plan

`app/api/analyses/route.ts` (`GET`, `dynamic = 'force-dynamic'`) — accepte soit un cookie de session (`@supabase/ssr`), soit un `?token=` (Bearer, pour les appels cross-tab/Realtime). Filtre par `PLAN_MONTHS` :

| Plan | Rétention |
|---|---|
| `pro` | 1 mois |
| `premium` | 6 mois |
| `elite` | illimité (`null` → pas de filtre `created_at`) |

Retourne `{ analyses: [{ id, created_at, plan, report }] }`, triées par `created_at desc`.

### Synchronisation cross-device des analyses — Supabase Realtime

`DashboardClient.tsx` :
1. Au montage, `restoreLatestAnalysis()` appelle `GET /api/analyses?token=...` et affiche `analyses[0]` (la plus récente tous appareils confondus), avec fallback sur `sessionStorage["atx_last_report"]` si l'appel échoue.
2. Souscription **Supabase Realtime** sur le canal `analyses-insert:${userId}` — `postgres_changes` `INSERT` sur `public.analyses` filtré `user_id=eq.${userId}` : si une nouvelle analyse est insérée depuis un autre appareil/onglet (ex. analyse lancée sur mobile pendant que le dashboard est ouvert sur desktop), le rapport affiché se met à jour en direct sans rechargement.

### `lib/parseCSV/utils.ts` — utilitaires de parsing CSV (Journal de trades)

Utilisés par `TradeJournal.tsx` pour l'import CSV (en complément de `parseCSV/index.ts` qui gère le parsing par plateforme pour l'analyse) :
- `cleanSymbol(raw)` : `raw.toUpperCase().replace(/[^A-Z0-9/.]/g, '')` — normalise les symboles (espaces, ponctuation parasite).
- `normalizeCSV(text)` : retire le BOM UTF-8 (`﻿`, fréquent dans les exports MT4/MT5, casse le matching des headers sur Safari mobile) et normalise les fins de ligne (`\r\n`/`\r` → `\n`).
- `detectDelimiter(headerLine)` : compte les `;` vs `,` dans la ligne d'en-tête, retourne le délimiteur majoritaire.
- `makeCSVParser(delimiter)` : retourne `{ line(), num() }` — `line()` split + trim + retire les guillemets ; `num()` gère le séparateur décimal `,`→`.` quand le délimiteur est `;` (format européen).

### `next.config.mjs` — Fallback CI
```js
NEXT_PUBLIC_SUPABASE_URL → placeholder si env absent
NEXT_PUBLIC_SUPABASE_ANON_KEY → JWT placeholder si env absent
```

### `lib/plans.ts` — Prix et IDs Stripe live

Plans identiques à ceux affichés sur `/pricing` (aucune incohérence) :

| Clé | Nom | Limit | Mensuel | Annuel |
|---|---|---|---|---|
| `pro` | Pro | 4 | 24.5€ | 234€ |
| `premium` | Premium | 24 | 49.5€ | 474€ |
| `elite` | Élite | 999999 | 99.5€ | 954€ |

**Price IDs et Product IDs Stripe live :**
| Plan | stripePriceMonthly | stripePriceAnnual | stripeProductId |
|---|---|---|---|
| pro | `price_1TTQM6CfiBqZlYaUIHzEg8mE` | `price_1TTQMUCfiBqZlYaUBGMvBO8M` | `prod_USL2OMHSRxPwPE` |
| premium | `price_1TTQNkCfiBqZlYaUz2FyNlFi` | `price_1TTQOBCfiBqZlYaUu2bZWfBQ` | `prod_USL3p21C1Kc8Rc` |
| elite | `price_1TTQPXCfiBqZlYaU11kT9Yoc` | `price_1TTQQ2CfiBqZlYaUvCndD4Xz` | `prod_USL53dmtaWpiDq` |

Référencé dans `/analysis` via `PLANS.pro.monthly` pour le CTA post-rapport (24.5€/mois).

### Rate limiting API `/api/analyze`
- `Map<userId, timestamp>` en mémoire — 1 requête / 15s par user
- Reset mensuel automatique le 1er du mois

### Demo `/api/analyze-demo`
- Table `demo_usage` Supabase — 1 analyse par IP
- `maxDuration = 60` (Vercel Edge timeout)
- Paramètres randomisés guidés par cibles calculées

### @supabase/ssr — Migration terminée

Tous les fichiers utilisent `@supabase/ssr`. `@supabase/auth-helpers-nextjs` reste dans `package.json` mais n'est plus utilisé dans le code applicatif.

| Fichier | Fonction exportée | Client utilisé |
|---|---|---|
| `lib/supabase.ts` | `getSupabaseClient()` | `createBrowserClient` (@supabase/ssr) |
| `lib/supabase.ts` | `getSupabase()` | `createClient` (@supabase/supabase-js) — utilisé dans create-checkout |
| `lib/supabase.ts` | `getSupabaseAdmin()` | `createClient` avec `SUPABASE_SERVICE_ROLE_KEY` — utilisé dans webhook |
| `middleware.ts` | — | `createServerClient` (@supabase/ssr) |
| `app/api/auth/callback/route.ts` | — | `createServerClient` (@supabase/ssr) |
| `app/api/customer-portal/route.ts` | — | `createServerClient` (@supabase/ssr) |
| `components/Navbar.tsx` | — | `getSupabaseClient()` |
| `app/dashboard/DashboardClient.tsx` | — | `getSupabaseClient()` |

### `parseCSV/index.ts` — Détection automatique de format

```
firstLine contient "position" + "fee"  → parseFTMO  (FTMO Metrix — extra colonne Fee décale Swap/Profit)
firstLine contient "ticket" ou "position" → parseMT4  (MT4 / MT5 standard)
firstLine contient "pair", "realized profit" ou "date(utc)" → parseBinance
firstLine contient "realized p&l"          → parseBybit
firstLine contient "trade #", "signal" ou "cum. profit" → parseTradingView
Sinon → Error "Format non reconnu"
```

**Plateformes supportées :** MT4, MT5, Binance, Bybit, TradingView, FTMO, FundedNext (7 plateformes)

**`parseFTMO` :** colonnes spécifiques — `Commission[10] + Fee[11]` combinés, `Swap[12]`, `Profit[13]` (décalage vs MT5 standard).

**`parseBybit` :** format "Trade History" — Date, Symbol, Side, Price, Quantity, Fee, Realized P&L, Order ID. Session calculée par heure UTC.

---

## 7. CONFIGURATION

### Variables d'environnement référencées dans le code

| Variable | Utilisée dans |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`, `middleware.ts`, `api/auth/callback`, `api/customer-portal`, `next.config.mjs` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Idem |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase.ts` → `getSupabaseAdmin()` → `api/webhook` |
| `STRIPE_SECRET_KEY` | `api/create-checkout`, `api/customer-portal`, `api/webhook` |
| `STRIPE_WEBHOOK_SECRET` | `api/webhook` (validation signature) |
| `NEXT_PUBLIC_APP_URL` | `api/create-checkout` (success/cancel URL), `api/customer-portal` (return_url) |
| `OPENAI_API_KEY` | `lib/openai.ts` |
| `RESEND_API_KEY` | `lib/resend.ts` → email de confirmation de paiement (`api/webhook`) |
| `CHROME_PATH` | `api/generate-pdf` (dev local uniquement) — chemin de l'exécutable Chrome pour Puppeteer ; défaut `C:\Program Files\Google\Chrome\Application\chrome.exe` |

### `next.config.mjs`
```js
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/generate-pdf': ['./node_modules/@sparticuz/chromium/**/*'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() || placeholderUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || placeholderAnon,
  },
};
```
`serverExternalPackages` + `outputFileTracingIncludes` sont nécessaires pour que le binaire Chromium de `@sparticuz/chromium` soit inclus dans le bundle serverless de `/api/generate-pdf` sur Vercel.

### `app/layout.tsx`
```tsx
// Fonts :
Inter({ subsets:["latin"], weight:["400","500","600","700"], variable:"--font-inter" })
JetBrains_Mono({ subsets:["latin"], weight:["400","500"], variable:"--font-jetbrains-mono" })

// Metadata :
metadataBase: 'https://alphatradex.ai'
title: "AlphaTradeX - Votre analyste IA personnel sur les marchés"
icons: { icon:"/logo.svg", apple:"/logo.svg", shortcut:"/logo.svg" }
openGraph.title: "AlphaTradeX — Votre analyste IA personnel sur les marchés"  (bug corrigé)

// Arbre :
<html lang="fr" data-scroll-behavior="smooth" className={fontVars} style={{ backgroundColor:'#0A0A0F', colorScheme:'dark' }}>
  <head>
    <meta name="theme-color" content="#0A0A0F"/>
    <meta name="color-scheme" content="dark"/>
    <link rel="manifest" href="/manifest.json"/>
    <script>{/* history.scrollRestoration = 'manual' */}</script>
    <script>{/* document.documentElement.classList.remove('hydrated') — anti flash blanc */}</script>
  </head>
  <body style={{ backgroundColor:'#0A0A0F' }}>
    <script>{/* double rAF → classList.add('hydrated') */}</script>
    <div aria-hidden className="radial-glow" />   {/* glow radial fixed z:1, masqué via body.hide-glow */}
    <ScrollReset />
    <Providers>                {/* NextTopLoader */}
      {children}
    </Providers>
    <CookieBanner />           {/* portal → body, z:9999 */}
  </body>
</html>
```

### `middleware.ts` — `@supabase/ssr`
```ts
import { createServerClient } from '@supabase/ssr'
// Protège /dashboard/:path*
// createServerClient avec cookies.getAll / setAll
// Redirect → "/" si pas de session (supabase.auth.getUser())
export const config = { matcher: ['/dashboard/:path*'] }
```

### `app/api/auth/callback/route.ts` — `@supabase/ssr`
```ts
// GET handler — reçoit ?code=...
// createServerClient avec cookieStore
// supabase.auth.exchangeCodeForSession(code)
// Redirect → origin
```

### Stripe — `app/api/create-checkout/route.ts`
```
GET /api/create-checkout?plan=pro|premium|elite&billing=monthly|annual&token={access_token}

1. Récupère l'user via supabase.auth.getUser(token)
2. Si abonnement actif → stripe.subscriptions.update() (upgrade/downgrade, proration_behavior:'none')
   puis redirect /dashboard?updated=true
3. Sinon → stripe.customers.create({ email, metadata:{ userId } })
         + stripe.checkout.sessions.create({ mode:'subscription', ... })
   puis redirect vers session.url (Stripe Checkout)

Metadata Stripe checkout : { userId, planName, analysesLimit }
success_url : NEXT_PUBLIC_APP_URL/dashboard?success=true
cancel_url  : NEXT_PUBLIC_APP_URL/pricing
```

### Stripe — `app/api/webhook/route.ts`

**Événements traités :**

| Événement | Action |
|---|---|
| `checkout.session.completed` | Met à jour `users` : `subscription_status=active`, `subscription_plan`, `analyses_limit`, `analyses_used=0`, `analyses_reset_date` (1er du mois suivant), `stripe_customer_id`, `stripe_subscription_id`. Met aussi à jour `sub.metadata` pour les handlers suivants. |
| `customer.subscription.updated` | Upgrade (`newLimit > dbLimit`) : met à jour plan et limit immédiatement. Downgrade : différé au renouvellement de période. `cancel_at_period_end → true` : garde `status=active`, attend `.deleted`. |
| `customer.subscription.deleted` | `status=canceled`, `plan=starter`, `analyses_limit=4`. Résolution user via `customer.metadata.userId` ou `customer.email`. |

### Stripe — `app/api/customer-portal/route.ts`
```
GET /api/customer-portal

1. Récupère l'user (@supabase/ssr, cookies)
2. Récupère stripe_customer_id depuis table users
3. Si pas de stripe_customer_id → redirect /pricing
4. stripe.billingPortal.sessions.create({ customer, return_url: APP_URL/dashboard })
5. redirect → session.url (Portail Stripe natif)
```

### `public/manifest.json`
```json
{
  "name": "AlphaTradeX",
  "short_name": "AlphaTradeX",
  "icons": [{ "src": "/logo.svg", "sizes": "any", "type": "image/svg+xml" }],
  "theme_color": "#0A0A0F",
  "background_color": "#0A0A0F",
  "display": "standalone"
}
```

---

## 8. CE QUI RESTE À FAIRE

### Fait depuis la dernière mise à jour
- ✅ **Export PDF réel** : remplacé par `app/api/generate-pdf/route.tsx` (Puppeteer-core + `@sparticuz/chromium`, HTML auto-suffisant, PDF 1 page à la taille du contenu)
- ✅ **Historique des analyses** : `<AnalysisHistory />` (vue `historique` du dashboard) consomme `GET /api/analyses`, rétention par plan (`PLAN_MONTHS`)
- ✅ **Journal de trades** : `<TradeJournal />` (vues calendrier jour/mois, import/export CSV, date range picker)
- ✅ **Synchronisation cross-device** : Supabase Realtime (`analyses-insert:${userId}`)
- ✅ **Email de confirmation de paiement** : Resend, déclenché sur `checkout.session.completed`

### Priorité 1 — UX et complétude
- **Page 404 personnalisée** : toujours absente (`app/not-found.tsx`)
- **`GoogleAuthButton.tsx`** : composant existant mais toujours non utilisé
- **`UploadZone.tsx`** : composant désormais mort/non utilisé — le dashboard a sa propre drop zone inline (vue `nouvelle-analyse`). Seul le nom de variable `uploadZoneKey` (state, `DashboardClient.tsx`) subsiste comme remnant.

### Priorité 3 — Features Élite/Premium manquantes (backend absent)
Présentes dans la sidebar du dashboard sous forme de `<EmptyFeaturePage>` (placeholders verrouillés selon le plan), mais sans implémentation backend :
- **Alertes Telegram** (Élite)
- **Détection prédictive de setups** (Élite)
- **Accès API** (Élite)
- **Évolution semaine** / **Résumé semaine** (Premium/Élite)
- **Prop Firm Score** (Élite — distinct du `propFirmScore` déjà calculé dans le rapport d'analyse)
- **Support prioritaire** (Premium — redirige actuellement vers `/help`)

### Notes
- `app/icon.svg` (dans `app/`) vs `public/logo.svg` : deux assets distincts — vérifier cohérence favicon
- `@supabase/auth-helpers-nextjs` reste dans `package.json` mais inutilisé — peut être retiré
