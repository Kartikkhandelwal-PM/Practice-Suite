import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[24px] font-serif font-bold text-gray-900 leading-tight">{title}</h2>
          {description && <p className="text-[13px] text-gray-500 mt-1">{description}</p>}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {action && (
            <div className="flex items-center gap-3">
              {action}
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
