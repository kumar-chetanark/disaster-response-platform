import re
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.incident import Incident
from app.models.citizen_report import CitizenReport
from app.services.citizen_service import process_citizen_report
from app.schemas.citizen_report import CitizenReportCreate

router = APIRouter(prefix="/sms", tags=["SMS / IVR Degraded-Mode Ingestion"])

class SMSPayload(BaseModel):
    sender_phone: str = Field(..., example="+919876543210")
    message_text: str = Field(..., example="FLOOD HELP 19.0760 72.8777 4 PEOPLE TRAPPED ELDERLY")

def parse_sms_text(text: str) -> Dict[str, Any]:
    """
    Deterministic NLP/Rule-based parser for structured degraded-mode SMS:
    Extracts disaster type, lat/lon if present, people trapped/affected, vulnerability indicators.
    """
    upper_text = text.upper()
    disaster_type = "other"
    if "FLOOD" in upper_text or "WATER" in upper_text or "SURGE" in upper_text:
        disaster_type = "flood"
    elif "CYCLONE" in upper_text or "STORM" in upper_text or "WIND" in upper_text:
        disaster_type = "cyclone"
    elif "FIRE" in upper_text or "SMOKE" in upper_text or "BLAST" in upper_text:
        disaster_type = "fire"
    elif "LANDSLIDE" in upper_text or "DEBRIS" in upper_text or "COLLAPSE" in upper_text:
        disaster_type = "landslide"

    # Match coordinates if present e.g. 19.0760 72.8777 or 29.76 -95.36
    coord_match = re.search(r'(-?\d+\.\d+)\s+(-?\d+\.\d+)', text)
    latitude = float(coord_match.group(1)) if coord_match else None
    longitude = float(coord_match.group(2)) if coord_match else None

    # People count estimate
    people_match = re.search(r'(\d+)\s*(PEOPLE|PERSONS|PAX|CIVILIANS|FAMILY|MEMBERS)', upper_text)
    affected_count = people_match.group(1) if people_match else "4-5"

    is_trapped = "TRAP" in upper_text or "ISOLAT" in upper_text or "STRAND" in upper_text or "ROOF" in upper_text
    is_danger = "HELP" in upper_text or "SOS" in upper_text or "URGENT" in upper_text or is_trapped
    vulnerability = "Elderly/Infant/Special Assistance" if ("ELDER" in upper_text or "BABY" in upper_text or "CHILD" in upper_text or "INJUR" in upper_text) else "Standard"

    location_desc = f"SMS Ingestion GPS: ({latitude}, {longitude})" if (latitude and longitude) else "SMS Cell Tower Triangulation"

    return {
        "disaster_type": disaster_type,
        "location": location_desc,
        "latitude": latitude,
        "longitude": longitude,
        "description": f"[SMS DEGRADED-MODE] {text} | Vulnerability: {vulnerability}",
        "affected_people_estimate": f"{affected_count} people",
        "is_people_trapped": is_trapped,
        "is_immediate_danger": is_danger,
    }

@router.post("/inbound", status_code=status.HTTP_201_CREATED)
def receive_inbound_sms(payload: SMSPayload, db: Session = Depends(get_db)):
    """
    Parse inbound SMS/IVR telecom feed and inject it into the primary incident orchestration pipeline.
    """
    parsed = parse_sms_text(payload.message_text)

    # Convert to standard citizen report payload
    cr_in = CitizenReportCreate(
        disaster_type=parsed["disaster_type"],
        location=parsed["location"],
        latitude=parsed["latitude"],
        longitude=parsed["longitude"],
        description=parsed["description"],
        reported_time="Just now (SMS Gateway)",
        is_people_trapped=parsed["is_people_trapped"],
        is_immediate_danger=parsed["is_immediate_danger"],
        affected_people_estimate=parsed["affected_people_estimate"],
        contact_info=payload.sender_phone,
    )

    report_result = process_citizen_report(db=db, report_in=cr_in)
    return {
        "status": "PROCESSED",
        "protocol": "SMS_IVR_TELECOM_GATEWAY",
        "sender": payload.sender_phone,
        "parsed_metadata": parsed,
        "incident_id": report_result.incident_id,
        "report_id": report_result.report_id,
        "matched_existing_incident": report_result.status == "CORROBORATED",
    }
