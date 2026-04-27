# RÉSUMÉ COMPLET — AlphaTradeX (à jour au 24 avril 2026)

---

## 1. STACK ET DÉPENDANCES

### Dependencies (production)
| Package | Version |
|---|---|
| `next` | ^16.2.3 |
| `react` | ^18.3.1 |
| `react-dom` | ^18.3.1 |
| `@supabase/supabase-js` | ^2.47.10 |
| `@supabase/auth-helpers-nextjs` | ^0.10.0 |
| `@stripe/stripe-js` | ^5.5.0 |
| `stripe` | ^17.5.0 |
| `openai` | ^4.77.3 |
| `framer-motion` | ^11.15.0 |
| `lucide-react` | ^0.468.0 |
| `papaparse` | ^5.4.1 |
| `nextjs-toploader` | ^3.9.17 |

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
│   ├── layout.tsx                  ← Root layout global
│   ├── page.tsx                    ← Page d'accueil /
│   ├── api/
│   │   ├── analyze/route.ts        ← POST (auth requise, rate-limit 15s)
│   │   ├── analyze-demo/route.ts   ← POST (rate-limit par IP)
│   │   ├── auth/callback/route.ts  ← OAuth callback Supabase
│   │   ├── create-checkout/route.ts← Stripe checkout
│   │   └── webhook/route.ts        ← Webhook Stripe
│   ├── dashboard/
│   │   ├── page.tsx                ← Wrapper Suspense
│   │   └── DashboardClient.tsx     ← /dashboard (protégé middleware)
│   ├── demo/
│   │   └── page.tsx                ← /demo
│   ├── pricing/
│   │   └── page.tsx                ← /pricing
│   └── legal/
│       ├── layout.tsx              ← Navbar + Footer partagés
│       ├── cgu/page.tsx
│       ├── cgv/page.tsx
│       ├── confidentialite/page.tsx
│       ├── cookies/page.tsx
│       ├── mentions-legales/page.tsx
│       ├── privacy/page.tsx
│       └── risques/page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── CookieBanner.tsx
│   ├── Providers.tsx
│   ├── ScrollReset.tsx
│   ├── TradeReport.tsx
│   ├── UploadZone.tsx
│   ├── ExportGuide.tsx
│   └── GoogleAuthButton.tsx
├── lib/
│   ├── supabase.ts
│   ├── openai.ts
│   ├── plans.ts
│   ├── demoTrades.ts
│   ├── tradingAnalysisTypes.ts
│   └── parseCSV/
│       ├── index.ts
│       ├── types.ts
│       ├── parseMT4.ts
│       ├── parseTradingView.ts
│       └── parseBinance.ts
├── styles/
│   └── theme.ts                    ← Source of truth couleurs/tokens
├── middleware.ts
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.mjs
├── .eslintrc.json
├── CLAUDE.md / AGENTS.md
└── public/
    └── file.svg, globe.svg, next.svg, vercel.svg, window.svg
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
- `demo/page.tsx` : même pattern + barre `width:['0%','90%']` duration 8s
- `UploadZone.tsx` : `whileHover={{ scale:1.01 }}` + AnimatePresence + barre `width:['0%','85%']` duration 10s

