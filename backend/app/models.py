from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from datetime import datetime
from typing import List, Optional
from .database import Base

# SQLAlchemy Models
class LoginLogDB(Base):
    __tablename__ = "login_logs"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String, index=True)
    branch = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String)
    user_agent = Column(String)

class DiamondPriceDB(Base):
    __tablename__ = "diamond_prices"

    id = Column(Integer, primary_key=True, index=True)
    carat = Column(Float)
    clarity = Column(String)
    color = Column(String)
    cut = Column(String)
    certification = Column(String)
    price = Column(Float)
    calculated_by = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# Pydantic Models for Request/Response
class Diamond(BaseModel):
    carat: float = Field(..., gt=0)
    clarity: str = Field(..., pattern="^(FL|IF|VVS1|VVS2|VS1|VS2|SI1|SI2|I1)$")
    color: str = Field(..., pattern="^[D-K]$")
    cut: str = Field(..., pattern="^(Excellent|Very Good|Good|Fair|Poor)$")
    certification: str = Field(..., pattern="^(GIA|AGS|IGI|HRD|None)$")

class DiamondCalculationRequest(BaseModel):
    staff_id: Optional[str] = None
    diamonds: List[Diamond]

class DiamondCalculationResponse(BaseModel):
    total_price: float
    individual_prices: List[float]
    timestamp: datetime

class LoginLogCreate(BaseModel):
    staff_id: str
    branch: str

class LoginLogResponse(BaseModel):
    id: int
    staff_id: str
    branch: str
    timestamp: datetime
    ip_address: str
    user_agent: str

    class Config:
        from_attributes = True