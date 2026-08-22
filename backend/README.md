# Disaster Response Platform — Backend API (FastAPI)

Core REST API backend built with FastAPI, SQLAlchemy ORM, and PostgreSQL (Supabase).

## Phase 1 Architecture (Foundation)
- **FastAPI Core**: Standardized routing, dependency injection, and health endpoints.
- **Database Engine**: SQLAlchemy 2.0 with PostgreSQL / SQLite dev compatibility.
- **Data Models**: Incident, Citizen Report, Incident Sources, Field Assessments, Resources, Resource Allocations, Operations, Alerts, Shelters, Inventory, and Reports.
- **Migrations**: Alembic migration environment.

## Running the Backend
```bash
# 1. Activate venv
.\.venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start development server
uvicorn app.main:app --reload --port 8000
```

## API Health Check
- `GET http://localhost:8000/api/health`
