import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { daysLeft, pct, STATUS_COLORS, PRIORITY_COLORS, today, fmt, canTransition } from '../utils';
import { Plus, GitMerge, KanbanSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { TypeChip } from '../components/ui/Badges';
import { Avatar } from '../components/ui/Avatar';
import { TaskModal } from '../components/ui/TaskModal';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { IconRenderer } from '../components/ui/IconRenderer';
import { Task } from '../types';
import { PageHeader } from '../components/ui/PageHeader';

export function KanbanPage() {
  const { tasks, clients, users, taskTypes, workflows, currentUser, updateTask: persistUpdateTask } = useApp();
  const toast = useToast();
  
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  const toggleParent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedParents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openNewTask = (status?: string) => {
    if (status) {
      setEditingTask({
        id: '',
        title: '',
        clientId: clients[0]?.id || '',
        type: 'GST',
        issueType: 'Task',
        status,
        priority: 'Medium',
        assigneeId: currentUser?.id || users[0]?.id || '',
        reporterId: currentUser?.id || users[0]?.id || '',
        reviewerId: '',
        dueDate: fmt(today),
        createdAt: fmt(today),
        recurring: 'One-time',
        description: '',
        tags: [],
        subtasks: [],
        comments: [],
        attachments: [],
        activity: [{ text: 'Task created', at: fmt(today) }]
      });
    } else {
      setEditingTask(null);
    }
    setIsModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (updates.status) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        const check = canTransition(task, updates.status, taskTypes, workflows);
        if (!check.allowed) {
          toast(check.reason || 'Invalid transition', 'error');
          return;
        }
      }
    }
    try {
      await persistUpdateTask(id, updates);
      toast('Task updated', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      toast('Failed to update task', 'error');
    }
  };

  const filtered = tasks.filter(t =>
    (!filterClient || t.clientId === filterClient) &&
    (!filterType || t.type === filterType) &&
    (!filterUser || t.assigneeId === filterUser) &&
    (!t.parentId || expandedParents.includes(t.parentId))
  );

  const COLS = Array.from(new Set(workflows.flatMap(w => w.statuses)));

  const drop = async (status: string) => {
    if (!dragId || !status) return;
    const task = tasks.find(t => t.id === dragId);
    if (task) {
      const check = canTransition(task, status, taskTypes, workflows);
      if (!check.allowed) {
        toast(check.reason || 'Invalid transition', 'error');
        setDragId(null);
        setDragOver(null);
        return;
      }
      try {
        await persistUpdateTask(dragId, { 
          status, 
          activity: [{ text: `Moved to ${status}`, at: fmt(today) }, ...(task.activity || [])] 
        });
        toast(`Moved to ${status}`, 'success');
      } catch (error) {
        console.error('Error moving task:', error);
        toast('Failed to move task', 'error');
      }
    }
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Kanban Board" 
        description="Visualize your workflow and track task progress across stages."
        action={
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200" onClick={() => openNewTask()}>
            <Plus size={18} /> New Task
          </button>
        }
      />

      <div className="flex gap-2 items-center flex-wrap mb-4 shrink-0">
        <div className="w-full sm:w-[200px]">
          <SearchableSelect 
            options={[{ value: '', label: 'All Clients' }, ...clients.map(c => ({ value: c.id, label: c.name }))]} 
            value={filterClient} 
            onChange={setFilterClient} 
            placeholder="All Clients" 
          />
        </div>
        <div className="w-full sm:w-[160px]">
          <SearchableSelect 
            options={[{ value: '', label: 'All Types' }, ...['GST', 'TDS', 'ITR', 'ROC', 'Audit', 'MCA', 'Advance Tax', 'FEMA', 'Labour', 'Other'].map(t => ({ value: t, label: t }))]} 
            value={filterType} 
            onChange={setFilterType} 
            placeholder="All Types" 
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <SearchableSelect 
            options={[{ value: '', label: 'All Assignees' }, ...users.map(u => ({ value: u.id, label: u.name }))]} 
            value={filterUser} 
            onChange={setFilterUser} 
            placeholder="All Assignees" 
          />
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2">
          <button 
            className="text-[12.5px] text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => setExpandedParents(expandedParents.length > 0 ? [] : tasks.filter(t => !t.parentId).map(t => t.id))}
          >
            {expandedParents.length > 0 ? 'Hide All Subtasks' : 'Show All Subtasks'}
          </button>
        </div>
      </div>

      <div className="flex gap-3.5 overflow-x-auto pb-4 flex-1 custom-scrollbar items-start">
        {COLS.map((col, i) => {
          const colTasks = filtered.filter(t => t.status === col);
          const [bg, text] = STATUS_COLORS[col] || ['#f3f4f6', '#374151'];
          return (
            <motion.div 
              key={col} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`w-[85vw] sm:w-[260px] shrink-0 flex flex-col bg-gray-50 rounded-xl border-[1.5px] transition-all max-h-full shadow-sm ${dragOver === col ? 'border-blue-600 bg-blue-50/50' : 'border-transparent'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(col); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => drop(col)}
            >
              <div className="flex items-center gap-2 px-3.5 py-3 bg-white rounded-t-xl border-b border-gray-200 shrink-0">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap" style={{ background: bg, color: text }}>{col}</span>
                <span className="flex-1"></span>
                <span className="text-[11px] font-bold text-gray-400">{colTasks.length}</span>
                <button className="w-[22px] h-[22px] rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 ml-0.5 transition-colors" onClick={() => openNewTask(col)}>
                  <Plus size={12} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
                {colTasks.length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-lg">Drop tasks here</div>
                )}
                {colTasks.map(t => {
                  const c = clients.find(x => x.id === t.clientId);
                  const a = users.find(x => x.id === t.assigneeId);
                  const dl = daysLeft(t.dueDate);
                  const childTasks = tasks.filter(x => x.parentId === t.id);
                  const done = childTasks.filter(s => s.status === 'Completed').length;
                  const total = childTasks.length;
                  const taskType = taskTypes.find(type => type.name === (t.issueType || 'Task'));
                  const parentTask = t.parentId ? tasks.find(x => x.id === t.parentId) : null;
                  
                  let dueClass = "text-gray-400";
                  let cardBorderClass = "border-gray-200";
                  if (dl !== null) {
                    if (dl < 0) {
                      dueClass = "text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-bold";
                      cardBorderClass = "border-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]";
                    } else if (dl <= 2) {
                      dueClass = "text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-bold";
                      cardBorderClass = "border-orange-300 shadow-[0_0_0_1px_rgba(249,115,22,0.2)]";
                    } else {
                      dueClass = "text-gray-500 font-medium";
                    }
                  }

                  return (
                    <div 
                      key={t.id} 
                      className={`bg-white rounded-lg p-3 border cursor-grab hover:shadow-md hover:-translate-y-[1px] transition-all ${cardBorderClass} ${dragId === t.id ? 'opacity-40' : ''}`}
                      draggable={true}
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => { setDragId(null); setDragOver(null); }}
                      onClick={() => openEditTask(t)}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        {taskType && (
                          <div className="w-4 h-4 rounded flex items-center justify-center text-white shrink-0" style={{ backgroundColor: taskType.color }} title={taskType.name}>
                            <IconRenderer name={taskType.icon} size={10} />
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-gray-400">#{t.id}</span>
                        {parentTask && (
                          <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1" title={`Parent: ${parentTask.title}`}>
                            ↑ #{parentTask.id}
                          </span>
                        )}
                        <span className={`text-[10px] ml-auto whitespace-nowrap ${dueClass}`}>
                          {dl !== null ? (dl < 0 ? `${Math.abs(dl)}d late` : dl === 0 ? 'Today' : `${dl}d`) : '—'}
                        </span>
                      </div>
                      <div className="font-semibold text-[12.5px] leading-snug mb-1.5 text-gray-900 flex items-start justify-between gap-2">
                        <span>{t.title}</span>
                        {total > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0" title={`${done}/${total} subtasks done`}>
                            <GitMerge size={10} />
                            <span>{done}/{total}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mb-2 truncate">{c?.name || '—'}</div>
                      {total > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mt-1 mb-1.5">
                            <button 
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                              onClick={(e) => toggleParent(t.id, e)}
                            >
                              {expandedParents.includes(t.id) ? 'Hide Subtasks' : 'Show Subtasks'}
                            </button>
                          </div>
                          <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${pct(done, total)}%` }} />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: PRIORITY_COLORS[t.priority] }} />
                        <div className="relative group" onClick={e => e.stopPropagation()}>
                          <Avatar user={a} size={22} />
                          <select 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={t.assigneeId}
                            onChange={e => updateTask(t.id, { assigneeId: e.target.value })}
                            title="Change Assignee"
                          >
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
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
