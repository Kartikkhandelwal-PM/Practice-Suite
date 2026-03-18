import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Plus, Search, Edit2, Trash2, ChevronLeft, Users, GitMerge, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Toggle } from '../components/ui/Toggle';
import { TypeChip, StatusBadge } from '../components/ui/Badges';
import { Avatar } from '../components/ui/Avatar';
import { TaskModal } from '../components/ui/TaskModal';
import { genUUID, fmt, today, daysLeft, TYPE_COLORS } from '../utils';
import { Client, Task } from '../types';
import { Pagination } from '../components/ui/Pagination';
import { PageHeader } from '../components/ui/PageHeader';

export function ClientsPage() {
  const { clients, users, tasks, currentUser, addClient, updateClient, deleteClient, addTask, addTasks } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState<'form' | 'view' | null>(null);
  const [form, setForm] = useState<Client | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const SERVICES = ['GST', 'TDS', 'ITR', 'ROC', 'Audit', 'MCA', 'Advance Tax', 'FEMA', 'Labour'];
  const CATS = ['Pvt Ltd', 'LLP', 'Partnership', 'Proprietorship', 'Individual', 'Trust', 'HUF'];

  const filtered = clients.filter(c =>
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.pan.toLowerCase().includes(search.toLowerCase()) || c.gstin?.toLowerCase().includes(search.toLowerCase())) &&
    (!filter || c.category === filter)
  );

  const paginatedClients = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openNew = () => {
    setForm({ id: genUUID(), name: '', pan: '', gstin: '', category: 'Pvt Ltd', services: [], manager: currentUser?.id || 'u1', email: '', phone: '', address: '', onboarded: fmt(today), active: true });
    setModal('form');
  };
  
  const openEdit = (c: Client) => {
    setForm({ ...c, services: [...c.services] });
    setModal('form');
  };

  const save = async () => {
    if (!form?.name || !form?.pan) { toast('Name and PAN are required', 'error'); return; }
    try {
      const isNew = !clients.find(c => c.id === form.id);
      if (!isNew) {
        await updateClient(form.id, form);
      } else {
        await addClient(form);
        
        // Auto-create tasks based on services
        const newTasks: Task[] = [];
        form.services.forEach(service => {
          const parentId = genUUID();
          newTasks.push({
            id: parentId,
            title: `Initial Setup & Compliance for ${service}`,
            clientId: form.id,
            type: service,
            status: 'To Do',
            priority: 'High',
            assigneeId: form.manager,
            reviewerId: '',
            dueDate: fmt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
            createdAt: fmt(today),
            recurring: 'Monthly',
            description: `Auto-generated task for ${service} compliance. Please review and set up necessary documents.`,
            tags: ['auto-generated', 'onboarding'],
            subtasks: [],
            comments: [],
            attachments: [],
            activity: [{ text: 'Task auto-created during client onboarding', at: fmt(today) }]
          });
          
          const subtaskTitles = ['Collect necessary documents', 'Verify credentials', 'Setup portal access'];
          subtaskTitles.forEach(title => {
            newTasks.push({
              id: genUUID(),
              parentId: parentId,
              issueType: 'Subtask',
              title: title,
              clientId: form.id,
              type: service,
              status: 'To Do',
              priority: 'Medium',
              assigneeId: form.manager,
              reviewerId: '',
              dueDate: fmt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
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
        });
        
        // Add all new tasks
        await addTasks(newTasks);
      }
      toast(isNew ? 'Client saved and tasks auto-generated' : 'Client updated', 'success');
      setModal(null);
      setForm(null);
    } catch (error) {
      console.error('Error saving client:', error);
      toast('Failed to save client', 'error');
    }
  };

  const del = async (id: string) => {
    if (await confirm({ title: 'Delete Client', message: 'Are you sure you want to delete this client?', danger: true })) {
      try {
        await deleteClient(id);
        toast('Client deleted', 'success');
      } catch (error) {
        console.error('Error deleting client:', error);
        toast('Failed to delete client', 'error');
      }
    }
  };

  const toggleService = (s: string) => {
    setForm(f => f ? { ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] } : null);
  };

  if (modal === 'view' && selected) {
    const c = selected;
    const mgr = users.find(u => u.id === c.manager);
    const ct = tasks.filter(t => t.clientId === c.id);
    const active_t = ct.filter(t => t.status !== 'Completed');
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const isCurrentMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };
    
    return (
      <div className="animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors" onClick={() => { setModal(null); setSelected(null); }}>
            <ChevronLeft size={14} /> Back
          </button>
          <h1 className="font-serif text-[22px] font-semibold text-gray-900 flex-1">{c.name}</h1>
          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors" onClick={() => openEdit(c)}>
            <Edit2 size={13} /> Edit
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="space-y-3">
              {[
                ['PAN', c.pan], ['GSTIN', c.gstin || 'Not registered'], ['Category', c.category], 
                ['Manager', mgr?.name || '—'], ['Email', c.email], ['Phone', c.phone], 
                ['Address', c.address], ['Onboarded', new Date(c.onboarded).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })]
              ].map(([k, v]) => (
                <div key={k} className="flex py-1.5 border-b border-gray-100 last:border-0">
                  <span className="w-[120px] text-[12px] text-gray-500 font-semibold shrink-0">{k}</span>
                  <span className="text-[13px] text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-2 border-t border-gray-100">
              <div className="text-[12px] font-semibold text-gray-500 mb-2.5">Services</div>
              <div className="flex gap-1.5 flex-wrap">
                {c.services.map(s => <TypeChip key={s} type={s} />)}
              </div>
            </div>
          </div>
          
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Total Tasks', num: ct.length, color: '#2563eb' },
                { label: 'Active', num: active_t.length, color: '#d97706' },
                { label: 'Completed', num: ct.filter(t => t.status === 'Completed').length, color: '#059669' },
                { label: 'Overdue', num: ct.filter(t => t.status !== 'Completed' && (daysLeft(t.dueDate) ?? 0) < 0).length, color: '#dc2626' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: s.color }} />
                  <div className="font-serif text-[28px] font-semibold leading-none mb-1.5 mt-1" style={{ color: s.color }}>{s.num}</div>
                  <div className="text-[12px] font-medium text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-[15px] text-gray-900">Task History</h3>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Assignee</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-gray-700">
                {ct.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                        <p>No tasks for this client.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {ct.map(t => {
                  const a = users.find(u => u.id === t.assigneeId);
                  const relevant = isCurrentMonth(t.dueDate);
                  return (
                    <tr key={t.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${!relevant ? 'opacity-40 grayscale-[0.5]' : ''}`} onClick={() => openEditTask(t)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-400">#{t.id}</span>
                          <span className="font-medium text-blue-600 hover:underline">{t.title}</span>
                          {!relevant && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Future/Past</span>}
                          {t.subtasks && t.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0" title={`${t.subtasks.filter(s => s.done).length}/${t.subtasks.length} subtasks done`}>
                              <GitMerge size={10} />
                              <span>{t.subtasks.filter(s => s.done).length}/{t.subtasks.length}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3"><TypeChip type={t.type} /></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-[12px] text-gray-500">{new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar user={a} size={20} />
                          <span className="text-[12px]">{a?.name?.split(' ')[0] || '—'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {ct.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <p>No tasks for this client.</p>
              </div>
            )}
            {ct.map(t => {
              const a = users.find(u => u.id === t.assigneeId);
              const relevant = isCurrentMonth(t.dueDate);
              return (
                <div key={t.id} className={`p-4 hover:bg-gray-50 transition-colors ${!relevant ? 'opacity-40 grayscale-[0.5]' : ''}`} onClick={() => openEditTask(t)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">#{t.id}</span>
                      <div className="font-bold text-[13px] text-blue-600">{t.title}</div>
                      {!relevant && <span className="text-[9px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded font-bold uppercase">Future/Past</span>}
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <TypeChip type={t.type} />
                      <span className="text-[11px] text-gray-500">{new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Avatar user={a} size={18} />
                      <span className="text-[11px] text-gray-600">{a?.name?.split(' ')[0] || '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isTaskModalOpen && (
          <TaskModal
            task={editingTask}
            onClose={() => setIsTaskModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <PageHeader 
        title="Clients" 
        description="Manage your client portfolio and their compliance status."
        action={
          <button id="add-client-btn" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200" onClick={openNew}>
            <Plus size={18} /> Add Client
          </button>
        }
      />

      <div className="flex gap-2 items-center flex-wrap mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-[260px] focus-within:border-blue-600 transition-colors">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input 
            placeholder="Search by name, PAN, GSTIN..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
          />
        </div>
        <select className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none cursor-pointer hover:border-gray-400 focus:border-blue-600" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">PAN</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">GSTIN</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-gray-700">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
                      <Users size={32} className="opacity-30" />
                      <h3 className="font-semibold text-gray-700 text-[15px]">No clients found</h3>
                    </div>
                  </td>
                </tr>
              )}
              {paginatedClients.map(c => {
                const mgr = users.find(u => u.id === c.manager);
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[13px] text-blue-600 hover:underline cursor-pointer" onClick={() => { setSelected(c); setModal('view'); }}>{c.name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[12px]">{c.category}</td>
                    <td className="px-4 py-3 text-[12px] font-mono">{c.pan}</td>
                    <td className="px-4 py-3 text-[11.5px] font-mono">{c.gstin || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {c.services.slice(0, 3).map(s => <TypeChip key={s} type={s} />)}
                        {c.services.length > 3 && <span className="text-[10px] text-gray-400 font-medium mt-0.5">+{c.services.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Avatar user={mgr} size={20} />
                        <span className="text-[12px]">{mgr?.name?.split(' ')[0] || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${c.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                        <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => del(c.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
              <Users size={32} className="opacity-30" />
              <h3 className="font-semibold text-gray-700 text-[15px]">No clients found</h3>
            </div>
          )}
          {paginatedClients.map(c => {
            const mgr = users.find(u => u.id === c.manager);
            return (
              <div key={c.id} className="p-4 hover:bg-gray-50 transition-colors" onClick={() => { setSelected(c); setModal('view'); }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-[14px] text-blue-600">{c.name}</div>
                    <div className="text-[11px] text-gray-400">{c.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${c.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 mb-3">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">PAN</div>
                    <div className="text-[12px] font-mono">{c.pan}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Category</div>
                    <div className="text-[12px]">{c.category}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {c.services.slice(0, 2).map(s => <TypeChip key={s} type={s} />)}
                    {c.services.length > 2 && <span className="text-[10px] text-gray-400 font-medium mt-0.5">+{c.services.length - 2}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Avatar user={mgr} size={18} />
                    <span className="text-[11px] text-gray-600">{mgr?.name?.split(' ')[0] || '—'}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button 
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); del(c.id); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
      </div>

      {modal === 'form' && form && (
        <Modal
          title={clients.find(c => c.id === form.id) ? 'Edit Client' : 'New Client'}
          onClose={() => setModal(null)}
          size="lg"
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setModal(null)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={save}>Save Client</button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Client Name *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="Legal business name" value={form.name} onChange={e => setForm(f => f ? { ...f, name: e.target.value } : null)} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Category</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.category} onChange={e => setForm(f => f ? { ...f, category: e.target.value } : null)}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">PAN *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-mono uppercase" placeholder="AAAAA0000A" value={form.pan} onChange={e => setForm(f => f ? { ...f, pan: e.target.value.toUpperCase() } : null)} maxLength={10} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">GSTIN</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-mono uppercase" placeholder="22AAAAA0000A1Z5" value={form.gstin || ''} onChange={e => setForm(f => f ? { ...f, gstin: e.target.value.toUpperCase() } : null)} maxLength={15} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Email</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" type="email" placeholder="accounts@company.in" value={form.email} onChange={e => setForm(f => f ? { ...f, email: e.target.value } : null)} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Phone</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" type="tel" placeholder="9876543210" value={form.phone} onChange={e => setForm(f => f ? { ...f, phone: e.target.value } : null)} />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Address</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="Full address" value={form.address || ''} onChange={e => setForm(f => f ? { ...f, address: e.target.value } : null)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Relationship Manager</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.manager} onChange={e => setForm(f => f ? { ...f, manager: e.target.value } : null)}>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Onboarding Date</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" type="date" value={form.onboarded} onChange={e => setForm(f => f ? { ...f, onboarded: e.target.value } : null)} />
            </div>
          </div>
          
          <div className="mb-5">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-2">Services</label>
            <div className="flex gap-2 flex-wrap">
              {SERVICES.map(s => {
                const isSelected = form.services.includes(s);
                const colors = TYPE_COLORS[s] || { bg: '#eff6ff', text: '#2563eb' };
                return (
                  <div 
                    key={s} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer transition-all text-[12px] font-medium ${isSelected ? 'border-transparent' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                    style={isSelected ? { background: colors.bg, color: colors.text } : {}}
                    onClick={() => toggleService(s)}
                  >
                    {s}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Toggle value={form.active} onChange={v => setForm(f => f ? { ...f, active: v } : null)} />
            <span className="text-[13px] font-medium text-gray-700">Client is active</span>
          </div>
        </Modal>
      )}
    </div>
  );
}
