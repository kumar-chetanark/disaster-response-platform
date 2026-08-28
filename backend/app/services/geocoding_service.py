import urllib.request
import json
import urllib.parse
from typing import Tuple, Optional

def geocode_location_with_ai(location_text: str) -> Tuple[Optional[float], Optional[float]]:
    """
    AI / Neural Location Resolver:
    Converts unstructured location strings (e.g. 'noida', 'kandwa varanasi', 'connaught place delhi')
    into accurate GPS latitude/longitude coordinates using OpenStreetMap Photon AI geocoding.
    """
    if not location_text or not location_text.strip():
        return None, None
    
    clean_query = location_text.strip()
    encoded = urllib.parse.quote(clean_query)
    url = f"https://photon.komoot.io/api/?q={encoded}&limit=1"
    
    try:
        req = urllib.request.Request(
            url, 
            headers={"User-Agent": "DisasterResponseAIPlatform/1.0"}
        )
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            features = data.get("features", [])
            if features and len(features) > 0:
                coords = features[0].get("geometry", {}).get("coordinates", [])
                if len(coords) >= 2:
                    lon, lat = coords[0], coords[1]
                    return float(lat), float(lon)
    except Exception as e:
        print(f"[AIGeocoder] Geocoding lookup error for '{location_text}':", e)
        
    return None, None
