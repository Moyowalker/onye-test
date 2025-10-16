"""
Authentication Models

Pydantic models for handling authenticated user data.
These models structure the user information we extract from JWT tokens.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from auth.scopes import UserRole, determine_user_role, parse_smart_scopes

class AuthenticatedUser(BaseModel):
    """
    Represents an authenticated user with SMART on FHIR context
    
    This model captures everything we need to know about a user
    for authorization decisions. I'm using Pydantic because it
    gives us validation and easy JSON serialization.
    """
    
    # Basic user identity (from OpenID Connect)
    user_id: str = Field(..., description="Unique user identifier (sub claim)")
    email: Optional[str] = Field(None, description="User's email address")
    name: Optional[str] = Field(None, description="User's display name")
    
    # FHIR-specific identity
    fhir_user: Optional[str] = Field(None, description="FHIR User resource reference")
    
    # Authorization context
    scopes: List[str] = Field(default_factory=list, description="SMART on FHIR scopes")
    role: UserRole = Field(default=UserRole.UNKNOWN, description="Derived user role")
    
    # Patient context (if applicable)
    patient_id: Optional[str] = Field(None, description="Patient context for patient-scoped access")
    encounter_id: Optional[str] = Field(None, description="Encounter context")
    
    # Original JWT claims (for debugging)
    raw_claims: Dict[str, Any] = Field(default_factory=dict, description="Original JWT payload")
    
    @classmethod
    def from_jwt_claims(cls, claims: Dict[str, Any]) -> "AuthenticatedUser":
        """
        Create AuthenticatedUser from JWT token claims
        
        This is the main factory method for converting Auth0 JWT tokens
        into our internal user representation. I'm mapping the standard
        OpenID Connect claims to our model.
        """
        
        # Extract basic user info
        user_id = claims.get('sub', '')
        email = claims.get('email')
        name = claims.get('name')
        
        # Extract FHIR-specific claims
        fhir_user = claims.get('fhirUser')
        
        # Parse scopes from the token
        scope_string = claims.get('scope', '')
        scopes = parse_smart_scopes(scope_string)
        
        # Determine user role from scopes
        role = determine_user_role(scopes)
        
        # Extract patient context if present
        # This would come from a SMART launch sequence
        patient_id = claims.get('patient')
        encounter_id = claims.get('encounter')
        
        return cls(
            user_id=user_id,
            email=email,
            name=name,
            fhir_user=fhir_user,
            scopes=scopes,
            role=role,
            patient_id=patient_id,
            encounter_id=encounter_id,
            raw_claims=claims
        )
    
    def has_scope(self, required_scope: str) -> bool:
        """
        Check if this user has a specific scope
        
        Convenience method that wraps the scope checking logic.
        """
        from auth.scopes import has_scope
        return has_scope(self.scopes, required_scope)
    
    def can_access_resource(self, resource_type: str, operation: str = 'read') -> bool:
        """
        Check if user can access a FHIR resource type
        
        This is the main authorization check that endpoints will use.
        """
        from auth.scopes import validate_fhir_access
        return validate_fhir_access(self.scopes, resource_type, operation)
    
    def get_data_filter_context(self) -> Dict[str, Any]:
        """
        Get context for filtering data based on user permissions
        
        This returns information that can be used to filter FHIR
        queries based on the user's authorized scope of access.
        
        For example, if user has patient/*.read with patient_id="123",
        we should only return data for that patient.
        """
        context = {
            'role': self.role.value,
            'scopes': self.scopes,
            'patient_id': self.patient_id,
            'encounter_id': self.encounter_id
        }
        
        # Add scope-specific filters
        if self.role == UserRole.PATIENT and self.patient_id:
            # Patient users should only see their own data
            context['filter_patient'] = self.patient_id
        elif self.role == UserRole.CLINICIAN:
            # Clinicians might have broader access
            # In a real app, this would be based on their organization/department
            context['filter_organization'] = None  # No restriction for demo
        
        return context
    
    def to_response_dict(self) -> Dict[str, Any]:
        """
        Convert to a dictionary safe for API responses
        
        This strips out sensitive information and formats the user
        data for returning to the frontend.
        """
        return {
            'user_id': self.user_id,
            'email': self.email,
            'name': self.name,
            'role': self.role.value,
            'scopes': [scope for scope in self.scopes if 'read' in scope or 'fhir' in scope],
            'fhir_user': self.fhir_user,
            'patient_context': self.patient_id is not None
        }