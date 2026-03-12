export const genId = () => Math.random().toString(36).slice(2, 9);
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
export const fmtTime = (d: string | null) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
export const fmtDateTime = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};
export const addDays = (d: Date | string, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const subDays = (d: Date | string, n: number) => addDays(d, -n);
export const daysLeft = (due: string | null) => {
  if (!due) return null;
  const d = new Date(due);
  d.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
};
export const pct = (a: number, b: number) => b === 0 ? 0 : Math.round((a / b) * 100);

export const STATUS_COLORS: Record<string, [string, string]> = {
  'To Do': ['#f3f4f6', '#374151'],
  'Awaiting Info': ['#fffbeb', '#d97706'],
  'In Progress': ['#eff6ff', '#2563eb'],
  'Under Review': ['#f5f3ff', '#7c3aed'],
  'Completed': ['#ecfdf5', '#059669'],
  'On Hold': ['#fff7ed', '#ea580c'],
};
export const PRIORITY_COLORS: Record<string, string> = { High: '#dc2626', Medium: '#d97706', Low: '#059669' };
export const TYPE_COLORS: Record<string, { bg: string, text: string }> = {
  GST: { bg: '#fffbeb', text: '#d97706' }, TDS: { bg: '#eff6ff', text: '#2563eb' },
  ITR: { bg: '#ecfdf5', text: '#059669' }, ROC: { bg: '#f5f3ff', text: '#7c3aed' },
  Audit: { bg: '#f0fdfa', text: '#0d9488' }, MCA: { bg: '#f5f3ff', text: '#7c3aed' },
  'Advance Tax': { bg: '#ecfdf5', text: '#059669' }, FEMA: { bg: '#fff7ed', text: '#ea580c' },
  Labour: { bg: '#f3f4f6', text: '#6b7280' }, Other: { bg: '#f3f4f6', text: '#6b7280' },
};
export const NOTE_COLORS = ['#fef9c3', '#dbeafe', '#d1fae5', '#fce7f3', '#ede9fe', '#ffedd5', '#e0f2fe', '#fef2f2'];
export const USER_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#ea580c', '#0d9488'];
