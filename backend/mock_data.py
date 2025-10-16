from datetime import datetime, timedelta
import random

def calculate_age(birth_date_str: str) -> int:
    """Calculate age from birth date"""
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
    today = datetime.now()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    return age

def filter_by_age(patients: list, age_filter: dict) -> list:
    """Filter patients by age criteria"""
    if not age_filter:
        return patients
    
    filtered = []
    for patient in patients:
        age = calculate_age(patient["birthDate"])
        
        if age_filter["operator"] == "gt":
            if age > age_filter["value"]:
                filtered.append(patient)
        elif age_filter["operator"] == "lt":
            if age < age_filter["value"]:
                filtered.append(patient)
        elif age_filter["operator"] == "eq":
            if age == age_filter["value"]:
                filtered.append(patient)
        elif age_filter["operator"] == "range":
            if age_filter["min"] <= age <= age_filter["max"]:
                filtered.append(patient)
    
    return filtered

def filter_by_condition(data: list, conditions: list) -> list:
    """Filter data by medical conditions"""
    if not conditions:
        return data
    
    filtered = []
    for item in data:
        display = item.get("display", "").lower()
        if any(condition.lower() in display for condition in conditions):
            filtered.append(item)
    
    return filtered

def get_mock_data(processed_query: dict, user_context: dict = None):
    """
    Return FHIR-formatted data based on processed query with entity filtering
    
    Now with user context! This lets me filter data based on the user's
    SMART on FHIR permissions and patient context.
    """
    intent = processed_query.get("intent", "unknown")
    entities = processed_query.get("entities", {})
    age_filter = entities.get("age_filter")
    conditions = entities.get("conditions", [])
    
    # Get user context for authorization filtering
    # In a real FHIR server, this would constrain database queries
    user_role = user_context.get("role", "unknown") if user_context else "unknown"
    patient_filter = user_context.get("filter_patient") if user_context else None
    
    if intent == "patient_search":
        patients = generate_mock_patients()
        
        # Apply user-context filtering first (SMART on FHIR security)
        if patient_filter:
            # Patient-scoped access - only return specific patient
            patients = [p for p in patients if p.get("id") == patient_filter]
        
        if age_filter:
            patients = filter_by_age(patients, age_filter)
        return to_fhir_bundle(patients, "Patient")
    
    elif intent == "condition_search":
        condition_data = generate_mock_conditions()
        
        # Apply user-context filtering first (SMART on FHIR security)
        if patient_filter:
            # Patient-scoped access - only return conditions for specific patient
            condition_data = [c for c in condition_data if c.get("patient_id") == patient_filter]
        
        if conditions:
            condition_data = filter_by_condition(condition_data, conditions)
        return to_fhir_bundle(condition_data, "Condition")
    
    elif intent == "medication_search":
        medications = generate_mock_medications()
        
        # Apply user-context filtering first (SMART on FHIR security)
        if patient_filter:
            # Patient-scoped access - only return medications for specific patient
            medications = [m for m in medications if m.get("patient_id") == patient_filter]
            
        return to_fhir_bundle(medications, "MedicationRequest")
    
    elif intent == "observation_search":
        observations = generate_mock_observations()
        
        # Apply user-context filtering first (SMART on FHIR security)
        if patient_filter:
            # Patient-scoped access - only return observations for specific patient
            observations = [o for o in observations if o.get("patient_id") == patient_filter]
            
        return to_fhir_bundle(observations, "Observation")
    
    else:
        return {
            "resourceType": "OperationOutcome",
            "issue": [{
                "severity": "information",
                "code": "not-found",
                "diagnostics": "No data available for this query"
            }]
        }

