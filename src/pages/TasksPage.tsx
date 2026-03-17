import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { daysLeft, STATUS_COLORS, PRIORITY_COLORS, canTransition } from '../utils';
import { Plus, Search, ChevronDown, ChevronUp, Check, Trash2, Maximize2, ListTodo, GitMerge, Filter, Calendar, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TypeChip, StatusBadge, PriorityBadge } from '../components/ui/Badges';
import { Avatar } from '../components/ui/Avatar';
import { TaskModal } from '../components/ui/TaskModal';
import { IconRenderer } from '../components/ui/IconRenderer';
import { Task } from '../types';
import { Pagination } from '../components/ui/Pagination';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';

export function TasksPage() {
  const { tasks, clients, users, taskTypes, workflows, currentUser, updateTask: persistUpdateTask, deleteTask: persistDeleteTask } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterClient, setFilterClient] = useState(searchParams.get('client') || '');
  const [filterType, setFilterType] = useState(searchParams.get('type') || '');
  const [filterIssueType, setFilterIssueType] = useState(searchParams.get('issueType') || '');
  const [filterPriority, setFilterPriority] = useState(searchParams.get('priority') || '');
  const [filterAssignee, setFilterAssignee] = useState(searchParams.get('assignee') || '');
  const [dateStart, setDateStart] = useState(searchParams.get('start') || '');
  const [dateEnd, setDateEnd] = useState(searchParams.get('end') || '');
  
  const [sortCol, setSortCol] = useState<keyof typeof tasks[0]>('dueDate');
  const [sortDir, setSortDir] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState(searchParams.get('tab') || 'all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showFilters, setShowFilters] = useState(
    !!(searchParams.get('status') || searchParams.get('client') || searchParams.get('type') || searchParams.get('issueType') || searchParams.get('priority') || searchParams.get('assignee') || searchParams.get('start') || searchParams.get('end'))
  );
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const params: any = {};
    if (tab !== 'all') params.tab = tab;
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    if (filterClient) params.client = filterClient;
    if (filterType) params.type = filterType;
    if (filterIssueType) params.issueType = filterIssueType;
    if (filterPriority) params.priority = filterPriority;
    if (filterAssignee) params.assignee = filterAssignee;
    if (dateStart) params.start = dateStart;
    if (dateEnd) params.end = dateEnd;
    setSearchParams(params);
  }, [tab, search, filterStatus, filterClient, filterType, filterIssueType, filterPriority, filterAssignee, dateStart, dateEnd]);

  const sort = (col: keyof typeof tasks[0]) => {
    setSortCol(col);
    setSortDir(d => sortCol === col ? -d : 1);
  };

  const openNewTask = () => {
    setEditingTask(null);
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

  const deleteTask = async (id: string) => {
    if (await confirm({ title: 'Delete Task', message: 'Are you sure you want to delete this task?', danger: true })) {
      try {
        await persistDeleteTask(id);
        toast('Task deleted', 'success');
      } catch (error) {
        console.error('Error deleting task:', error);
        toast('Failed to delete task', 'error');
      }
    }
  };

  const filtered = useMemo(() => {
    let t = tasks;
    
    // Non-admins only see tasks they are involved in
    if (currentUser?.role?.toLowerCase() !== 'admin') {
      t = t.filter(x => x.assigneeId === currentUser?.id || x.reviewerId === currentUser?.id);
    }

    if (tab === 'mine') t = t.filter(x => x.assigneeId === currentUser?.id);
    if (tab === 'overdue') t = t.filter(x => x.status !== 'Completed' && (daysLeft(x.dueDate) ?? 0) < 0);
    if (tab === 'due-soon') t = t.filter(x => x.status !== 'Completed' && (daysLeft(x.dueDate) ?? -1) >= 0 && (daysLeft(x.dueDate) ?? 8) <= 7);
    if (tab === 'recurring') t = t.filter(x => x.recurring && x.recurring !== 'One-time');
    if (tab === 'completed') t = t.filter(x => x.status === 'Completed');
    
    if (search) {
      const s = search.toLowerCase();
      t = t.filter(x => 
        x.title.toLowerCase().includes(s) || 
        x.id.toLowerCase().includes(s) ||
        clients.find(c => c.id === x.clientId)?.name.toLowerCase().includes(s)
      );
    }
    if (filterStatus) t = t.filter(x => x.status === filterStatus);
    if (filterClient) t = t.filter(x => x.clientId === filterClient);
    if (filterType) t = t.filter(x => x.type === filterType);
    if (filterIssueType) t = t.filter(x => x.issueType === filterIssueType);
    if (filterPriority) t = t.filter(x => x.priority === filterPriority);
    if (filterAssignee) t = t.filter(x => x.assigneeId === filterAssignee);
    if (dateStart) t = t.filter(x => x.dueDate >= dateStart);
    if (dateEnd) t = t.filter(x => x.dueDate <= dateEnd);
    
    // If showSubtasks is ON, we only want to show top-level tasks in the main list
    // to avoid double rendering. However, if a subtask matches the filter but its
    // parent doesn't, we should still show it at the top level.
    if (showSubtasks) {
      const filteredIds = new Set(t.map(x => x.id));
      t = t.filter(x => !x.parentId || !filteredIds.has(x.parentId));
    }

    return [...t].sort((a, b) => {
      const av = sortCol === 'dueDate' ? (a[sortCol] || '9999-99-99') : (a[sortCol] || '');
      const bv = sortCol === 'dueDate' ? (b[sortCol] || '9999-99-99') : (b[sortCol] || '');
      return av < bv ? -sortDir : av > bv ? sortDir : 0;
    });
  }, [tasks, clients, tab, search, filterStatus, filterClient, filterType, filterIssueType, filterPriority, filterAssignee, dateStart, dateEnd, sortCol, sortDir, showSubtasks]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSelected(filtered.map(t => t.id));
  const clearSelect = () => setSelected([]);
  
  const bulkComplete = async () => {
    let successCount = 0;
    let failCount = 0;
    
    const toUpdate = tasks.filter(t => selected.includes(t.id));
    
    try {
      await Promise.all(toUpdate.map(async (t) => {
        const check = canTransition(t, 'Completed', taskTypes, workflows);
        if (check.allowed) {
          await persistUpdateTask(t.id, { status: 'Completed' });
          successCount++;
        } else {
          failCount++;
        }
      }));
      
      clearSelect();
      if (failCount > 0) {
        toast(`${successCount} tasks completed. ${failCount} tasks could not be completed due to workflow rules.`, 'warning');
      } else {
        toast(`${successCount} tasks marked complete`, 'success');
      }
    } catch (error) {
      console.error('Error bulk completing tasks:', error);
      toast('Failed to complete some tasks', 'error');
    }
  };
  
  const bulkDelete = async () => {
    if (await confirm({ title: 'Delete Tasks', message: `Are you sure you want to delete ${selected.length} tasks?`, danger: true })) {
      try {
        await Promise.all(selected.map(id => persistDeleteTask(id)));
        clearSelect();
        toast('Tasks deleted', 'success');
      } catch (error) {
        console.error('Error bulk deleting tasks:', error);
        toast('Failed to delete some tasks', 'error');
      }
    }
  };

  const SH = ({ col, label }: { col: keyof typeof tasks[0], label: string }) => (
    <th className="cursor-pointer select-none hover:bg-gray-100 transition-colors px-3.5 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider" onClick={() => sort(col)}>
      <span className="flex items-center gap-1">
        {label}
        {sortCol === col && (sortDir === 1 ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
      </span>
    </th>
  );

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader 
        title="Tasks" 
        description="Manage and track all your practice tasks and deadlines."
        action={
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200" onClick={openNewTask}>
            <Plus size={18} /> New Task
          </button>
        }
      />

      <div className="flex gap-2 items-center flex-wrap mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-[220px] focus-within:border-blue-600 transition-colors">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input 
            placeholder="Search tasks or IDs..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
          />
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-1.5 border rounded-lg text-[12.5px] font-medium flex items-center gap-2 transition-all ${showFilters || filterStatus || filterClient || filterType || filterIssueType || filterPriority || filterAssignee || dateStart || dateEnd || tab !== 'all' ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
        >
          <Filter size={14} />
          Filters {(filterStatus || filterClient || filterType || filterIssueType || filterPriority || filterAssignee || dateStart || dateEnd || tab !== 'all') ? '(Active)' : ''}
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {tab !== 'all' && (
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[12px] font-medium border border-blue-200">
            <span>
              {tab === 'overdue' ? 'Overdue Tasks' : 
               tab === 'due-soon' ? 'Due This Week' : 
               tab === 'mine' ? 'My Tasks' : 
               tab === 'recurring' ? 'Recurring Tasks' : 
               tab === 'completed' ? 'Completed Tasks' : tab}
            </span>
            <button onClick={() => setTab('all')} className="hover:bg-blue-200 p-0.5 rounded-full transition-colors">
              <X size={12} />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          <label className="flex items-center gap-2 text-[12.5px] text-gray-600 cursor-pointer hover:text-gray-900">
            <input 
              type="checkbox" 
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={showSubtasks}
              onChange={e => setShowSubtasks(e.target.checked)}
            />
            Show Subtasks
          </label>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Status</label>
                <select className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none focus:border-blue-600" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Client</label>
                <select className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none focus:border-blue-600" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                  <option value="">All Clients</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Type</label>
                <select className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none focus:border-blue-600" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">All Types</option>
                  {['GST', 'TDS', 'ITR', 'ROC', 'Audit', 'MCA', 'Advance Tax', 'FEMA', 'Labour', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Issue Type</label>
                <select className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none focus:border-blue-600" value={filterIssueType} onChange={e => setFilterIssueType(e.target.value)}>
                  <option value="">All Issue Types</option>
                  {taskTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Priority</label>
                <select className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none focus:border-blue-600" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Assignee</label>
                <select className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none focus:border-blue-600" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                  <option value="">All Assignees</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Date From</label>
                <div className="relative">
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-600" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Date To</label>
                <div className="relative">
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" className="w-full pl-8 pr-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-600" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input 
                  type="checkbox" 
                  id="showSubtasksFilter"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={showSubtasks}
                  onChange={e => setShowSubtasks(e.target.checked)}
                />
                <label htmlFor="showSubtasksFilter" className="text-[12.5px] font-medium text-gray-700 cursor-pointer">
                  Show Subtasks
                </label>
              </div>
              <div className="flex items-end">
                <button 
                  className="w-full px-3 py-1.5 text-[12.5px] text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  onClick={() => { 
                    setSearch(''); setFilterStatus(''); setFilterClient(''); setFilterType(''); 
                    setFilterIssueType(''); setFilterPriority(''); setFilterAssignee('');
                    setDateStart(''); setDateEnd(''); setTab('all');
                  }}
                >
                  <X size={14} /> Reset All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected.length > 0 && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-blue-50 border border-blue-100 rounded-lg mb-3.5 animate-slide-down">
          <Check size={14} className="text-blue-600" />
          <span className="text-[13px] font-semibold text-blue-600">{selected.length} selected</span>
          <button className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1 transition-colors" onClick={bulkComplete}>
            <Check size={12} /> Mark Complete
          </button>
          <button className="bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1 transition-colors" onClick={bulkDelete}>
            <Trash2 size={12} /> Delete
          </button>
          <button className="ml-auto text-[12px] text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-blue-100/50" onClick={clearSelect}>
            Clear
          </button>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3.5 py-2.5 w-10">
                  <input 
                    type="checkbox" 
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    onChange={e => e.target.checked ? selectAll() : clearSelect()} 
                    checked={selected.length === filtered.length && filtered.length > 0} 
                  />
                </th>
                <SH col="id" label="ID" />
                <SH col="title" label="Task" />
                <SH col="parentId" label="Parent" />
                <SH col="clientId" label="Client" />
                <SH col="type" label="Type" />
                <SH col="status" label="Status" />
                <SH col="priority" label="Priority" />
                <SH col="assigneeId" label="Assignee" />
                <SH col="dueDate" label="Due Date" />
                <th className="px-3.5 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-gray-700">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11}>
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
                      <ListTodo size={32} className="opacity-30" />
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-700 text-[15px]">No tasks found</h3>
                        <p className="text-[13px] mt-1">Try adjusting filters or create a new task.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {paginatedTasks.map(t => {
                const c = clients.find(x => x.id === t.clientId);
                const a = users.find(x => x.id === t.assigneeId);
                const dl = daysLeft(t.dueDate);
                const isSelected = selected.includes(t.id);
                const taskType = taskTypes.find(type => type.name === (t.issueType || 'Task'));
                const childTasks = tasks.filter(x => x.parentId === t.id);
                const parentTask = t.parentId ? tasks.find(x => x.id === t.parentId) : null;
                
                let dueClass = "text-gray-500";
                let rowClass = "";
                if (dl !== null) {
                  if (dl < 0) {
                    dueClass = "text-red-600 font-bold";
                    rowClass = "bg-red-50/30";
                  } else if (dl <= 2) {
                    dueClass = "text-orange-600 font-bold";
                    rowClass = "bg-orange-50/30";
                  } else {
                    dueClass = "text-gray-400";
                  }
                }
                
                return (
                  <React.Fragment key={t.id}>
                    <tr className={`border-b border-gray-100 transition-colors ${isSelected ? 'bg-blue-50/30' : rowClass ? `${rowClass} hover:opacity-80` : 'hover:bg-gray-50'}`}>
                      <td className="px-3.5 py-2.5">
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={isSelected} 
                          onChange={() => toggleSelect(t.id)} 
                        />
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5" title={taskType?.name}>
                          {taskType && (
                            <div className="w-4 h-4 rounded flex items-center justify-center text-white" style={{ backgroundColor: taskType.color }}>
                              <IconRenderer name={taskType.icon} size={10} />
                            </div>
                          )}
                          <span className="text-[11px] font-mono text-gray-400">#{t.id}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => openEditTask(t)}>{t.title}</div>
                          {childTasks.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded" title={`${childTasks.filter(s => s.status === 'Completed').length}/${childTasks.length} subtasks done`}>
                              <GitMerge size={10} />
                              <span>{childTasks.filter(s => s.status === 'Completed').length}/{childTasks.length}</span>
                            </div>
                          )}
                        </div>
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {t.tags.map(g => <span key={g} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{g}</span>)}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {parentTask ? (
                          <div className="flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit" title={`Parent: ${parentTask.title}`}>
                            ↑ #{parentTask.id}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[12px]">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-[12px] text-gray-500">{c?.name || '—'}</td>
                      <td className="px-3.5 py-2.5"><TypeChip type={t.type} /></td>
                      <td className="px-3.5 py-2.5">
                        <select 
                          className="bg-transparent border-none outline-none text-[12px] font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1"
                          value={t.status}
                          onChange={e => updateTask(t.id, { status: e.target.value })}
                        >
                          {(() => {
                            const currentTaskType = taskTypes.find(type => type.name === (t.issueType || 'Task'));
                            const currentWorkflow = currentTaskType?.workflowId ? workflows.find(w => w.id === currentTaskType.workflowId) : null;
                            
                            let options = Array.from(new Set(workflows.flatMap(w => w.statuses)));
                            if (currentWorkflow) {
                              options = currentWorkflow.statuses.filter(opt => {
                                if (opt === t.status) return true;
                                const transition = currentWorkflow.transitions.find(tr => tr.from === t.status);
                                return transition ? transition.to.includes(opt) : false;
                              });
                            }
                            if (!options.includes(t.status)) {
                              options.push(t.status);
                            }
                            return options.map(s => <option key={s} value={s}>{s}</option>);
                          })()}
                        </select>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <select 
                          className="bg-transparent border-none outline-none text-[12px] font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1"
                          value={t.priority}
                          onChange={e => updateTask(t.id, { priority: e.target.value })}
                        >
                          {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5 relative group">
                          <Avatar user={a} size={22} />
                          <select 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={t.assigneeId}
                            onChange={e => updateTask(t.id, { assigneeId: e.target.value })}
                            title="Change Assignee"
                          >
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                          <span className="text-[12px] group-hover:text-blue-600 transition-colors">{a?.name?.split(' ')[0] || '—'}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <input 
                            type="date" 
                            className={`bg-transparent border-none outline-none text-[12px] cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 w-[110px] ${dl !== null && dl < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}
                            value={t.dueDate}
                            onChange={e => updateTask(t.id, { dueDate: e.target.value })}
                          />
                          {dl !== null && (
                            <span className={`text-[10px] font-semibold ${dueClass}`}>
                              {dl < 0 ? `${Math.abs(dl)}d late` : dl === 0 ? 'Today' : `${dl}d`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1">
                          <button className="w-[26px] h-[26px] rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors" onClick={() => openEditTask(t)}>
                            <Maximize2 size={13} />
                          </button>
                          <button className="w-[26px] h-[26px] rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={async () => {
                            if (await confirm({ title: 'Delete Task', message: 'Are you sure you want to delete this task?', danger: true })) {
                              try {
                                await persistDeleteTask(t.id);
                                toast('Task deleted', 'success');
                              } catch (error) {
                                console.error('Error deleting task:', error);
                                toast('Failed to delete task', 'error');
                              }
                            }
                          }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showSubtasks && childTasks.length > 0 && childTasks.map((s) => {
                      const sc = clients.find(x => x.id === s.clientId);
                      const sa = users.find(x => x.id === s.assigneeId);
                      const sdl = daysLeft(s.dueDate);
                      const sIsSelected = selected.includes(s.id);
                      const sTaskType = taskTypes.find(type => type.name === (s.issueType || 'Subtask'));
                      
                      let sDueClass = "text-gray-500";
                      let sRowClass = "";
                      if (sdl !== null) {
                        if (sdl < 0) {
                          sDueClass = "text-red-600 font-bold";
                          sRowClass = "bg-red-50/20";
                        } else if (sdl <= 2) {
                          sDueClass = "text-orange-600 font-bold";
                          sRowClass = "bg-orange-50/20";
                        } else {
                          sDueClass = "text-gray-400";
                        }
                      }

                      return (
                        <tr key={s.id} className={`border-b border-gray-100 transition-colors ${sIsSelected ? 'bg-blue-50/30' : sRowClass ? `${sRowClass} hover:opacity-80` : 'bg-gray-50/30 hover:bg-gray-50'}`}>
                          <td className="px-3.5 py-2.5 pl-8 text-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block mr-2" />
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              checked={sIsSelected} 
                              onChange={() => toggleSelect(s.id)} 
                            />
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5" title={sTaskType?.name}>
                              {sTaskType && (
                                <div className="w-4 h-4 rounded flex items-center justify-center text-white" style={{ backgroundColor: sTaskType.color }}>
                                  <IconRenderer name={sTaskType.icon} size={10} />
                                </div>
                              )}
                              <span className="text-[11px] font-mono text-gray-400">#{s.id}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={`font-medium cursor-pointer hover:underline ${s.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-700'}`} onClick={() => openEditTask(s)}>{s.title}</div>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit" title={`Parent: ${t.title}`}>
                              ↑ #{t.id}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-[12px] text-gray-500">{sc?.name || '—'}</td>
                          <td className="px-3.5 py-2.5"><TypeChip type={s.type} /></td>
                          <td className="px-3.5 py-2.5">
                            <select 
                              className="bg-transparent border-none outline-none text-[12px] font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1"
                              value={s.status}
                              onChange={e => updateTask(s.id, { status: e.target.value })}
                            >
                              {(() => {
                                const currentTaskType = taskTypes.find(type => type.name === (s.issueType || 'Task'));
                                const currentWorkflow = currentTaskType?.workflowId ? workflows.find(w => w.id === currentTaskType.workflowId) : null;
                                
                                let options = Array.from(new Set(workflows.flatMap(w => w.statuses)));
                                if (currentWorkflow) {
                                  options = currentWorkflow.statuses.filter(opt => {
                                    if (opt === s.status) return true;
                                    const transition = currentWorkflow.transitions.find(tr => tr.from === s.status);
                                    return transition ? transition.to.includes(opt) : false;
                                  });
                                }
                                if (!options.includes(s.status)) {
                                  options.push(s.status);
                                }
                                return options.map(st => <option key={st} value={st}>{st}</option>);
                              })()}
                            </select>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <select 
                              className="bg-transparent border-none outline-none text-[12px] font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1"
                              value={s.priority}
                              onChange={e => updateTask(s.id, { priority: e.target.value })}
                            >
                              {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5 relative group">
                              <Avatar user={sa} size={22} />
                              <select 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                value={s.assigneeId}
                                onChange={e => updateTask(s.id, { assigneeId: e.target.value })}
                                title="Change Assignee"
                              >
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                              <span className="text-[12px] group-hover:text-blue-600 transition-colors">{sa?.name?.split(' ')[0] || '—'}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <input 
                                type="date" 
                                className={`bg-transparent border-none outline-none text-[12px] cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 w-[110px] ${sdl !== null && sdl < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}
                                value={s.dueDate}
                                onChange={e => updateTask(s.id, { dueDate: e.target.value })}
                              />
                              {sdl !== null && (
                                <span className={`text-[10px] font-semibold ${sDueClass}`}>
                                  {sdl < 0 ? `${Math.abs(sdl)}d late` : sdl === 0 ? 'Today' : `${sdl}d`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-1">
                              <button className="w-[26px] h-[26px] rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors" onClick={() => openEditTask(s)}>
                                <Maximize2 size={13} />
                              </button>
                              <button className="w-[26px] h-[26px] rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={async () => {
                                if (await confirm({ title: 'Delete Subtask', message: 'Are you sure you want to delete this subtask?', danger: true })) {
                                  try {
                                    await persistDeleteTask(s.id);
                                    toast('Subtask deleted', 'success');
                                  } catch (error) {
                                    console.error('Error deleting subtask:', error);
                                    toast('Failed to delete subtask', 'error');
                                  }
                                }
                              }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
              <ListTodo size={32} className="opacity-30" />
              <div className="text-center">
                <h3 className="font-semibold text-gray-700 text-[15px]">No tasks found</h3>
              </div>
            </div>
          )}
          {paginatedTasks.map(t => {
            const c = clients.find(x => x.id === t.clientId);
            const a = users.find(x => x.id === t.assigneeId);
            const dl = daysLeft(t.dueDate);
            const isSelected = selected.includes(t.id);
            const taskType = taskTypes.find(type => type.name === (t.issueType || 'Task'));
            const childTasks = tasks.filter(x => x.parentId === t.id);
            const parentTask = t.parentId ? tasks.find(x => x.id === t.parentId) : null;
            
            return (
              <div key={t.id} className="flex flex-col">
                <div className={`p-4 ${isSelected ? 'bg-blue-50/30' : ''}`} onClick={() => openEditTask(t)}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isSelected}
                        onClick={e => e.stopPropagation()}
                        onChange={() => toggleSelect(t.id)}
                      />
                      <div className="flex items-center gap-1.5">
                        {taskType && (
                          <div className="w-4 h-4 rounded flex items-center justify-center text-white" style={{ backgroundColor: taskType.color }}>
                            <IconRenderer name={taskType.icon} size={10} />
                          </div>
                        )}
                        <span className="text-[11px] font-mono text-gray-400">#{t.id}</span>
                      </div>
                      <TypeChip type={t.type} />
                    </div>
                    <div className="flex items-center gap-2">
                      {dl !== null && (
                        <span className={`text-[10px] font-bold ${dl < 0 ? 'text-red-600' : dl <= 2 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {dl < 0 ? `${Math.abs(dl)}d late` : dl === 0 ? 'Today' : `${dl}d`}
                        </span>
                      )}
                      <Avatar user={a} size={20} />
                    </div>
                  </div>
                  
                  <div className="mb-1">
                    {parentTask && (
                      <div className="text-[10px] text-blue-600 font-medium mb-0.5">
                        ↑ Parent: #{parentTask.id}
                      </div>
                    )}
                    <h4 className="text-[14px] font-semibold text-gray-900 leading-tight">{t.title}</h4>
                  </div>
                  <p className="text-[12px] text-gray-500 mb-3">{c?.name || 'No Client'}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <select 
                        className="text-[11px] font-medium bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                        value={t.status}
                        onChange={e => updateTask(t.id, { status: e.target.value })}
                      >
                        {(() => {
                          const currentTaskType = taskTypes.find(type => type.name === (t.issueType || 'Task'));
                          const currentWorkflow = currentTaskType?.workflowId ? workflows.find(w => w.id === currentTaskType.workflowId) : null;
                          
                          let options = Array.from(new Set(workflows.flatMap(w => w.statuses)));
                          if (currentWorkflow) {
                            options = currentWorkflow.statuses.filter(opt => {
                              if (opt === t.status) return true;
                              const transition = currentWorkflow.transitions.find(tr => tr.from === t.status);
                              return transition ? transition.to.includes(opt) : false;
                            });
                          }
                          if (!options.includes(t.status)) {
                            options.push(t.status);
                          }
                          return options.map(s => <option key={s} value={s}>{s}</option>);
                        })()}
                      </select>
                      <select 
                        className="text-[11px] font-medium bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                        value={t.priority}
                        onChange={e => updateTask(t.id, { priority: e.target.value as any })}
                      >
                        {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-gray-400 hover:text-gray-900" onClick={(e) => { e.stopPropagation(); openEditTask(t); }}>
                        <Maximize2 size={14} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600" onClick={async (e) => {
                        e.stopPropagation();
                        if (await confirm({ title: 'Delete Task', message: 'Are you sure?', danger: true })) {
                          try {
                            await persistDeleteTask(t.id);
                            toast('Task deleted', 'success');
                          } catch (error) {
                            console.error('Error deleting task:', error);
                            toast('Failed to delete task', 'error');
                          }
                        }
                      }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Subtasks */}
                {showSubtasks && childTasks.length > 0 && (
                  <div className="bg-gray-50/50 border-t border-gray-100 pl-4 py-1 divide-y divide-gray-100">
                    {childTasks.map(s => {
                      const sc = clients.find(x => x.id === s.clientId);
                      const sa = users.find(x => x.id === s.assigneeId);
                      const sdl = daysLeft(s.dueDate);
                      const sIsSelected = selected.includes(s.id);
                      
                      return (
                        <div key={s.id} className={`p-3 flex items-start gap-3 ${sIsSelected ? 'bg-blue-50/30' : ''}`} onClick={(e) => { e.stopPropagation(); openEditTask(s); }}>
                          <div className="pt-1">
                            <input 
                              type="checkbox" 
                              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={sIsSelected}
                              onClick={e => e.stopPropagation()}
                              onChange={() => toggleSelect(s.id)}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-[10px] font-mono text-gray-400">#{s.id}</span>
                              {sdl !== null && (
                                <span className={`text-[9px] font-bold ${sdl < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {sdl < 0 ? `${Math.abs(sdl)}d late` : sdl === 0 ? 'Today' : `${sdl}d`}
                                </span>
                              )}
                            </div>
                            <h5 className={`text-[13px] font-medium leading-tight ${s.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.title}</h5>
                            <div className="flex items-center justify-between mt-2">
                              <StatusBadge status={s.status} />
                              <Avatar user={sa} size={18} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <Pagination 
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </motion.div>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
