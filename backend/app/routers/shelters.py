from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_db
from app.models.shelter import Shelter

router = APIRouter(prefix="/shelters", tags=["Shelters & Evacuation"])

class ShelterResponse(BaseModel):
    id: str
    name: str
    location: str
    total_capacity: int
    current_occupancy: int
    available_capacity: int
    occupancy_pct: float
    status: str
    contact_phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    facility_type: Optional[str] = "Shelter"
    resource_center_id: Optional[str] = None
    available_beds: Optional[int] = 0
    emergency_beds: Optional[int] = 0
    icu_beds: Optional[int] = 0
    doctors_count: Optional[int] = 0
    nurses_count: Optional[int] = 0
    water_litres: Optional[int] = 0
    food_person_days: Optional[int] = 0
    medicine_days_stock: Optional[int] = 0
    created_at: Optional[datetime] = None

class ShelterCreate(BaseModel):
    name: str
    location: str
    total_capacity: int = 500
    current_occupancy: int = 0
    contact_phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    facility_type: Optional[str] = "Shelter"
    resource_center_id: Optional[str] = None

class ShelterUpdate(BaseModel):
    current_occupancy: Optional[int] = None
    total_capacity: Optional[int] = None
    contact_phone: Optional[str] = None

@router.get("", response_model=List[ShelterResponse])
def list_shelters(db: Session = Depends(get_db)):
    """
    List all emergency relief shelters, hospitals, beds, supplies, and live occupancy availability.
    """
    shelters = db.query(Shelter).all()
    results = []
    for s in shelters:
        avail = max(0, (s.total_capacity or 0) - (s.current_occupancy or 0))
        pct = round(((s.current_occupancy or 0) / max(1, s.total_capacity or 1)) * 100, 1)
        st = "FULL" if avail == 0 else "NEAR_CAPACITY" if pct >= 80 else "AVAILABLE"
        results.append({
            "id": s.id,
            "name": s.name,
            "location": s.location,
            "total_capacity": s.total_capacity or 0,
            "current_occupancy": s.current_occupancy or 0,
            "available_capacity": avail,
            "occupancy_pct": pct,
            "status": st,
            "contact_phone": s.contact_phone,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "facility_type": s.facility_type or ("Hospital" if "hospital" in s.name.lower() else "Shelter"),
            "resource_center_id": s.resource_center_id,
            "available_beds": s.available_beds or 0,
            "emergency_beds": s.emergency_beds or 0,
            "icu_beds": s.icu_beds or 0,
            "doctors_count": s.doctors_count or 0,
            "nurses_count": s.nurses_count or 0,
            "water_litres": s.water_litres or 0,
            "food_person_days": s.food_person_days or 0,
            "medicine_days_stock": s.medicine_days_stock or 0,
            "created_at": s.created_at,
        })
    return results

@router.post("", response_model=ShelterResponse, status_code=status.HTTP_201_CREATED)
def create_shelter(s_in: ShelterCreate, db: Session = Depends(get_db)):
    """
    Register a new emergency disaster relief shelter.
    """
    import uuid
    new_s = Shelter(
        id=f"shl-{uuid.uuid4().hex[:6]}",
        name=s_in.name,
        location=s_in.location,
        total_capacity=s_in.total_capacity,
        current_occupancy=s_in.current_occupancy,
        contact_phone=s_in.contact_phone,
        latitude=s_in.latitude,
        longitude=s_in.longitude,
        facility_type=s_in.facility_type or "Shelter",
        resource_center_id=s_in.resource_center_id,
    )
    db.add(new_s)
    db.commit()
    db.refresh(new_s)
    avail = max(0, new_s.total_capacity - new_s.current_occupancy)
    pct = round((new_s.current_occupancy / max(1, new_s.total_capacity)) * 100, 1)
    return {
        "id": new_s.id,
        "name": new_s.name,
        "location": new_s.location,
        "total_capacity": new_s.total_capacity,
        "current_occupancy": new_s.current_occupancy,
        "available_capacity": avail,
        "occupancy_pct": pct,
        "status": "AVAILABLE" if avail > 0 else "FULL",
        "contact_phone": new_s.contact_phone,
        "latitude": new_s.latitude,
        "longitude": new_s.longitude,
        "facility_type": new_s.facility_type,
        "resource_center_id": new_s.resource_center_id,
        "available_beds": new_s.available_beds or 0,
        "emergency_beds": new_s.emergency_beds or 0,
        "icu_beds": new_s.icu_beds or 0,
        "doctors_count": new_s.doctors_count or 0,
        "nurses_count": new_s.nurses_count or 0,
        "water_litres": new_s.water_litres or 0,
        "food_person_days": new_s.food_person_days or 0,
        "medicine_days_stock": new_s.medicine_days_stock or 0,
        "created_at": new_s.created_at,
    }

@router.patch("/{shelter_id}", response_model=ShelterResponse)
def update_shelter(shelter_id: str, s_up: ShelterUpdate, db: Session = Depends(get_db)):
    """
    Update shelter occupancy or total capacity.
    """
    s = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelter not found")
    if s_up.current_occupancy is not None:
        s.current_occupancy = s_up.current_occupancy
    if s_up.total_capacity is not None:
        s.total_capacity = s_up.total_capacity
    if s_up.contact_phone is not None:
        s.contact_phone = s_up.contact_phone
    db.commit()
    db.refresh(s)
    avail = max(0, s.total_capacity - s.current_occupancy)
    pct = round((s.current_occupancy / max(1, s.total_capacity)) * 100, 1)
    return {
        "id": s.id,
        "name": s.name,
        "location": s.location,
        "total_capacity": s.total_capacity,
        "current_occupancy": s.current_occupancy,
        "available_capacity": avail,
        "occupancy_pct": pct,
        "status": "FULL" if avail == 0 else "NEAR_CAPACITY" if pct >= 80 else "AVAILABLE",
        "contact_phone": s.contact_phone,
        "latitude": s.latitude,
        "longitude": s.longitude,
        "facility_type": s.facility_type,
        "available_beds": s.available_beds or 0,
        "emergency_beds": s.emergency_beds or 0,
        "icu_beds": s.icu_beds or 0,
        "doctors_count": s.doctors_count or 0,
        "nurses_count": s.nurses_count or 0,
        "water_litres": s.water_litres or 0,
        "food_person_days": s.food_person_days or 0,
        "medicine_days_stock": s.medicine_days_stock or 0,
        "created_at": s.created_at,
    }
