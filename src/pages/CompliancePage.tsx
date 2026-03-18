import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { daysLeft, fmtDate, TYPE_COLORS, genUUID, fmt, today } from '../utils';
import { TypeChip } from '../components/ui/Badges';
import { PageHeader } from '../components/ui/PageHeader';
import { FileText, Clock, AlertCircle, CheckCircle2, Zap, RefreshCw, Plus, X, Trash2 } from 'lucide-react';
import { Task, Deadline } from '../types';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'motion/react';
import { Coachmark } from '../components/ui/Coachmark';

export function CompliancePage() {
  const { deadlines, clients, addTask, addTasks, addDeadline, updateDeadline, deleteDeadline, currentUser, complianceCategories, setComplianceCategories } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [filter, setFilter] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const [newDeadline, setNewDeadline] = useState<Partial<Deadline>>({
    title: '',
    desc: '',
    category: complianceCategories[0] || 'GST',
    dueDate: fmt(today),
    form: '',
    section: '',
    clients: 0
  });
  
  const filtered = deadlines.filter(d => !filter || d.category === filter);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (complianceCategories.includes(newCategory.trim())) {
      toast('Category already exists', 'error');
      return;
    }
    setComplianceCategories([...complianceCategories, newCategory.trim()]);
    setNewDeadline({ ...newDeadline, category: newCategory.trim() });
    setNewCategory('');
    setIsAddingCategory(false);
    toast('Category added successfully', 'success');
  };

  const handleAddCompliance = async () => {
    if (!newDeadline.title || !newDeadline.dueDate || !newDeadline.category) {
      toast('Please fill all required fields', 'error');
      return;
    }
    
    try {
      if (newDeadline.id) {
        await updateDeadline(newDeadline.id, {
          title: newDeadline.title,
          desc: newDeadline.desc,
          category: newDeadline.category,
          dueDate: newDeadline.dueDate,
          form: newDeadline.form,
          section: newDeadline.section,
          clients: clients.filter(c => c.services.includes(newDeadline.category!)).length
        });
        toast('Compliance deadline updated successfully', 'success');
      } else {
        await addDeadline({
          id: genUUID(),
          title: newDeadline.title!,
          desc: newDeadline.desc || '',
          category: newDeadline.category!,
          dueDate: newDeadline.dueDate!,
          form: newDeadline.form || '',
          section: newDeadline.section || '',
          clients: clients.filter(c => c.services.includes(newDeadline.category!)).length
        });
        toast('Compliance deadline added successfully', 'success');
      }
      setIsAdding(false);
      setNewDeadline({
        title: '',
        desc: '',
        category: 'GST',
        dueDate: fmt(today),
        form: '',
        section: '',
        clients: 0
      });
    } catch (error) {
      toast('Failed to save compliance deadline', 'error');
    }
  };

  const handleSyncKDK = async () => {
    setIsSyncing(true);
    try {
      // Simulate API call to KDK Sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast('Successfully synced filing status from KDK Sync', 'success');
    } catch (error) {
      toast('Failed to sync with KDK Sync', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateTasks = async (deadline: any) => {
    setIsGenerating(deadline.id);
    try {
      // Find clients that have the service matching this deadline's category
      const applicableClients = clients.filter(c => c.services.includes(deadline.category));
      
      if (applicableClients.length === 0) {
        toast(`No clients found with ${deadline.category} service`, 'error');
        setIsGenerating(null);
        return;
      }

      let createdCount = 0;
      const tasksToCreate: Task[] = [];
      for (const client of applicableClients) {
        const parentId = genUUID();
        const newTask: Task = {
          id: parentId,
          title: `${deadline.title} - ${client.name}`,
          clientId: client.id,
          type: deadline.category,
          status: 'To Do',
          priority: 'High',
          assigneeId: client.manager || currentUser?.id || 'u1',
          reviewerId: '',
          dueDate: deadline.dueDate,
          createdAt: fmt(today),
          recurring: 'One-time',
          description: `Auto-generated compliance task for ${deadline.form} (${deadline.section}).\n\n${deadline.desc}`,
          tags: ['compliance', 'auto-generated'],
          subtasks: [],
          comments: [],
          attachments: [],
          activity: [{ text: 'Task auto-generated from Compliance Master', at: fmt(today) }]
        };
        tasksToCreate.push(newTask);
        
        const subtaskTitles = ['Collect data from client', 'Prepare computation', 'File return via KDK Sync'];
        subtaskTitles.forEach(title => {
          tasksToCreate.push({
            id: genUUID(),
            parentId: parentId,
            issueType: 'Subtask',
            title: title,
            clientId: client.id,
            type: deadline.category,
            status: 'To Do',
            priority: 'Medium',
            assigneeId: client.manager || currentUser?.id || 'u1',
            reviewerId: '',
            dueDate: deadline.dueDate,
            createdAt: fmt(today),
            recurring: 'One-time',
            description: '',
            tags: [],
            subtasks: [],
            comments: [],
            attachments: [],
            activity: []
          });
        });
        createdCount++;
      }
      
      await addTasks(tasksToCreate);
      
      toast(`Successfully generated ${createdCount} tasks for ${deadline.title}`, 'success');
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast('Failed to generate tasks', 'error');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="animate-slide-up">
      <PageHeader 
        title="Compliance Master" 
        description="All statutory deadlines and filing schedules"
        action={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus size={18} />
              Add Compliance
            </button>
            <button 
              onClick={async () => {
                setIsGenerating('all');
                let count = 0;
                for (const d of deadlines) {
                  const applicableClients = clients.filter(c => c.services.includes(d.category));
                  for (const client of applicableClients) {
                    const newTask: Task = {
                      id: genUUID(),
                      title: `${d.title} - ${client.name}`,
                      clientId: client.id,
                      type: d.category,
                      status: 'To Do',
                      priority: 'High',
                      assigneeId: client.manager || currentUser?.id || 'u1',
                      reviewerId: '',
                      dueDate: d.dueDate,
                      createdAt: fmt(today),
                      recurring: 'One-time',
                      description: `Auto-generated compliance task for ${d.form} (${d.section}).\n\n${d.desc}`,
                      tags: ['compliance', 'auto-generated'],
                      subtasks: [
                        { id: genUUID(), title: 'Collect data from client', done: false },
                        { id: genUUID(), title: 'Prepare computation', done: false },
                        { id: genUUID(), title: 'File return via KDK Sync', done: false }
                      ],
                      comments: [],
                      attachments: [],
                      activity: [{ text: 'Task auto-generated from Compliance Master', at: fmt(today) }]
                    };
                    await addTask(newTask);
                    count++;
                  }
                }
                setIsGenerating(null);
                toast(`Successfully generated ${count} tasks for all deadlines`, 'success');
              }}
              disabled={isGenerating === 'all'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {isGenerating === 'all' ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
              Generate All Tasks
            </button>
            <button 
              id="how-it-works-btn"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100"
              title="How it works"
            >
              <Zap size={18} />
            </button>
            <button 
              onClick={handleSyncKDK}
              disabled={isSyncing}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} /> 
              {isSyncing ? 'Syncing with KDK...' : 'Sync KDK'}
            </button>
          </div>
        }
      />

      {/* How it works info box */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Zap size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-[14px] font-bold text-blue-900 mb-1">How Compliance Master Works</h4>
                <p className="text-[12px] text-blue-800 leading-relaxed opacity-80">
                  1. <span className="font-bold">Define Deadlines:</span> Add master compliance events (e.g., GSTR-1, TDS Filing) with their due dates and categories.<br/>
                  2. <span className="font-bold">Automatic Linking:</span> The system automatically counts clients who have the matching service in their profile.<br/>
                  3. <span className="font-bold">Bulk Task Generation:</span> Click the <Zap size={12} className="inline mx-0.5" /> icon on any deadline to auto-create tasks for all applicable clients instantly.
                </p>
              </div>
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="text-blue-400 hover:text-blue-600 p-1"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Coachmark 
        id="compliance-master-onboarding"
        title="Compliance Automation"
        content="Learn how to automate task generation for all your clients based on statutory deadlines."
        targetId="how-it-works-btn"
        position="bottom"
      />

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <button 
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors shrink-0 ${filter === '' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setFilter('')}
        >
          All
        </button>
        {complianceCategories.map(c => (
          <button 
            key={c} 
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors shrink-0 ${filter === c ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Compliance</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Form</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Section</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Clients</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-gray-700">
            {filtered.map(d => {
              const dl = daysLeft(d.dueDate);
              const urgent = dl !== null && dl <= 3 && dl >= 0;
              const overdue = dl !== null && dl < 0;
              
              return (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[13px] text-gray-900">{d.title}</div>
                    <div className="text-[11.5px] text-gray-500 mt-0.5">{d.desc}</div>
                  </td>
                  <td className="px-4 py-3"><TypeChip type={d.category} /></td>
                  <td className="px-4 py-3 text-[12px] font-mono font-semibold">{d.form}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">{d.section}</td>
                  <td className="px-4 py-3">
                    <div className={`font-semibold text-[13px] ${overdue ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-gray-900'}`}>
                      {fmtDate(d.dueDate)}
                    </div>
                    {dl !== null && (
                      <div className={`text-[11px] mt-0.5 ${overdue ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-gray-400'}`}>
                        {overdue ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d remaining`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[14px]">{d.clients}</div>
                    <div className="text-[11px] text-gray-400">clients</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${overdue ? 'bg-red-50 text-red-600' : urgent ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {overdue ? 'Overdue' : urgent ? 'Urgent' : 'On Track'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleGenerateTasks(d)}
                        disabled={isGenerating === d.id}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Auto-Create Tasks"
                      >
                        {isGenerating === d.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Zap size={12} />
                        )}
                        Tasks
                      </button>
                      <button 
                        onClick={() => {
                          setNewDeadline(d);
                          setIsAdding(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Deadline"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                      <button 
                        onClick={async () => {
                          if (await confirm({ 
                            title: 'Delete Deadline', 
                            message: 'Are you sure you want to delete this compliance deadline? This will not delete any tasks already generated from it.',
                            danger: true 
                          })) {
                            try {
                              await deleteDeadline(d.id);
                              toast('Deadline deleted successfully', 'success');
                            } catch (error) {
                              toast('Failed to delete deadline', 'error');
                            }
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Deadline"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filtered.map(d => {
          const dl = daysLeft(d.dueDate);
          const urgent = dl !== null && dl <= 3 && dl >= 0;
          const overdue = dl !== null && dl < 0;
          
          return (
            <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-bold text-[14px] text-gray-900">{d.title}</div>
                  <div className="text-[12px] text-gray-500 mt-0.5">{d.desc}</div>
                </div>
                <TypeChip type={d.category} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Form / Section</div>
                  <div className="text-[12px] font-mono font-bold text-gray-700">{d.form}</div>
                  <div className="text-[11px] text-gray-500">{d.section}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</div>
                  <div className={`text-[13px] font-bold ${overdue ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-gray-900'}`}>
                    {fmtDate(d.dueDate)}
                  </div>
                  {dl !== null && (
                    <div className={`text-[11px] ${overdue ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-gray-400'}`}>
                      {overdue ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d remaining`}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-[14px] text-gray-900">{d.clients}</div>
                  <div className="text-[11px] text-gray-400">clients</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${overdue ? 'bg-red-50 text-red-600' : urgent ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {overdue ? 'Overdue' : urgent ? 'Urgent' : 'On Track'}
                  </span>
                  <button 
                    onClick={() => handleGenerateTasks(d)}
                    disabled={isGenerating === d.id}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                    title="Auto-Create Tasks"
                  >
                    {isGenerating === d.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Zap size={14} />
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setNewDeadline(d);
                      setIsAdding(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Deadline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </button>
                  <button 
                    onClick={async () => {
                      if (await confirm({ 
                        title: 'Delete Deadline', 
                        message: 'Are you sure you want to delete this compliance deadline? This will not delete any tasks already generated from it.',
                        danger: true 
                      })) {
                        try {
                          await deleteDeadline(d.id);
                          toast('Deadline deleted successfully', 'success');
                        } catch (error) {
                          toast('Failed to delete deadline', 'error');
                        }
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Deadline"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <Modal
          title={newDeadline.id ? "Edit Compliance Deadline" : "Add Compliance Deadline"}
          onClose={() => setIsAdding(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCompliance}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {newDeadline.id ? "Save Changes" : "Add Deadline"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input 
                type="text" 
                value={newDeadline.title} 
                onChange={e => setNewDeadline({...newDeadline, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. GST GSTR-3B Filing"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newCategory} 
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="New Category"
                      autoFocus
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                    <button 
                      onClick={() => setIsAddingCategory(false)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select 
                      value={newDeadline.category} 
                      onChange={e => setNewDeadline({...newDeadline, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      {complianceCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button 
                      onClick={() => setIsAddingCategory(true)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                      title="Add new category"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input 
                  type="date" 
                  value={newDeadline.dueDate} 
                  onChange={e => setNewDeadline({...newDeadline, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form</label>
                <input 
                  type="text" 
                  value={newDeadline.form} 
                  onChange={e => setNewDeadline({...newDeadline, form: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. GSTR-3B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input 
                  type="text" 
                  value={newDeadline.section} 
                  onChange={e => setNewDeadline({...newDeadline, section: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Sec 39"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={newDeadline.desc} 
                onChange={e => setNewDeadline({...newDeadline, desc: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                placeholder="Details about this compliance requirement..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
