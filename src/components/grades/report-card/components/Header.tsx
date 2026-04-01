import React from 'react';
import { School } from 'lucide-react';

export function Header() {
  return (
    <header className="header">
      <div className="school-info">
        <div className="flex items-center gap-3 mb-4">
          <School className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">COLLEGE PRIVE SULLY</h1>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p>L'issue vers la réussite</p>
          <p>Lot IV A 16 bis Ambodivonkely - Tél: 85 234 94</p>
          <p>sully@moov.mg</p>
        </div>
      </div>
    </header>
  );
}