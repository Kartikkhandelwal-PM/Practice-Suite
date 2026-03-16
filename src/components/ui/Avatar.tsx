import React from 'react';
import { User } from '../../types';

export function Avatar({ user, size = 28, className = '' }: { user?: User; size?: number; className?: string }) {
  if (!user) return null;
  const initials = (user.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <div 
      className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 ${className}`}
      style={{ width: size, height: size, background: user.color || '#6b7280', fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
