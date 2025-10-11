# Frontend Components

## QueryInput Component
Natural language query input with suggestions

**Features:**
- Text input for natural language queries
- 8 pre-built query suggestions
- Clear button
- Loading state
- Keyboard submit support

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
Integrates both components with API calls

**Features:**
- Fetches from backend at `http://localhost:8000/query`
- Loading states
- Error handling
- Clean, responsive layout
