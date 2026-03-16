import React from 'react';
import { CheckSquare, GitMerge, Bug, Zap, Circle, AlertCircle, FileText, Settings, Star } from 'lucide-react';

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export function IconRenderer({ name, size = 16, className = '' }: IconRendererProps) {
  switch (name) {
    case 'check-square': return <CheckSquare size={size} className={className} />;
    case 'git-merge': return <GitMerge size={size} className={className} />;
    case 'bug': return <Bug size={size} className={className} />;
    case 'zap': return <Zap size={size} className={className} />;
    case 'circle': return <Circle size={size} className={className} />;
    case 'alert-circle': return <AlertCircle size={size} className={className} />;
    case 'file-text': return <FileText size={size} className={className} />;
    case 'settings': return <Settings size={size} className={className} />;
    case 'star': return <Star size={size} className={className} />;
    default: return <Circle size={size} className={className} />;
  }
}
