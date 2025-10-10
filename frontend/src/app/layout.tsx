import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Full Stack App',
  description: 'A full stack application with FastAPI and Next.js',
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