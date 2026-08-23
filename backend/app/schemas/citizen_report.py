import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator

SUPPORTED_DISASTER_TYPES = {
    "flood", "cyclone", "fire", "earthquake", "landslide", "infrastructure", "tsunami", "storm", "other"
}

SPAM_GIBBERISH_REGEX = re.compile(
    r'^(.)\1{4,}$|^(asdf|hello|test|123|abc|xyz|qwerty|zzz|aaa|ha(ha)+|he(he)+|lol)+$',
    re.IGNORECASE
)

class CitizenReportCreate(BaseModel):
    name: Optional[str] = Field(None, description="Optional citizen submitter name")
    contact_info: Optional[str] = Field(None, description="Optional phone number or email")
    disaster_type: str = Field(..., description="Supported disaster category")
    description: str = Field(..., min_length=10, description="Meaningful account of the emergency")
    location: str = Field(..., min_length=2, description="Location description or landmark")
    latitude: Optional[float] = Field(None, description="GPS Latitude (-90 to 90)")
    longitude: Optional[float] = Field(None, description="GPS Longitude (-180 to 180)")
    reported_time: Optional[str] = Field(None, description="Client reported time string")
    image_url: Optional[str] = Field(None, description="Optional uploaded image or evidence URL")
    
    # Priority indicators
    is_people_trapped: Optional[bool] = Field(False, description="Flag if individuals are trapped")
    is_immediate_danger: Optional[bool] = Field(False, description="Flag if life-threatening danger exists")
    affected_people_estimate: Optional[str] = Field(None, description="Estimated number of affected civilians")

    @field_validator("disaster_type")
    @classmethod
    def validate_disaster_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in SUPPORTED_DISASTER_TYPES:
            raise ValueError(
                f"Unsupported disaster type '{v}'. Must be one of: {', '.join(sorted(SUPPORTED_DISASTER_TYPES))}"
            )
        return v.strip()

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 2 or clean.isnumeric() or SPAM_GIBBERISH_REGEX.match(clean.lower()):
            raise ValueError("Location must be a meaningful geographic name, landmark, or address.")
        return clean

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 10:
            raise ValueError("Description must contain at least 10 characters detailing the emergency.")
        
        clean_no_spaces = re.sub(r'\s+', '', clean.lower())
        if SPAM_GIBBERISH_REGEX.match(clean_no_spaces):
            raise ValueError("Description rejected: contains meaningless spam, test text, or repetitive characters.")
        
        unique_chars = len(set(clean_no_spaces))
        if unique_chars < 5 and len(clean_no_spaces) > 10:
            raise ValueError("Description rejected: repetitive character sequence detected.")

        return clean

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-90.0 <= v <= 90.0):
            raise ValueError(f"Latitude {v} out of valid geographic range [-90, 90].")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (-180.0 <= v <= 180.0):
            raise ValueError(f"Longitude {v} out of valid geographic range [-180, 180].")
        return v

class CitizenReportResponse(BaseModel):
    report_id: str
    incident_id: str
    incident_title: str
    is_new_incident: bool
    status: str
    message: str
    submitted_at: str
