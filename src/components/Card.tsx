import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export default function Card({ children, className = '', onClick }: Props) {
  return (
    <div
      className={`bg-lightGrey rounded-card p-4 shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
