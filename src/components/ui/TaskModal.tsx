import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Task, Subtask, Comment, Attachment } from '../../types';
import { genUUID, fmt, today, STATUS_COLORS, PRIORITY_COLORS, TYPE_COLORS } from '../../utils';
import { TagInput } from './TagInput';
import { SearchableSelect } from './SearchableSelect';
import { IconRenderer } from './IconRenderer';
import { RichTextEditor } from './RichTextEditor';
import { Plus, X, Trash2, Eye, Paperclip, MessageSquare, Clock, User, GitMerge, ListTodo, Calendar, Reply, Tag as TagIcon, Smile, CheckCircle2, AlertCircle } from 'lucide-react';
import { Avatar } from './Avatar';
import { MentionTextarea } from './MentionTextarea';

interface TaskModalProps {
  task?: Task | null;
  templateId?: string;
  onClose: () => void;
}

export function TaskModal({ task, templateId, onClose }: TaskModalProps) {
  const { tasks, clients, users, templates, taskTypes, workflows, notify, currentUser, addTask, updateTask, deleteTask } = useApp();
  const toast = useToast();

  const [form, setForm] = useState<Task>(() => {
    if (task) {
      if (!task.id && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        return { ...task, subtasks: [] };
      }
      return { ...task };
    }
    return {
      id: '', // Empty ID means new task
      title: '',
      clientId: '',
      type: 'GST',
      issueType: 'Task',
      status: 'To Do',
      priority: 'Medium',
      assigneeId: currentUser?.id || 'u1',
      reporterId: currentUser?.id || 'u1',
      reviewerId: '',
      dueDate: fmt(today),
      createdAt: fmt(today),
      recurring: 'One-time',
      description: '',
      tags: [],
      dependencies: [],
      statutoryDeadline: '',
      subtasks: [],
      linkedTasks: [],
      comments: [],
      attachments: [],
      activity: [{ text: 'Task created', at: fmt(today) }]
    };
  });

  const [selectedTemplate, setSelectedTemplate] = useState(templateId || '');
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const tenantPrefix = currentUser?.tenantId ? currentUser.tenantId.substring(0, 4).toUpperCase() : 'KDK';

  const [pendingSubtasks, setPendingSubtasks] = useState<Partial<Task>[]>(() => {
    if (task && !task.id && Array.isArray(task.subtasks)) {
      let max = 0;
      tasks.forEach(t => {
        if (t.id.startsWith(`${tenantPrefix}-`)) {
          const num = parseInt(t.id.split('-')[1], 10);
          if (!isNaN(num) && num > max) max = num;
        }
      });
      let currentMax = max;
      return task.subtasks.map(s => {
        currentMax++;
        return {
          id: `${tenantPrefix}-${currentMax}`,
          title: s.title,
          status: s.done ? 'Completed' : 'To Do',
          priority: task.priority,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate,
          issueType: 'Subtask'
        };
      });
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'comments' | 'activity' | 'attachments'>('details');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const isNew = !form.id;
  const childTasks = tasks.filter(t => t.parentId === form.id);
  const linkedTasksList = tasks.filter(t => form.linkedTasks?.includes(t.id));

  const save = async () => {
    if (!form.title || !form.clientId || !form.dueDate) {
      toast('Title, Client, and Due Date are required', 'error');
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      if (isNew) {
        let max = 0;
        tasks.forEach(t => {
          if (t.id.startsWith(`${tenantPrefix}-`)) {
            const num = parseInt(t.id.split('-')[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
        pendingSubtasks.forEach(pst => {
          if (pst.id && pst.id.startsWith(`${tenantPrefix}-`)) {
            const num = parseInt(pst.id.split('-')[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
        const newId = `${tenantPrefix}-${max + 1}`;
        const newTask = { ...form, id: newId };
        
        await addTask(newTask);
        
        if (pendingSubtasks.length > 0) {
          await Promise.all(pendingSubtasks.map(async (pst, idx) => {
            const subtask: Task = {
              id: pst.id || `${tenantPrefix}-${max + 2 + idx}`,
              title: pst.title || 'Untitled Subtask',
              clientId: form.clientId,
              type: form.type,
              issueType: 'Subtask',
              status: pst.status || 'To Do',
              priority: pst.priority || form.priority,
              assigneeId: pst.assigneeId || form.assigneeId,
              reporterId: currentUser?.id || 'u1',
              reviewerId: '',
              dueDate: pst.dueDate || form.dueDate,
              createdAt: fmt(today),
              recurring: 'One-time',
              description: pst.description || '',
              tags: [],
              parentId: newId,
              subtasks: [],
              linkedTasks: [],
              comments: [],
              attachments: [],
              activity: [{ text: 'Subtask created', at: fmt(today) }]
            };
            return addTask(subtask);
          }));
        }
        
        toast('Task created', 'success');
      } else {
        const changes: string[] = [];
        if (task) {
          if (task.status !== form.status) changes.push(`Status changed to ${form.status}`);
          if (task.assigneeId !== form.assigneeId) {
             const assignee = users.find(u => u.id === form.assigneeId)?.name || 'Unassigned';
             changes.push(`Assigned to ${assignee}`);
          }
          if (task.dueDate !== form.dueDate) changes.push(`Due date changed to ${form.dueDate}`);
          if (task.priority !== form.priority) changes.push(`Priority changed to ${form.priority}`);
          if (task.description !== form.description) changes.push(`Description updated`);
        }
        
        let updatedForm = { ...form };
        if (changes.length > 0) {
          updatedForm.activity = [
            ...changes.map(c => ({ text: c, at: fmt(today) })),
            ...(form.activity || [])
          ];
        }
        
        await updateTask(form.id, updatedForm);
        toast('Task updated', 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast('Failed to save task', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = async (tid: string) => {
    setSelectedTemplate(tid);
    const tmpl = templates.find(t => t.id === tid);
    if (tmpl) {
      setForm(f => ({
        ...f,
        title: f.title || tmpl.name, // Auto-draft title if empty
        type: tmpl.category,
        description: f.description ? `${f.description}\n\n${tmpl.description}` : tmpl.description,
      }));
      
      if (Array.isArray(tmpl.subtasks) && tmpl.subtasks.length > 0) {
        let max = 0;
        tasks.forEach(t => {
          if (t.id.startsWith(`${tenantPrefix}-`)) {
            const num = parseInt(t.id.split('-')[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
        pendingSubtasks.forEach(pst => {
          if (pst.id && pst.id.startsWith(`${tenantPrefix}-`)) {
            const num = parseInt(pst.id.split('-')[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
        
        let currentMax = max;
        const templateSubtasks: Partial<Task>[] = tmpl.subtasks.map(title => {
          currentMax++;
          return {
            id: `${tenantPrefix}-${currentMax}`,
            title,
            status: 'To Do',
            priority: form.priority,
            assigneeId: form.assigneeId,
            dueDate: form.dueDate,
            issueType: 'Subtask'
          };
        });

        if (isNew) {
          setPendingSubtasks(prev => [...prev, ...templateSubtasks]);
          toast(`${tmpl.subtasks.length} subtasks added`, 'success');
        } else {
          const newSubtasks = templateSubtasks.map(pst => {
            return {
              id: pst.id!,
              title: pst.title!,
              clientId: form.clientId,
              type: tmpl.category,
              issueType: 'Subtask',
              status: 'To Do',
              priority: form.priority,
              assigneeId: form.assigneeId,
              reporterId: currentUser?.id || 'u1',
              reviewerId: '',
              dueDate: form.dueDate,
              createdAt: fmt(today),
              recurring: 'One-time',
              description: '',
              tags: [],
              parentId: form.id,
              subtasks: [],
              linkedTasks: [],
              comments: [],
              attachments: [],
              activity: [{ text: 'Subtask created from template', at: fmt(today) }]
            };
          });
          await Promise.all(newSubtasks.map(s => addTask(s)));
          toast(`${newSubtasks.length} subtasks created immediately`, 'success');
        }
      }
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = { 
      id: genUUID(), 
      userId: currentUser?.id || 'u1', 
      text: newComment, 
      createdAt: new Date().toISOString(),
      reactions: [] 
    };
    setForm(f => ({ ...f, comments: [...(f.comments || []), comment], activity: [{ text: 'Added a comment', at: fmt(today) }, ...(f.activity || [])] }));
    setNewComment('');
  };

  const addReaction = (commentId: string, emoji: string) => {
    setForm(f => ({
      ...f,
      comments: (f.comments || []).map(c => {
        if (c.id === commentId) {
          const reactions = c.reactions || [];
          const existing = reactions.find(r => r.emoji === emoji);
          if (existing) {
            return { ...c, reactions: reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
          }
          return { ...c, reactions: [...reactions, { emoji, count: 1, users: [currentUser?.id || 'u1'] }] };
        }
        return c;
      })
    }));
  };

  const replyToComment = (c: Comment) => {
    const u = users.find(x => x.id === c.userId);
    setNewComment(`@${u?.name} `);
    setActiveTab('comments');
  };

  const handleMention = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      notify(userId, `You were mentioned in a comment on task #${form.id || 'New Task'}`, 'mention', `/tasks?id=${form.id}`);
      toast(`Mentioned ${user.name}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const attachment: Attachment = { id: genUUID(), name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, type: file.type };
      setForm(f => ({ ...f, attachments: [...(f.attachments || []), attachment], activity: [{ text: `Attached ${file.name}`, at: fmt(today) }, ...(f.activity || [])] }));
    }
  };

  const createQuickSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    let max = 0;
    tasks.forEach(t => {
      if (t.id.startsWith(`${tenantPrefix}-`)) {
        const num = parseInt(t.id.split('-')[1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    pendingSubtasks.forEach(pst => {
      if (pst.id && pst.id.startsWith(`${tenantPrefix}-`)) {
        const num = parseInt(pst.id.split('-')[1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    
    const newId = `${tenantPrefix}-${max + 1}`;

    if (isNew) {
      setPendingSubtasks(prev => [...prev, { 
        id: newId,
        title: newSubtaskTitle, 
        status: 'To Do', 
        priority: form.priority, 
        assigneeId: form.assigneeId,
        dueDate: form.dueDate,
        issueType: 'Subtask'
      }]);
      setNewSubtaskTitle('');
      return;
    }

    const newTask: Task = {
      id: newId,
      title: newSubtaskTitle,
      clientId: form.clientId,
      type: form.type,
      issueType: 'Subtask',
      status: 'To Do',
      priority: form.priority,
      assigneeId: form.assigneeId,
      reporterId: currentUser?.id || 'u1',
      reviewerId: '',
      dueDate: form.dueDate,
      createdAt: fmt(today),
      recurring: 'One-time',
      description: '',
      tags: [],
      parentId: form.id,
      subtasks: [],
      linkedTasks: [],
      comments: [],
      attachments: [],
      activity: [{ text: 'Subtask created', at: fmt(today) }]
    };
    
    try {
      await addTask(newTask);
      setNewSubtaskTitle('');
      toast('Subtask created', 'success');
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast('Failed to create subtask', 'error');
    }
  };

  const linkExistingAsSubtask = async (id: string) => {
    if (!id) return;
    if (isNew) {
      toast('Please save the task first before linking existing subtasks', 'warning');
      return;
    }
    try {
      await updateTask(id, { parentId: form.id, issueType: 'Subtask' });
    } catch (error) {
      console.error('Error linking task:', error);
    }
    toast('Task linked as subtask', 'success');
  };

  const toggleLinkedTask = (id: string) => {
    setForm(f => {
      const linked = f.linkedTasks || [];
      if (linked.includes(id)) {
        return { ...f, linkedTasks: linked.filter(x => x !== id) };
      } else {
        return { ...f, linkedTasks: [...linked, id] };
      }
    });
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const userOptions = users.map(u => ({ value: u.id, label: u.name }));
  const typeOptions = Object.keys(TYPE_COLORS).map(t => ({ value: t, label: t }));
  
  const currentTaskType = taskTypes.find(t => t.name === (form.issueType || 'Task'));
  const currentWorkflow = currentTaskType?.workflowId ? workflows.find(w => w.id === currentTaskType.workflowId) : null;
  
  const allStatuses = currentWorkflow ? currentWorkflow.statuses : Array.from(new Set(workflows.flatMap(w => w.statuses)));
  if (form.status && !allStatuses.includes(form.status)) {
    allStatuses.push(form.status);
  }
  
  const statusOptions = allStatuses.map(s => {
    if (isNew || s === form.status) return { value: s, label: s };
    
    // Check if transition is allowed
    const transition = currentWorkflow?.transitions.find(t => t.from === form.status);
    const isAllowed = !currentWorkflow || (transition && transition.to.includes(s));
    
    return { 
      value: s, 
      label: s,
      disabled: !isAllowed
    };
  }).filter(o => !o.disabled); // Only show allowed statuses

  const priorityOptions = Object.keys(PRIORITY_COLORS).map(p => ({ value: p, label: p }));
  const parentOptions = [{ value: '', label: 'None' }, ...tasks.filter(t => t.id !== form.id && !t.parentId).map(t => ({ value: t.id, label: `#${t.id} - ${t.title}` }))];
  const linkedTaskOptions = tasks.filter(t => t.id !== form.id).map(t => ({ value: t.id, label: `#${t.id} - ${t.title}` }));
  
  const issueTypeOptions = taskTypes.map(t => ({ 
    value: t.name, 
    label: (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded flex items-center justify-center text-white" style={{ backgroundColor: t.color }}>
          <IconRenderer name={t.icon} size={10} />
        </div>
        <span>{t.name}</span>
      </div>
    ),
    searchLabel: t.name
  }));

  const handleOpenAttachment = (a: any) => {
    toast(`Opening ${a.name}...`, 'success');
    
    // For sample files, we can use the actual files
    if (a.name === 'sample.pdf' || a.name === 'sample.xlsx') {
      window.open(`/${a.name}`, '_blank');
    } else {
      // Simulate opening for others
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('download', a.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const TABS = [
    { id: 'details', label: 'Details', icon: ListTodo },
    { id: 'subtasks', label: 'Subtasks', icon: GitMerge, count: childTasks.length + pendingSubtasks.length },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: form.comments?.length },
    { id: 'attachments', label: 'Attachments', icon: Paperclip, count: form.attachments?.length },
    { id: 'activity', label: 'Activity Log', icon: Clock, count: form.activity?.length },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          {currentTaskType && (
            <div className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: currentTaskType.color }}>
              <IconRenderer name={currentTaskType.icon} size={14} />
            </div>
          )}
          <span className="text-gray-500 font-mono text-sm">{!isNew ? form.id : 'New Task'}</span>
          {!isNew && <span className="text-gray-300">|</span>}
          {!isNew && <span className="text-[12px] text-gray-400 font-medium">Created {new Date(form.createdAt).toLocaleDateString()}</span>}
        </div>
      }
      onClose={onClose}
      size="4xl"
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <button className="px-4 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" onClick={save} disabled={isSaving}>{isSaving ? 'Saving...' : (!isNew ? 'Save Changes' : 'Create Task')}</button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
        {/* Left Column: Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          <div>
            <input 
              className="w-full px-0 py-2 border-none text-2xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 bg-transparent" 
              placeholder="Task summary or title..." 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              autoFocus
            />
          </div>

          <div className="flex border-b border-gray-200 gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-2.5 text-[13px] font-semibold flex items-center gap-2 border-b-2 transition-all relative shrink-0 ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              >
                <t.icon size={15} />
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            {activeTab === 'details' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">Description</label>
                  <RichTextEditor 
                    content={form.description || ''} 
                    onChange={content => setForm({ ...form, description: content })} 
                    placeholder="Add a more detailed description..."
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-3">Linked Tasks</label>
                  <div className="space-y-2">
                    <SearchableSelect 
                      options={linkedTaskOptions} 
                      value="" 
                      onChange={toggleLinkedTask} 
                      placeholder="Search tasks to link..." 
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {linkedTasksList.map(lt => (
                        <div key={lt.id} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors group">
                          <span className="text-gray-400 font-mono">#{lt.id}</span>
                          <span className="text-gray-700 truncate max-w-[200px]">{lt.title}</span>
                          <button onClick={() => toggleLinkedTask(lt.id)} className="text-gray-400 hover:text-red-600">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subtasks' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">Task Breakdown</h3>
                    <p className="text-[12px] text-gray-500">Manage subtasks and linked dependencies.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SearchableSelect 
                      options={linkedTaskOptions.filter(o => !childTasks.some(ct => ct.id === o.value))} 
                      value="" 
                      onChange={linkExistingAsSubtask} 
                      placeholder="Link existing task..." 
                    />
                    <button 
                      onClick={() => {
                        const newSubtasks = [...(form.subtasks || []), { id: genUUID(), title: 'New Checklist Item', done: false }];
                        setForm({ ...form, subtasks: newSubtasks });
                      }}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} className="text-blue-600" />
                      Add Checklist
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Quick Add Subtask */}
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-blue-400 transition-all">
                    <Plus size={16} className="text-gray-400 ml-2" />
                    <input 
                      className="flex-1 bg-transparent border-none p-1.5 text-[13px] outline-none placeholder:text-gray-400"
                      placeholder="Add a subtask title and press Enter..."
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createQuickSubtask()}
                    />
                    <button 
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                      onClick={createQuickSubtask}
                    >
                      Add
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
                    {(childTasks.length > 0 || pendingSubtasks.length > 0 || (Array.isArray(form.subtasks) && form.subtasks.length > 0)) ? (
                      <div className="divide-y divide-gray-100">
                        {form.subtasks?.map((st, idx) => (
                          <div key={st.id} className="relative focus-within:z-10 flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors group">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                              checked={st.done} 
                              onChange={e => {
                                const newSubtasks = [...(form.subtasks || [])];
                                newSubtasks[idx] = { ...st, done: e.target.checked };
                                setForm({ ...form, subtasks: newSubtasks });
                              }} 
                            />
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-400">CHK</span>
                              <input 
                                className={`w-full bg-transparent border-none p-0 text-[13px] outline-none focus:ring-0 font-medium ${st.done ? 'line-through text-gray-400' : 'text-gray-900'}`} 
                                value={st.title} 
                                onChange={e => {
                                  const newSubtasks = [...(form.subtasks || [])];
                                  newSubtasks[idx] = { ...st, title: e.target.value };
                                  setForm({ ...form, subtasks: newSubtasks });
                                }} 
                              />
                            </div>
                            <button 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" 
                              onClick={() => {
                                const newSubtasks = form.subtasks?.filter((_, i) => i !== idx);
                                setForm({ ...form, subtasks: newSubtasks });
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {pendingSubtasks.map((pst, idx) => (
                          <div key={`pending-${idx}`} className="relative focus-within:z-10 flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors group">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                              checked={pst.status === 'Completed'} 
                              onChange={e => setPendingSubtasks(prev => prev.map((p, i) => i === idx ? { ...p, status: e.target.checked ? 'Completed' : 'To Do' } : p))} 
                            />
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-400">#{pst.id || 'NEW'}</span>
                              <input 
                                className={`w-full bg-transparent border-none p-0 text-[13px] outline-none focus:ring-0 font-medium ${pst.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`} 
                                value={pst.title} 
                                onChange={e => setPendingSubtasks(prev => prev.map((p, i) => i === idx ? { ...p, title: e.target.value } : p))} 
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-[120px]">
                                <SearchableSelect 
                                  options={userOptions} 
                                  value={pst.assigneeId || ''} 
                                  onChange={v => setPendingSubtasks(prev => prev.map((p, i) => i === idx ? { ...p, assigneeId: v } : p))} 
                                  placeholder="Assignee" 
                                />
                              </div>
                              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" onClick={() => setPendingSubtasks(prev => prev.filter((_, i) => i !== idx))}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {childTasks.map((s) => (
                          <div key={s.id} className="relative focus-within:z-10 flex items-center gap-3 p-3.5 hover:bg-gray-50 transition-colors group">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                              checked={s.status === 'Completed'} 
                              onChange={async (e) => {
                                try {
                                  await updateTask(s.id, { status: e.target.checked ? 'Completed' : 'To Do' });
                                } catch (err) {
                                  console.error(err);
                                }
                              }} 
                            />
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-400">#{s.id}</span>
                              <input 
                                className={`w-full bg-transparent border-none p-0 text-[13px] outline-none focus:ring-0 ${s.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}`} 
                                value={s.title} 
                                onChange={async (e) => {
                                  try {
                                    await updateTask(s.id, { title: e.target.value });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }} 
                                placeholder="Subtask title" 
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-[120px]">
                                <SearchableSelect options={userOptions} value={s.assigneeId || ''} onChange={async (v) => {
                                  try {
                                    await updateTask(s.id, { assigneeId: v });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }} placeholder="Assignee" />
                              </div>
                              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100" onClick={async () => { 
                                try {
                                  await deleteTask(s.id);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-gray-50/50">
                        <GitMerge size={32} className="mx-auto text-gray-300 mb-3" />
                        <h4 className="text-[14px] font-bold text-gray-700">No subtasks yet</h4>
                        <p className="text-[12px] text-gray-500 mt-1">Break this task down into smaller, manageable steps.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">Files & Assets</h3>
                  <label className="text-blue-600 hover:text-blue-700 text-[12px] font-bold flex items-center gap-1 transition-colors cursor-pointer">
                    <Plus size={14} /> Upload File
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div 
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} />
                  <Paperclip size={32} className="mx-auto text-gray-300 mb-3 group-hover:text-blue-400 transition-colors" />
                  <p className="text-[13px] font-bold text-gray-700">Click or drag files here to upload</p>
                  <p className="text-[11px] text-gray-500 mt-1">PDF, DOCX, JPG, PNG up to 10MB</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.attachments?.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                        <Paperclip size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-gray-900 truncate">{a.name}</div>
                        <div className="text-[11px] text-gray-500">{a.size} • {a.type.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => handleOpenAttachment(a)}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={() => setForm({ ...form, attachments: form.attachments?.filter(x => x.id !== a.id) })}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start gap-4">
                  <Avatar user={currentUser || users[0]} size={36} />
                  <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-50 transition-all bg-white shadow-sm">
                    <MentionTextarea 
                      className="w-full px-4 py-3 border-none text-[14px] outline-none min-h-[100px] resize-y bg-transparent" 
                      placeholder="Add a comment or update... Use @ to mention users" 
                      value={newComment} 
                      onChange={e => setNewComment(e.target.value)}
                      onMention={handleMention}
                    />
                    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors" title="Attach file">
                          <Paperclip size={16} />
                        </button>
                      </div>
                      <button 
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        onClick={addComment}
                        disabled={!newComment.trim()}
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  {(form.comments || []).slice().reverse().map(c => {
                    const u = users.find(x => x.id === c.userId);
                    return (
                      <div key={c.id} className="flex gap-4">
                        <Avatar user={u} size={36} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-bold text-[14px] text-gray-900">{u?.name || 'Unknown'}</span>
                            <span className="text-[11px] text-gray-400 font-medium">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-[13.5px] text-gray-700 whitespace-pre-wrap shadow-sm leading-relaxed">
                            {c.text}
                          </div>
                          <div className="flex items-center gap-4 mt-2 px-1">
                            <button 
                              className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-blue-600 transition-colors"
                              onClick={() => replyToComment(c)}
                            >
                              <Reply size={12} /> Reply
                            </button>
                            <button 
                              className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-blue-600 transition-colors"
                              onClick={() => addReaction(c.id, '👍')}
                            >
                              <Smile size={12} /> Like
                            </button>
                            <button 
                              className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-blue-600 transition-colors"
                              onClick={() => replyToComment(c)}
                            >
                              <TagIcon size={12} /> Tag
                            </button>
                            {c.reactions && c.reactions.length > 0 && (
                              <div className="flex items-center gap-1 ml-auto">
                                {c.reactions.map((r, i) => (
                                  <div key={i} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-blue-100">
                                    {r.emoji} {r.count}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[14px] font-bold text-gray-900">System Activity</h3>
                </div>
                <div className="space-y-4">
                  {(form.activity || []).map((a, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[13px] text-gray-700 font-medium">{a.text}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{a.at}</p>
                      </div>
                    </div>
                  ))}
                  {(!form.activity || form.activity.length === 0) && (
                    <div className="text-center py-12 text-gray-400 text-[13px]">No activity recorded yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5 shadow-sm">
            {templates.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Apply Template</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] font-medium outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all"
                  value={selectedTemplate}
                  onChange={e => applyTemplate(e.target.value)}
                >
                  <option value="">Select a template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <p className="text-[10px] text-gray-400 mt-1.5 px-1">Templates pre-fill description and add subtasks.</p>
              </div>
            )}

            <div className="h-px bg-gray-100 mx-[-20px]" />

            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Status</label>
              <SearchableSelect options={statusOptions} value={form.status} onChange={v => setForm({ ...form, status: v })} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Priority</label>
                <SearchableSelect options={priorityOptions} value={form.priority} onChange={v => setForm({ ...form, priority: v })} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Issue Type</label>
                <SearchableSelect 
                  options={issueTypeOptions} 
                  value={form.issueType || 'Task'} 
                  onChange={v => {
                    const newType = taskTypes.find(t => t.name === v);
                    const newWf = newType?.workflowId ? workflows.find(w => w.id === newType.workflowId) : null;
                    let newStatus = form.status;
                    if (newWf && !newWf.statuses.includes(newStatus)) {
                      newStatus = newWf.statuses[0] || 'To Do';
                    }
                    setForm({ ...form, issueType: v, status: newStatus });
                  }} 
                />
              </div>
            </div>

            <div className="h-px bg-gray-100 mx-[-20px]" />

            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Assignee</label>
              <SearchableSelect options={userOptions} value={form.assigneeId} onChange={v => setForm({ ...form, assigneeId: v })} />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Client *</label>
              <SearchableSelect options={clientOptions} value={form.clientId} onChange={v => setForm({ ...form, clientId: v })} placeholder="Select Client" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Due Date *</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-[13.5px] font-medium outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 bg-white transition-all" 
                  type="date" 
                  value={form.dueDate} 
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle size={12} className="text-orange-500" />
                Statutory Deadline
              </label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-[13.5px] font-medium outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 bg-white transition-all" 
                  type="date" 
                  value={form.statutoryDeadline || ''} 
                  onChange={e => setForm({ ...form, statutoryDeadline: e.target.value })} 
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 px-1 italic">Statutory deadline for compliance prioritization.</p>
            </div>
          </div>

          <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-5 space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest text-center">Metadata</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Task Category</label>
                  <SearchableSelect options={typeOptions} value={form.type} onChange={v => setForm({ ...form, type: v })} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Parent Task</label>
                  <SearchableSelect options={parentOptions} value={form.parentId || ''} onChange={v => setForm({ ...form, parentId: v || undefined })} placeholder="None" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <GitMerge size={12} className="text-blue-500" />
                    Dependencies
                  </label>
                  <SearchableSelect 
                    options={linkedTaskOptions.filter(o => o.value !== form.id)} 
                    value="" 
                    onChange={v => {
                      const deps = form.dependencies || [];
                      if (!deps.includes(v)) {
                        setForm({ ...form, dependencies: [...deps, v] });
                      }
                    }} 
                    placeholder="Add dependency..." 
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(form.dependencies || []).map(depId => {
                      const depTask = tasks.find(t => t.id === depId);
                      return (
                        <div key={depId} className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-blue-100 group">
                          <span className="font-mono">#{depId}</span>
                          <button onClick={() => setForm({ ...form, dependencies: (form.dependencies || []).filter(d => d !== depId) })} className="hover:text-red-500 transition-colors">
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Tags</label>
                  <TagInput tags={form.tags || []} onChange={v => setForm({ ...form, tags: v })} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
