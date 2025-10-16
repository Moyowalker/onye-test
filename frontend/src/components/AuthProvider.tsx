"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

// I'm putting this in a separate component so I can use it in layout.tsx
// The SessionProvider needs to be a Client Component, but layout.tsx is Server Component

interface AuthProviderProps {
  children: ReactNode
  session?: any // The session from getServerSession if we had SSR
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session}
      // Refetch session every 5 minutes to keep it fresh
      // This is important for healthcare apps where permissions might change
      refetchInterval={5 * 60}
      // Refetch when window gains focus (user comes back to tab)
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}