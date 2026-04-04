import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '[NomDuSaaS] — Journal de Trading IA',
  description: 
    'Arrêtez de perdre de l\'argent sur les mêmes ' +
    'erreurs. Notre IA analyse vos trades et vous ' +
    'dit exactement pourquoi vous sous-performez.',
  openGraph: {
    title: '[NomDuSaaS] — Journal de Trading IA',
    description: 
      'Votre coach IA trading personnel.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '[NomDuSaaS] — Journal de Trading IA',
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
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
