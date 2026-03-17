import React from 'react';
import { User } from '../../types';

export function Avatar({ user, size = 28, className = '' }: { user?: User | any; size?: number; className?: string }) {
  if (!user) return null;
  const displayName = user.name || user.full_name || '?';
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('');
  const imgUrl = user.avatarUrl || user.avatar_url;

  return (
    <div 
      className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, background: user.color || '#6b7280', fontSize: size * 0.38 }}
    >
      {imgUrl ? (
        <img src={imgUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </div>
  );
}
