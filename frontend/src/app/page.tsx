'use client'

import { useState } from 'react'
import QueryInput from '@/components/QueryInput'
import QueryResults from '@/components/QueryResults'
import DataVisualization from '@/components/DataVisualization'

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

  const handleClear = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-10">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              AI on FHIR Query System
            </h1>
          </div>
          <p className="text-lg text-gray-600 ml-15">
            Natural language queries for patient and medical data
          </p>
        </header>

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
