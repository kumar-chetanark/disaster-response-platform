from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensures all models and tables are registered in Base.metadata
from app.routers import (
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Deterministically ensure database tables exist on server startup
    Base.metadata.create_all(bind=engine)
    yield

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
