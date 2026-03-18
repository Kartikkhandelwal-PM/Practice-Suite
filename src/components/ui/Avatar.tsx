import React, { useState } from 'react';
import { User } from '../../types';

export function Avatar({ user, size = 28, className = '' }: { user?: User | any; size?: number; className?: string }) {
  const [imgError, setImgError] = useState(false);
  if (!user) return null;
  
  const displayName = user.name || user.full_name || '?';
  const initials = displayName.split(' ').length > 1 
    ? displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : displayName.slice(0, 2).toUpperCase();
  const imgUrl = user.avatarUrl || user.avatar_url;

  return (
    <div 
      className={`flex items-center justify-center rounded-full text-white font-bold shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, background: user.color || '#6b7280', fontSize: size * 0.38 }}
    >
      {imgUrl && !imgError ? (
        <img 
          src={imgUrl} 
          alt={displayName} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
