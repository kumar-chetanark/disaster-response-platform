import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/auth", tags=["Authority Authentication"])

# Authority credentials store (In production, stored hashed in DB/Vault)
# Default authority credentials for Command Center:
# Username: authority_admin / Pass: Commander@2026!
AUTHORITY_USERS = {
    "authority_admin": {
        "password_hash": hashlib.sha256("Commander@2026!".encode()).hexdigest(),
        "name": "Commander R. Vance",
        "badge_id": "DISASTER-CMD-01",
        "role": "AUTHORITY",
        "authority_level": 5,
        "department": "National Emergency Command Center",
    },
    "operator_ops": {
        "password_hash": hashlib.sha256("Operator@2026!".encode()).hexdigest(),
        "name": "Officer S. Chen",
        "badge_id": "DISASTER-OPS-14",
        "role": "AUTHORITY",
        "authority_level": 4,
        "department": "Sector 7 Operations Hub",
    }
}

# Active in-memory session tokens store
ACTIVE_SESSIONS: Dict[str, dict] = {}

class LoginRequest(BaseModel):
    username: str = Field(..., example="authority_admin")
    password: str = Field(..., example="Commander@2026!")

class UserSessionResponse(BaseModel):
    token: str
    username: str
    name: str
    badge_id: str
    role: str
    authority_level: int
    department: str
    expires_at: str

class VerifyResponse(BaseModel):
    authenticated: bool
    user: Optional[dict] = None

@router.post("/login", response_model=UserSessionResponse)
def login(req: LoginRequest):
    """
    Authenticate authority credentials and issue a verified session token.
    """
    user = AUTHORITY_USERS.get(req.username.strip().lower())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authority credentials. Access restricted to authorized command personnel."
        )
    
    pw_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if pw_hash != user["password_hash"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authority credentials. Access restricted to authorized command personnel."
        )

    # Generate cryptographically secure session token
    token = secrets.token_hex(24)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=12)
    session_data = {
        "token": token,
        "username": req.username,
        "name": user["name"],
        "badge_id": user["badge_id"],
        "role": user["role"],
        "authority_level": user["authority_level"],
        "department": user["department"],
        "expires_at": expires_at.isoformat(),
    }
    ACTIVE_SESSIONS[token] = session_data

    return session_data

@router.get("/verify", response_model=VerifyResponse)
def verify_session(authorization: Optional[str] = Header(None)):
    """
    Verify whether an active authority session token is valid.
    """
    if not authorization:
        return {"authenticated": False, "user": None}
    
    token = authorization.replace("Bearer ", "").strip()
    session = ACTIVE_SESSIONS.get(token)
    if not session:
        return {"authenticated": False, "user": None}
    
    return {"authenticated": True, "user": session}

@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    """
    Revoke the active authority session token.
    """
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        ACTIVE_SESSIONS.pop(token, None)
    return {"status": "SUCCESS", "message": "Authority session successfully terminated."}
