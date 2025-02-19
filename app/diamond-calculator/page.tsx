"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, Diamond, Calculator, LogOut } from 'lucide-react';

const handleError = (error: any) => {
  console.error('Error:', error);
  if (error?.response?.status === 401 || 
      error?.message?.includes('API key') || 
      error?.message?.includes('Session expired')) {
    localStorage.removeItem('api_key');
    localStorage.removeItem('authenticated');
    window.location.href = "/credentials";
  }
};

interface DiamondState {
  carat: string;
  clarity: string;
  color: string;
  cut: string;
  certification: string;
  price?: number;
  pricePerCarat?: number;
  quantity?: number;
}

const DiamondCalculator = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'certified' | 'non-certified'>('certified');
  const [individualPrices, setIndividualPrices] = useState<Record<number, number>>({});
  const [diamonds, setDiamonds] = useState<DiamondState[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [calculationLoading, setCalculationLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const initialDiamondState: DiamondState = {
    carat: '1.0',
    clarity: 'VS1',
    color: 'D',
    cut: 'Excellent',
    certification: activeFilter === 'certified' ? 'GIA' : 'None', 
    quantity: 1,
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("authenticated") === "true";
    const apiKey = localStorage.getItem("api_key");
    
    if (!isAuthenticated || !apiKey) {
      localStorage.removeItem("authenticated");
      router.push("/credentials");
    } else {
      setIsLoading(false);
      setDiamonds([{ ...initialDiamondState }]);
    }
  }, [router, activeFilter]);

  const clarityOptions = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'];
  const colorOptions = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
  const cutOptions = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
  const certificationOptions = activeFilter === 'certified' 
    ? ['GIA', 'AGS', 'IGI', 'HRD'] 
    : ['None'];

    const handleFilterChange = (filter: 'certified' | 'non-certified') => {
      setActiveFilter(filter);
      setDiamonds([{
        ...initialDiamondState,
        certification: filter === 'certified' ? 'GIA' : 'None' // Changed from 'Others' to 'None'
      }]);
      setTotalPrice(0);
      setIndividualPrices({});
    };

  const handleLogout = async () => {
    try {
      const apiKey = localStorage.getItem('api_key');
      if (apiKey) {
        await fetch('http://localhost:8000/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('api_key');
      localStorage.removeItem('authenticated');
      router.push('/credentials');
    }
  };

  const addDiamond = () => {
    setDiamonds(prev => [...prev, { 
      ...initialDiamondState,
      certification: activeFilter === 'certified' ? 'GIA' : 'Others'
    }]);
  };
  
  const removeDiamond = (index: number) => {
    setDiamonds(prev => prev.filter((_, i) => i !== index));
  };
  
  const updateDiamond = useCallback((index: number, updates: Partial<DiamondState>) => {
    setDiamonds(prevDiamonds => 
      prevDiamonds.map((diamond, i) => 
        i === index ? { ...diamond, ...updates } : diamond
      )
    );
  }, []);

  const calculateTotalPrice = async () => {
    setCalculationLoading(true);
    setError('');
    try {
        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) {
            throw new Error('API key not found. Please log in again.');
        }

        // Validate diamonds before sending
        const validatedDiamonds = diamonds.map((diamond, idx) => {
          const caratValue = parseFloat(diamond.carat);
          if (isNaN(caratValue) || caratValue <= 0) {
            throw new Error(`Invalid carat weight for Diamond ${idx + 1}`);
          }
          return {
            carat: caratValue,
            clarity: diamond.clarity,
            color: diamond.color,
            cut: diamond.cut,
            certification: activeFilter === 'certified' ? diamond.certification : 'None',
            quantity: parseInt(diamond.quantity?.toString() || '1')
          };
        });

        const response = await fetch('http://localhost:8000/api/calculate-price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ 
                diamonds: validatedDiamonds.map(d => ({
                    carat: d.carat,
                    clarity: d.clarity,
                    color: d.color,
                    cut: d.cut,
                    certification: d.certification,
                    quantity: d.quantity
                }))
            })
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
              localStorage.removeItem('api_key');
              localStorage.removeItem('authenticated');
              router.push('/credentials');
              throw new Error('Session expired. Please log in again.');
          }
          // Improved error message extraction
          throw new Error(
              typeof errorData.detail === 'string' 
                  ? errorData.detail 
                  : JSON.stringify(errorData.detail) || 'Failed to calculate price'
          );
      }

        const data = await response.json();
        if (!data || typeof data.total_price !== 'number') {
            throw new Error('Invalid response from server');
        }

        setTotalPrice(data.total_price);
        
        if (Array.isArray(data.individual_prices)) {
            const pricesObj: Record<number, number> = {};
            data.individual_prices.forEach((price: number, index: number) => {
                if (typeof price === 'number') {
                    pricesObj[index] = price;
                }
            });
            setIndividualPrices(pricesObj);
        }
    } catch (error: any) {
        console.error('Calculation error:', error);
        const errorMessage = error?.message || 'An unexpected error occurred';
        setError(errorMessage);
        
        if (errorMessage.includes('API key') || errorMessage.includes('Session expired')) {
            router.push('/credentials');
        }
    } finally {
        setCalculationLoading(false);
    }
};