**RevealSection** (IntersectionObserver threshold 0.15) :
```
invisible : translate-y-6 opacity-0
visible   : translate-y-0 opacity-100
transition: duration-700 ease-out
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

**Container inner :** `mx-auto flex max-w-6xl items-center justify-between px-6 py-4`

**Logo bouton :** `flex items-center gap-2 rounded text-left focus-visible:ring-2 focus-visible:ring-blue`
- Texte desktop : `hidden text-lg font-bold text-primary md:inline`
- Texte mobile centré : `pointer-events-none absolute left-1/2 -translate-x-1/2 text-lg font-bold text-primary md:hidden`

**Nav desktop :** `hidden items-center gap-8 text-sm md:flex`
- Items : `text-secondary transition-colors duration-200 hover:text-primary`
- Liens : Services · Analyse Gratuite → `/demo` · Prix → `/pricing` · À propos · Aide

**Bouton S'inscrire desktop :**
- `hidden items-center gap-2 rounded bg-blue px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-blue/90 md:inline-flex`
- Icône : `<UserCircle h-4 w-4>`
- Action : `supabase.auth.signInWithOAuth({ provider:"google", redirectTo:"/api/auth/callback" })`

**Burger mobile :** `rounded border border-border bg-card p-2 text-secondary md:hidden`

**Menu mobile :**
- `mx-4 overflow-hidden rounded border border-border bg-card transition-all duration-200 ease-out md:hidden`
- Ouvert : `max-h-[360px] opacity-100`
- Fermé : `max-h-0 opacity-0`
- Inner : `flex flex-col gap-2 p-4`
- Bouton S'inscrire mobile : `mt-2 inline-flex w-full items-center justify-center gap-2 rounded bg-blue px-4 py-2 font-semibold text-primary hover:bg-blue/90`
- Fermeture au clic extérieur via `mousedown` listener sur `document`

**États / logique :**
- `scrolled` : `window.scrollY > 50`
- `handleBrandClick` : scroll top si sur `/`, sinon `router.push("/")`
- `handleServicesClick` : `window.scrollTo(0,0)` si sur `/`, sinon `router.push("/")`

---

### `Footer.tsx` — Server Component

```
<footer class="mx-auto flex max-w-6xl flex-col gap-8 text-secondary">
  Logo SVG 32x32 + "AlphaTradeX" font-bold text-primary
  "Votre analyste IA personnel sur les marchés" — mt-2 text-sm
  a[href="mailto:contact@alphatradex.ai"] — hover:text-primary
  flex flex-wrap items-center gap-4 text-sm :
    <Info h-4 w-4> "À propos"
    <HelpCircle h-4 w-4> "Aide"

<div class="mx-auto mt-6 flex max-w-6xl flex-col gap-2 text-xs text-secondary">
  Row 1 : /legal/mentions-legales · /legal/cgu · /legal/confidentialite
  Row 2 : /legal/cookies · /legal/cgv · /legal/risques

<p class="mx-auto mt-8 max-w-6xl text-sm text-secondary">
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

### `TradeReport.tsx`

Sections animées (`framer-motion initial={opacity:0,y:20} → animate={opacity:1,y:0}`) :

| # | Titre | Delay |
|---|---|---|
| 1 | Quota bar (si analysesLeft défini) | 0 |
| 2 | Performance globale — 3 ScoreCircle SVG | 0 |
| 3 | Statistiques clés — `grid-cols-2 md:grid-cols-4` | 0.1 |
| 4 | Profil psychologique + SeverityBadge | 0.2 |
| 5 | Performance par session London/NY/Tokyo | 0.3 |
| 6 | Patterns meilleur/pire jour, heure, symbole | 0.35 |
| 7 | Prop Firm Readiness badge + obstacles | 0.4 |
| 8 | Plan d'action priorisé par catégorie | 0.45 |
| 9 | Coach IA — `card border-blue/30 bg-blue/5 p-6` | 0.5 |
| 10 | Bouton PDF → `window.print()` | — |

**ScoreCircle :** SVG viewBox 100×100, cercle r=45, stroke 8px
- >60 → `var(--green)` / ≥40 → `var(--cyan)` / <40 → `var(--red)`

**SeverityBadge :**
- CRITIQUE/ÉLEVÉ : `bg-red/20 text-red border-red/30`
- MOYEN : `bg-cyan/20 text-cyan border-cyan/30`
- FAIBLE : `bg-green/20 text-green border-green/30`

---

### `UploadZone.tsx`

- Wrapper : `w-full max-w-2xl mx-auto`
- Zone : `border-2 border-dashed rounded-xl p-12 text-center cursor-pointer`
  - Idle : `border-border bg-card hover:border-blue/50`
  - Dragging : `border-blue bg-blue/5 shadow-blue`
  - File OK : `border-green bg-green/5`
- `whileHover={{ scale: 1.01 }}`
- Accepte uniquement `.csv`
- Spinner `animate-spin h-5 w-5` pendant loading
- Barre framer : `["0%","85%"]` en 10s

---

## 5. PAGES

### `/` — `app/page.tsx` — `"use client"`

Wrapper : `div.relative.min-h-screen.bg-background.text-primary` `z-index:0`

#### Section 1 — Hero
- `min-h-screen pt-16 flex items-center justify-center bg-gradient-to-b from-[#0A0A0F] to-[#12121A]`
- Container : `mx-auto max-w-[1200px] px-6 pb-20 pt-4 md:pb-0 md:pt-0 text-center`
- Badge : `inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-secondary`
  - Point : `h-2 w-2 animate-pulse rounded-full bg-blue`
  - Texte : "Propulsé par GPT-5.4"
