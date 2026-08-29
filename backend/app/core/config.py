from pathlib import Path
from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory (anchors SQLite db path to backend directory regardless of invocation CWD)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "disaster_response_dev.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Disaster Response Platform API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    DEMO_MODE: bool = True
    API_V1_PREFIX: str = "/api"

    # Database connection URL - default to absolute SQLite path in backend directory
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"

    # Supabase credentials (for future auth/realtime services)
    SUPABASE_URL: str = "https://your-supabase-project.supabase.co"
    SUPABASE_ANON_KEY: str = "your-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "your-service-role-key"

    # Explicit CORS Allowlist (Preserves local dev + production Vercel frontend)
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://disaster-response-platform-eta.vercel.app",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        default_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "https://disaster-response-platform-eta.vercel.app",
        ]
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    return list(dict.fromkeys(default_origins + [o.rstrip("/") for o in parsed if isinstance(o, str)]))
                except Exception:
                    pass
            items = [item.strip().rstrip("/") for item in v.split(",") if item.strip()]
            return list(dict.fromkeys(default_origins + items))
        elif isinstance(v, (list, set, tuple)):
            items = [str(item).strip().rstrip("/") for item in v if str(item).strip()]
            return list(dict.fromkeys(default_origins + items))
        return default_origins

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )

settings = Settings()
