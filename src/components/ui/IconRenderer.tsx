import React from 'react';
import { 
  CheckSquare, GitMerge, Bug, Zap, Circle, AlertCircle, 
  FileText, Settings, Star, Folder, Users, Mail, 
  Calendar, Clock, AlertTriangle, Info, HelpCircle, Bot,
  Layout, List, CheckCircle2, Search, Filter, Plus,
  Trash2, Send, Inbox, Paperclip, Link as LinkIcon,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
  X, Edit2, MoreVertical, MoreHorizontal, ExternalLink,
  ArrowRight, ArrowLeft, UserPlus, Video, ShieldAlert,
  ShieldCheck, Sliders, LogOut, GitBranch, GitPullRequest
} from 'lucide-react';

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export function IconRenderer({ name, size = 16, className = '' }: IconRendererProps) {
  const iconMap: Record<string, React.ElementType> = {
    'check-square': CheckSquare,
    'git-merge': GitMerge,
    'bug': Bug,
    'zap': Zap,
    'circle': Circle,
    'alert-circle': AlertCircle,
    'file-text': FileText,
    'settings': Settings,
    'star': Star,
    'folder': Folder,
    'users': Users,
    'mail': Mail,
    'calendar': Calendar,
    'clock': Clock,
    'alert-triangle': AlertTriangle,
    'info': Info,
    'help-circle': HelpCircle,
    'bot': Bot,
    'layout': Layout,
    'list': List,
    'check-circle': CheckCircle2,
    'search': Search,
    'filter': Filter,
    'plus': Plus,
    'trash': Trash2,
    'send': Send,
    'inbox': Inbox,
    'paperclip': Paperclip,
    'link': LinkIcon,
    'chevron-down': ChevronDown,
    'chevron-up': ChevronUp,
    'chevron-right': ChevronRight,
    'chevron-left': ChevronLeft,
    'x': X,
    'edit': Edit2,
    'more-vertical': MoreVertical,
    'more-horizontal': MoreHorizontal,
    'external-link': ExternalLink,
    'arrow-right': ArrowRight,
    'arrow-left': ArrowLeft,
    'user-plus': UserPlus,
    'video': Video,
    'shield-alert': ShieldAlert,
    'shield-check': ShieldCheck,
    'sliders': Sliders,
    'logout': LogOut,
    'git-branch': GitBranch,
    'git-pull-request': GitPullRequest,
  };

  const IconComponent = iconMap[name.toLowerCase()] || Circle;
  return <IconComponent size={size} className={className} />;
}