def to_fhir_bundle(resources: list, resource_type: str) -> dict:
    """Convert resources to FHIR Bundle format"""
    entries = []
    
    for resource in resources:
        if resource_type == "Patient":
            fhir_resource = {
                "resourceType": "Patient",
                "id": resource["id"],
                "name": [{
                    "use": "official",
                    "text": resource["name"]
                }],
                "gender": resource["gender"],
                "birthDate": resource["birthDate"],
                "extension": [{
                    "url": "http://hl7.org/fhir/StructureDefinition/patient-age",
                    "valueInteger": resource["age"]
                }]
            }
        elif resource_type == "Condition":
            fhir_resource = {
                "resourceType": "Condition",
                "id": resource["id"],
                "subject": {
                    "reference": f"Patient/{resource['patient']}",
                    "display": resource["patientName"]
                },
                "code": {
                    "coding": [{
                        "system": "http://snomed.info/sct",
                        "code": resource["code"],
                        "display": resource["display"]
                    }]
                },
                "onsetDateTime": resource["onsetDate"]
            }
        elif resource_type == "MedicationRequest":
            fhir_resource = {
                "resourceType": "MedicationRequest",
                "id": resource["id"],
                "subject": {
                    "reference": f"Patient/{resource['patient']}"
                },
                "medicationCodeableConcept": {
                    "text": resource["medication"]
                },
                "dosageInstruction": [{
                    "text": f"{resource['dosage']} {resource['frequency']}"
                }]
            }
        elif resource_type == "Observation":
            fhir_resource = {
                "resourceType": "Observation",
                "id": resource["id"],
                "status": "final",
                "subject": {
                    "reference": f"Patient/{resource['patient']}"
                },
                "code": {
                    "text": resource["type"]
                },
                "valueQuantity": {
                    "value": resource["value"],
                    "unit": resource["unit"]
                },
                "effectiveDateTime": resource["date"]
            }
        else:
            fhir_resource = resource
        
        entries.append({
            "fullUrl": f"http://example.com/fhir/{resource_type}/{resource.get('id', 'unknown')}",
            "resource": fhir_resource
        })
    
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(entries),
        "entry": entries
    }

def generate_mock_patients():
    return [
        {
            "id": "P001",
            "name": "Moloski Ajayi",
            "birthDate": "1985-03-15",
            "gender": "male",
            "age": calculate_age("1985-03-15")
        },
        {
            "id": "P002",
            "name": "Dipo Ajayi",
            "birthDate": "1990-07-22",
            "gender": "female",
            "age": calculate_age("1990-07-22")
        },
        {
            "id": "P003",
            "name": "Bob Johnson",
            "birthDate": "1978-11-30",
            "gender": "male",
            "age": calculate_age("1978-11-30")
        },
        {
            "id": "P004",
            "name": "Mary Williams",
            "birthDate": "1965-05-12",
            "gender": "female",
            "age": calculate_age("1965-05-12")
        },
        {
            "id": "P005",
            "name": "James Brown",
            "birthDate": "1955-09-20",
            "gender": "male",
            "age": calculate_age("1955-09-20")
        },
        {
            "id": "P006",
            "name": "Sarah Davis",
            "birthDate": "2000-02-14",
            "gender": "female",
            "age": calculate_age("2000-02-14")
        }
    ]

def generate_mock_conditions():
    return [
        {
            "id": "C001",
            "patient": "P001",
            "patientName": "Moloski Ajayi",
            "code": "38341003",
            "display": "Hypertension",
            "onsetDate": "2020-01-15"
        },
        {
            "id": "C002",
            "patient": "P002",
            "patientName": "Dipo Ajayi",
            "code": "73211009",
            "display": "Diabetes mellitus",
            "onsetDate": "2019-06-10"
        },
        {
            "id": "C003",
            "patient": "P004",
            "patientName": "Mary Williams",
            "code": "73211009",
            "display": "Diabetes mellitus",
            "onsetDate": "2015-03-22"
        },
        {
            "id": "C004",
            "patient": "P005",
            "patientName": "James Brown",
            "code": "38341003",
            "display": "Hypertension",
            "onsetDate": "2010-07-18"
        },
        {
            "id": "C005",
            "patient": "P005",
            "patientName": "James Brown",
            "code": "195967001",
            "display": "Asthma",
            "onsetDate": "2008-11-05"
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
