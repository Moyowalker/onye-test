import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'AI on FHIR',
  description: 'Healthcare data visualization with SMART on FHIR authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Wrapping the entire app with auth context */}
        {/* This makes user session available to all components */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
