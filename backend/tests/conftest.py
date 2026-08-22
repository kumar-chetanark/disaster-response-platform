import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import get_db, Base
from app.main import app as fastapi_app

# Import all models to ensure complete schema creation
import app.models.incident
import app.models.incident_source
import app.models.citizen_report
import app.models.assessment
import app.models.resource
import app.models.resource_allocation
import app.models.operation
import app.models.alert
import app.models.report
import app.models.inventory

TEST_DB_URL = "sqlite:///:memory:"
from sqlalchemy.pool import StaticPool
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

fastapi_app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function", autouse=True)
def init_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
