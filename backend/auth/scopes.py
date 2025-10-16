"""
SMART on FHIR Scope Validation

This module handles the healthcare-specific authorization logic.
SMART on FHIR defines standard scopes for healthcare applications:

- patient/*.read: Read access to patient-context data
- user/*.read: Read access for the authenticated user
- launch/patient: Patient context is provided
- system/*.read: System-level access (for backend services)

The key insight is that scopes determine WHAT you can access,
while the user context determines WHICH patients you can see.
"""

from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from enum import Enum

class SmartScope(Enum):
    """
    Standard SMART on FHIR scopes
    
    I'm defining these as an enum to avoid typos and make the code clearer.
    Each scope represents a different level of access to FHIR resources.
    """
    # Patient context scopes - most restrictive
    PATIENT_READ_ALL = "patient/*.read"
    PATIENT_READ_PATIENT = "patient/Patient.read"
    PATIENT_READ_CONDITION = "patient/Condition.read"
    PATIENT_READ_OBSERVATION = "patient/Observation.read"
    
    # User context scopes - broader access
    USER_READ_ALL = "user/*.read"
    USER_READ_PATIENT = "user/Patient.read"
    USER_READ_CONDITION = "user/Condition.read"
    
    # System scopes - backend services
    SYSTEM_READ_ALL = "system/*.read"
    
    # Launch context
    LAUNCH_PATIENT = "launch/patient"
    LAUNCH_ENCOUNTER = "launch/encounter"
    
    # OpenID Connect scopes
    OPENID = "openid"
    PROFILE = "profile"
    EMAIL = "email"
    FHIR_USER = "fhirUser"

class UserRole(Enum):
    """
    User roles mapped from SMART scopes
    
    I'm simplifying the complex world of healthcare roles into 
    a few categories that make sense for this demo.
    """
    PATIENT = "patient"        # Has patient/*.read scopes
    CLINICIAN = "clinician"    # Has user/*.read scopes
    SYSTEM = "system"          # Has system/*.read scopes
    UNKNOWN = "unknown"        # Doesn't fit our categories

def parse_smart_scopes(scope_string: Optional[str]) -> List[str]:
    """
    Parse space-separated scope string into list
    
    OAuth 2.0 scopes come as a space-separated string like:
    "openid profile patient/*.read user/Patient.read"
    
    I need to split this and clean it up for processing.
    """
    if not scope_string:
        return []
    
    # Split on spaces and filter out empty strings
    scopes = [scope.strip() for scope in scope_string.split(' ') if scope.strip()]
    return scopes

def determine_user_role(scopes: List[str]) -> UserRole:
    """
    Figure out what kind of user this is based on their scopes
    
    This is my business logic for mapping SMART scopes to roles.
    In a real app, you might get roles from the identity provider directly.
    """
    
    # Check for system scopes first (most privileged)
    if any(scope.startswith('system/') for scope in scopes):
        return UserRole.SYSTEM
    
    # Check for user scopes (clinician access)
    if any(scope.startswith('user/') for scope in scopes):
        return UserRole.CLINICIAN
    
    # Check for patient scopes (patient access)
    if any(scope.startswith('patient/') for scope in scopes):
        return UserRole.PATIENT
    
    return UserRole.UNKNOWN

def check_required_scopes(user_scopes: List[str], required_scopes: List[str]) -> bool:
    """
    Check if user has all required scopes
    
    This implements the "minimum necessary" principle for HIPAA.
    Users only get access to data they're authorized for.
    """
    
    for required_scope in required_scopes:
        if not has_scope(user_scopes, required_scope):
            return False
    
    return True

def has_scope(user_scopes: List[str], required_scope: str) -> bool:
    """
    Check if user has a specific scope (with wildcard support)
    
    SMART scopes support wildcards, so "patient/*.read" covers
    "patient/Patient.read", "patient/Condition.read", etc.
    
    This is where the magic happens for scope checking.
    """
    
    # Direct match
    if required_scope in user_scopes:
        return True
    
    # Check wildcard patterns
    # If user has "patient/*.read", they can access any patient resource
    for user_scope in user_scopes:
        if user_scope.endswith('*.read') and required_scope.startswith(user_scope[:-6]):
            return True
        if user_scope.endswith('*.*') and required_scope.startswith(user_scope[:-3]):
            return True
    
    return False

def validate_fhir_access(user_scopes: List[str], resource_type: str, operation: str = 'read') -> bool:
    """
    Validate access to a specific FHIR resource type
    
    This is the main authorization check for FHIR data access.
    I'm focusing on read operations for this demo.
    """
    
    # Build the required scope for this resource
    patient_scope = f"patient/{resource_type}.{operation}"
    user_scope = f"user/{resource_type}.{operation}"
    system_scope = f"system/{resource_type}.{operation}"
    
    # Check if user has any of the valid scopes
    valid_scopes = [patient_scope, user_scope, system_scope]
    
    return any(has_scope(user_scopes, scope) for scope in valid_scopes)

def require_scopes(required_scopes: List[str]):
    """
    Decorator for FastAPI endpoints to require specific scopes
    
    Usage:
    @require_scopes(["patient/*.read"])
    async def get_patients():
        ...
    
    This makes it easy to protect endpoints with SMART scopes.
    """
    def decorator(func):
        func._required_scopes = required_scopes
        return func
    return decorator

def get_accessible_resources(user_scopes: List[str]) -> Dict[str, List[str]]:
    """
    Return what FHIR resources this user can access
    
    This is useful for debugging and showing users their permissions.
    I'm only checking the main resource types for this demo.
    """
    
    resources = {
        'patient_context': [],
        'user_context': [],
        'system_context': []
    }
    
    fhir_resources = ['Patient', 'Condition', 'Observation', 'Encounter', 'Procedure']
    
    for resource in fhir_resources:
        # Check patient context access
        if has_scope(user_scopes, f"patient/{resource}.read"):
            resources['patient_context'].append(resource)
        
        # Check user context access  
        if has_scope(user_scopes, f"user/{resource}.read"):
            resources['user_context'].append(resource)
            
        # Check system context access
        if has_scope(user_scopes, f"system/{resource}.read"):
            resources['system_context'].append(resource)
    
    return resources

def create_scope_error_message(missing_scopes: List[str]) -> str:
    """
    Create a helpful error message for missing scopes
    
    Instead of just saying "access denied", I want to tell users
    exactly what permissions they need. This helps with troubleshooting.
    """
    
    if len(missing_scopes) == 1:
        return f"Missing required scope: {missing_scopes[0]}"
    else:
        return f"Missing required scopes: {', '.join(missing_scopes)}"

# Common scope combinations for easy reuse
PATIENT_READ_SCOPES = ["patient/*.read"]
USER_READ_SCOPES = ["user/*.read"] 
CLINICIAN_SCOPES = ["user/*.read", "launch/patient"]
SYSTEM_SCOPES = ["system/*.read"]