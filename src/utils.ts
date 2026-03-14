import { Task, TaskTypeConfig, Workflow } from './types';

export const genUUID = () => crypto.randomUUID();
export const today = new Date();
export const fmt = (d: Date | string | null) => {
  if (!d) return '';
  if (d instanceof Date) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  return d;
};
export const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const fmtDateShort = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
export const daysLeft = (d: string | null) => {
  if (!d) return null;
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const canTransition = (task: Task, newStatus: string, taskTypes: TaskTypeConfig[], workflows: Workflow[]) => {
  const type = taskTypes.find(t => t.name === (task.issueType || 'Task'));
  if (!type || !type.workflowId) return { allowed: true };
  
  const workflow = workflows.find(w => w.id === type.workflowId);
  if (!workflow) return { allowed: true };
  
  const transition = workflow.transitions.find(t => t.from === task.status);
  if (!transition) return { allowed: false, reason: `No transitions defined from '${task.status}'` };
  
  if (!transition.to.includes(newStatus)) {
    return { allowed: false, reason: `Cannot transition from '${task.status}' to '${newStatus}'` };
  }
  
  return { allowed: true };
};

export const STATUS_COLORS: Record<string, [string, string]> = {
  'To Do': ['#f3f4f6', '#374151'],
  'Awaiting Info': ['#fffbeb', '#d97706'],
  'In Progress': ['#eff6ff', '#2563eb'],
  'Under Review': ['#f5f3ff', '#7c3aed'],
  'Completed': ['#ecfdf5', '#059669'],
  'On Hold': ['#fff7ed', '#ea580c'],
};
export const PRIORITY_COLORS: Record<string, string> = { High: '#dc2626', Medium: '#d97706', Low: '#059669' };
export const NOTE_COLORS = ['#fff9c4', '#ffecb3', '#f8bbd0', '#e1f5fe', '#e8f5e9', '#f3e5f5'];
export const pct = (val: number, total: number) => total === 0 ? 0 : Math.round((val / total) * 100);
export const TYPE_COLORS: Record<string, { bg: string, text: string }> = {
  GST: { bg: '#fffbeb', text: '#d97706' }, TDS: { bg: '#eff6ff', text: '#2563eb' },
  ITR: { bg: '#f5f3ff', text: '#7c3aed' }, Audit: { bg: '#ecfdf5', text: '#059669' },
  Other: { bg: '#f3f4f6', text: '#374151' }
};
