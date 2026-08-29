from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Engine configuration (supporting Supabase PostgreSQL and local SQLite)
connect_args = {}
engine_kwargs = {
    "echo": settings.DEBUG if settings.ENVIRONMENT == "development" else False,
    "pool_pre_ping": True,
}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL / Supabase connection pool configuration
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 1800,  # recycle connections after 30 mins to avoid stale pooler connections
        "pool_timeout": 30,
    })

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency injection yield for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
