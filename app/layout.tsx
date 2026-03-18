import type { Metadata } from 'next'
import { Playfair_Display, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'),
  title: {
    default: 'FieldNotes AI',
    template: '%s | FieldNotes AI',
  },
  description: 'A practitioner journal documenting real-time AI development. Field notes on building with LLMs, Contentful, and modern web infrastructure.',
  openGraph: {
    siteName: 'FieldNotes AI',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'FieldNotes AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nikakarl',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body className="page-wrap">
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` }} />
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
