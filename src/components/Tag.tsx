import React from 'react';
import type { FoodCondition, FoodStatus } from '../types';

type Props = { status: FoodCondition | FoodStatus };

const MAP: Record<string, { bg: string; label: string }> = {
  edible:    { bg: 'bg-edible',   label: '✅ Edible' },
  unfit:     { bg: 'bg-unfit',    label: '⚠️ Unfit' },
  available: { bg: 'bg-midGreen', label: 'Available' },
  claimed:   { bg: 'bg-claimed',  label: '📋 Claimed' },
  collected: { bg: 'bg-primary',  label: '✔ Collected' },
  biogas:    { bg: 'bg-brick',    label: '♻️ Biogas' },
};

export default function Tag({ status }: Props) {
  const { bg, label } = MAP[status] ?? { bg: 'bg-gray-400', label: status };
  return (
    <span className={`text-white text-xs px-2 py-0.5 rounded font-medium ${bg}`}>
      {label}
    </span>
  );
}
