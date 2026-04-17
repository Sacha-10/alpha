import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
  title: "TonSaaS — AI Trading Journal",
  description:
    "Analyze your trades with AI. Find out exactly why you're losing money and fix it before your next session.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
  openGraph: {
    title: "TonSaaS — AI Trading Journal",
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
    <html lang="fr" data-scroll-behavior="smooth" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
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
            zIndex: 1,
          }}
        />
        <ScrollReset />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
