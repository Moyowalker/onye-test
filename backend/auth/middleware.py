"""
JWT Authentication Middleware for SMART on FHIR

This module handles the heavy lifting of OAuth 2.0 token validation.
I'm following the standard JWT validation flow:
1. Extract Bearer token from Authorization header
2. Validate JWT signature against Auth0's JWKS 
3. Check standard claims (exp, iss, aud)
4. Extract user info and scopes for authorization

The tricky part with healthcare apps is that tokens need to be validated
against the identity provider's public keys, which can rotate.
"""

import jwt
import requests
from datetime import datetime, timezone
from typing import Optional, Dict, List
from functools import lru_cache
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
import json

# Ensure environment variables from backend/.env are loaded even when uvicorn
# wasn't started with an --env-file flag. We load from CWD and also try the
# backend folder relative to this file for robustness.
load_dotenv()  # current working directory
_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=_env_path, override=False)
AUTH_DEBUG = os.getenv("AUTH_DEBUG", "false").lower() == "true"

# I'm using dependency injection pattern here - FastAPI's way of handling auth
security = HTTPBearer()

class JWTValidator:
    """
    Handles JWT validation for Auth0 tokens
    
    This class manages the JWKS (JSON Web Key Set) from Auth0 and validates
    incoming JWTs. I'm caching the JWKS to avoid hitting Auth0 on every request.
    """
    
    def __init__(self, domain: str, audience: str):
        self.domain = domain
        self.audience = audience
        # Remove https:// if present - we'll add it back
        if isinstance(self.domain, str) and self.domain.startswith('https://'):
            self.domain = self.domain[8:]
        # Only construct URLs when we have a domain
        if self.domain:
            self.jwks_url = f"https://{self.domain}/.well-known/jwks.json"
            self.issuer = f"https://{self.domain}/"
        else:
            self.jwks_url = None
            self.issuer = None
    
    @lru_cache(maxsize=1)
    def get_jwks(self) -> Dict:
        """
        Fetch the JSON Web Key Set from Auth0
        
        I'm caching this because:
        1. JWKS doesn't change often (only during key rotation)
        2. We don't want to hit Auth0 on every request
        3. It's expensive to fetch over the network
        
        In production, I'd add TTL and refresh logic for key rotation
        """
        # Ensure configuration is present
        if not self.jwks_url:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Auth configuration error: AUTH0_DOMAIN is not set. "
                    "Please set AUTH0_DOMAIN (e.g. dev-xyz.us.auth0.com) in backend/.env or environment."
                ),
            )
        try:
            response = requests.get(self.jwks_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            # If we can't get JWKS, we can't validate any tokens
            # This is a hard failure - better to be secure than sorry
            raise HTTPException(
                status_code=503,
                detail=f"Unable to fetch JWKS from identity provider: {str(e)}"
            )
    
    def get_signing_key(self, token_header: Dict) -> str:
        """
        Find the right public key for this token
        
        JWTs specify which key was used to sign them in the 'kid' header.
        We need to find that key in the JWKS to verify the signature.
        """
        if 'kid' not in token_header:
            raise HTTPException(
                status_code=401,
                detail="Token missing key ID (kid) - invalid JWT format"
            )
        
        jwks = self.get_jwks()
        
        # Find the key that matches this token's key ID
        for key in jwks.get('keys', []):
            if key['kid'] == token_header['kid']:
                # Convert the JWK to PEM format for PyJWT
                return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
        
        # If we get here, the token was signed with a key we don't know about
        # This could mean key rotation happened, or it's a malicious token
        raise HTTPException(
            status_code=401,
            detail="Unable to find appropriate signing key for token"
        )
    
    def validate_token(self, token: str) -> Dict:
        """
        The main event - validate a JWT token completely
        
        This does all the standard JWT validation:
        - Signature verification (cryptographically secure)
        - Expiry check (tokens don't live forever)
        - Issuer check (make sure it came from Auth0)
        - Audience check (make sure it's for our API)
        """
        # Validate configuration before proceeding
        if not self.issuer:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Auth configuration error: AUTH0_DOMAIN is missing; cannot construct issuer/JWKS URL."
                ),
            )
        if not self.audience:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Auth configuration error: AUTH0_AUDIENCE is not set. "
                    "Configure it to the API Identifier from Auth0 (e.g. https://your-api)."
                ),
            )
        try:
            # First, decode the header without verification to get the key ID
            # This is safe because we're not trusting the payload yet
            unverified_header = jwt.get_unverified_header(token)
            
            # Get the public key for signature verification
            signing_key = self.get_signing_key(unverified_header)
            
            # Now decode and verify everything
            # This will raise an exception if anything is wrong
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=['RS256'],  # Auth0 uses RS256
                audience=self.audience,
                issuer=self.issuer,
                # Adding some leeway for clock skew between servers
                leeway=30  # 30 seconds tolerance
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            # Token is expired - user needs to refresh or login again
            raise HTTPException(
                status_code=401,
                detail="Token has expired - please login again"
            )
        except jwt.InvalidAudienceError:
            # Token is for a different API - possible attack
            raise HTTPException(
                status_code=401,
                detail="Token audience mismatch - invalid token"
            )
        except jwt.InvalidIssuerError:
            # Token didn't come from our Auth0 domain - definitely suspicious
            raise HTTPException(
                status_code=401,
                detail="Token issuer mismatch - invalid token"
            )
        except jwt.InvalidSignatureError:
            # Signature doesn't match - token has been tampered with
            raise HTTPException(
                status_code=401,
                detail="Invalid token signature - token has been modified"
            )
        except jwt.DecodeError:
            # Token is malformed
            raise HTTPException(
                status_code=401,
                detail="Invalid token format - malformed JWT"
            )
        except Exception as e:
            # Catch-all for any other JWT validation errors
            raise HTTPException(
                status_code=401,
                detail=f"Token validation failed: {str(e)}"
            )

