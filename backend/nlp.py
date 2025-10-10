import spacy
import re
from typing import Dict, List, Optional

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spaCy model...")
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

# Medical condition keywords
CONDITION_KEYWORDS = {
    "diabetes": ["diabetes", "diabetic"],
    "hypertension": ["hypertension", "high blood pressure", "hbp"],
    "asthma": ["asthma", "asthmatic"],
    "copd": ["copd", "chronic obstructive"],
    "heart disease": ["heart disease", "cardiac", "cardiovascular"],
    "cancer": ["cancer", "tumor", "malignancy"],
    "arthritis": ["arthritis", "joint pain"]
}

def extract_age_filter(text: str) -> Optional[Dict]:
    """Extract age filters from query"""
    age_patterns = [
        (r'over (\d+)', 'gt'),
        (r'above (\d+)', 'gt'),
        (r'older than (\d+)', 'gt'),
        (r'under (\d+)', 'lt'),
        (r'below (\d+)', 'lt'),
        (r'younger than (\d+)', 'lt'),
        (r'(\d+) to (\d+)', 'range'),
        (r'between (\d+) and (\d+)', 'range'),
        (r'age (\d+)', 'eq')
    ]
    
    for pattern, operator in age_patterns:
        match = re.search(pattern, text.lower())
        if match:
            if operator == 'range':
                return {
                    "operator": "range",
                    "min": int(match.group(1)),
                    "max": int(match.group(2))
                }
            else:
                return {
                    "operator": operator,
                    "value": int(match.group(1))
                }
    return None

def extract_conditions(text: str) -> List[str]:
    """Extract medical conditions from query"""
    text_lower = text.lower()
    found_conditions = []
    
    for condition, keywords in CONDITION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                found_conditions.append(condition)
                break
    
    return found_conditions

def extract_entities_spacy(text: str) -> Dict:
    """Use spaCy to extract entities"""
    doc = nlp(text)
    
    entities = {
        "persons": [],
        "dates": [],
        "numbers": [],
        "orgs": []
    }
    
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            entities["persons"].append(ent.text)
        elif ent.label_ == "DATE":
            entities["dates"].append(ent.text)
        elif ent.label_ in ["CARDINAL", "QUANTITY"]:
            entities["numbers"].append(ent.text)
        elif ent.label_ == "ORG":
            entities["orgs"].append(ent.text)
    
    return entities

def detect_intent(text: str) -> str:
    """Detect query intent"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ["patient", "person", "people"]):
        return "patient_search"
    elif any(word in text_lower for word in ["condition", "diagnosis", "disease", "illness"]):
        return "condition_search"
    elif any(word in text_lower for word in ["medication", "medicine", "drug", "prescription"]):
        return "medication_search"
    elif any(word in text_lower for word in ["observation", "vital", "measurement", "test"]):
        return "observation_search"
    
    return "general_search"

def process_query(query: str) -> dict:
    """
    Process natural language query using spaCy and extract entities
    """
    # Extract entities using spaCy
    spacy_entities = extract_entities_spacy(query)
    
    # Extract age filter
    age_filter = extract_age_filter(query)
    
    # Extract conditions
    conditions = extract_conditions(query)
    
    # Detect intent
    intent = detect_intent(query)
    
    return {
        "intent": intent,
        "entities": {
            "spacy": spacy_entities,
            "age_filter": age_filter,
            "conditions": conditions
        },
        "original_query": query
    }
