import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Plus, Edit2, Trash2, X, GripVertical, LayoutTemplate, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { TypeChip } from '../components/ui/Badges';
import { Modal } from '../components/ui/Modal';
import { TaskModal } from '../components/ui/TaskModal';
import { genUUID, today, fmt } from '../utils';
import { Template, Task } from '../types';
import { PageHeader } from '../components/ui/PageHeader';

export function TemplatesPage() {
  const { templates, tasks, addTemplate, updateTemplate, deleteTemplate } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState<'view' | 'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Template | null>(null);
  const [form, setForm] = useState<Template | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filtered = templates.filter(t => !filter || t.category === filter || filter === 'All');

  const openCreate = () => {
    setForm({ id: genUUID(), name: '', category: 'GST', recurring: 'Monthly', estHours: '', description: '', subtasks: [], color: '#2563eb' });
    setModal('create');
  };
  
  const openEdit = (t: Template) => {
    setForm({ ...t, subtasks: [...t.subtasks] });
    setModal('edit');
  };

  const useTemplate = (t: Template) => {
    const newTask: Task = {
      ...tasks[0], // Get default structure
      id: '', // Will be generated in TaskModal
      title: t.name,
      type: t.category,
      description: t.description,
      recurring: t.recurring,
      subtasks: t.subtasks.map(s => ({ id: genUUID(), title: s, done: false })),
      status: 'To Do',
      dueDate: fmt(today),
      tags: [],
      comments: [],
      attachments: [],
      activity: []
    };
    setEditingTask(newTask);
    setIsTaskModalOpen(true);
    setModal(null);
  };

  const saveTmpl = async () => {
    if (!form?.name.trim()) { toast('Template name required', 'error'); return; }
    try {
      if (modal === 'create') {
        await addTemplate(form);
      } else {
        await updateTemplate(form.id, form);
      }
      toast(modal === 'create' ? 'Template created' : 'Template updated', 'success');
      setModal(null);
      setForm(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toast('Failed to save template', 'error');
    }
  };

  const delTmpl = async (id: string) => {
    if (await confirm({ title: 'Delete Template', message: 'Are you sure you want to delete this template?', danger: true })) {
      try {
        await deleteTemplate(id);
        toast('Template deleted', 'success');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast('Failed to delete template', 'error');
      }
    }
  };

  const TEMPLATE_COLORS = ['#2563eb', '#d97706', '#059669', '#7c3aed', '#ea580c', '#0d9488', '#dc2626'];
  const CATS = ['All', 'GST', 'TDS', 'ITR', 'ROC', 'Audit', 'MCA', 'Advance Tax', 'Other'];

  return (
    <div className="animate-slide-up">
      <PageHeader 
        title="Task Templates" 
        description="Reusable workflow templates for compliance tasks"
        action={
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200" onClick={openCreate}>
            <Plus size={18} /> New Template
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {CATS.map(c => (
          <button 
            key={c} 
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${(!filter && c === 'All') || filter === c ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setFilter(c === 'All' ? '' : c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4.5 hover:shadow-md hover:-translate-y-[2px] transition-all group" style={{ borderTop: `3px solid ${t.color}` }}>
            <div className="flex items-start justify-between mb-2.5">
              <div className="min-w-0 pr-2">
                <div className="font-bold text-[14px] text-gray-900 mb-1.5 truncate">{t.name}</div>
                <div className="flex gap-1.5 flex-wrap">
                  <TypeChip type={t.category} />
                  <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[11px] font-semibold">{t.recurring}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900" onClick={() => openEdit(t)}><Edit2 size={12} /></button>
                <button className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => delTmpl(t.id)}><Trash2 size={12} /></button>
              </div>
            </div>
            
            <p className="text-[12px] text-gray-500 leading-relaxed mb-3 min-h-[40px] line-clamp-2">{t.description || 'No description.'}</p>
            
            <div className="text-[11px] text-gray-400 mb-3 flex items-center gap-2">
              <span className="font-medium text-gray-600">{t.subtasks.length} steps</span>
              {t.estHours && <span>• {t.estHours} hrs est.</span>}
            </div>
            
            <div className="border-t border-gray-100 pt-3 mt-1">
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-2">Steps Included:</div>
              <div className="space-y-1.5">
                {t.subtasks.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11.5px] text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <span className="truncate">{s}</span>
                  </div>
                ))}
                {t.subtasks.length > 3 && <div className="text-[11px] text-gray-400 ml-6 italic">+{t.subtasks.length - 3} more steps</div>}
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded-lg text-[12px] font-semibold transition-colors" onClick={() => useTemplate(t)}>Use Template</button>
              <button className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-[12px] font-medium text-gray-600 transition-colors" onClick={() => { setSelected(t); setModal('view'); }}>Preview</button>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {modal === 'view' && selected && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: selected.color }} />
              {selected.name}
            </div>
          }
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setModal(null)}>Close</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={() => useTemplate(selected)}>Use This Template</button>
            </>
          }
        >
          <div className="flex gap-2 mb-4">
            <TypeChip type={selected.category} />
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-semibold">{selected.recurring}</span>
            {selected.estHours && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-semibold">{selected.estHours} hrs</span>}
          </div>
          <p className="text-[13px] text-gray-700 leading-relaxed mb-5">{selected.description}</p>
          
          <div className="font-semibold text-[12px] text-gray-500 mb-3 uppercase tracking-wider">All {selected.subtasks.length} Steps:</div>
          <div className="space-y-0">
            {selected.subtasks.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: selected.color + '22', color: selected.color }}>{i + 1}</span>
                <span className="text-[13px] text-gray-800">{s}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Create/Edit Modal */}
      {(modal === 'create' || modal === 'edit') && form && (
        <Modal
          title={modal === 'create' ? 'New Template' : 'Edit Template'}
          onClose={() => setModal(null)}
          size="lg"
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setModal(null)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={saveTmpl}>{modal === 'create' ? 'Create Template' : 'Save Changes'}</button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Template Name *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="e.g., Monthly GST Filing" value={form.name} onChange={e => setForm(f => f ? { ...f, name: e.target.value } : null)} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Category</label>
              <input 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" 
                value={form.category} 
                onChange={e => setForm(f => f ? { ...f, category: e.target.value } : null)}
                placeholder="e.g., GST, TDS, Custom Category"
                list="template-categories"
              />
              <datalist id="template-categories">
                {CATS.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Recurrence</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.recurring} onChange={e => setForm(f => f ? { ...f, recurring: e.target.value } : null)}>
                <option>One-time</option><option>Monthly</option><option>Quarterly</option><option>Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Estimated Hours</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="e.g., 4-6" value={form.estHours} onChange={e => setForm(f => f ? { ...f, estHours: e.target.value } : null)} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {TEMPLATE_COLORS.map(c => (
                <div 
                  key={c} 
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`} 
                  style={{ background: c }} 
                  onClick={() => setForm(f => f ? { ...f, color: c } : null)} 
                />
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Description</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 min-h-[80px] resize-y" placeholder="Describe what this template covers..." value={form.description} onChange={e => setForm(f => f ? { ...f, description: e.target.value } : null)} />
          </div>

          <div>
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-2">Steps / Subtasks</label>
            <div className="space-y-2 mb-3">
              {form.subtasks.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="cursor-grab text-gray-400 hover:text-gray-600"><GripVertical size={14} /></div>
                  <div className="w-[22px] h-[22px] bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{i + 1}</div>
                  <input 
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-600" 
                    value={s} 
                    onChange={e => setForm(f => f ? { ...f, subtasks: f.subtasks.map((x, j) => j === i ? e.target.value : x) } : null)} 
                  />
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => setForm(f => f ? { ...f, subtasks: f.subtasks.filter((_, j) => j !== i) } : null)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors" onClick={() => setForm(f => f ? { ...f, subtasks: [...f.subtasks, ''] } : null)}>
              <Plus size={14} /> Add Step
            </button>
          </div>
        </Modal>
      )}

      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          templateId={editingTask?.title ? templates.find(t => t.name === editingTask.title)?.id : undefined}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}
    </div>
  );
}
