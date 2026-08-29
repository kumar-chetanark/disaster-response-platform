from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensures all models and tables are registered in Base.metadata
import asyncio
import logging
from app.core.database import SessionLocal
from app.services.external_ingestion_service import global_ingestion_service
from app.routers import (
    external_alerts,
    auth,
    health,
    citizen_reports,
    incidents,
    resources,
    operations,
    assessments,
    alerts,
    reports,
    allocations,
    shelters,
    sms_gateway,
)

async def periodic_gdacs_ingestion_worker():
    """Background worker: Ingests global disaster events every 5 minutes."""
    # Wait 2 seconds after startup for database initialization
    await asyncio.sleep(2)
    while True:
        try:
            db = SessionLocal()
            try:
                global_ingestion_service.run_ingestion(db)
            finally:
                db.close()
        except Exception as e:
            logging.error(f"[Background Ingestion Worker] Ingestion error: {e}")
        # Run every 5 minutes (300 seconds)
        await asyncio.sleep(300)

def _ensure_schema_compatibility():
    """
    Ensures all PostgreSQL tables and columns match the latest SQLAlchemy models.
    Automatically alters legacy VARCHAR(255) columns to TEXT in Supabase PostgreSQL without data loss.
    """
    Base.metadata.create_all(bind=engine)
    if not settings.DATABASE_URL.startswith("sqlite"):
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                # Widen columns in external_alerts to TEXT for long international disaster event titles/locations/URLs
                conn.execute(text("ALTER TABLE external_alerts ALTER COLUMN title TYPE TEXT;"))
                conn.execute(text("ALTER TABLE external_alerts ALTER COLUMN country TYPE TEXT;"))
                conn.execute(text("ALTER TABLE external_alerts ALTER COLUMN countries TYPE TEXT;"))
                conn.execute(text("ALTER TABLE external_alerts ALTER COLUMN location_name TYPE TEXT;"))
                conn.execute(text("ALTER TABLE external_alerts ALTER COLUMN source_url TYPE TEXT;"))
                conn.commit()
                logging.info("[Database Schema] PostgreSQL column types safely upgraded to TEXT.")
        except Exception as e:
            logging.warning(f"[Database Schema] Column upgrade notice (non-fatal): {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Deterministically ensure database tables & columns exist on server startup
    _ensure_schema_compatibility()
    # Start periodic worldwide disaster alert ingestion worker
    ingestion_task = asyncio.create_task(periodic_gdacs_ingestion_worker())
    yield
    ingestion_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Disaster Response Platform REST API & Allocation Engine",
    version="0.9.5",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(citizen_reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents.router, prefix=settings.API_V1_PREFIX)
app.include_router(resources.router, prefix=settings.API_V1_PREFIX)
app.include_router(operations.router, prefix=settings.API_V1_PREFIX)
app.include_router(assessments.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(allocations.router, prefix=settings.API_V1_PREFIX)
app.include_router(shelters.router, prefix=settings.API_V1_PREFIX)
app.include_router(sms_gateway.router, prefix=settings.API_V1_PREFIX)
app.include_router(external_alerts.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "message": "Disaster Response Platform API & Allocation Engine is online",
        "docs": "/docs",
        "auth": f"{settings.API_V1_PREFIX}/auth/login",
        "health": f"{settings.API_V1_PREFIX}/health",
        "citizen_reports": f"{settings.API_V1_PREFIX}/citizen-reports",
        "incidents": f"{settings.API_V1_PREFIX}/incidents",
        "resources": f"{settings.API_V1_PREFIX}/resources",
        "operations": f"{settings.API_V1_PREFIX}/operations",
        "assessments": f"{settings.API_V1_PREFIX}/assessments",
        "alerts": f"{settings.API_V1_PREFIX}/alerts",
        "reports": f"{settings.API_V1_PREFIX}/reports",
        "allocations": f"{settings.API_V1_PREFIX}/allocations/recommendations",
        "shelters": f"{settings.API_V1_PREFIX}/shelters",
        "sms_gateway": f"{settings.API_V1_PREFIX}/sms/inbound",
    }
