import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Plus, Search, Folder, FolderOpen, FileText, Upload, Trash2, Download, Copy, X, Building2, Clock, Zap, CheckCircle2, ExternalLink, FileImage, FileSpreadsheet, FileVideo, FileAudio, FileArchive, FileCode, File } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { TagInput } from '../components/ui/TagInput';
import { genUUID, fmt, today } from '../utils';
import { Document, Folder as FolderType } from '../types';

export function DocumentManagerPage() {
  const { docs, folders, clients, users, currentUser, addDocument, updateDocument, deleteDocument, addFolder, updateFolder, deleteFolder } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [activeSelection, setActiveSelection] = useState<{ type: 'all' | 'folder' | 'client', id?: string }>({ type: 'all' });
  const [search, setSearch] = useState('');

  const [filterTag, setFilterTag] = useState('');
  const [modal, setModal] = useState<'upload' | null>(null);
  const [form, setForm] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [folderModal, setFolderModal] = useState(false);
  const [folderForm, setFolderForm] = useState<FolderType | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['f1', 'f2', 'f3']);
  const [expandedClients, setExpandedClients] = useState<string[]>([]);

  const [showSidebar, setShowSidebar] = useState(false);

  const FILE_ICONS: Record<string, string> = { pdf: '#dc2626', xlsx: '#059669', csv: '#059669', docx: '#2563eb', pptx: '#ea580c', txt: '#6b7280', png: '#8b5cf6', jpg: '#8b5cf6', jpeg: '#8b5cf6', mp4: '#ec4899', mp3: '#14b8a6', zip: '#f59e0b', default: '#9ca3af' };
  const getFileColor = (type: string) => FILE_ICONS[type.toLowerCase()] || FILE_ICONS.default;

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(t)) return <FileImage size={20} />;
    if (['xlsx', 'xls', 'csv'].includes(t)) return <FileSpreadsheet size={20} />;
    if (['mp4', 'mov', 'avi'].includes(t)) return <FileVideo size={20} />;
    if (['mp3', 'wav'].includes(t)) return <FileAudio size={20} />;
    if (['zip', 'rar', 'tar', 'gz'].includes(t)) return <FileArchive size={20} />;
    if (['html', 'css', 'js', 'ts', 'json'].includes(t)) return <FileCode size={20} />;
    if (['pdf', 'docx', 'doc', 'txt'].includes(t)) return <FileText size={20} />;
    return <File size={20} />;
  };

  const allTags = [...new Set(docs.flatMap(d => d.tags || []))];
  
  const handleOpen = (doc: Document) => {
    setPreviewDoc(doc);
    toast(`Previewing ${doc.name}`);
  };

  const handleDownload = (doc: Document) => {
    toast(`Downloading ${doc.name}...`, 'success');
    
    if (doc.data) {
      const a = document.createElement('a');
      a.href = doc.data;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // For sample files, we can use the actual files
      if (doc.name === 'sample.pdf' || doc.name === 'sample.xlsx') {
        const link = document.createElement('a');
        link.href = `/${doc.name}`;
        link.setAttribute('download', doc.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Simulate real download with a blob
        const content = `This is the content of ${doc.name}. In a real app, this would be the actual file data.`;
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const filteredDocs = docs.filter(d => {
    if (activeSelection.type === 'folder') {
      if (d.folderId !== activeSelection.id) return false;
    } else if (activeSelection.type === 'client') {
      if (d.clientId !== activeSelection.id) return false;
    }
    
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !(d.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTag && !d.tags?.includes(filterTag)) return false;
    
    return true;
  });

  const rootFolders = folders.filter(f => !f.parentId);
  const childFolders = (parentId: string) => folders.filter(f => f.parentId === parentId);
  const toggleFolder = (id: string) => setExpandedFolders(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id]);
  const toggleClient = (id: string) => setExpandedClients(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id]);

  const FolderItem = ({ folder, depth = 0 }: { folder: FolderType, depth?: number }) => {
    const hasChildren = childFolders(folder.id).length > 0;
    const isExpanded = expandedFolders.includes(folder.id);
    const isActive = activeSelection.type === 'folder' && activeSelection.id === folder.id;
    
    return (
      <div>
        <div 
          className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-[13px] ${isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
          style={{ paddingLeft: `${depth * 12 + 10}px` }}
          onClick={() => {
            setActiveSelection({ type: 'folder', id: folder.id });
            if (hasChildren && !isExpanded) toggleFolder(folder.id);
          }}
        >
          {hasChildren ? (
            <button 
              className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
              onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
            >
              {isExpanded ? <FolderOpen size={14} color={isActive ? '#2563eb' : '#d97706'} /> : <Folder size={14} color={isActive ? '#2563eb' : '#d97706'} />}
            </button>
          ) : (
            <Folder size={14} color={isActive ? '#2563eb' : '#d97706'} className="shrink-0" />
          )}
          <span className="flex-1 truncate">{folder.name}</span>
          <span className="text-[10px] text-gray-400 font-medium">{docs.filter(d => d.folderId === folder.id).length}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-blue-600"
              onClick={(e) => { e.stopPropagation(); newFolder(folder.id); }}
              title="Add Subfolder"
            >
              <Plus size={12} />
            </button>
            <button 
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-600"
              onClick={(e) => { e.stopPropagation(); delFolder(folder.id); }}
              title="Delete Folder"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {isExpanded && childFolders(folder.id).map(cf => <FolderItem key={cf.id} folder={cf} depth={depth + 1} />)}
      </div>
    );
  };

  const openUpload = () => {
    setForm({ 
      id: genUUID(), 
      folderId: activeSelection.type === 'folder' ? activeSelection.id! : 'f1', 
      name: '', 
      type: 'pdf', 
      size: '0 KB', 
      clientId: activeSelection.type === 'client' ? activeSelection.id! : '', 
      tags: [], 
      description: '', 
      uploadedBy: currentUser?.id || 'u1', 
      uploadedAt: fmt(today) 
    });
    setModal('upload');
  };
  
  const saveDoc = async () => {
    if (!form?.name) { toast('File name required', 'error'); return; }
    try {
      await addDocument(form);
      toast('Document added', 'success');
      setModal(null);
      setForm(null);
    } catch (error) {
      console.error('Error saving document:', error);
      toast('Failed to save document', 'error');
    }
  };

  const delDoc = async (id: string) => {
    if (await confirm({ title: 'Delete Document', message: 'Are you sure you want to delete this document? This action cannot be undone.', danger: true })) {
      try {
        await deleteDocument(id);
        toast('Document deleted');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast('Failed to delete document', 'error');
      }
    }
  };

  const delFolder = async (id: string) => {
    if (await confirm({ title: 'Delete Folder', message: 'Delete folder and all its contents? This action cannot be undone.', danger: true })) {
      try {
        // In a real app, we'd delete subfolders and docs recursively on the server or in a transaction
        // For now, we'll just delete the folder itself and rely on the UI to filter out orphans
        await deleteFolder(id);
        if (activeSelection.type === 'folder' && activeSelection.id === id) {
          setActiveSelection({ type: 'all' });
        }
        toast('Folder deleted');
      } catch (error) {
        console.error('Error deleting folder:', error);
        toast('Failed to delete folder', 'error');
      }
    }
  };

  const newFolder = (parentId?: string) => {
    setFolderForm({ 
      id: genUUID(), 
      name: '', 
      parentId: parentId || (activeSelection.type === 'folder' ? activeSelection.id! : null), 
      clientId: activeSelection.type === 'client' ? activeSelection.id! : '', 
      icon: 'folder' 
    });
    setFolderModal(true);
  };

  const saveFolder = async () => {
    if (!folderForm?.name) { toast('Folder name required', 'error'); return; }
    try {
      await addFolder(folderForm);
      toast('Folder created', 'success');
      setFolderModal(false);
    } catch (error) {
      console.error('Error saving folder:', error);
      toast('Failed to save folder', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col animate-slide-up">
      <PageHeader 
        title="Document Manager" 
        description="Securely store and organize client documents and files."
        action={
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-lg text-[13px] font-medium items-center gap-1.5 transition-colors" onClick={() => newFolder()}>
              <Folder size={15} /> New Folder
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors" onClick={openUpload}>
              <Upload size={15} /> Upload
            </button>
            <button 
              className="md:hidden p-2 bg-white border border-gray-200 rounded-lg text-gray-600"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Folder size={18} />
            </button>
          </div>
        }
      />

      <div className="bg-white border border-gray-200 rounded-xl flex-1 flex flex-col md:flex-row overflow-hidden min-h-[400px] relative">
        {/* Folder Tree */}
        <div className={`
          absolute inset-0 z-20 bg-white md:relative md:bg-gray-50/50 md:z-0 md:flex
          w-full md:w-[260px] shrink-0 border-r border-gray-200 flex flex-col
          transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-3 border-b border-gray-200 shrink-0 flex items-center justify-between">
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-1">Navigation</div>
            <button className="md:hidden p-1 text-gray-400 hover:text-gray-600" onClick={() => setShowSidebar(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="p-3 border-b border-gray-200 shrink-0">
            <div 
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-[13px] ${activeSelection.type === 'all' ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
              onClick={() => { setActiveSelection({ type: 'all' }); setShowSidebar(false); }}
            >
              <FileText size={14} color={activeSelection.type === 'all' ? '#2563eb' : '#6b7280'} />
              <span className="flex-1">All Documents</span>
              <span className="text-[10px] text-gray-400 font-medium">{docs.length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 px-1 mt-1">Firm Folders</div>
            {rootFolders.filter(f => !f.clientId).map(f => <FolderItem key={f.id} folder={f} />)}
            
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2 px-1 mt-4">Client Documents</div>
            {clients.map(c => {
               const clientFolders = rootFolders.filter(f => f.clientId === c.id);
               const clientDocsCount = docs.filter(d => d.clientId === c.id).length;
               const isExpanded = expandedClients.includes(c.id);
               const isActive = activeSelection.type === 'client' && activeSelection.id === c.id;
               
               return (
                 <div key={c.id} className="mb-1">
                   <div 
                     className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors text-[13px] ${isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                     onClick={() => {
                       setActiveSelection({ type: 'client', id: c.id });
                       if (!isExpanded) toggleClient(c.id);
                       // Don't close sidebar here if they might want to pick a subfolder
                     }}
                   >
                     <button 
                       className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
                       onClick={(e) => { e.stopPropagation(); toggleClient(c.id); }}
                     >
                       {isExpanded ? <FolderOpen size={14} color={isActive ? '#2563eb' : '#6b7280'} /> : <Folder size={14} color={isActive ? '#2563eb' : '#6b7280'} />}
                     </button>
                     <Building2 size={14} className="shrink-0 opacity-70" />
                     <span className="flex-1 truncate">{c.name}</span>
                     <span className="text-[10px] text-gray-400 font-medium">{clientDocsCount}</span>
                   </div>
                   
                   {isExpanded && (
                     <div className="ml-2 border-l border-gray-200 pl-1 mt-1">
                       {clientFolders.map(f => <FolderItem key={f.id} folder={f} depth={1} />)}
                       {clientFolders.length === 0 && (
                         <div className="text-[11px] text-gray-400 px-4 py-1 italic">No folders</div>
                       )}
                     </div>
                   )}
                 </div>
               );
            })}
          </div>
        </div>

        {/* Doc Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-3 border-b border-gray-200 flex flex-col sm:flex-row gap-2 items-start sm:items-center shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex-1 focus-within:border-blue-600 focus-within:bg-white transition-colors w-full">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input 
                placeholder="Search documents..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
              />
            </div>
            <select className="w-full sm:w-auto px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12.5px] bg-white outline-none cursor-pointer hover:border-gray-400 focus:border-blue-600" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
              <option value="">All Tags</option>
              {allTags.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredDocs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                <FileText size={48} className="opacity-20" />
                <div className="text-center">
                  <h3 className="font-semibold text-gray-700 text-[15px]">No documents</h3>
                  <p className="text-[13px] mt-1">Upload documents to this location.</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.map(d => {
                const uploader = users.find(u => u.id === d.uploadedBy);
                const fc = getFileColor(d.type);
                return (
                  <div key={d.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all group bg-white">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: fc + '18', color: fc }}>
                        {getFileIcon(d.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13px] text-gray-900 truncate" title={d.name}>{d.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wider font-bold" style={{ color: fc }}>{d.type} <span className="text-gray-400 font-medium ml-1">• {d.size}</span></div>
                      </div>
                      <button className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => delDoc(d.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    
                    {d.description && <p className="text-[11.5px] text-gray-600 mb-3 line-clamp-2 leading-relaxed">{d.description}</p>}
                    
                    {d.tags && d.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {d.tags.map(t => (
                          <span key={t} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">{t}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-[10.5px] text-gray-400 font-medium mb-3">
                      <span>{uploader?.name?.split(' ')[0] || '—'}</span>
                      <span>{d.uploadedAt}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors" onClick={() => handleOpen(d)}>
                        <ExternalLink size={12} /> Open
                      </button>
                      <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-colors" onClick={() => handleDownload(d)}>
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {modal === 'upload' && form && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Upload size={18} className="text-blue-600" />
              Upload Document
            </div>
          }
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setModal(null)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5" onClick={saveDoc}>
                <Upload size={14} /> Upload
              </button>
            </>
          }
        >
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-5 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
                    setForm(f => f ? { 
                      ...f, 
                      name: file.name, 
                      type: ext, 
                      size: (file.size / 1024).toFixed(1) + ' KB',
                      data: ev.target?.result as string
                    } : null);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <Upload size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-[13px] font-medium text-gray-700">Drag & drop files here, or click to browse</p>
            <p className="text-[11px] text-gray-500 mt-1">PDF, Excel, Word, PowerPoint — up to 50MB</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">File Name *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="e.g., GSTR-3B_Nov2024_AgarwalExports.pdf" value={form.name} onChange={e => setForm(f => f ? { ...f, name: e.target.value } : null)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">File Type</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.type} onChange={e => setForm(f => f ? { ...f, type: e.target.value } : null)}>
                {['pdf', 'xlsx', 'docx', 'pptx', 'txt', 'other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Folder</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.folderId} onChange={e => setForm(f => f ? { ...f, folderId: e.target.value } : null)}>
                <option value="">No Folder</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Client</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={form.clientId || ''} onChange={e => setForm(f => f ? { ...f, clientId: e.target.value } : null)}>
              <option value="">General / Firm</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Tags</label>
            <TagInput tags={form.tags || []} onChange={v => setForm(f => f ? { ...f, tags: v } : null)} />
            <p className="text-[11px] text-gray-400 mt-1.5">Press Enter or comma to add tags (e.g., GST, GSTR-3B, October)</p>
          </div>
          
          <div className="mb-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Description</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="Brief description of this document..." value={form.description} onChange={e => setForm(f => f ? { ...f, description: e.target.value } : null)} />
          </div>
        </Modal>
      )}

      {/* New Folder Modal */}
      {folderModal && folderForm && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <Folder size={18} className="text-amber-500" />
              New Folder
            </div>
          }
          onClose={() => setFolderModal(false)}
          size="sm"
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setFolderModal(false)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={saveFolder}>Create Folder</button>
            </>
          }
        >
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Folder Name *</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" placeholder="e.g., GST Returns 2024" value={folderForm.name} onChange={e => setFolderForm(f => f ? { ...f, name: e.target.value } : null)} />
          </div>
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Parent Folder</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={folderForm.parentId || ''} onChange={e => setFolderForm(f => f ? { ...f, parentId: e.target.value || null } : null)}>
              <option value="">Root (No parent)</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Client (optional)</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white" value={folderForm.clientId || ''} onChange={e => setFolderForm(f => f ? { ...f, clientId: e.target.value || null } : null)}>
              <option value="">General / Firm</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: getFileColor(previewDoc.type) + '18', color: getFileColor(previewDoc.type) }}>
                {getFileIcon(previewDoc.type)}
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-gray-900">{previewDoc.name}</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{previewDoc.type} • {previewDoc.size}</span>
              </div>
            </div>
          }
          onClose={() => setPreviewDoc(null)}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] text-gray-400">Uploaded by {users.find(u => u.id === previewDoc.uploadedBy)?.name} on {previewDoc.uploadedAt}</div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setPreviewDoc(null)}>Close</button>
                <button className="px-4 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5" onClick={() => handleDownload(previewDoc)}>
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          }
        >
          <div className="bg-gray-100 rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center border border-gray-200 overflow-hidden relative">
            {previewDoc.data ? (
              ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(previewDoc.type.toLowerCase()) ? (
                <img src={previewDoc.data} alt={previewDoc.name} className="max-w-full max-h-[400px] object-contain" />
              ) : previewDoc.type.toLowerCase() === 'pdf' ? (
                <iframe src={previewDoc.data} className="w-full h-[400px] border-none" title={previewDoc.name} />
              ) : (
                <div className="space-y-4">
                  <File size={64} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 font-medium italic">Preview not available for this file type</p>
                  <button className="text-blue-600 font-bold hover:underline" onClick={() => handleDownload(previewDoc)}>Download to view</button>
                </div>
              )
            ) : (
              ['png', 'jpg', 'jpeg', 'gif'].includes(previewDoc.type.toLowerCase()) ? (
                <div className="space-y-4">
                  <FileImage size={64} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 font-medium italic">Image preview would appear here</p>
                </div>
              ) : previewDoc.type.toLowerCase() === 'pdf' ? (
                <div className="space-y-4">
                  <FileText size={64} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 font-medium italic">PDF viewer would load here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <File size={64} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 font-medium italic">Preview not available for this file type</p>
                  <button className="text-blue-600 font-bold hover:underline" onClick={() => handleDownload(previewDoc)}>Download to view</button>
                </div>
              )
            )}
          </div>
          {previewDoc.description && (
            <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <h4 className="text-[12px] font-bold text-blue-800 mb-1 uppercase tracking-wider">Description</h4>
              <p className="text-[13px] text-gray-700 leading-relaxed">{previewDoc.description}</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
