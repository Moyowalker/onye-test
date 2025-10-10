from datetime import datetime, timedelta
import random

def get_mock_data(processed_query: dict):
    """
    Return mock FHIR-like data based on processed query
    """
    intent = processed_query.get("intent", "unknown")
    
    if intent == "patient_search":
        return generate_mock_patients()
    elif intent == "condition_search":
        return generate_mock_conditions()
    elif intent == "medication_search":
        return generate_mock_medications()
    elif intent == "observation_search":
        return generate_mock_observations()
    else:
        return {"message": "No data available for this query"}

def generate_mock_patients():
    return [
        {
            "id": "P001",
            "name": "John Doe",
            "birthDate": "1985-03-15",
            "gender": "male"
        },
        {
            "id": "P002",
            "name": "Jane Smith",
            "birthDate": "1990-07-22",
            "gender": "female"
        },
        {
            "id": "P003",
            "name": "Bob Johnson",
            "birthDate": "1978-11-30",
            "gender": "male"
        }
    ]

def generate_mock_conditions():
    return [
        {
            "id": "C001",
            "patient": "P001",
            "code": "38341003",
            "display": "Hypertension",
            "onsetDate": "2020-01-15"
        },
        {
            "id": "C002",
            "patient": "P002",
            "code": "73211009",
            "display": "Diabetes mellitus",
            "onsetDate": "2019-06-10"
        }
    ]

def generate_mock_medications():
    return [
        {
            "id": "M001",
            "patient": "P001",
            "medication": "Lisinopril",
            "dosage": "10mg",
            "frequency": "Once daily"
        },
        {
            "id": "M002",
            "patient": "P002",
            "medication": "Metformin",
            "dosage": "500mg",
            "frequency": "Twice daily"
        }
    ]

def generate_mock_observations():
    base_date = datetime.now()
    return [
        {
            "id": f"O{str(i).zfill(3)}",
            "patient": "P001",
            "type": "Blood Pressure",
            "value": f"{random.randint(110, 140)}/{random.randint(70, 90)}",
            "unit": "mmHg",
            "date": (base_date - timedelta(days=i*7)).strftime("%Y-%m-%d")
        }
        for i in range(5)
    ]
