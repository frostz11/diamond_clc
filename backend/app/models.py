from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.sql import func
from datetime import datetime, timezone, timedelta  
from typing import List, Optional
from .database import Base

# SQLAlchemy Models
class LoginLogDB(Base):
    __tablename__ = "login_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String(50), index=True)  
    branch = Column(String(100), index=True)  
    counter = Column(String(20))  
    success = Column(Boolean)
    details = Column(String(255))  
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone(timedelta(hours=8))))
    ip_address = Column(String(45))  # IPv4 & IPv6 support
    user_agent = Column(String(255))
    session_token = Column(String(255), unique=True, index=True)  
    logged_out = Column(Boolean, default=False)

class DiamondPriceDB(Base):
    __tablename__ = "diamond_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    carat = Column(Float)
    clarity = Column(String(10))  
    color = Column(String(5))  
    cut = Column(String(20))  
    certification = Column(String(10))  
    price = Column(Float)
    calculated_by = Column(String(50), index=True) 
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# Pydantic Models for Request/Response
class Diamond(BaseModel):
    carat: float = Field(..., gt=0)
    clarity: str = Field(..., pattern="^(FL|IF|VVS1|VVS2|VS1|VS2|SI1|SI2|I1)$")
    color: str = Field(..., pattern="^[D-K]$")
    cut: str = Field(..., pattern="^(Excellent|Very Good|Good|Fair|Poor)$")
    certification: str = Field(
        ..., 
        pattern="^(GIA|AGS|IGI|HRD|Others|None)$"
    )
    quantity: Optional[int] = Field(default=1, gt=0)

    class Config:
        from_attributes = True

class DiamondCalculationRequest(BaseModel):
    staff_id: Optional[str] = None
    diamonds: List[Diamond]

class DiamondCalculationResponse(BaseModel):
    total_price: float
    individual_prices: List[float]
    timestamp: datetime

class LoginLogCreate(BaseModel):
    staff_id: str = Field(..., description="Staff ID of the user")
    branch: str = Field(..., description="Branch location of the staff member")
    counter: str = Field(..., description="Counter number")
    success: bool = Field(..., description="Whether the login attempt was successful")
    details: str = Field(..., description="Additional details about the login attempt")
    session_token: Optional[str] = Field(None, description="Session token for authentication")  

class LoginLogResponse(BaseModel):
    id: int
    staff_id: str
    branch: str
    counter: str
    success: bool
    details: str
    timestamp: datetime
    ip_address: Optional[str] = None  
    user_agent: Optional[str] = None  
    session_token: Optional[str]
    logged_out: bool

    class Config:
        from_attributes = True  # ✅ Pydantic v2

class LoginRequest(BaseModel):
    staff_id: str = Field(..., description="Staff ID for authentication")
    branch: str = Field(..., description="Branch location of the staff member")
    counter: str = Field(..., description="Counter number")

class LoginResponse(BaseModel):
    api_key: str = Field(..., description="API key to be used for subsequent requests")
    staff_id: str = Field(..., description="Staff ID of the authenticated user")
    message: str = Field(..., description="Status message")

    class Config:
        from_attributes = True

class LogActivityRequest(BaseModel):
    staff_id: str = Field(..., description="Staff ID of the user")
    branch: str = Field(..., description="Branch location of the staff member")
    counter: str = Field(..., description="Counter number")
    success: bool = Field(..., description="Whether the action was successful")
    details: str = Field(..., description="Details of the activity")

    class Config:
        from_attributes = True  # ✅ Pydantic v2
        