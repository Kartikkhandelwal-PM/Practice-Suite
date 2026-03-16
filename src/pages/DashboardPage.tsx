import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { daysLeft, pct, canTransition } from '../utils';
import { AlertCircle, Zap, Clock, CheckCircle, Calendar as CalendarIcon, Users, ShieldAlert, GitMerge, Plus, ExternalLink, ArrowRight, FileText, UserPlus, Video, LayoutDashboard, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TypeChip, StatusBadge } from '../components/ui/Badges';
import { Avatar } from '../components/ui/Avatar';
import { TaskModal } from '../components/ui/TaskModal';
import { Task } from '../types';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';

export function DashboardPage() {
  const { tasks, clients, users, deadlines, meetings, taskTypes, workflows, currentUser, updateTask } = useApp();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<string | null>(null);
  const navigate = useNavigate();

  const openNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };
  
  const markComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === id);
    if (task) {
      const check = canTransition(task, 'Completed', taskTypes, workflows);
      if (!check.allowed) {
        toast(check.reason || 'Invalid transition to Completed', 'error');
        return;
      }
    }
    try {
      await updateTask(id, { status: 'Completed' });
      toast('Task marked as completed', 'success');
    } catch (error) {
      console.error('Error marking task complete:', error);
      toast('Failed to update task', 'error');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (currentUser?.role === 'admin') return true;
    return t.assigneeId === currentUser?.id || t.reviewerId === currentUser?.id;
  });

  const overdue = filteredTasks.filter(t => t.status !== 'Completed' && (daysLeft(t.dueDate) ?? 0) < 0);
  const awaitingInfo = filteredTasks.filter(t => t.status === 'Awaiting Info');
  const dueSoon = filteredTasks.filter(t => t.status !== 'Completed' && (daysLeft(t.dueDate) ?? -1) >= 0 && (daysLeft(t.dueDate) ?? 8) <= 7);
  const underReview = filteredTasks.filter(t => t.status === 'Under Review');
  const urgent = deadlines.filter(d => (daysLeft(d.dueDate) ?? 8) <= 7 && (daysLeft(d.dueDate) ?? -1) >= 0);
  const upcomingMeetings = meetings.filter(m => m.attendees.includes(currentUser?.id || '') && (daysLeft(m.date) ?? -1) >= 0 && m.status !== 'completed').slice(0, 3);

  const stats = [
    { id: 'overdue', label: 'Overdue Tasks', num: overdue.length, sub: overdue.length > 0 ? `${Math.abs(Math.min(...overdue.map(t => daysLeft(t.dueDate) || 0)))} days max` : 'No overdue tasks', color: '#dc2626', icon: AlertCircle, filter: 'overdue' },
    { id: 'due-soon', label: 'Due This Week', num: dueSoon.length, sub: 'In the next 7 days', color: '#2563eb', icon: Clock, filter: 'due-soon' },
    { id: 'awaiting-info', label: 'Awaiting Info', num: awaitingInfo.length, sub: 'Blocked by client', color: '#d97706', icon: ShieldAlert, filter: 'Awaiting Info' },
    { id: 'under-review', label: 'Under Review', num: underReview.length, sub: 'Needs partner approval', color: '#8b5cf6', icon: CheckCircle2, filter: 'Under Review' },
  ];

  const handleStatClick = (s: typeof stats[0]) => {
    if (s.id === 'overdue') {
      navigate(`/tasks?tab=overdue`);
    } else if (s.id === 'due-soon') {
      navigate(`/tasks?tab=due-soon`);
    } else if (s.id === 'awaiting-info') {
      navigate(`/tasks?status=Awaiting Info`);
    } else if (s.id === 'under-review') {
      navigate(`/tasks?status=Under Review`);
    }
  };

  const quickActions = [
    { label: 'New Task', icon: Plus, onClick: openNewTask, color: 'bg-blue-600' },
    { label: 'Add Client', icon: UserPlus, onClick: () => navigate('/clients'), color: 'bg-emerald-600' },
    { label: 'Schedule Meeting', icon: Video, onClick: () => navigate('/meetings'), color: 'bg-purple-600' },
    { label: 'Upload Document', icon: FileText, onClick: () => navigate('/documents'), color: 'bg-amber-600' },
  ];

  const getFilteredTasks = () => {
    if (activeView === 'overdue') return overdue;
    if (activeView === 'in-progress') return filteredTasks.filter(t => t.status === 'In Progress');
    if (activeView === 'due-soon') return filteredTasks.filter(t => t.status !== 'Completed' && (daysLeft(t.dueDate) ?? -1) >= 0 && (daysLeft(t.dueDate) ?? 8) <= 7);
    if (activeView === 'completed') return filteredTasks.filter(t => t.status === 'Completed');
    return [];
  };

  return (
    <div className="flex-1 pb-10">
      <PageHeader 
        title={`Welcome back, ${currentUser?.name.split(' ')[0] || 'User'}`}
        description={`Here's what's happening with your practice today, ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.`}
        action={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {quickActions.map((action) => (
              <button 
                key={action.label}
                className={`${action.color} hover:opacity-90 text-white p-2 sm:p-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2 px-3 sm:px-4 text-[12px] sm:text-[13px] font-bold shrink-0`}
                onClick={action.onClick}
              >
                <action.icon size={16} />
                <span className="hidden md:inline">{action.label}</span>
                <span className="md:hidden">{action.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        }
      />

      {currentUser?.email?.toLowerCase() === 'kartikkhandelwal1104@gmail.com' && (
        <div className="mb-6 bg-blue-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-200">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Sparkles size={20} /> Demo Environment Active
              </h3>
              <p className="text-blue-100 text-[14px]">
                You are logged in as a demo user. Feel free to explore all features, including AI-powered inbox and task management.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/settings')}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-blue-50 transition-colors"
              >
                Explore Settings
              </button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-[-20px] left-[20%] w-24 h-24 bg-blue-400/20 rounded-full blur-xl" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            onClick={() => handleStatClick(s)}
            className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-lg transition-all relative overflow-hidden group border-gray-200"
          >
            <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ background: s.color }} />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-gray-500 font-semibold uppercase tracking-wider">{s.label}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: s.color + '18', color: s.color }}>
                <s.icon size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="font-serif text-[38px] font-bold leading-none" style={{ color: s.color }}>{s.num}</div>
              <div className="text-[12px] font-bold text-gray-400">{s.sub}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
              <span>VIEW IN TASK MANAGER</span>
              <ArrowRight size={12} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <AlertCircle size={15} className="text-red-600" />
            <h3 className="text-[14px] font-semibold flex-1">Overdue Tasks</h3>
            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[11px] font-bold">{overdue.length}</span>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            {overdue.length === 0 && <div className="flex flex-col items-center justify-center p-8 text-gray-500"><p>All tasks are on track!</p></div>}
            {overdue.slice(0, 5).map(t => {
              const c = clients.find(x => x.id === t.clientId);
              const a = users.find(x => x.id === t.assigneeId);
              return (
                <div key={t.id} className="flex items-center gap-2.5 px-4.5 py-2.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openEditTask(t)}>
                  <TypeChip type={t.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">#{t.id}</span>
                      <div className="font-medium text-[13px] truncate text-gray-900">{t.title}</div>
                      {t.subtasks && t.subtasks.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0" title={`${t.subtasks.filter(s => s.done).length}/${t.subtasks.length} subtasks done`}>
                          <GitMerge size={10} />
                          <span>{t.subtasks.filter(s => s.done).length}/{t.subtasks.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">{c?.name || '—'}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10.5px] font-bold px-1.5 py-0.5 rounded">
                    {Math.abs(daysLeft(t.dueDate) || 0)}d
                  </span>
                  <Avatar user={a} size={24} />
                  <button 
                    className="ml-2 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                    onClick={(e) => markComplete(t.id, e)}
                    title="Mark Complete"
                  >
                    <CheckCircle size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <CalendarIcon size={15} className="text-blue-600" />
            <h3 className="text-[14px] font-semibold flex-1">Upcoming Meetings</h3>
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[11px] font-bold">{upcomingMeetings.length}</span>
          </div>
          <div className="overflow-y-auto max-h-[300px] p-2">
            {upcomingMeetings.length === 0 && <div className="flex flex-col items-center justify-center p-8 text-gray-500"><p>No upcoming meetings.</p></div>}
            {upcomingMeetings.map(m => {
              const c = clients.find(x => x.id === m.clientId);
              const dl = daysLeft(m.date) || 0;
              return (
                <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-3.5 mb-2 hover:shadow-md transition-shadow border-l-[3px]" style={{ borderLeftColor: dl === 0 ? '#dc2626' : dl <= 2 ? '#d97706' : '#2563eb' }}>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-semibold text-[13px] leading-tight">{m.title}</span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                      {dl === 0 ? 'Today' : dl === 1 ? 'Tomorrow' : new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-start sm:items-center justify-between mt-2 gap-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                      <span className="truncate max-w-[140px]">{c?.name || '—'}</span>
                      <span>{m.time}</span>
                      <span>{m.duration}min</span>
                      <span className="capitalize">{m.platform || m.type}</span>
                    </div>
                    {m.meetLink && (
                      <a 
                        href={m.meetLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded inline-flex items-center justify-center gap-1 transition-colors shrink-0 mt-0.5 sm:mt-0"
                      >
                        Join <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <ShieldAlert size={15} className="text-amber-600" />
            <h3 className="text-[14px] font-semibold flex-1">Compliance Deadlines — Next 7 Days</h3>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            {urgent.length === 0 && <div className="flex flex-col items-center justify-center p-8 text-gray-500"><p>No urgent deadlines.</p></div>}
            {urgent.map(d => {
              const dl = daysLeft(d.dueDate) || 0;
              return (
                <div key={d.id} className="flex items-center gap-2.5 px-4.5 py-2.5 border-b border-gray-100">
                  <TypeChip type={d.category} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[13px]">{d.title}</div>
                    <div className="text-[11px] text-gray-500">{d.clients} clients · {d.form}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${dl <= 3 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    {dl === 0 ? 'Today' : `${dl}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.32 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <ShieldAlert size={15} className="text-amber-600" />
            <h3 className="text-[14px] font-semibold flex-1">Awaiting Client Info</h3>
            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-[11px] font-bold">{awaitingInfo.length}</span>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            {awaitingInfo.length === 0 && <div className="flex flex-col items-center justify-center p-8 text-gray-500"><p>No tasks blocked by clients.</p></div>}
            {awaitingInfo.slice(0, 5).map(t => {
              const c = clients.find(x => x.id === t.clientId);
              const a = users.find(x => x.id === t.assigneeId);
              return (
                <div key={t.id} className="flex items-center gap-2.5 px-4.5 py-2.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => openEditTask(t)}>
                  <TypeChip type={t.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">#{t.id}</span>
                      <div className="font-medium text-[13px] truncate text-gray-900">{t.title}</div>
                    </div>
                    <div className="text-[11px] text-gray-500">{c?.name || '—'}</div>
                  </div>
                  <Avatar user={a} size={24} />
                  <button 
                    className="ml-2 px-2 py-1 rounded-md border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    onClick={(e) => { e.stopPropagation(); openEditTask(t); }}
                  >
                    Follow Up
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm lg:col-span-2"
        >
          <div className="flex items-center gap-2.5 p-4 border-b border-gray-200">
            <Users size={15} className="text-purple-600" />
            <h3 className="text-[14px] font-semibold flex-1">Team Workload & Insights</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {users.map(u => {
              const uTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== 'Completed');
              const uOverdue = uTasks.filter(t => (daysLeft(t.dueDate) ?? 0) < 0);
              const uDueSoon = uTasks.filter(t => (daysLeft(t.dueDate) ?? -1) >= 0 && (daysLeft(t.dueDate) ?? 8) <= 7);
              const uAwaiting = uTasks.filter(t => t.status === 'Awaiting Info');
              
              return (
                <div key={u.id} className="border border-gray-100 rounded-xl p-3.5 hover:shadow-md transition-shadow bg-gray-50/30 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar user={u} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-gray-900 truncate">{u.name}</div>
                      <div className="text-[11px] text-gray-500 truncate">{u.designation}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4 flex-1">
                    <div className="bg-white border border-gray-100 rounded-lg p-2 flex flex-col items-center justify-center">
                      <span className="text-[18px] font-bold text-gray-700">{uTasks.length}</span>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Active</span>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-2 flex flex-col items-center justify-center">
                      <span className="text-[18px] font-bold text-red-600">{uOverdue.length}</span>
                      <span className="text-[10px] text-red-600/80 uppercase font-semibold">Overdue</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 flex flex-col items-center justify-center">
                      <span className="text-[18px] font-bold text-blue-600">{uDueSoon.length}</span>
                      <span className="text-[10px] text-blue-600/80 uppercase font-semibold">Due Soon</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 flex flex-col items-center justify-center">
                      <span className="text-[18px] font-bold text-amber-600">{uAwaiting.length}</span>
                      <span className="text-[10px] text-amber-600/80 uppercase font-semibold">Blocked</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/tasks?assignee=${u.id}`)}
                    className="w-full py-2 bg-white border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
                  >
                    View Tasks <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
