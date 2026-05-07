# RÉSUMÉ COMPLET — AlphaTradeX (à jour au 6 mai 2026)

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
│   │   ├── auth/callback/route.ts      ← OAuth callback Supabase (@supabase/ssr)
│   │   ├── create-checkout/route.ts    ← Stripe checkout (GET, param token)
│   │   ├── customer-portal/route.ts    ← Portail client Stripe (GET)
│   │   └── webhook/route.ts            ← Webhook Stripe (3 événements)
│   ├── about/
│   │   └── page.tsx                    ← /about (Page À propos)
│   ├── analysis/
│   │   └── page.tsx                    ← /analysis (démo libre, 1/IP)
│   ├── dashboard/
│   │   ├── page.tsx                    ← Wrapper Suspense
│   │   └── DashboardClient.tsx         ← /dashboard (protégé middleware)
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
- Note : `mx-auto mt-4 max-w-sm text-sm text-secondary`

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

#### FAQ (5 questions)
`details.rounded-xl.border.border-[#1E2035].bg-[#12121A].p-5`
1. Sécurité des données
2. Changement/résiliation de plan
3. Fonctionnement accès anticipé
4. Formats compatibles (MT4, MT5, Binance, Bybit, TradingView, FTMO, FundedNext)
5. Cible utilisateurs

#### CTA démo
`w-full rounded-2xl bg-[#0A0A0F] px-6 py-16 text-center md:py-20`
Link → `/analysis` : `rounded-lg bg-[#2D6FFF] px-8 py-3 text-lg font-semibold hover:opacity-90`

---

### `/analysis` — `app/analysis/page.tsx` — `"use client"`

