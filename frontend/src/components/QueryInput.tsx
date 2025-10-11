'use client'

import { useState } from 'react'

interface QueryInputProps {
  onSubmit: (query: string) => void
  loading?: boolean
}

const SUGGESTIONS = [
  "show diabetic patients over 50",
  "find patients with hypertension",
  "patients between 30 and 45 years old",
  "show all conditions for diabetes",
  "display medications for patients",
  "show me all patients",
  "patients under 40 with asthma",
  "get observations for vital signs"
]

export default function QueryInput({ onSubmit, loading = false }: QueryInputProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSubmit(query.trim())
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSubmit(suggestion)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about patients, conditions, or medications..."
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
