def process_query(query: str) -> dict:
    """
    Process natural language query and extract intent/entities
    """
    query_lower = query.lower()
    
    # Basic intent detection
    intent = "unknown"
    entities = {}
    
    if "patient" in query_lower:
        intent = "patient_search"
        if "name" in query_lower:
            entities["search_type"] = "name"
        elif "id" in query_lower:
            entities["search_type"] = "id"
    
    elif "condition" in query_lower or "diagnosis" in query_lower:
        intent = "condition_search"
    
    elif "medication" in query_lower or "prescription" in query_lower:
        intent = "medication_search"
    
    elif "observation" in query_lower or "vital" in query_lower:
        intent = "observation_search"
    
    return {
        "intent": intent,
        "entities": entities,
        "original_query": query
    }
