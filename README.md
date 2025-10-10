# Project Setup

## Running the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on http://localhost:8000

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## Notes

- Backend uses FastAPI
- Frontend uses Next.js with TypeScript
- CORS is configured to allow frontend requests