const DiamondInputs = ({ diamond, index, isOnly }: { 
  diamond: DiamondState, 
  index: number,
  isOnly: boolean 
}) => (
  <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-lg min-w-[300px] hover:shadow-xl transition-shadow">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <Diamond className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">
          {index === 0 ? "Primary Diamond" : `Diamond ${index + 1}`}
        </h3>
      </div>
      {!isOnly && (
        <button
          onClick={() => removeDiamond(index)}
          className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
        >
          <MinusCircle className="w-5 h-5" />
        </button>
      )}
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
          Carat Weight
        </label>
        <input
          type="number"
          value={diamond.carat}
          onChange={(e) => updateDiamond(index, { carat: e.target.value })}
          disabled={calculationLoading}
          step="0.01"
          min="0.1"
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {activeFilter === 'non-certified' ? (
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
            Quantity
          </label>
          <input
            type="number"
            value={diamond.quantity}
            onChange={(e) => updateDiamond(index, { quantity: parseInt(e.target.value) })}
            min="1"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 hover:border-blue-300 transition-colors"
          />
        </div>
      ) : (
        <>
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
              Clarity
            </label>
            <select
              value={diamond.clarity}
              onChange={(e) => updateDiamond(index, { clarity: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 hover:border-blue-300 transition-colors"
            >
              {clarityOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
              Color
            </label>
            <select
              value={diamond.color}
              onChange={(e) => updateDiamond(index, { color: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 hover:border-blue-300 transition-colors"
            >
              {colorOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
              Cut
            </label>
            <select
              value={diamond.cut}
              onChange={(e) => updateDiamond(index, { cut: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 hover:border-blue-300 transition-colors"
            >
              {cutOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
              Certification
            </label>
            <select
              value={diamond.certification}
              onChange={(e) => updateDiamond(index, { certification: e.target.value })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 hover:border-blue-300 transition-colors"
            >
              {certificationOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {individualPrices[index] !== undefined && (
        <div className="col-span-2 mt-4 p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              {activeFilter === 'non-certified' ? 'Price per Carat:' : 'Price:'}
            </span>
            <span className="text-lg font-bold text-blue-600">
              {new Intl.NumberFormat('ms-MY', {
                style: 'currency',
                currency: 'MYR'
              }).format(activeFilter === 'non-certified' ? 
                individualPrices[index] / parseFloat(diamond.carat) : 
                individualPrices[index]
              )}
            </span>
          </div>
          {activeFilter === 'non-certified' && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-gray-600">Total Price:</span>
              <span className="text-lg font-bold text-green-600">
                {new Intl.NumberFormat('ms-MY', {
                  style: 'currency',
                  currency: 'MYR'
                }).format(individualPrices[index])}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="p-6 container mx-auto">
        <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="space-y-4 border-b border-gray-200/50 bg-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Diamond Calculator
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {diamonds.length} Diamond{diamonds.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            
            <div className="flex gap-4">
  <Button
    variant={activeFilter === 'certified' ? 'default' : 'outline'}
    onClick={() => handleFilterChange('certified')}
    className="flex-1"
  >
    Certified
  </Button>
  <Button
    variant={activeFilter === 'non-certified' ? 'default' : 'outline'}
    onClick={() => handleFilterChange('non-certified')}
    className="flex-1"
  >
    Non-Certified
  </Button>
</div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {diamonds.map((diamond, index) => (
                  <DiamondInputs
                    key={index}
                    diamond={diamond}
                    index={index}
                    isOnly={diamonds.length === 1}
                  />
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={addDiamond}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Diamond
                </button>
                <button
                  onClick={calculateTotalPrice}
                  disabled={calculationLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Calculator className="w-4 h-4" />
                  {calculationLoading ? 'Calculating...' : 'Calculate Total Price'}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                  {error}
                </div>
              )}

              {totalPrice > 0 && (
                <div className="p-6 bg-white/80 rounded-lg border border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Total Price</p>
                      <p className="text-3xl font-bold text-green-600">
                        {new Intl.NumberFormat('ms-MY', {
                          style: 'currency',
                          currency: 'MYR'
                        }).format(totalPrice)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {diamonds.length} Diamond{diamonds.length > 1 ? 's' : ''} Total
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiamondCalculator;