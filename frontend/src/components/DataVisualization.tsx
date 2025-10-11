'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Patient {
  id: string
  name: Array<{ text: string }>
  extension: Array<{ valueInteger: number }>
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
      const age = patient.extension[0].valueInteger
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
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
        <p className="text-sm text-gray-600 mt-2">
          Total patients: {patients.length}
        </p>
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Condition Distribution</h3>
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Data Visualization</h2>
      
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