Anciennement `/demo` (`app/demo/page.tsx` n'existe plus — route renommée).

Main : `min-h-screen bg-background text-primary p-8 max-w-6xl mx-auto`

- H1 : `text-4xl font-bold mb-4`
- Bouton : `btn-primary text-xl px-12 py-4 disabled:opacity-50`
- Barre loading : `w-full bg-card rounded-full h-2 max-w-md mx-auto` + framer `['0%','90%']` 8s
- État "déjà utilisé" : `card p-8 text-center max-w-lg mx-auto`
- CTA post-rapport : `card p-8 text-center mt-12 border-blue glow-blue`
- Prix affiché dans CTA : `PLANS.pro.monthly` = 24.5€/mois

---

### `/dashboard` — `DashboardClient.tsx` — `"use client"`

Protégé par `middleware.ts` (`@supabase/ssr`).

Header : `border-b border-border bg-card/50 backdrop-blur`
Container : `mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4`
Main : `mx-auto max-w-5xl space-y-10 px-6 py-10`

**State chargé au montage :**
- `subscriptionPlan` — nom du plan (ex. "pro", "premium", "elite")
- `analysesUsed` — nombre d'analyses utilisées ce cycle
- `dbAnalysesLimit` — quota du plan
- `analysesResetDate` — date de prochain reset (formatée `dd/mm`)

**Header — zone plan (si `subscriptionPlan` existe) :**
```
<nom du plan> (capitalisé, texte seul — sans badge)
{analysesUsed} / {dbAnalysesLimit} analyses utilisées
Prochain cycle le {dd/mm}
<a href="/api/customer-portal" class="text-xs text-secondary hover:text-primary">
  Modifier · Annuler · Factures
</a>
```

**Header — zone plan (si pas d'abonnement) :**
- Bouton "Voir les plans" → `router.push('/pricing')`

**Header — bouton Déconnexion :**
- `supabase.auth.signOut()` puis `router.push("/")` + `router.refresh()`
- Style : `rounded-lg border border-border px-4 py-2 text-sm text-secondary hover:bg-background`

**Bandeaux feedback :**
- Succès paiement (`?success=true` ou `?checkout=success`) : `rounded-lg border border-green/35 bg-green/10 px-4 py-3 text-sm text-green`
- Annulation (`?checkout=cancel`) : `rounded-lg border border-red/35 bg-red/10 px-4 py-3 text-sm text-red`

**Section analyse :**
- Description : "MT4, MT5, Binance, Bybit, TradingView, FTMO et FundedNext"
- `<UploadZone>` → `detectAndParse(file)` → `POST /api/analyze`
- Résultat : `<TradeReport report={analysis} analysesLeft={left} analysesLimit={limit} />`

---

### `/about` — `app/about/page.tsx` — `"use client"`

Layout : `min-h-screen bg-background text-primary` · Navbar + Footer inclus.
Toutes les sections utilisent `RevealSection` (IntersectionObserver, translateY 28px, 700ms).

| Section | Contenu |
|---|---|
| **Hero** | `px-6 pb-28 pt-40 text-center` · H1 : "Vous aviez les données. Personne n'avait encore décrypté vos biais." |
| **Le problème** | `px-6 py-24` · 4 "truth cards" en `md:grid-cols-2` : edge / exposition / journal / exécution |
| **En chiffres** | `px-6 py-24` · 4 stats : `<60s` / `5` plateformes / `200` traders / `2` Prop Firms |
| **Nos convictions** | `px-6 py-24` · 3 cards `md:grid-cols-3` : Brain(blue) La donnée / Shield(cyan) La discipline / Target(green) L'exécution |
| **Genèse** | `px-6 py-24` · 2 cols : texte intro + timeline 2022/2023/2025/2026 |
| **Le fondateur** | `px-6 py-24` · Avatar "S" gradient blue→cyan + citation · `border-l: 3px solid #2D6FFF` |
| **Compatibilité** | `px-6 py-24` · 7 pill-cards : MT4 · MT5 · Binance · Bybit · TradingView · FTMO · FundedNext |
| **CTA final** | `px-6 py-28` · Links : "Analyse gratuite" → `/analysis` + "Voir les plans" → `/pricing` |

---

### `/help` — `app/help/page.tsx` — `"use client"`

Layout : `min-h-screen bg-background text-primary` · Navbar + Footer inclus.
Toutes les sections utilisent `RevealSection`.

| Section | Contenu |
|---|---|
| **Hero** | `px-6 pt-40 pb-28 text-center` · H1 : "Une question. Une réponse directe." |
| **Comment on fonctionne** | 3 steps `md:grid-cols-3` : Upload(blue) · Brain(cyan) · FileText(green) |
| **Compatibilité** | Grille 4+3 cards avec instructions d'export par plateforme |
| **FAQ** | 10 questions `<details>/<summary>` avec `AccordionItem` — ChevronDown rotate(180) à l'ouverture |
| **Support** | Card : MessageCircle(blue) + `mailto:contact@alphatradex.ai` + "Du lundi au vendredi" |
| **CTA final** | Links : "Analyse gratuite" → `/analysis` + "Voir les plans" → `/pricing` |

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

**FAQ (10 questions) :**
1. Sécurité des données
2. Formats acceptés
3. Test avant abonnement
4. Réinitialisation du compteur
5. Changement / résiliation de plan
6. Score Prop Firm Readiness (Élite uniquement)
7. Types d'actifs compatibles
8. Cible utilisateurs
9. Volume minimum (50 trades)
10. Alertes Telegram (Élite uniquement)

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

Routes : `/legal/mentions-legales` · `/legal/cgu` · `/legal/cgv` · `/legal/confidentialite` · `/legal/privacy` · `/legal/cookies` · `/legal/risque` · `/legal/terms`

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

### Priorité 1 — UX et complétude
- **Export PDF réel** : `window.print()` est un hack → remplacer par `@react-pdf/renderer`
- **Historique des analyses** : table `analyses` créée en DB mais aucune page de consultation
- **`GoogleAuthButton.tsx`** : composant existant mais non utilisé
- **Page 404 personnalisée** : absente

### Priorité 3 — Features Élite manquantes (backend absent)
- **Alertes Telegram** : feature ÉLITE listée sur `/pricing` et `/help`, backend non implémenté
- **Détection prédictive de setups** : feature ÉLITE listée, non implémentée
- **Historique / Évolution hebdomadaire** : features PREMIUM/ÉLITE listées, non implémentées

### Notes
- `app/icon.svg` (dans `app/`) vs `public/logo.svg` : deux assets distincts — vérifier cohérence favicon
- `ExportGuide.tsx` : importé par UploadZone, contenu non audité
- `@supabase/auth-helpers-nextjs` reste dans `package.json` mais inutilisé — peut être retiré
