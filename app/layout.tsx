import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Travel Planner - Pianifica il tuo viaggio perfetto',
  description: 'Crea itinerari di viaggio personalizzati con l\'aiuto dell\'intelligenza artificiale',
  keywords: 'viaggio, itinerario, pianificazione, travel, AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}