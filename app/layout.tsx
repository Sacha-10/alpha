import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import { Providers } from "@/components/Providers";
import ScrollReset from "@/components/ScrollReset";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://alphatradex.ai'),
  title: "AlphaTradeX - Votre analyste IA personnel sur les marchés",
  description:
    "Analyze your trades with AI. Find out exactly why you're losing money and fix it before your next session.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
  openGraph: {
    title: "AlphaTradeX — Votre analyste IA personnel sur les marchés",
    description:
      "Analyze your trades with AI. Find out exactly why you're losing money and fix it before your next session.",
    type: "website",
    images: ["/logo.svg"],
  },
  twitter: {
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${inter.variable} ${jetbrainsMono.variable}`} style={{ backgroundColor: '#0A0A0F', colorScheme: 'dark' }}>
      <head>
        <meta name="theme-color" content="#0A0A0F" />
        <meta name="color-scheme" content="dark" />
        <link rel="manifest" href="/manifest.json" />
        {/* Désactive la scroll-restoration navigateur avant tout — empêche le jump de position au refresh */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if('scrollRestoration' in history){history.scrollRestoration='manual';}}catch(e){}})();` }} />
        {/* Bloque toutes les transitions pendant le 1er paint pour éliminer le flash blanc */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{document.documentElement.classList.remove('hydrated');}catch(e){}})();` }} />
      </head>
      <body style={{ backgroundColor: '#0A0A0F' }}>
        {/* Active les transitions après hydratation complète (double rAF = après le 1er vrai paint) */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.add('hydrated');});});})();` }} />
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(45, 111, 255, 0.20) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <ScrollReset />
        <Providers>{children}</Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
