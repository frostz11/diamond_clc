from fastapi import Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from .database import get_db
from .models import LoginLogDB

# Define API key header security
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

def get_current_user(
    api_key: str = Security(api_key_header), 
    db: Session = Depends(get_db)
):
    """Validate the API key and return the staff_id"""
    if not api_key:
        raise HTTPException(status_code=401, detail="API key is missing")

    # Ensure API key does not contain extra spaces
    api_key = api_key.strip()

    session = (
        db.query(LoginLogDB)
        .filter(
            LoginLogDB.session_token == api_key,
            LoginLogDB.logged_out.is_(False)
        )
        .limit(1)
        .first()
    )

    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired API key")

    return session.staff_id  
