"use client"

import { useEffect, useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
export default function AuthButton() {
  const { data: session, status } = useSession()
  const [source, setSource] = useState<string | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${apiBase}/api/health`).then(async (r) => {
      const j = await r.json()
      if (j?.data_source) setSource(j.data_source)
      if (j?.fhir_base_url) setSourceUrl(j.fhir_base_url)
    }).catch(() => {
      setSource('Offline')
      setSourceUrl(apiBase)
    })
  }, [])

  const toggleSource = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const next = source === 'HapiFhirRepository' ? 'mock' : 'hapi'
    try {
      await fetch(`${apiBase}/api/toggle-data-source?mode=${next}`, { method: 'POST' })
      // Re-fetch health to update badge
      const r = await fetch(`${apiBase}/api/health`)
      const j = await r.json()
      if (j?.data_source) setSource(j.data_source)
      if (j?.fhir_base_url) setSourceUrl(j.fhir_base_url)
    } catch {
      // If failed, mark offline
      setSource('Offline')
      setSourceUrl(apiBase)
    }
  }

  // Show loading state while checking auth status
  // This prevents the login button from flashing before session loads
  if (status === "loading") {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-600">Checking authentication...</span>
      </div>
    )
  }

  // User is authenticated - show their info, data source, and logout option
  if (session) {
    return (
      <div className="flex items-center space-x-4">
        {source && (
          <span
            className={`px-2 py-1 text-xs rounded-full border ${
              source === 'Offline'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
            title={sourceUrl || undefined}
          >
            Source: {
              source === 'HapiFhirRepository' ? 'HAPI' :
              source === 'MockRepository' ? 'Mock' :
              source
            }
          </span>
        )}
        {session && source && source !== 'Offline' && (
          <button
            onClick={toggleSource}
            className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
            title="Toggle data source between Mock and HAPI"
          >
            Toggle
          </button>
        )}
        {/* Show user info and their FHIR permissions */}
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            Welcome, {session.user?.name || session.user?.email}
          </div>
          {/* This is really cool - showing the user their SMART scopes */}
          {session.scopes && (
            <div className="text-xs text-gray-600">
              Permissions: {session.scopes.filter(scope => 
                scope.includes('read') || scope.includes('fhir')
              ).join(', ')}
            </div>
          )}
        </div>
        
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  // User not authenticated - show login button
  return (
    <div className="flex items-center space-x-4">
      <div className="text-sm text-gray-600">
        Sign in to query FHIR data with proper authorization
      </div>
      <button
        onClick={() => signIn("auth0")}
        className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Sign In with Auth0
      </button>
    </div>
  )
}