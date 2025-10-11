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
    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{patient.name[0].text}</h3>
          <p className="text-sm text-gray-600">ID: {patient.id}</p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          Patient
        </span>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p><span className="font-medium">Age:</span> {patient.extension[0].valueInteger} years</p>
        <p><span className="font-medium">Gender:</span> {patient.gender}</p>
        <p><span className="font-medium">Birth Date:</span> {patient.birthDate}</p>
      </div>
    </div>
  )

  const renderCondition = (condition: Condition) => (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{condition.code.coding[0].display}</h3>
          <p className="text-sm text-gray-600">ID: {condition.id}</p>
        </div>
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          Condition
        </span>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p><span className="font-medium">Patient:</span> {condition.subject.display}</p>
        <p><span className="font-medium">Onset:</span> {condition.onsetDateTime}</p>
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Query Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Your query:</p>
        <p className="font-medium">{query}</p>
        {nlpAnalysis && (
          <div className="mt-2 flex gap-4 text-xs text-gray-600">
            <span>Intent: <span className="font-medium text-blue-600">{nlpAnalysis.intent}</span></span>
            {nlpAnalysis.entities.age_filter && (
              <span>Age Filter: <span className="font-medium text-blue-600">
                {JSON.stringify(nlpAnalysis.entities.age_filter)}
              </span></span>
            )}
            {nlpAnalysis.entities.conditions?.length > 0 && (
              <span>Conditions: <span className="font-medium text-blue-600">
                {nlpAnalysis.entities.conditions.join(', ')}
              </span></span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Results ({fhirResponse.total})
          </h2>
          <span className="text-sm text-gray-600">
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
