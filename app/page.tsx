// app/page.tsx
import DiamondCalculator from '@/app/diamond-calculator/page';
import React from 'react';

export default function Home(): React.ReactElement {
  return (
    <main className="container mx-auto p-4">
      <DiamondCalculator />
    </main>
  );
}