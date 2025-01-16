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

  // Base price per carat
  const basePrice: number = 23750;
  
  const clarityMultipliers: DiamondCharacteristics = {
    'FL': 2.0, 'IF': 1.8, 'VVS1': 1.6, 'VVS2': 1.5,
    'VS1': 1.4, 'VS2': 1.3, 'SI1': 1.2, 'SI2': 1.1, 'I1': 0.9,
  };

  const colorMultipliers: DiamondCharacteristics = {
    'D': 1.8, 'E': 1.6, 'F': 1.4, 'G': 1.3,
    'H': 1.2, 'I': 1.1, 'J': 1.0, 'K': 0.9,
  };

  const cutMultipliers: DiamondCharacteristics = {
    'Excellent': 1.5, 'Very Good': 1.3, 'Good': 1.1,
    'Fair': 0.9, 'Poor': 0.7,
  };

  const certificationMultipliers: DiamondCharacteristics = {
    'GIA': 1.3, 'AGS': 1.25, 'IGI': 1.1, 'HRD': 1.2, 'None': 1.0
  };

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

  const calculateDiamondPrice = (diamond: DiamondState): number => {
    const caratValue = parseFloat(diamond.carat);
    const clarityMultiplier = clarityMultipliers[diamond.clarity];
    const colorMultiplier = colorMultipliers[diamond.color];
    const cutMultiplier = cutMultipliers[diamond.cut];
    const certificationMultiplier = certificationMultipliers[diamond.certification];

    return basePrice * caratValue * clarityMultiplier * colorMultiplier * cutMultiplier * certificationMultiplier;
  };

  const calculateTotalPrice = (): void => {
    const total = diamonds.reduce((sum, diamond) => sum + calculateDiamondPrice(diamond), 0);
    setTotalPrice(Math.round(total));
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
            {Object.keys(clarityMultipliers).map((c) => (
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
            {Object.keys(colorMultipliers).map((c) => (
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
            {Object.keys(cutMultipliers).map((c) => (
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
            {Object.keys(certificationMultipliers).map((c) => (
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
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Calculator className="w-5 h-5" />
                  Calculate Total Price
                </button>
              </div>

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