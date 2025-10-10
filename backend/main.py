from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nlp import process_query
from mock_data import get_mock_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
async def root():
    return {"message": "AI on FHIR API"}

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/query")
async def query_endpoint(request: QueryRequest):
    try:
        processed = process_query(request.query)
        data = get_mock_data(processed)
        return {
            "query": request.query,
            "processed": processed,
            "results": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)