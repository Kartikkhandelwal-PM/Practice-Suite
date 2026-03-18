import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Plus, Search, Star, Trash2, StickyNote as StickyNoteIcon, X, Clock, Zap } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { Toggle } from '../components/ui/Toggle';
import { MentionTextarea } from '../components/ui/MentionTextarea';
import { genUUID, fmt, today, NOTE_COLORS } from '../utils';
import { Note } from '../types';

export function StickyNotesPage() {
  const { notes, users, notify, addNote, updateNote, deleteNote } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Note | null>(null);

  const filtered = notes.filter(n =>
    !search || 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );
  
  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  const openNew = () => {
    setForm({ 
      id: genUUID(), 
      title: '', 
      content: '', 
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)], 
      pinned: false, 
      createdAt: fmt(today), 
      updatedAt: fmt(today) 
    });
    setModal(true);
  };
  
  const openEdit = (n: Note) => {
    setForm({ ...n });
    setModal(true);
  };

  const save = async () => {
    if (!form?.title.trim() && !form?.content.trim()) { toast('Note is empty', 'error'); return; }
    const updated = { ...form };
    try {
      if (notes.find(n => n.id === form.id)) {
        await updateNote(form.id, updated);
      } else {
        await addNote(updated);
      }
      toast('Note saved', 'success');
      setModal(false);
      setForm(null);
    } catch (error) {
      console.error('Error saving note:', error);
      toast('Failed to save note', 'error');
    }
  };

  const del = async (id: string) => {
    try {
      await deleteNote(id);
      toast('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast('Failed to delete note', 'error');
    }
  };

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      await updateNote(id, { pinned: !note.pinned });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast('Failed to update note', 'error');
    }
  };

  const handleMention = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      notify(userId, `You were mentioned in a sticky note: ${form?.title || 'Untitled'}`, 'mention', '/sticky-notes');
      toast(`Mentioned ${user.name}`);
    }
  };

  const NoteCard = ({ n }: { n: Note }) => (
    <div 
      className="rounded-2xl p-4 cursor-pointer relative transition-all hover:-translate-y-1 hover:shadow-md"
      style={{ background: n.color }}
      onClick={() => openEdit(n)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-bold text-[14px] text-black/75 leading-snug flex-1">{n.title || 'Untitled'}</div>
        <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button 
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${n.pinned ? 'text-black' : 'text-black/30 hover:text-black/60'}`}
            onClick={() => togglePin(n.id)}
          >
            <Star size={14} fill={n.pinned ? 'currentColor' : 'none'} />
          </button>
          <button 
            className="w-6 h-6 rounded flex items-center justify-center text-black/30 hover:text-black/60 transition-colors"
            onClick={async (e) => { 
              e.stopPropagation();
              if (await confirm({ title: 'Delete Note', message: 'Are you sure you want to delete this note?', danger: true })) del(n.id); 
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p className="text-[12.5px] text-black/60 whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-hidden line-clamp-5">{n.content}</p>
      <div className="text-[10.5px] text-black/35 mt-3 font-medium">Updated {n.updatedAt}</div>
    </div>
  );

  return (
    <div className="animate-slide-up">
      <PageHeader 
        title="Sticky Notes" 
        description="Quick notes and reminders for your practice"
        action={
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[13px] sm:text-[14px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200" onClick={openNew}>
            <Plus size={18} /> <span className="hidden sm:inline">New Note</span><span className="sm:hidden">New</span>
          </button>
        }
      />

      <div className="mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-full sm:w-[260px] focus-within:border-blue-600 transition-colors">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input 
            placeholder="Search notes..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
          />
        </div>
      </div>

      {pinned.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-1">Pinned</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinned.map(n => <NoteCard key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <div className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-1">Other Notes</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unpinned.map(n => <NoteCard key={n.id} n={n} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16 text-gray-500 gap-4">
          <StickyNoteIcon size={48} className="opacity-20" />
          <div className="text-center">
            <h3 className="font-semibold text-gray-700 text-[15px]">No notes found</h3>
            <p className="text-[13px] mt-1 max-w-[300px]">Create a note to capture quick reminders, client info, or anything you need handy.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium mt-2" onClick={openNew}>
            Create First Note
          </button>
        </div>
      )}

      {modal && form && (
        <Modal
          title={<span className="text-black/75">Edit Note</span>}
          onClose={() => setModal(false)}
          headerBg={form.color}
          headerColor="rgba(0,0,0,0.5)"
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setModal(false)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={save}>Save Note</button>
            </>
          }
        >
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Title</label>
            <input 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" 
              placeholder="Note title..." 
              value={form.title} 
              onChange={e => setForm(f => f ? { ...f, title: e.target.value } : null)} 
            />
          </div>
          <div className="mb-4">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Content</label>
            <MentionTextarea 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 min-h-[120px] resize-y" 
              placeholder="Write your note here... Use @ to mention users" 
              value={form.content} 
              onChange={e => setForm(f => f ? { ...f, content: e.target.value } : null)} 
              onMention={handleMention}
            />
          </div>
          <div className="mb-5">
            <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {NOTE_COLORS.map(c => (
                <div 
                  key={c} 
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 border-2 border-black/10 ${form.color === c ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`} 
                  style={{ background: c }} 
                  onClick={() => setForm(f => f ? { ...f, color: c } : null)} 
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Toggle value={form.pinned} onChange={v => setForm(f => f ? { ...f, pinned: v } : null)} />
            <span className="text-[13px] font-medium text-gray-700">Pin this note</span>
          </div>
        </Modal>
      )}
    </div>
  );
}
