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
  title: "TonSaaS — AI Trading Journal",
  description:
    "Analyze your trades with AI. Find out exactly why you're losing money and fix it before your next session.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "TonSaaS — AI Trading Journal",
    description:
      "Analyze your trades with AI. Find out exactly why you're losing money and fix it before your next session.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ScrollReset />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