- H1 : `mx-auto mt-8 max-w-[1200px] text-balance text-4xl font-bold leading-tight text-primary md:text-6xl xl:text-5xl`
  - "Les meilleurs traders n'ont pas plus travaillé. Ils ont mieux **compris**."
  - "compris" : `bg-gradient-to-r from-blue to-cyan bg-clip-text text-transparent`
- P : `mx-auto mt-6 max-w-[600px] text-lg text-secondary`
- CTA : `mt-10 flex flex-wrap items-center justify-center gap-4`
  - S'inscrire : `rounded bg-blue px-6 py-3 font-semibold text-primary hover:bg-blue/90`
  - Analyse Gratuite : `rounded border border-border bg-transparent px-6 py-3 font-semibold text-primary hover:border-blue`

#### Section 2 — Dashboard mockup
- `bg-[#12121A]` — Container : `mx-auto max-w-[1200px] px-6 pb-20 pt-20 [perspective:1000px]`
- Card : `card glow-blue rounded p-6 [transform:rotateX(5deg)]`
- 3 métriques `rounded border border-border bg-background/50 p-4` :
  - "+2 847€" `font-mono text-2xl text-primary`
  - "68%" `font-mono text-2xl text-cyan`
  - "4.2%" `font-mono text-2xl text-green`
- Badge IA : `rounded-full border border-green/40 bg-green/10 px-2 py-1 text-xs text-green`

#### Section 3 — Marquee
- `border-y border-border bg-[#0A0A0F] py-4`
- `animate-landing-marquee 50s linear infinite`
- Items doublés : "Approuvé par les traders sur" · Binance · MT4 · MT5 · TradingView · FTMO · MyForexFunds
- Séparateurs : `mx-3 h-1.5 w-1.5 rounded-full bg-blue`

#### Section 4 — Services (id="services")
- `bg-[#12121A]` — Container : `mx-auto max-w-[1200px] px-6 py-20`
- H2 : `text-center text-3xl font-bold text-primary md:text-4xl` — "niveau" en gradient
- Grille : `mt-12 grid gap-6 md:grid-cols-3`
- ServiceCard : `card rounded p-7 hover:border-blue hover:glow-blue`
  - BrainCircuit (blue) "Avantage psychologique" delay:0ms
  - BarChart3 (cyan) "Statistiques approfondies" delay:100ms
  - BellRing (green) "Alertes sur les schémas" delay:200ms

#### Section 5 — GPT-5.4
- `bg-background px-6 py-20`
- H2 : `mx-auto mt-8 max-w-[1200px] text-3xl font-bold md:text-5xl` — "GPT-5.4" en gradient
- Grille : `mt-12 grid gap-6 lg:grid-cols-3`
- 3 cards `card rounded p-7` : BrainCircuit(blue) · ShieldCheck(cyan) · TrendingUp(green)

#### Section 6 — Système discipliné
- `bg-[#12121A] px-6 py-20`
- H2 : `text-center text-3xl font-bold text-primary md:text-5xl` — "disciplinés" en gradient
- Grille : `mt-12 grid gap-6 md:grid-cols-2`
- 4 cards `card rounded p-7` : Trophy(blue) · BarChart3(cyan) · BrainCircuit(green) · ShieldCheck(blue)

#### Section 7 — Témoignages
- `bg-background px-6 py-20`
- H2 : `text-center text-3xl font-bold text-primary md:text-5xl` — "sérieux" en gradient
- Grille : `mt-12 grid gap-6 lg:grid-cols-4`
- Cards : `relative rounded border border-border bg-card p-7 hover:border-blue`
  - Guillemet : `absolute right-4 top-3 text-5xl font-bold text-blue/20`
  - Étoiles : `mb-3 text-sm tracking-widest text-blue` (★★★★★)
- 4 traders : Kilian I. (FTMO) · Lilou O. (TradingView) · Alya L. (Binance) · Nassim S. (MT5)

#### Section 8 — CTA Démo (id="analyse")
- `bg-[#12121A] px-6 py-20 text-center`
- H2 : `text-3xl font-bold md:text-4xl` — "révèle" en gradient
- CTA : `mx-auto mt-8 inline-flex items-center gap-2 rounded bg-blue px-7 py-3 font-semibold text-primary hover:bg-blue/90`
- Note : `mx-auto mt-4 max-w-sm text-sm text-secondary` — "Sans carte bancaire. Démonstration immédiate."

