import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define database path using absolute paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_FOLDER = os.path.join(BASE_DIR, "database")
DB_FILE = "sql_app.db"
DB_PATH = os.path.join(DB_FOLDER, DB_FILE)

# Ensure the database folder exists
os.makedirs(DB_FOLDER, exist_ok=True)
logger.info(f"Database directory: {DB_FOLDER}")
logger.info(f"Database file path: {DB_PATH}")

# SQLite database URL with absolute path
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Configure SQLite to enforce foreign key constraints
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")  # Better concurrent access
        cursor.close()
        logger.info("SQLite PRAGMA settings configured successfully")
    except Exception as e:
        logger.error(f"Failed to set SQLite PRAGMA settings: {str(e)}")
        raise

# Create engine with connection pooling and improved settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,  # Connection timeout in seconds
        "isolation_level": "IMMEDIATE"  # Better concurrent write handling
    },
    pool_pre_ping=True,  # Enable connection health checks
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_size=5,  # Maximum number of connections
    max_overflow=10  # Maximum number of connections that can be created beyond pool_size
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Prevent expired object issues
)

# Base class for ORM models
Base = declarative_base()

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        logger.debug("Database session created")
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        logger.debug("Database session closed")
        db.close()

# Log successful database setup
logger.info("Database configuration completed successfully")