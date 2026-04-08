import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Alpha — Journal de Trading IA',
  description: 
    'Arrêtez de perdre de l\'argent sur les mêmes ' +
    'erreurs. Notre IA analyse vos trades et vous ' +
    'dit exactement pourquoi vous sous-performez.',
  openGraph: {
    title: 'Alpha — Journal de Trading IA',
    description: 
      'Votre coach IA trading personnel.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha — Journal de Trading IA',
    description: 
      'Votre coach IA trading personnel.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
