"""
FHIR Repository Abstractions

This module lets me swap where FHIR data comes from:
- Mock repository (existing fake data)
- HAPI FHIR (public demo server)

I keep a tiny interface so the rest of the app doesn't care which source we use.
"""

from typing import Dict, Optional
from datetime import datetime, timedelta
import os
import requests

# Basic config via env
FHIR_SERVER_TYPE = os.getenv("FHIR_SERVER_TYPE", "mock").lower()  # mock | hapi
FHIR_BASE_URL = os.getenv("FHIR_BASE_URL", "https://hapi.fhir.org/baseR4").rstrip("/")
FHIR_TIMEOUT = int(os.getenv("FHIR_TIMEOUT_MS", "10000")) / 1000.0

def compute_birthdate_filter_from_age(age_filter: Optional[Dict]) -> Optional[str]:
    """Translate an age filter into a FHIR birthDate search expression.
    Examples:
      gt 50 => birthdate=ltYYYY-MM-DD
      lt 30 => birthdate=gtYYYY-MM-DD
      eq 40 => birthdate=geYYYY-MM-DD & leYYYY-MM-DD (40th birthday range)
      range 30..50 => birthdate between computed dates
    """
    if not age_filter:
        return None

    today = datetime.utcnow().date()
    op = age_filter.get("operator")

    def date_for_years(years: int):
        # Approximate by subtracting years; good enough for demo
        try:
            return today.replace(year=today.year - years)
        except ValueError:
            # Handle Feb 29 etc.
            return today.replace(month=2, day=28, year=today.year - years)

    if op == "gt":
        # older than N => born before (today - N years)
        d = date_for_years(int(age_filter["value"]))
        return f"birthdate=lt{d.isoformat()}"
    if op == "lt":
        # younger than N => born after (today - N years)
        d = date_for_years(int(age_filter["value"]))
        return f"birthdate=gt{d.isoformat()}"
    if op == "eq":
        # around exact age: between birthday last year and next year (simple window)
        years = int(age_filter["value"]) 
        d = date_for_years(years)
        return f"birthdate=ge{d.isoformat()}&birthdate=le{d.isoformat()}"
    if op == "range":
        mn = date_for_years(int(age_filter["min"]))
        mx = date_for_years(int(age_filter["max"]))
        # age range A..B ≈ birthdate between (today-B) and (today-A)
        lower = mx.isoformat()
        upper = mn.isoformat()
        return f"birthdate=ge{lower}&birthdate=le{upper}"
    return None


class FhirRepository:
    """Interface for FHIR data sources."""

    def search(self, processed_query: Dict, user_context: Optional[Dict] = None) -> Dict:
        raise NotImplementedError


class MockRepository(FhirRepository):
    def __init__(self):
        import mock_data  # import from backend working directory
        self._mock = mock_data

    def search(self, processed_query: Dict, user_context: Optional[Dict] = None) -> Dict:
        return self._mock.get_mock_data(processed_query, user_context=user_context or {})


class HapiFhirRepository(FhirRepository):
    """Very small HAPI FHIR client using REST search.

    It converts our NLP output into FHIR search parameters and calls the public
    HAPI server. It's read-only and perfect for demos.
    """

    def __init__(self, base_url: str, timeout: float):
        self.base = base_url.rstrip("/")
        self.timeout = timeout

    def _get(self, path: str, params: Optional[Dict] = None) -> Dict:
        url = f"{self.base}/{path.lstrip('/')}"
        resp = requests.get(url, params=params or {}, timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()

    def _patient_search(self, entities: Dict) -> Dict:
        age_filter = entities.get("age_filter")
        params: Dict[str, str] = {}

        # Age -> birthdate filter
        birthdate_q = compute_birthdate_filter_from_age(age_filter)
        if birthdate_q:
            # birthdate_q can contain multiple birthdate params joined with &
            for part in birthdate_q.split("&"):
                k, v = part.split("=", 1)
                params[k] = v

        # Simple name search from NLP persons if any
        persons = (entities.get("spacy") or {}).get("persons") or []
        if persons:
            params["name"] = persons[0]

        return self._get("Patient", params)

    def _condition_search(self, entities: Dict) -> Dict:
        params: Dict[str, str] = {}
        conditions = entities.get("conditions") or []
        # Minimal demo: use text search on condition display if no codes
        if conditions:
            params["_text"] = conditions[0]
        return self._get("Condition", params)

    def _observation_search(self, entities: Dict) -> Dict:
        params: Dict[str, str] = {"category": "vital-signs"}
        return self._get("Observation", params)

    def search(self, processed_query: Dict, user_context: Optional[Dict] = None) -> Dict:
        intent = processed_query.get("intent", "general_search")
        entities = (processed_query.get("entities") or {})

        if intent == "patient_search":
            return self._patient_search(entities)
        if intent == "condition_search":
            return self._condition_search(entities)
        if intent == "observation_search":
            return self._observation_search(entities)

        # Fallback: server capability statement to show connectivity
        return self._get("metadata")


def build_repository(repo_type: str) -> FhirRepository:
    t = (repo_type or "").lower()
    if t == "hapi":
        return HapiFhirRepository(FHIR_BASE_URL, FHIR_TIMEOUT)
    return MockRepository()


def get_repository() -> FhirRepository:
    return build_repository(FHIR_SERVER_TYPE)
