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
  title: 'Baral — Diagnóstico Web Integral | Master Web Auditor',
  description:
    'Auditoría web profesional de baralintegral.com: 22 hallazgos priorizados, benchmarks competitivos y roadmap de acción por impacto en negocio. Powered by Master Web Auditor.',
  generator: 'Master Web Auditor v2.0',
  icons: {
    icon: [
      { url: '/baral-logo.svg', type: 'image/svg+xml' },
    ],
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
