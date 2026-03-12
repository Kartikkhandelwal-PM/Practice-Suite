import React, { useState } from 'react';
import { X } from 'lucide-react';

export function TagInput({ tags = [], onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  
  const addTag = () => {
    const v = input.trim().toLowerCase().replace(/\s+/g, '-');
    if (v && !tags.includes(v)) {
      onChange([...tags, v]);
    }
    setInput('');
  };

  return (
    <div 
      className="flex flex-wrap gap-1.5 p-1.5 border border-gray-200 rounded-lg bg-white min-h-[38px] cursor-text focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all"
      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
    >
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 text-xs font-semibold">
          {t}
          <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="opacity-70 hover:opacity-100">
            <X size={12} />
          </button>
        </span>
      ))}
      <input 
        value={input} 
        placeholder="Add tag..." 
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
          }
          if (e.key === 'Backspace' && !input && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        className="border-none outline-none bg-transparent text-[13px] min-w-[80px] flex-1 text-gray-900"
      />
    </div>
  );
}
