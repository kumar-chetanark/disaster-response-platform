import math
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.incident import Incident

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def token_similarity(str1: str, str2: str) -> float:
    """Calculates Jaccard word-token similarity between two text strings."""
    if not str1 or not str2:
        return 0.0
    tokens1 = set(str1.lower().replace("-", " ").replace("/", " ").replace(",", " ").split())
    tokens2 = set(str2.lower().replace("-", " ").replace("/", " ").replace(",", " ").split())
    
    # Remove common stop words
    stopwords = {"and", "the", "in", "at", "near", "on", "of", "a", "an", "sector", "zone", "road", "street"}
    t1 = tokens1 - stopwords
    t2 = tokens2 - stopwords
    
    if not t1 or not t2:
        return 0.0
    
    intersection = t1.intersection(t2)
    union = t1.union(t2)
    return len(intersection) / len(union) if union else 0.0

def find_matching_incident(
    db: Session,
    disaster_type: str,
    location_name: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    proximity_threshold_km: float = 15.0,
    text_similarity_threshold: float = 0.35,
) -> Optional[Incident]:
    """
    Deterministic rule-based incident matching & deduplication engine.
    Matches against active/monitoring incidents based on:
    1. Disaster type matching
    2. GPS proximity (<15km) if coordinates provided
    3. Location name token overlap (e.g. 'Sector 7G', 'Highway 4', 'Causeway')
    """
    normalized_disaster = disaster_type.strip().lower()
    
    # Query active/monitoring incidents
    active_incidents: List[Incident] = (
        db.query(Incident)
        .filter(Incident.status.in_(["PENDING", "ACTIVE", "MONITORING"]))
        .all()
    )

    for inc in active_incidents:
        inc_disaster = inc.disaster_type.lower()
        
        # 1. Type compatibility check
        type_match = (
            normalized_disaster in inc_disaster or
            inc_disaster in normalized_disaster or
            (normalized_disaster == "flood" and "cyclone" in inc_disaster) or
            (normalized_disaster == "cyclone" and "flood" in inc_disaster)
        )
        
        if not type_match:
            continue

        # 2. GPS coordinate proximity check (if both have lat/lon)
        if latitude is not None and longitude is not None and inc.latitude is not None and inc.longitude is not None:
            dist = haversine_distance_km(latitude, longitude, inc.latitude, inc.longitude)
            if dist <= proximity_threshold_km:
                return inc

        # 3. Location name token overlap check
        sim = token_similarity(location_name, inc.location_name)
        if sim >= text_similarity_threshold:
            return inc
            
        # Check sector overlap if available
        if inc.sector and inc.sector.lower() in location_name.lower():
            return inc

        # Sub-string match on notable identifiers
        loc_clean = location_name.lower()
        inc_loc_clean = inc.location_name.lower()
        
        for keyword in ["sector 7g", "highway 4", "causeway", "levee", "ridge", "riverfront"]:
            if keyword in loc_clean and keyword in inc_loc_clean:
                return inc

    return None
