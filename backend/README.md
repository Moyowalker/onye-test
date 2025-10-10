# Backend

## Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload
```

## Endpoints

- `POST /query` - Natural language query endpoint
- `GET /api/health` - Health check

API docs at http://localhost:8000/docs