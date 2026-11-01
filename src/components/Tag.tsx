import React from 'react';

type Props = { status: 'edible' | 'claimed' | 'unfit' | 'collected' };

export default function Tag({ status }: Props) {
  const map = {
    edible: { bg: 'bg-edible', label: 'Edible' },
    claimed: { bg: 'bg-claimed', label: 'Claimed' },
    unfit: { bg: 'bg-unfit', label: 'Unfit → Biogas' },
    collected: { bg: 'bg-midGreen', label: 'Collected' },
  } as const;
  const { bg, label } = map[status];
  return (
    <span className={`text-white text-xs px-2 py-1 rounded ${bg}`}>{label}</span>
  );
}
