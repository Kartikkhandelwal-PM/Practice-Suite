import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Plus, Search, KeyRound, Edit2, Trash2, Users, Lock, Copy, Check, Eye, EyeOff, ShieldAlert, ExternalLink, Building2, ChevronRight, ChevronDown, Clock, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { genId, fmt, today } from '../utils';
import { Password } from '../types';

export function PasswordManagerPage() {
  const { passwords, setPasswords, clients } = useApp();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [activeSelection, setActiveSelection] = useState<{ type: 'all' | 'client', id?: string }>({ type: 'all' });
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Password | null>(null);
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState('');
  const [showModalPw, setShowModalPw] = useState(false);
  const [expandedClients, setExpandedClients] = useState(true);

  const CATS = ['GST', 'Income Tax', 'TDS', 'MCA', 'TRACES', 'Other'];

  const filtered = passwords.filter(p =>
    (!search || p.portal.toLowerCase().includes(search.toLowerCase()) || p.username.toLowerCase().includes(search.toLowerCase())) &&
    (activeSelection.type === 'all' || p.clientId === activeSelection.id) &&
    (!filterCat || p.category === filterCat)
  );

  const pwStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  
  const strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColor = ['#dc2626', '#ea580c', '#d97706', '#059669', '#2563eb', '#7c3aed'];

  const copyPw = (pw: string, id: string) => {
    navigator.clipboard?.writeText(pw).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
      toast('Password copied', 'success');
    }).catch(() => {
      toast('Could not copy — check permissions', 'error');
    });
  };
  
  const copyUser = (u: string) => {
    navigator.clipboard?.writeText(u).then(() => toast('Username copied', 'success')).catch(() => {});
  };

  const openNew = () => {
    setForm({ id: genId(), clientId: activeSelection.type === 'client' ? activeSelection.id || '' : '', portal: '', url: '', username: '', password: '', notes: '', category: 'GST', strength: 0, lastUpdated: fmt(today) });
    setModal(true);
  };
  
  const openEdit = (p: Password) => {
    setForm({ ...p });
    setModal(true);
  };

  const save = () => {
    if (!form?.portal || !form?.username || !form?.password || !form?.clientId) { toast('Client, Portal, username and password are required', 'error'); return; }
    const s = pwStrength(form.password);
    const updated = { ...form, strength: s, lastUpdated: fmt(today) };
    if (passwords.find(p => p.id === form.id)) {
      setPasswords(p => p.map(x => x.id === form.id ? updated : x));
    } else {
      setPasswords(p => [...p, updated]);
    }
    toast('Password saved', 'success');
    setModal(false);
    setForm(null);
  };

  const del = (id: string) => {
    if (confirm('Delete this credential?')) {
      setPasswords(p => p.filter(x => x.id !== id));
      toast('Credential deleted');
    }
  };

  return (
    <div className="flex-1 flex flex-col animate-slide-up">
      <PageHeader 
        title="Password Manager" 
        description="Securely store client portal credentials"
        action={
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200" onClick={openNew}>
            <Plus size={18} /> Add Credential
          </button>
        }
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3 mb-5 text-[13px] shrink-0">
        <ShieldAlert size={18} className="text-amber-600 shrink-0" />
        <div className="text-amber-800">
          <span className="font-bold">Security Notice:</span> Passwords are encrypted at rest. Never share credentials via email or chat. Use the copy button to paste securely.
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl flex-1 flex overflow-hidden min-h-[500px]">
        {/* Sidebar */}
        <div className="w-[260px] shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/50">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input 
                placeholder="Search clients..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="border-none bg-transparent outline-none text-[12.5px] w-full text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <div 
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-2 ${activeSelection.type === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              onClick={() => setActiveSelection({ type: 'all' })}
            >
              <KeyRound size={16} className={activeSelection.type === 'all' ? 'text-blue-600' : 'text-gray-400'} />
              <span className="text-[13px] font-medium">All Passwords</span>
            </div>

            <div className="mb-1">
              <div 
                className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-gray-500 hover:text-gray-900 transition-colors"
                onClick={() => setExpandedClients(!expandedClients)}
              >
                {expandedClients ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="text-[11px] font-bold uppercase tracking-wider">Clients</span>
              </div>
              
              {expandedClients && (
                <div className="space-y-0.5 mt-1">
                  {clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())).map(client => (
                    <div 
                      key={client.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ml-2 ${activeSelection.type === 'client' && activeSelection.id === client.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => setActiveSelection({ type: 'client', id: client.id })}
                    >
                      <Building2 size={14} className={activeSelection.type === 'client' && activeSelection.id === client.id ? 'text-blue-600' : 'text-gray-400'} />
                      <span className="text-[12.5px] font-medium truncate">{client.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-[16px] font-semibold text-gray-900">
                {activeSelection.type === 'all' ? 'All Passwords' : clients.find(c => c.id === activeSelection.id)?.name || 'Client Passwords'}
              </h2>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {filtered.length}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-[12.5px] outline-none focus:border-blue-600 bg-white"
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => {
                const client = clients.find(c => c.id === p.clientId);
                const sLabel = strengthLabel[p.strength] || 'Unknown';
                const sColor = strengthColor[p.strength] || '#9ca3af';
                
                return (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group relative">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors" onClick={() => openEdit(p)}>
                        <Edit2 size={13} />
                      </button>
                      <button className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors" onClick={() => del(p.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-start gap-3 mb-4 pr-16">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                        <Lock size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-bold text-gray-900 truncate">{p.portal}</h3>
                        <div className="text-[12px] text-gray-500 truncate">{client?.name || 'Unknown Client'}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Username / ID</span>
                          <button className="text-gray-400 hover:text-blue-600 transition-colors" onClick={() => copyUser(p.username)}>
                            <Copy size={12} />
                          </button>
                        </div>
                        <div className="text-[13px] font-mono text-gray-800 truncate">{p.username}</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</span>
                          <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-blue-600 transition-colors" onClick={() => setShowPw(s => ({ ...s, [p.id]: !s[p.id] }))}>
                              {showPw[p.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button className="text-gray-400 hover:text-blue-600 transition-colors" onClick={() => copyPw(p.password, p.id)}>
                              {copied === p.id ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                        <div className="text-[13px] font-mono text-gray-800 truncate">
                          {showPw[p.id] ? p.password : '••••••••••••'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className="w-2.5 h-1 rounded-full" style={{ background: i <= p.strength ? sColor : '#e5e7eb' }} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sColor }}>{sLabel}</span>
                      </div>
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
                          Open <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 text-[13px]">
                  No credentials found matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal && form && (
        <Modal title={form.id ? 'Edit Credential' : 'Add Credential'} onClose={() => setModal(false)} footer={
          <>
            <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setModal(false)}>Cancel</button>
            <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={save}>Save Credential</button>
          </>
        }>
          <div className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Client *</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 bg-white" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Portal Name *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" placeholder="e.g. GST Portal" value={form.portal} onChange={e => setForm({ ...form, portal: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Category</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 bg-white" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Login URL</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" placeholder="https://" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Username / ID *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 font-mono" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showModalPw ? 'text' : 'password'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 font-mono pr-10" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowModalPw(!showModalPw)}>
                    {showModalPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Notes / Security Q&A</label>
              <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 resize-none h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
