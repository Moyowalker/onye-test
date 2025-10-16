'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import QueryInput from '@/components/QueryInput'
import QueryResults from '@/components/QueryResults'
import DataVisualization from '@/components/DataVisualization'
import AuthButton from '@/components/AuthButton'

interface QueryResponse {
  query: string
  nlp_analysis: {
    intent: string
    entities: any
  }
  fhir_response: any
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Get the user's session and access token for API calls
  // This is the key to SMART on FHIR - we need the token with proper scopes
  const { data: session, status } = useSession()

  const handleQuery = async (query: string) => {
    // Don't allow queries without authentication
    // This enforces our security model - no anonymous access to FHIR data
    if (!session?.accessToken) {
      setError('You must be signed in to query FHIR data')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Now I'm sending the Bearer token with every request
      // The backend will validate this JWT and check SMART scopes
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${apiBase}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // This is the magic - passing the OAuth access token
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        // Try to surface the exact backend error so we know what's failing
        let serverDetail: string | undefined
        try {
          const errBody = await response.json()
          serverDetail = errBody?.detail || errBody?.message
        } catch {
          // no-op
        }

        if (response.status === 401) {
          throw new Error(serverDetail ? `Authentication failed: ${serverDetail}` : 'Authentication required - please sign in again')
        }
        if (response.status === 403) {
          throw new Error(serverDetail ? `Insufficient permissions: ${serverDetail}` : 'Insufficient permissions - you need patient/*.read or user/*.read scope')
        }
        throw new Error(serverDetail || 'Failed to fetch results')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI on FHIR</h1>
                  <p className="text-xs text-gray-500">Healthcare Intelligence</p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <span className="text-emerald-600 px-3 py-2 rounded-md text-sm font-semibold border-b-2 border-emerald-600">
                  Query
                </span>
              </div>
            </div>

            {/* Right side - Authentication */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Live</span>
              </div>
              {/* This replaces the generic user icon with actual auth */}
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                AI on FHIR
              </span>
              <br />
              <span className="text-gray-800">Query System</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Transform complex medical data into actionable insights using natural language queries. 
              Search patient records, analyze conditions, and visualize healthcare data with proper SMART on FHIR authorization.
            </p>
            
            {/* Show auth status in hero */}
            {status === "loading" && (
              <div className="text-emerald-600 font-medium">Checking authentication...</div>
            )}
            {!session && status !== "loading" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-yellow-800 text-sm">
                  🔒 Sign in required to access FHIR data with proper authorization
                </p>
              </div>
            )}
            {session && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-emerald-800 text-sm">
                  ✅ Authenticated with {session.scopes?.filter(s => s.includes('read')).length || 0} FHIR permissions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <main className="space-y-8">
          <QueryInput onSubmit={handleQuery} onClear={handleClear} loading={loading} />

          {error && (
            <div className="max-w-4xl mx-auto mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r shadow-sm">
              <div className="flex items-center gap-2 text-red-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {result && (
            <>
              <DataVisualization fhirResponse={result.fhir_response} />
              
              <QueryResults
                query={result.query}
                nlpAnalysis={result.nlp_analysis}
                fhirResponse={result.fhir_response}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
