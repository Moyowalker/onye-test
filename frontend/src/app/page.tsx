'use client'

import { useState } from 'react'
import QueryInput from '@/components/QueryInput'
import QueryResults from '@/components/QueryResults'

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

  const handleQuery = async (query: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI on FHIR Query System
          </h1>
          <p className="text-gray-600">
            Ask questions about patients, conditions, and medical records
          </p>
        </header>

        <main className="space-y-8">
          <QueryInput onSubmit={handleQuery} loading={loading} />

          {error && (
            <div className="max-w-4xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {result && (
            <QueryResults
              query={result.query}
              nlpAnalysis={result.nlp_analysis}
              fhirResponse={result.fhir_response}
            />
          )}
        </main>
      </div>
    </div>
  )
}