#### Section 9 — CTA Elite
- `bg-gradient-to-b from-[#12121A] to-[#0A0A0F] px-6 py-20 text-center`
- H2 : `text-3xl font-bold text-primary md:text-5xl` — "élite" en gradient

#### Section 10 — Footer
- `border-t border-border bg-background/80 px-6 py-10 backdrop-blur-md`

#### Bouton retour en haut (fixe)
- `pointer-events-none fixed bottom-6 right-6 z-50`
- Visible si `scrollY > 300` : `translate-y-0 opacity-100`, sinon `translate-y-3 opacity-0`
- Style : `rounded border border-border bg-card p-2 text-secondary hover:text-primary`
- `<ArrowRight h-5 w-5 -rotate-90>`

---

### `/pricing` — `app/pricing/page.tsx` — `"use client"`

Wrapper : `min-h-screen bg-[#0A0A0F] font-sans text-[#F0F4FF]`
Main : `px-6 pb-20 pt-32`
Container : `mx-auto flex w-full max-w-[1200px] flex-col items-center`

#### Badge accès anticipé
`inline-flex items-center gap-2 rounded-full border border-[#2D6FFF] bg-[#2D6FFF]/10 px-4 py-2 text-sm font-medium text-[#2D6FFF]`
`<Flame h-4 w-4>` + "Accès anticipé - Places limitées"

#### Toggle mensuel/annuel
- Wrapper : `mt-8 inline-flex items-center rounded-full border border-[#1E2035] bg-[#12121A] p-1 text-sm`
- Actif : `rounded-full px-4 py-2 bg-[#1E2035] text-[#F0F4FF]`
- Inactif : `text-[#8892AA]`
- Badge économie : `rounded-full bg-[#2D6FFF] px-2 py-0.5 text-xs font-semibold text-[#F0F4FF]`

#### Tableau des plans

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
- Label : `text-xs uppercase tracking-wide text-[#8892AA]`
- Prix principal : `mt-2 text-3xl font-bold text-[#F0F4FF]`
- Prix barré : `mt-1 text-sm text-[#8892AA] line-through`

#### Features par plan
```
PRO (4/11 incluses)     : 4 analyses/mois, Analyse IA GPT-5.4, Export PDF, Historique✗,
                           Évolution hebdo✗, Résumé hebdo✗, Support prio✗,
                           Score Prop Firm✗, Détection prédictive✗, Alertes Telegram✗, API✗
PREMIUM (6/11 incluses) : 24 analyses/mois, Analyse IA GPT-5.4, Export PDF,
                           Historique 6 mois✓, Évolution hebdo✓, Résumé hebdo✓,
                           Support prio✗, Score Prop Firm✗, Détection prédictive✗,
                           Alertes Telegram✗, API✗
ÉLITE (11/11 incluses)  : Analyses illimitées + TOUTES les features
```

#### FAQ (5 questions)
`details.rounded-xl.border.border-[#1E2035].bg-[#12121A].p-5`
1. Sécurité des données
2. Changement/résiliation de plan
3. Fonctionnement accès anticipé
4. Formats compatibles (MT4, MT5, Binance, TradingView)
5. Cible utilisateurs

#### CTA démo
`w-full rounded-2xl bg-[#0A0A0F] px-6 py-16 text-center md:py-20`
Link → `/demo` : `rounded-lg bg-[#2D6FFF] px-8 py-3 text-lg font-semibold hover:opacity-90`

---

### `/demo` — `app/demo/page.tsx` — `"use client"`

Main : `min-h-screen bg-background text-primary p-8 max-w-6xl mx-auto`

- H1 : `text-4xl font-bold mb-4`
- Bouton : `btn-primary text-xl px-12 py-4 disabled:opacity-50`
- Barre loading : `w-full bg-card rounded-full h-2 max-w-md mx-auto` + framer `['0%','90%']` 8s
- État "déjà utilisé" : `card p-8 text-center max-w-lg mx-auto`
- CTA post-rapport : `card p-8 text-center mt-12 border-blue glow-blue`
- Prix affiché : `PLANS.starter.monthly` = 29€/mois

---

### `/dashboard` — `DashboardClient.tsx` — `"use client"`

Protégé par `middleware.ts`.

Header : `border-b border-border bg-card/50 backdrop-blur`
Container : `mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4`
Main : `mx-auto max-w-5xl space-y-10 px-6 py-10`

