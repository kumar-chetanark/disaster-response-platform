import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Disaster Response Platform - Command Dashboard',
  description: 'Mission-critical disaster early-warning and resource coordination command center',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-background text-on-background font-body-base antialiased h-screen overflow-hidden flex"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
