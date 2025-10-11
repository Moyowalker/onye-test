# Frontend Components

## QueryInput Component
Natural language query input with suggestions

**Features:**
- Text input for natural language queries
- 8 pre-built query suggestions
- Clear button
- Loading state
- Keyboard submit support

## DataVisualization Component
Interactive charts using Recharts

**Features:**
- **Age Distribution Chart**: Bar chart showing patient count by age range (0-20, 21-30, etc.)
- **Gender Distribution Chart**: Pie chart showing male/female distribution
- **Condition Distribution**: Bar chart + Pie chart showing condition frequency
- Auto-detects resource type (Patient vs Condition)
- Responsive charts
- Color-coded visualizations
- Shows total counts

## QueryResults Component
Displays FHIR-formatted query results

**Features:**
- Shows NLP analysis (intent, entities, filters)
- Renders Patient resources (name, age, gender, birth date)
- Renders Condition resources (diagnosis, patient, onset date)
- Supports multiple resource types
- Grid layout for cards
- Color-coded by resource type

## Main Page
Integrates all components with API calls

**Features:**
- Fetches from backend at `http://localhost:8000/query`
- Loading states
- Error handling
- Clean, responsive layout
- Shows visualizations above detailed results
