'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Patient {
  id: string
  name?: Array<{ text?: string }>
  extension?: Array<{ valueInteger?: number }>
  birthDate?: string
  gender?: string
}

interface Condition {
  id: string
  code: { coding: Array<{ display: string }> }
}

interface FHIREntry {
  resource: Patient | Condition | any
}

interface DataVisualizationProps {
  fhirResponse?: {
    resourceType: string
    total: number
    entry?: FHIREntry[]
  }
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function DataVisualization({ fhirResponse }: DataVisualizationProps) {
  if (!fhirResponse?.entry || fhirResponse.entry.length === 0) {
    return null
  }

  const resourceType = fhirResponse.entry[0]?.resource?.resourceType

  // Helper to compute age from birthDate (fallback when extension is missing)
  const getAge = (patient: Patient): number | undefined => {
    const extAge = patient.extension?.[0]?.valueInteger
    if (typeof extAge === 'number') return extAge
    if (!patient.birthDate) return undefined
    try {
      const birth = new Date(patient.birthDate)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
      return age
    } catch {
      return undefined
    }
  }

  // Age Distribution Chart for Patients
  const renderAgeDistribution = () => {
    const patients = fhirResponse.entry?.filter(
      (e) => e.resource.resourceType === 'Patient'
    ).map((e) => e.resource as Patient) || []

    if (patients.length === 0) return null

    // Group patients by age range
    const ageRanges = {
      '0-20': 0,
      '21-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61-70': 0,
      '71+': 0
    }

    patients.forEach((patient) => {
      const age = getAge(patient)
      if (typeof age !== 'number') return
      if (age <= 20) ageRanges['0-20']++
      else if (age <= 30) ageRanges['21-30']++
      else if (age <= 40) ageRanges['31-40']++
      else if (age <= 50) ageRanges['41-50']++
      else if (age <= 60) ageRanges['51-60']++
      else if (age <= 70) ageRanges['61-70']++
      else ageRanges['71+']++
    })

    const chartData = Object.entries(ageRanges).map(([range, count]) => ({
      ageRange: range,
      count,
      patients: count
    }))

    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-emerald-500">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900">Age Distribution</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ageRange" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="patients" fill="#3b82f6" name="Number of Patients" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold text-emerald-600">{patients.filter(p => typeof getAge(p) === 'number').length}</span> patients
          </p>
        </div>
      </div>
    )
  }

  // Condition Distribution Chart
  const renderConditionDistribution = () => {
    const conditions = fhirResponse.entry?.filter(
      (e) => e.resource.resourceType === 'Condition'
    ).map((e) => e.resource as Condition) || []

    if (conditions.length === 0) return null

    // Count conditions by type
    const conditionCounts: { [key: string]: number } = {}
    conditions.forEach((condition) => {
      const display = condition.code.coding[0].display
      conditionCounts[display] = (conditionCounts[display] || 0) + 1
    })

    const chartData = Object.entries(conditionCounts).map(([name, value]) => ({
      name,
      value,
      count: value
    }))

    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-red-500">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900">Condition Distribution</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ef4444" name="Number of Cases" />
            </BarChart>
          </ResponsiveContainer>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Total conditions: {conditions.length}
        </p>
      </div>
    )
  }

  // Gender Distribution for Patients
  const renderGenderDistribution = () => {
    const patients = fhirResponse.entry?.filter(
      (e) => e.resource.resourceType === 'Patient'
    ).map((e) => e.resource as Patient) || []

    if (patients.length === 0) return null

    const genderCounts: { [key: string]: number } = {}
    patients.forEach((patient: any) => {
      const gender = patient.gender || 'unknown'
      genderCounts[gender] = (genderCounts[gender] || 0) + 1
    })

    const chartData = Object.entries(genderCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      count: value
    }))

    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-teal-500">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900">Gender Distribution</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Data Visualization</h2>
      </div>
      
      {resourceType === 'Patient' && (
        <div className="grid gap-6 md:grid-cols-2">
          {renderAgeDistribution()}
          {renderGenderDistribution()}
        </div>
      )}
      
      {resourceType === 'Condition' && renderConditionDistribution()}
    </div>
  )
}
