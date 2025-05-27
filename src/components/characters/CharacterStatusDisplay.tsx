'use client';

import React from 'react';

interface CharacterStatus {
  hp: number;
  mp: number;
  stamina: number;
}

interface CharacterStatusDisplayProps {
  status: CharacterStatus;
}

export function CharacterStatusDisplay({ status }: CharacterStatusDisplayProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Health Points */}
      <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
        <div className="text-sm font-medium text-red-600 mb-1">
          Health
        </div>
        <div className="text-2xl font-bold text-red-900">
          {status.hp}
        </div>
        <div className="text-xs text-red-500">
          HP
        </div>
      </div>

      {/* Mana Points */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 text-center">
        <div className="text-sm font-medium text-purple-600 mb-1">
          Mana
        </div>
        <div className="text-2xl font-bold text-purple-900">
          {status.mp}
        </div>
        <div className="text-xs text-purple-500">
          MP
        </div>
      </div>

      {/* Stamina */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
        <div className="text-sm font-medium text-green-600 mb-1">
          Stamina
        </div>
        <div className="text-2xl font-bold text-green-900">
          {status.stamina}
        </div>
        <div className="text-xs text-green-500">
          Points
        </div>
      </div>
    </div>
  );
}