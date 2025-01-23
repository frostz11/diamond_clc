from pydantic import BaseModel, Field
from typing import List

class Diamond(BaseModel):
    carat: float = Field(..., ge=0.1)
    clarity: str
    color: str
    cut: str
    certification: str

class DiamondCalculationRequest(BaseModel):
    diamonds: List[Diamond]

class DiamondCalculationResponse(BaseModel):
    total_price: float
    individual_prices: List[float]