- Succès paiement : `rounded-lg border border-green/35 bg-green/10 px-4 py-3 text-sm text-green`
- Annulation : `rounded-lg border border-red/35 bg-red/10 px-4 py-3 text-sm text-red`
- Bouton abonnement : `rounded-lg bg-blue px-4 py-2 text-sm font-medium hover:bg-blue/85`
- Checkout → `/api/create-checkout?plan=starter`

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

Routes : `/legal/mentions-legales` · `/legal/cgu` · `/legal/cgv` · `/legal/confidentialite` · `/legal/privacy` · `/legal/cookies` · `/legal/risques`

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

### `next.config.mjs` — Fallback CI
```js
NEXT_PUBLIC_SUPABASE_URL → placeholder si env absent
NEXT_PUBLIC_SUPABASE_ANON_KEY → JWT placeholder si env absent
```

### Plans `lib/plans.ts` vs `/pricing`
- `lib/plans.ts` : starter=29€, pro=79€, elite=199€ → utilisé uniquement par `/demo`
- `/pricing` affiche : 24.5€, 49.5€, 99.5€ (accès anticipé)
- Les deux systèmes coexistent sans lien

### Rate limiting API `/api/analyze`
- `Map<userId, timestamp>` en mémoire — 1 requête / 15s par user
- Reset mensuel automatique le 1er du mois

### Demo `/api/analyze-demo`
- Table `demo_usage` Supabase — 1 analyse par IP
- `maxDuration = 60` (Vercel Edge timeout)
- Paramètres randomisés guidés par cibles calculées

---

## 7. CONFIGURATION

### `next.config.mjs`
```js
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() || placeholderUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() || placeholderAnon,
  },
};
```

### `app/layout.tsx`
```tsx
// Fonts :
Inter({ subsets:["latin"], weight:["400","500","600","700"], variable:"--font-inter" })
JetBrains_Mono({ subsets:["latin"], weight:["400","500"], variable:"--font-jetbrains-mono" })

// Metadata :
metadataBase: 'https://alphatradex.ai'
title: "AlphaTradeX - Votre analyste IA personnel sur les marchés"
icons: { icon:"/logo.svg", apple:"/logo.svg", shortcut:"/logo.svg" }
openGraph.title: "TonSaaS — AI Trading Journal"  ← BUG à corriger

// Arbre :
<html lang="fr" className={fontVars}>
  <head><link rel="manifest" href="/manifest.json"/></head>
  <body>
    <div aria-hidden />        {/* glow radial fixed z:1 */}
    <ScrollReset />
    <Providers>                {/* NextTopLoader */}
      {children}
    </Providers>
    <CookieBanner />           {/* portal → body, z:9999 */}
  </body>
</html>
```

### `middleware.ts`
```ts
// Protège /dashboard/:path*
// createMiddlewareClient(@supabase/auth-helpers-nextjs)
// Redirect → "/" si pas de session
export const config = { matcher: ['/dashboard/:path*'] }
```

---

## 8. CE QUI RESTE À FAIRE

### Priorité 1 — Fonctionnel critique manquant
- **Bouton "Commencer" sur `/pricing`** : aucun `onClick`, ne déclenche pas Stripe
- **Boutons "À propos" et "Aide"** : ne font rien dans Navbar et Footer (pas de page)
- **Incohérence prix** : `lib/plans.ts` (29€/79€/199€) ≠ `/pricing` (24.5€/49.5€/99.5€)

### Priorité 2 — UX et complétude
- **Export PDF réel** : `window.print()` est un hack → remplacer par `@react-pdf/renderer`
- **Historique des analyses** : table `analyses` créée en DB mais aucune page de consultation
- **`GoogleAuthButton.tsx`** : composant existant mais non utilisé
- **Page 404 personnalisée** : absente
- **`/manifest.json`** : référencé dans `<head>` mais absent de `public/`

### Priorité 3 — Polish et infrastructure
- **Bug OpenGraph** : `openGraph.title` = "TonSaaS — AI Trading Journal" → corriger en "AlphaTradeX"
- **Alertes Telegram** : feature ÉLITE listée, backend absent
- **Détection prédictive de setups** : feature ÉLITE, non implémentée
- **`app/icon.svg`** vs `/logo.svg` : vérifier cohérence favicon
- **`ExportGuide.tsx`** : importé par UploadZone, contenu non audité
