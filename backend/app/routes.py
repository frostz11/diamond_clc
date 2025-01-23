from fastapi import APIRouter, HTTPException
from .models import DiamondCalculationRequest, DiamondCalculationResponse
from .utils import calculate_diamond_price

# Initialize API Router
router = APIRouter()

@router.post("/calculate-price", response_model=DiamondCalculationResponse)
async def calculate_price(request: DiamondCalculationRequest):
    """
    Calculate the total price and individual prices of diamonds.
    
    Args:
        request (DiamondCalculationRequest): A request containing a list of diamonds and their characteristics.
    
    Returns:
        DiamondCalculationResponse: The total price and a list of individual prices.
    """
    try:
        # Calculate individual diamond prices
        individual_prices = [calculate_diamond_price(diamond) for diamond in request.diamonds]
        
        # Calculate the total price
        total_price = sum(individual_prices)
        
        # Return the response with rounded values
        return DiamondCalculationResponse(
            total_price=round(total_price, 2),
            individual_prices=[round(price, 2) for price in individual_prices]
        )
    except KeyError as e:
        # Handle invalid characteristic errors
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid characteristic value: {str(e)}"
        )
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )
