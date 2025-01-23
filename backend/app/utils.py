from .models import Diamond

# Price constants
BASE_PRICE = 23750

CLARITY_MULTIPLIERS = {
    'FL': 2.0, 'IF': 1.8, 'VVS1': 1.6, 'VVS2': 1.5,
    'VS1': 1.4, 'VS2': 1.3, 'SI1': 1.2, 'SI2': 1.1, 'I1': 0.9,
}

COLOR_MULTIPLIERS = {
    'D': 1.8, 'E': 1.6, 'F': 1.4, 'G': 1.3,
    'H': 1.2, 'I': 1.1, 'J': 1.0, 'K': 0.9,
}

CUT_MULTIPLIERS = {
    'Excellent': 1.5, 'Very Good': 1.3, 'Good': 1.1,
    'Fair': 0.9, 'Poor': 0.7,
}

CERTIFICATION_MULTIPLIERS = {
    'GIA': 1.3, 'AGS': 1.25, 'IGI': 1.1, 'HRD': 1.2, 'None': 1.0
}

def calculate_diamond_price(diamond: Diamond) -> float:
    """Calculate the price of a single diamond based on its characteristics."""
    price = (BASE_PRICE * 
            diamond.carat * 
            CLARITY_MULTIPLIERS[diamond.clarity] * 
            COLOR_MULTIPLIERS[diamond.color] * 
            CUT_MULTIPLIERS[diamond.cut] * 
            CERTIFICATION_MULTIPLIERS[diamond.certification])
    return round(price, 2)