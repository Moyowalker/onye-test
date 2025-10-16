import os
from dotenv import load_dotenv
load_dotenv()  # Load from CWD if present
_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(dotenv_path=_env_path, override=False)

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nlp import process_query
from fhir_repository import get_repository, build_repository
from auth.middleware import validate_jwt_token
from auth.models import AuthenticatedUser
from auth.scopes import check_required_scopes, PATIENT_READ_SCOPES, USER_READ_SCOPES

app = FastAPI(
    title="AI on FHIR API",
    description="Natural language query interface for FHIR data with SMART on FHIR authentication",
    version="1.0.0"
)

repo = get_repository()

# CORS setup - now including credentials for auth tokens
# I need to allow credentials because we're using Bearer tokens
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,  # This is crucial for Bearer token auth
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
async def root():
    return {"message": "AI on FHIR API"}

@app.get("/api/health")
async def health():
    try:
        # Report which repo is active and the base URL if HAPI
        repo_name = type(repo).__name__
        info = {"status": "ok", "data_source": repo_name}
        if repo_name == "HapiFhirRepository":
            # getattr for safety in case attributes are missing
            info["fhir_base_url"] = getattr(repo, "base", None)
        return info
    except Exception:
        return {"status": "ok", "data_source": "unknown"}


@app.post("/api/toggle-data-source")
async def toggle_data_source(mode: str):
    """
    Switch the backend data source at runtime.
    mode: "mock" | "hapi"
    """
    global repo
    repo = build_repository(mode)
    return {"status": "ok", "data_source": type(repo).__name__}

@app.get("/api/user")
async def get_user_info(jwt_claims: dict = Depends(validate_jwt_token)):
    """
    Get current user information and their SMART permissions
    
    This endpoint lets the frontend know who's logged in and what
    they're authorized to access. Useful for debugging and UI.
    """
    user = AuthenticatedUser.from_jwt_claims(jwt_claims)
    return {
        "user": user.to_response_dict(),
        "permissions": {
            "can_read_patients": user.can_access_resource("Patient"),
            "can_read_conditions": user.can_access_resource("Condition"),
            "scopes": user.scopes
        }
    }

@app.post("/query")
async def query_endpoint(
    request: QueryRequest,
    jwt_claims: dict = Depends(validate_jwt_token),
    source: str | None = None,
):
    """
    Process natural language query and return filtered FHIR data
    
    NOW WITH AUTHENTICATION! 🔒
    
    This endpoint now requires a valid JWT token with appropriate SMART scopes.
    I'm checking for either patient/*.read or user/*.read permissions.
    """
    try:
        # Create user object from JWT claims
        user = AuthenticatedUser.from_jwt_claims(jwt_claims)
        
        # Check if user has required SMART scopes for FHIR data access
        # They need either patient-level or user-level read access
        required_scopes = PATIENT_READ_SCOPES + USER_READ_SCOPES  # Either one is fine
        has_patient_access = check_required_scopes(user.scopes, PATIENT_READ_SCOPES)
        has_user_access = check_required_scopes(user.scopes, USER_READ_SCOPES)
        
        if not (has_patient_access or has_user_access):
            # User doesn't have the right SMART scopes
            raise HTTPException(
                status_code=403,
                detail="Insufficient SMART on FHIR permissions. Required: patient/*.read or user/*.read scope"
            )
        
        # Parse the natural language query
        processed = process_query(request.query)
        
        # Optionally switch source per-request via querystring ?source=hapi|mock
        active_repo = repo if not source else build_repository(source)
        # Fetch FHIR data from the selected repository (mock or HAPI)
        fhir_data = active_repo.search(processed, user_context=user.get_data_filter_context())
        
        # Return structured response with user context
        return {
            "query": request.query,
            "user_context": {
                "user_id": user.user_id,
                "role": user.role.value,
                "scopes": [s for s in user.scopes if 'read' in s]  # Only show relevant scopes
            },
            "nlp_analysis": {
                "intent": processed.get("intent"),
                "entities": processed.get("entities"),
            },
            "fhir_response": fhir_data
        }
    except HTTPException:
        # Re-raise HTTP exceptions (like auth errors)
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)