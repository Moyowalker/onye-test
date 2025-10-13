'use client'

interface Patient {
  id: string
  name: Array<{ text: string }>
  gender: string
  birthDate: string
  extension: Array<{ valueInteger: number }>
}

interface Condition {
  id: string
  subject: { display: string }
  code: { coding: Array<{ display: string }> }
  onsetDateTime: string
}

interface FHIREntry {
  resource: Patient | Condition | any
}

interface QueryResultsProps {
  query?: string
  nlpAnalysis?: {
    intent: string
    entities: any
  }
  fhirResponse?: {
    resourceType: string
    total: number
    entry?: FHIREntry[]
  }
}

export default function QueryResults({ query, nlpAnalysis, fhirResponse }: QueryResultsProps) {
  if (!fhirResponse) return null

  const renderPatient = (patient: Patient) => (
    <div className="p-5 bg-white border-l-4 border-emerald-500 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{patient.name[0].text}</h3>
            <p className="text-xs text-gray-500">ID: {patient.id}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
          Patient
        </span>
      </div>
      <div className="text-sm space-y-2 text-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Age:</span> {patient.extension[0].valueInteger} years
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Gender:</span> {patient.gender}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Birth Date:</span> {patient.birthDate}
        </div>
      </div>
    </div>
  )

  const renderCondition = (condition: Condition) => (
    <div className="p-5 bg-white border-l-4 border-red-500 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{condition.code.coding[0].display}</h3>
            <p className="text-xs text-gray-500">ID: {condition.id}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
          Condition
        </span>
      </div>
      <div className="text-sm space-y-2 text-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Patient:</span> {condition.subject.display}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Onset:</span> {condition.onsetDateTime}
        </div>
      </div>
    </div>
  )

  const renderResource = (entry: FHIREntry) => {
    const resource = entry.resource
    
    switch (resource.resourceType) {
      case 'Patient':
        return renderPatient(resource as Patient)
      case 'Condition':
        return renderCondition(resource as Condition)
      default:
        return (
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="font-medium">{resource.resourceType}</p>
            <p className="text-sm text-gray-600">ID: {resource.id}</p>
          </div>
        )
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      {/* Query Info */}
      <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-sm font-semibold text-gray-600">Your Query</p>
        </div>
        <p className="font-semibold text-gray-900 text-lg mb-1">{query}</p>
        {nlpAnalysis && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              </svg>
              Intent: {nlpAnalysis.intent}
            </span>
            {nlpAnalysis.entities.age_filter && (
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Age: {JSON.stringify(nlpAnalysis.entities.age_filter)}
              </span>
            )}
            {nlpAnalysis.entities.conditions?.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                Conditions: {nlpAnalysis.entities.conditions.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-900">
            Results <span className="inline-flex items-center justify-center w-8 h-8 ml-2 text-sm font-bold text-emerald-600 bg-emerald-100 rounded-full">{fhirResponse.total}</span>
          </h2>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            {fhirResponse.resourceType}
          </span>
        </div>

        {fhirResponse.entry && fhirResponse.entry.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {fhirResponse.entry.map((entry, index) => (
              <div key={index}>
                {renderResource(entry)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No results found
          </div>
        )}
      </div>
    </div>
  )
}
