import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { SmoothScrollProvider } from '@/components/smooth-scroll-provider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Master Web Auditor — Escáner SEO & Performance',
  description:
    'Analiza cualquier URL en segundos. Diagnóstico SEO, performance, accesibilidad y conversión con Claude AI. Hallazgos priorizados P0→P3 con evidencia y dirección de solución.',
  generator: 'Master Web Auditor v2.0',
  metadataBase: new URL('https://baral-audit-dashboard.vercel.app'),
  openGraph: {
    title: 'Master Web Auditor — Escáner SEO & Performance',
    description: 'Analiza cualquier URL en segundos. Diagnóstico SEO, performance, accesibilidad y conversión con IA.',
    url: 'https://baral-audit-dashboard.vercel.app',
    siteName: 'Master Web Auditor',
    locale: 'es_BO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Master Web Auditor — Escáner SEO & Performance',
    description: 'Analiza cualquier URL en segundos con IA. Hallazgos priorizados con evidencia.',
  },
  icons: {
    icon: [{ url: '/baral-logo.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0b14',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="bg-background text-foreground font-sans antialiased">
        <SmoothScrollProvider />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
