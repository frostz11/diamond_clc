from fastapi import APIRouter, Depends, HTTPException, Request,Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import secrets
from .database import get_db
from .models import (
    Diamond, DiamondCalculationRequest, DiamondCalculationResponse,
    LoginLogCreate, LoginLogResponse, LoginLogDB, DiamondPriceDB,
    LoginRequest, LoginResponse, LogActivityRequest  # Add LogActivityRequest here
)
from .utils import calculate_diamond_price
from .auth import get_current_user

# Add after imports, before routes

def get_malaysia_time():
    """Get current time in Malaysia timezone (UTC+8)"""
    return datetime.now(timezone(timedelta(hours=8)))

async def verify_api_key(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="API key is missing")
    
    try:
        scheme, api_key = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        # Create a database session
        db = next(get_db())
        try:
            # Verify the API key exists in the database and is not logged out
            log = db.query(LoginLogDB).filter(
                LoginLogDB.session_token == api_key,
                LoginLogDB.logged_out.is_(False)
            ).first()
            
            if not log:
                raise HTTPException(status_code=401, detail="Invalid or expired API key")
            
            return log.staff_id
        finally:
            db.close()
            
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login and return an API key"""
    try:
        session_token = secrets.token_urlsafe(32)
        
        # Create login log with session token
        db_log = LoginLogDB(
            staff_id=login_data.staff_id,
            branch=login_data.branch,
            counter=login_data.counter,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            session_token=session_token,
            logged_out=False,
            success=True,
            details="Successful login"
        )
        db.add(db_log)
        db.commit()
        
        return LoginResponse(
            api_key=session_token,
            staff_id=login_data.staff_id,
            message="Login successful"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to log login: {str(e)}")

@router.post("/logout")
async def logout(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout and invalidate session"""
    result = db.query(LoginLogDB).filter(
        LoginLogDB.staff_id == current_user,
        LoginLogDB.logged_out.is_(False)
    ).update({"logged_out": True})
    
    db.commit()
    if result == 0:
        raise HTTPException(status_code=404, detail="No active sessions found")
    
    return {"message": "Logged out successfully"}

@router.post("/calculate-price", response_model=DiamondCalculationResponse)
async def calculate_price(
    request: DiamondCalculationRequest,
    staff_id: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Calculate diamond prices"""
    try:
        request.staff_id = staff_id
        individual_prices = []
        
        # Add validation before calculation
        for i, diamond in enumerate(request.diamonds):
            if float(diamond.carat) <= 0:
                raise HTTPException(
                    status_code=422,
                    detail=f"Diamond {i+1}: Carat weight must be greater than 0"
                )
            if diamond.quantity and diamond.quantity <= 0:
                raise HTTPException(
                    status_code=422,
                    detail=f"Diamond {i+1}: Quantity must be greater than 0"
                )
            
            price = calculate_diamond_price(diamond)
            individual_prices.append(price)

            db_record = DiamondPriceDB(
                carat=diamond.carat,
                clarity=diamond.clarity,
                color=diamond.color,
                cut=diamond.cut,
                certification=diamond.certification,
                price=price,
                calculated_by=staff_id
            )
            db.add(db_record)

        db.commit()
        
        return DiamondCalculationResponse(
            total_price=round(sum(individual_prices), 2),
            individual_prices=[round(price, 2) for price in individual_prices],
            timestamp=get_malaysia_time()  
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

# 🔹 Create a login log
@router.post("/login-log")
async def create_login_log(
    log_data: LoginLogCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Log login attempts"""
    if not log_data.staff_id or not log_data.branch:
        raise HTTPException(status_code=400, detail="Missing required data")
    
    try:
        db_log = LoginLogDB(
            staff_id=log_data.staff_id,
            branch=log_data.branch,
            counter=log_data.counter,
            success=log_data.success,
            details=log_data.details,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            session_token=log_data.session_token,  # Optional
            logged_out=log_data.logged_out
        )
        db.add(db_log)
        db.commit()
        return {"message": "Login activity logged successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to log activity: {str(e)}")

# 🔹 Get login logs
@router.get("/login-logs/", response_model=List[LoginLogResponse])
async def get_login_logs(
    staff_id: Optional[str] = None,
    branch: Optional[str] = None,
    limit: int = 100,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve login logs"""
    query = db.query(LoginLogDB)
    if staff_id:
        query = query.filter(LoginLogDB.staff_id == staff_id)
    if branch:
        query = query.filter(LoginLogDB.branch == branch)
    
    logs = query.order_by(LoginLogDB.timestamp.desc()).limit(limit).all()

    if not logs:
        raise HTTPException(status_code=404, detail="No logs found")
    
    return [LoginLogResponse.model_validate(log) for log in logs]  # 🔹 Fix .to_dict() error

# 🔹 Get calculation history
@router.get("/calculation-history/", response_model=List[dict])
async def get_calculation_history(
    staff_id: Optional[str] = None,
    limit: int = 50,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve calculation history"""
    query = db.query(DiamondPriceDB)
    if staff_id:
        query = query.filter(DiamondPriceDB.calculated_by == staff_id)

    history = query.order_by(DiamondPriceDB.timestamp.desc()).limit(limit).all()

    if not history:
        raise HTTPException(status_code=404, detail="No history found")

    return [
        {
            "timestamp": record.timestamp,
            "carat": record.carat,
            "clarity": record.clarity,
            "color": record.color,
            "cut": record.cut,
            "certification": record.certification,
            "price": round(record.price, 2),
            "calculated_by": record.calculated_by
        }
        for record in history
    ]

@router.post("/log-activity/")
async def log_activity(request: LogActivityRequest, db: Session = Depends(get_db)):
    """Log user activity"""
    try:
        log = LoginLogDB(
            staff_id=request.staff_id,
            branch=request.branch,
            counter=request.counter,
            success=request.success,
            details=request.details,
            ip_address=None,  # Optional field
            user_agent=None,  # Optional field
            session_token=None,  # Optional field
            logged_out=False
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return {"message": "Activity logged successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to log activity: {str(e)}")