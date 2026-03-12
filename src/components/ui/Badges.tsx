import React from 'react';
import { STATUS_COLORS, PRIORITY_COLORS, TYPE_COLORS } from '../../utils';

export function StatusBadge({ status }: { status: string }) {
  const [bg, text] = STATUS_COLORS[status] || ['#f3f4f6', '#374151'];
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ background: bg, color: text }}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || '#6b7280';
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ background: color + '22', color }}>
      {priority}
    </span>
  );
}

export function TypeChip({ type }: { type: string }) {
  const { bg, text } = TYPE_COLORS[type] || { bg: '#f3f4f6', text: '#6b7280' };
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: bg, color: text }}>
      {type}
    </span>
  );
}
