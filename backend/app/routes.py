from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .database import get_db
from .models import (
    Diamond,
    DiamondCalculationRequest,
    DiamondCalculationResponse,
    LoginLogCreate,
    LoginLogResponse,
    LoginLogDB,
    DiamondPriceDB
)
from .utils import calculate_diamond_price

router = APIRouter()

# Diamond calculation endpoints
@router.post("/calculate-price", response_model=DiamondCalculationResponse)
async def calculate_price(
    request: DiamondCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calculate diamond prices and store the calculation in database"""
    try:
        # Calculate individual prices
        individual_prices = []
        for diamond in request.diamonds:
            price = calculate_diamond_price(diamond)
            individual_prices.append(price)
            
            # Store calculation in database
            db_record = DiamondPriceDB(
                carat=diamond.carat,
                clarity=diamond.clarity,
                color=diamond.color,
                cut=diamond.cut,
                certification=diamond.certification,
                price=price,
                calculated_by=request.staff_id or "anonymous"
            )
            db.add(db_record)
        
        # Calculate total
        total_price = sum(individual_prices)
        
        # Commit database changes
        db.commit()
        
        return DiamondCalculationResponse(
            total_price=round(total_price, 2),
            individual_prices=[round(price, 2) for price in individual_prices],
            timestamp=datetime.utcnow()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

# Login log endpoints
@router.post("/login-logs/", response_model=LoginLogResponse)
async def create_login_log(
    log: LoginLogCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new login log entry"""
    try:
        db_log = LoginLogDB(
            **log.dict(),
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", "")
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not create log: {str(e)}")

@router.get("/login-logs/", response_model=List[LoginLogResponse])
async def get_login_logs(
    staff_id: str = None,
    branch: str = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get login logs with optional filtering"""
    query = db.query(LoginLogDB)
    
    if staff_id:
        query = query.filter(LoginLogDB.staff_id == staff_id)
    if branch:
        query = query.filter(LoginLogDB.branch == branch)
    
    logs = query.order_by(LoginLogDB.timestamp.desc()).limit(limit).all()
    return logs

# Price calculation history endpoint
@router.get("/calculation-history/", response_model=List[dict])
async def get_calculation_history(
    staff_id: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get history of price calculations"""
    query = db.query(DiamondPriceDB)
    
    if staff_id:
        query = query.filter(DiamondPriceDB.calculated_by == staff_id)
    
    history = query.order_by(DiamondPriceDB.timestamp.desc()).limit(limit).all()
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