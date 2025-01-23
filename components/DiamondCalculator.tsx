"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, MinusCircle, Diamond, Calculator } from 'lucide-react';
import { useState } from 'react';

interface DiamondCharacteristics {
  [key: string]: number;
}

interface DiamondState {
  carat: string;
  clarity: string;
  color: string;
  cut: string;
  certification: string;
}

const DiamondCalculator = () => {
  const initialDiamondState: DiamondState = {
    carat: '1.0',
    clarity: 'VS1',
    color: 'D',
    cut: 'Excellent',
    certification: 'GIA'
  };

  const [diamonds, setDiamonds] = useState<DiamondState[]>([{...initialDiamondState}]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // These constants are kept for the select options, but calculation is moved to backend
  const clarityOptions = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'];
  const colorOptions = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
  const cutOptions = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
  const certificationOptions = ['GIA', 'AGS', 'IGI', 'HRD', 'None'];

  const addDiamond = () => {
    setDiamonds([...diamonds, { ...initialDiamondState, carat: '0.5' }]);
  };

  const removeDiamond = (index: number) => {
    const newDiamonds = diamonds.filter((_, i) => i !== index);
    setDiamonds(newDiamonds);
  };

  const updateDiamond = (index: number, updates: Partial<DiamondState>) => {
    const newDiamonds = diamonds.map((diamond, i) => 
      i === index ? { ...diamond, ...updates } : diamond
    );
    setDiamonds(newDiamonds);
  };

  const calculateTotalPrice = async (): Promise<void> => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diamonds: diamonds.map(diamond => ({
            ...diamond,
            carat: parseFloat(diamond.carat)
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate price');
      }

      const data = await response.json();
      setTotalPrice(data.total_price);
    } catch (error) {
      console.error('Error calculating price:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate price');
    } finally {
      setIsLoading(false);
    }
  };

  const DiamondInputs = ({ diamond, index, isOnly }: { 
    diamond: DiamondState, 
    index: number,
    isOnly: boolean
  }) => (
    <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-gray-200 shadow-lg min-w-[300px]">
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
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <MinusCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Carat Weight</label>
          <input
            type="number"
            value={diamond.carat}
            onChange={(e) => updateDiamond(index, { carat: e.target.value })}
            step="0.01"
            min="0.1"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clarity</label>
          <select
            value={diamond.clarity}
            onChange={(e) => updateDiamond(index, { clarity: e.target.value })}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
          >
            {clarityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <select
            value={diamond.color}
            onChange={(e) => updateDiamond(index, { color: e.target.value })}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
          >
            {colorOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cut</label>
          <select
            value={diamond.cut}
            onChange={(e) => updateDiamond(index, { cut: e.target.value })}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
          >
            {cutOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Certification</label>
          <select
            value={diamond.certification}
            onChange={(e) => updateDiamond(index, { certification: e.target.value })}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80"
          >
            {certificationOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="p-6 container mx-auto">
        <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="space-y-1 border-b border-gray-200/50 bg-white/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Diamond Calculator
              </CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {diamonds.length} Diamond{diamonds.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-wrap gap-4">
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
                  className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors shadow-lg"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add Diamond
                </button>

                <button 
                  onClick={calculateTotalPrice}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calculator className="w-5 h-5" />
                  {isLoading ? 'Calculating...' : 'Calculate Total Price'}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                  {error}
                </div>
              )}

              {totalPrice > 0 && (
                <div className="mt-6 p-6 bg-white/80 rounded-lg border border-gray-200 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Total Price</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {new Intl.NumberFormat('ms-MY', { 
                          style: 'currency', 
                          currency: 'MYR' 
                        }).format(totalPrice)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
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