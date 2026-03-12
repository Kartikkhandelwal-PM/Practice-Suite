import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: React.ReactNode;
  searchLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({ options, value, onChange, placeholder = 'Select...', className = '' }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => {
    const textToSearch = o.searchLabel || (typeof o.label === 'string' ? o.label : '');
    return textToSearch.toLowerCase().includes(search.toLowerCase());
  });
  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div 
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] bg-white flex items-center justify-between cursor-pointer hover:border-gray-300"
        onClick={() => { setOpen(!open); setSearch(''); }}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-slide-down">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input 
              className="w-full outline-none text-[13px]" 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && <div className="p-3 text-[12px] text-gray-500 text-center">No results found</div>}
            {filtered.map(o => (
              <div 
                key={o.value}
                className={`px-3 py-2 text-[13px] cursor-pointer hover:bg-gray-50 ${o.value === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
