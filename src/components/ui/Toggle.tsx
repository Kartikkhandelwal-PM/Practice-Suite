import React from 'react';

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div 
      className="w-[38px] h-[22px] rounded-full cursor-pointer relative shrink-0 transition-colors duration-200"
      style={{ background: value ? '#2563eb' : '#e5e7eb' }}
      onClick={() => onChange(!value)}
    >
      <div 
        className="w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm"
        style={{ left: value ? '19px' : '3px' }}
      />
    </div>
  );
}
