# Backend - FastAPI + NLP# Backend



This is the backend service that handles natural language query processing and FHIR data retrieval.## Setup



## Running Locally```bash

python -m venv venv

```bashsource venv/bin/activate  # Windows: venv\Scripts\activate

# Create virtual environmentpip install -r requirements.txt

python -m venv venv```

source venv/bin/activate  # Windows: venv\Scripts\activate

## Run

# Install dependencies

pip install -r requirements.txt```bash

uvicorn main:app --reload

# Download spaCy language model```

python -m spacy download en_core_web_sm

## Endpoints

# Run the server

uvicorn main:app --reload- `POST /query` - Natural language query endpoint

```- `GET /api/health` - Health check



Server starts at http://localhost:8000API docs at http://localhost:8000/docs

API docs available at:
- Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## What's Inside

**main.py** - FastAPI app with CORS setup and query endpoint
**nlp.py** - Natural language processing logic using spaCy
**mock_data.py** - FHIR-compliant mock patient and condition data

## How It Works

When you send a query like "show patients with diabetes", the NLP module:
1. Tokenizes and analyzes the text with spaCy
2. Extracts intent (patient search vs condition search)
3. Pulls out entities (age numbers, condition names, gender)
4. Returns structured data for filtering

The mock data generator creates FHIR R4 compliant resources. In production, I can swap this out for actual FHIR server calls.

## What I'd Add Next

- **Better entity extraction**: Right now I'm doing pattern matching for conditions. Could train a custom NER model on medical entities
- **Query expansion**: Handle synonyms (e.g., "diabetes" = "diabetes mellitus")
- **Caching**: Memoize NLP results for repeated queries
- **Real FHIR server**: Connect to HAPI FHIR or Azure FHIR API
- **Tests**: Unit tests for the NLP parser, integration tests for endpoints

## Dependencies

- FastAPI - web framework
- spaCy - NLP engine
- uvicorn - ASGI server
- pydantic - data validation

Pretty lightweight setup. No database needed since I am using mock data for now.
