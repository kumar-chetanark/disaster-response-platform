from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import health, citizen_reports, incidents, resources, operations, assessments, alerts, reports

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Disaster Response Platform REST API",
    version="0.8.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(citizen_reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents.router, prefix=settings.API_V1_PREFIX)
app.include_router(resources.router, prefix=settings.API_V1_PREFIX)
app.include_router(operations.router, prefix=settings.API_V1_PREFIX)
app.include_router(assessments.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "message": "Disaster Response Platform API is online",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
        "citizen_reports": f"{settings.API_V1_PREFIX}/citizen-reports",
        "incidents": f"{settings.API_V1_PREFIX}/incidents",
        "resources": f"{settings.API_V1_PREFIX}/resources",
        "operations": f"{settings.API_V1_PREFIX}/operations",
        "assessments": f"{settings.API_V1_PREFIX}/assessments",
        "alerts": f"{settings.API_V1_PREFIX}/alerts",
        "reports": f"{settings.API_V1_PREFIX}/reports",
    }
