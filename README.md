# AI on FHIR Query System

Hello Emmanuel! This is my take on building a natural language interface for FHIR healthcare data. The idea was to let people query patient records and medical conditions without writing complex database queries - just ask in plain English.

## What It Does

Type something like "show me patients with diabetes" and the system:
1. Processes your query using NLP (spaCy)
2. Figures out what you're looking for
3. Filters the FHIR data accordingly
4. Shows you results with charts and visualizations

I deployed the frontend to Vercel and Dockerized everything so you can spin it up locally in seconds.

## Quick Setup

### Docker Way (easiest):
```bash
git clone <repo-url>
cd onye-test
docker-compose up --build
```

Then open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Local Development:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

- **Backend**: FastAPI + spaCy for NLP + Python 3.11
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **Deployment**: Docker + Vercel
- **Data**: FHIR R4 compliant mock resources

## Try These Queries

- "Show me all patients"
- "Find patients with diabetes" 
- "Show patients older than 50"
- "List all conditions"

## What I Focused On

**Core Functionality**: Got the NLP processing working smoothly with spaCy. The query parser can handle different phrasings and extract entities like age, conditions, and gender filters.

**FHIR Standards**: Made sure the data follows FHIR R4 resource structure. In a real scenario, this would connect to an actual FHIR server, but for now I'm using mock data that matches the spec.

**DevOps**: Dockerized both services with proper health checks, non-root users, and multi-stage builds. Everything orchestrates through docker-compose with a custom network.

**UI/UX**: Kept it clean and functional. Added visualizations (charts for age distribution, gender breakdown, condition stats) using Recharts. Went with an emerald/teal theme instead of the typical blue.

## What I'd Improve With More Time

1. **Real FHIR Integration**: Hook this up to an actual FHIR server (HAPI FHIR or Azure FHIR service) instead of mock data

2. **Better NLP**: The current parser works but could be smarter. Would love to add support for complex queries like "male patients over 60 with diabetes OR hypertension"

3. **Authentication**: Add proper auth flow (OAuth2/OIDC) and role-based access control

4. **Testing**: Need unit tests for the NLP parser and integration tests for the API endpoints

5. **Caching**: Redis layer for frequently accessed FHIR resources

6. **Error Handling**: More graceful error messages and retry logic

7. **Observability**: Proper logging (structured JSON logs) and maybe OpenTelemetry for tracing

## Notes

- The backend runs on port 8000, frontend on 3000
- CORS is configured for localhost:3000
- Check out DOCKER_GUIDE.md for deployment details
- HIPAA considerations are documented separately

Feel free to reach out if you have questions or want to discuss the implementation choices!