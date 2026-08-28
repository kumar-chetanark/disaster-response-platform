import abc
import json
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# 1. Standardized Internal Disaster Type Mapping
GDACS_EVENT_TYPE_MAP = {
    "EQ": "EARTHQUAKE",
    "TC": "TROPICAL_CYCLONE",
    "FL": "FLOOD",
    "VO": "VOLCANIC_ACTIVITY",
    "WF": "WILDFIRE",
    "DR": "DROUGHT",
    "ST": "STORM",
    "TS": "TSUNAMI",
    "LS": "LANDSLIDE",
}

# 2. Standardized Internal Severity Mapping
GDACS_SEVERITY_MAP = {
    "RED": "CRITICAL",
    "ORANGE": "HIGH",
    "GREEN": "MEDIUM",
}

class NormalizedDisasterEvent(BaseModel):
    source: str = Field(..., description="External source name e.g. GDACS")
    external_id: str = Field(..., description="Unique event identifier from the source")
    event_type: str = Field(..., description="Normalized internal disaster type")
    title: str = Field(..., description="Clean event title")
    description: Optional[str] = Field(None, description="Detailed situation summary")
    country: Optional[str] = Field(None, description="Primary affected country")
    countries: Optional[str] = Field(None, description="Affected countries list")
    location_name: Optional[str] = Field(None, description="Specific descriptive geographic location")
    latitude: Optional[float] = Field(None, description="Geographic Latitude")
    longitude: Optional[float] = Field(None, description="Geographic Longitude")
    severity: str = Field("MEDIUM", description="Normalized severity: CRITICAL, HIGH, MEDIUM, LOW")
    alert_level: Optional[str] = Field(None, description="Source alert level string e.g. Red, Orange, Green")
    alert_score: Optional[float] = Field(None, description="Numeric alert score if provided")
    population_affected_est: Optional[str] = Field(None, description="Estimated population impacted")
    published_at: Optional[datetime] = Field(None, description="Original publication timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    source_url: Optional[str] = Field(None, description="Official permalink to event report")
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Raw source JSON for auditing")

class BaseExternalDisasterAdapter(abc.ABC):
    @property
    @abc.abstractmethod
    def source_name(self) -> str:
        pass

    @abc.abstractmethod
    def fetch_events(self) -> List[NormalizedDisasterEvent]:
        pass

class GDACSAdapter(BaseExternalDisasterAdapter):
    GEOJSON_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?format=json"
    RSS_URL = "https://www.gdacs.org/xml/rss.xml"

    @property
    def source_name(self) -> str:
        return "GDACS"

    def fetch_events(self) -> List[NormalizedDisasterEvent]:
        # Fetch high-priority curated GeoJSON events first, fallback to RSS
        events = []
        try:
            events = self._fetch_geojson()
        except Exception:
            try:
                events = self._fetch_rss()
            except Exception as e:
                raise RuntimeError(f"Both GDACS GeoJSON and RSS failed: {e}")
        return events

    def _fetch_rss(self) -> List[NormalizedDisasterEvent]:
        import xml.etree.ElementTree as ET
        req = urllib.request.Request(
            self.RSS_URL,
            headers={"User-Agent": "DisasterResponsePlatformAI/2.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw_xml = resp.read()

        root = ET.fromstring(raw_xml)
        items = root.findall(".//item")
        normalized_list: List[NormalizedDisasterEvent] = []

        for item in items:
            title = item.findtext("title") or "Global Disaster Alert"
            link = item.findtext("link") or "https://www.gdacs.org"
            desc = item.findtext("description") or ""

            ext_id = None
            event_type_code = None
            alert_level = None
            country = None
            alert_score = 0.0
            episode_id = None
            lat = None
            lon = None

            for child in item:
                tag = child.tag.split("}")[-1].lower()
                val = (child.text or "").strip()
                if tag == "eventid":
                    ext_id = val
                elif tag == "episodeid":
                    episode_id = val
                elif tag == "eventtype":
                    event_type_code = val.upper()
                elif tag == "alertlevel":
                    alert_level = val
                elif tag == "alertscore":
                    try:
                        alert_score = float(val)
                    except ValueError:
                        pass
                elif tag == "country":
                    country = val
                elif tag == "point":
                    parts = val.split()
                    if len(parts) >= 2:
                        try:
                            lat = float(parts[0])
                            lon = float(parts[1])
                        except ValueError:
                            pass

            if not ext_id:
                ext_id = str(abs(hash(link)))[:8]

            event_type = GDACS_EVENT_TYPE_MAP.get(event_type_code or "", "OTHER")
            severity = GDACS_SEVERITY_MAP.get((alert_level or "").upper(), "MEDIUM")

            # Extract impacted population / depth / intensity from rich RSS title
            pop_est = None
            if "million" in title.lower():
                import re
                m = re.search(r'([\d\.]+\s*million)', title, re.IGNORECASE)
                if m:
                    pop_est = f"{m.group(1)} people"
            elif "thousand" in title.lower():
                import re
                m = re.search(r'([\d\.]+\s*thousand)', title, re.IGNORECASE)
                if m:
                    pop_est = f"{m.group(1)} people"

            # Parse detailed geographic location from title: "in <Location> <Date>"
            loc_name = country or "International Alert Zone"
            if " in " in title:
                after_in = title.split(" in ", 1)[1]
                # split before date pattern
                import re
                parts = re.split(r'\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2}', after_in)
                if parts and parts[0].strip():
                    loc_name = parts[0].strip().rstrip(",").strip()

            raw_payload = {
                "title": title,
                "link": link,
                "description": desc,
                "episodeid": episode_id,
                "eventid": ext_id,
                "alertlevel": alert_level,
                "alertscore": alert_score,
                "country": country,
                "lat": lat,
                "lon": lon,
            }

            norm = NormalizedDisasterEvent(
                source=self.source_name,
                external_id=ext_id,
                event_type=event_type,
                title=f"[{self.source_name}] {title}",
                description=desc if desc else f"{alert_level or ''} {event_type} event reported in {loc_name}.",
                country=country or loc_name,
                countries=country or loc_name,
                location_name=loc_name,
                latitude=lat,
                longitude=lon,
                severity=severity,
                alert_level=alert_level,
                alert_score=alert_score,
                population_affected_est=pop_est,
                published_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                source_url=link,
                raw_data=raw_payload,
            )
            normalized_list.append(norm)

        return normalized_list

    def _fetch_geojson(self) -> List[NormalizedDisasterEvent]:
        req = urllib.request.Request(
            self.GEOJSON_URL,
            headers={"User-Agent": "DisasterResponsePlatformAI/2.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        features = data.get("features", [])
        normalized_list: List[NormalizedDisasterEvent] = []

        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [])

            lon = float(coords[0]) if len(coords) >= 2 and coords[0] is not None else None
            lat = float(coords[1]) if len(coords) >= 2 and coords[1] is not None else None

            event_id = str(props.get("eventid") or props.get("episodeid") or feat.get("id") or "").strip()
            if not event_id:
                continue

            raw_type = str(props.get("eventtype") or "").upper()
            event_type = GDACS_EVENT_TYPE_MAP.get(raw_type, "OTHER")
            
            raw_level = str(props.get("alertlevel") or "").upper()
            severity = GDACS_SEVERITY_MAP.get(raw_level, "MEDIUM")

            country = props.get("country") or props.get("countryname") or props.get("iso3") or None
            name = props.get("name") or props.get("eventname") or props.get("title") or f"{event_type.capitalize()} Alert"
            
            sev_data = props.get("severitydata", {})
            sev_text = sev_data.get("severitytext", "") if isinstance(sev_data, dict) else ""
            desc = props.get("htmldescription") or props.get("description") or f"{props.get('alertlevel', '')} {event_type} in {country or 'Global Region'}."
            if sev_text and sev_text not in desc:
                desc = f"{desc} Details: {sev_text}."

            from_date_str = props.get("fromdate")
            pub_date = None
            if from_date_str:
                try:
                    pub_date = datetime.fromisoformat(from_date_str.replace("Z", "+00:00"))
                except Exception:
                    pub_date = datetime.now(timezone.utc)

            url = props.get("url", {}).get("report") if isinstance(props.get("url"), dict) else props.get("url")
            if not url:
                url = f"https://www.gdacs.org/report.aspx?eventtype={raw_type}&eventid={event_id}"

            pop_str = str(props.get("population") or props.get("affected_population") or "")
            score = float(props.get("alertscore") or 0.0) if props.get("alertscore") is not None else None

            norm = NormalizedDisasterEvent(
                source=self.source_name,
                external_id=event_id,
                event_type=event_type,
                title=f"[{self.source_name}] {name}",
                description=desc,
                country=country or "International",
                countries=country or "International",
                location_name=country or "International Alert Zone",
                latitude=lat,
                longitude=lon,
                severity=severity,
                alert_level=props.get("alertlevel"),
                alert_score=score,
                population_affected_est=pop_str if pop_str and pop_str != "0" else None,
                published_at=pub_date or datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                source_url=url,
                raw_data=props,
            )
            normalized_list.append(norm)

        return normalized_list