# Global validator instance - initialized from environment variables
# I'm using environment variables so this works in different environments
def _derive_domain_from_env() -> str:
    """Return Auth0 domain from AUTH0_DOMAIN or parse from AUTH0_ISSUER."""
    domain = os.getenv('AUTH0_DOMAIN', '') or ''
    if not domain:
        issuer = os.getenv('AUTH0_ISSUER', '') or ''
        if issuer:
            # Accept values like https://tenant.auth0.com/ and strip scheme and trailing slash
            if issuer.startswith('https://'):
                issuer = issuer[len('https://'):]
            domain = issuer.rstrip('/')
    return domain

jwt_validator = JWTValidator(
    domain=_derive_domain_from_env(),
    audience=os.getenv('AUTH0_AUDIENCE', '')
)

if AUTH_DEBUG:
    # Lightweight debug to confirm we constructed the correct issuer and JWKS URL
    try:
        dbg_domain = jwt_validator.domain or "<empty>"
        dbg_aud = jwt_validator.audience or "<empty>"
        print(f"[AUTH DEBUG] AUTH0_DOMAIN={dbg_domain} AUTH0_AUDIENCE={dbg_aud}")
        print(f"[AUTH DEBUG] Issuer={jwt_validator.issuer} JWKS={jwt_validator.jwks_url}")
    except Exception as _:
        pass

def extract_bearer_token(request: Request) -> Optional[str]:
    """
    Extract the Bearer token from Authorization header
    
    This handles the standard OAuth 2.0 Bearer token format:
    Authorization: Bearer <token>
    """
    authorization = request.headers.get('Authorization')
    if not authorization:
        return None
    
    # Check if it's a Bearer token
    if not authorization.startswith('Bearer '):
        return None
    
    # Extract just the token part
    return authorization[7:]  # Remove "Bearer " prefix

async def validate_jwt_token(request: Request) -> Dict:
    """
    FastAPI dependency for JWT validation
    
    This can be used with FastAPI's Depends() to protect endpoints.
    It extracts and validates the JWT, returning the user claims.
    """
    token = extract_bearer_token(request)
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header with Bearer token"
        )
    
    # Validate the token and return the claims
    return jwt_validator.validate_token(token)