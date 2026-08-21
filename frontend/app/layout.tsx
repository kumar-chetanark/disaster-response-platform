import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Disaster Response Platform',
  description: 'Real-time disaster early-warning & resource coordination platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}