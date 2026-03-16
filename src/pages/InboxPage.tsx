import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Search, Filter, Plus, Calendar, Reply, Forward, Paperclip, Link as LinkIcon, Settings, Bot, CheckCircle2, Mail, X, Send, Inbox, Send as SendIcon, FileText, Trash2 } from 'lucide-react';
import { Email } from '../types';
import { TaskModal } from '../components/ui/TaskModal';
import { genUUID, fmt, today } from '../utils';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { summarizeEmail, improveDraft, EmailSummary } from '../services/geminiService';

function EmailAutocompleteInput({ value = '', onChange, placeholder, users, clients }: any) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const parts = value.split(',');
  const currentPart = parts[parts.length - 1].trim();

  const suggestions = [...users, ...clients].filter(p => 
    currentPart.length > 1 &&
    (p.name.toLowerCase().includes(currentPart.toLowerCase()) || 
     p.email.toLowerCase().includes(currentPart.toLowerCase()))
  ).slice(0, 5);

  const handleSelect = (person: any) => {
    const newParts = [...parts];
    newParts[newParts.length - 1] = `${person.name} <${person.email}>`;
    onChange(newParts.join(', ').trim() + ', ');
    setShowSuggestions(false);
  };

  return (
    <div className="relative flex-1">
      <input 
        type="text" 
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="w-full text-[14px] outline-none"
        placeholder={placeholder}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {suggestions.map((s: any) => (
            <div 
              key={s.id} 
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex flex-col"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              <span className="text-[13px] font-medium text-gray-900">{s.name}</span>
              <span className="text-[12px] text-gray-500">{s.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function InboxPage() {
  const { emails, clients, users, currentUser, addEmail, updateEmail, deleteEmail } = useApp();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(emails[0] || null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [composeModal, setComposeModal] = useState<{ isOpen: boolean, type: 'compose' | 'reply' | 'forward', email?: Email | null }>({ isOpen: false, type: 'compose' });
  const [composeData, setComposeData] = useState({ to: '', cc: '', bcc: '', subject: '', body: '' });
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [aiDraft, setAiDraft] = useState<{ subject: string, body: string } | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [emailSummary, setEmailSummary] = useState<EmailSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ configured: boolean, model: string, key_source?: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  React.useEffect(() => {
    import('../services/geminiService').then(m => {
      m.checkAiStatus().then(status => setAiStatus(status));
    });
  }, []);

  const fetchSummary = async () => {
    if (!selectedEmail || currentFolder !== 'inbox') return;
    setIsSummarizing(true);
    try {
      const summary = await summarizeEmail(
        selectedEmail.subject,
        selectedEmail.body,
        selectedEmail.from,
        currentUser?.name || 'User'
      );
      setEmailSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  React.useEffect(() => {
    fetchSummary();
  }, [selectedEmail, currentFolder, currentUser, retryCount]);

  const openCompose = (type: 'compose' | 'reply' | 'forward', email?: Email | null, draftBody?: string) => {
    setComposeModal({ isOpen: true, type, email });
    setAiDraft(null);
    setShowCcBcc(false);
    
    if (type === 'reply' && email) {
      setComposeData({
        to: email.fromEmail || email.from,
        cc: '',
        bcc: '',
        subject: `Re: ${email.subject}`,
        body: draftBody ? `${draftBody.replace(/\n/g, '<br>')}<br><br>On ${email.date} at ${email.time}, ${email.from} wrote:<br><blockquote>${email.body.replace(/\n/g, '<br>')}</blockquote>` : `<br><br>On ${email.date} at ${email.time}, ${email.from} wrote:<br><blockquote>${email.body.replace(/\n/g, '<br>')}</blockquote>`
      });
    } else if (type === 'forward' && email) {
      setComposeData({
        to: '',
        cc: '',
        bcc: '',
        subject: `Fwd: ${email.subject}`,
        body: `<br><br>---------- Forwarded message ---------<br>From: ${email.from} &lt;${email.fromEmail}&gt;<br>Date: ${email.date}, ${email.time}<br>Subject: ${email.subject}<br>To: ${email.to || 'rajesh@kdkfirm.in'}<br><br>${email.body.replace(/\n/g, '<br>')}`
      });
    } else {
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
    }
  };

  const handleAiDraft = async () => {
    setIsDrafting(true);
    try {
      const result = await improveDraft(composeData.subject, composeData.body);
      setAiDraft({ subject: result.subject || composeData.subject, body: result.body || 'Failed to generate draft.' });
    } catch (error) {
      console.error(error);
      toast('Failed to generate AI draft', 'error');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSend = async () => {
    if (!composeData.to) {
      toast('Please specify at least one recipient', 'error');
      return;
    }
    
    const newEmail: Email = {
      id: genUUID(),
      from: currentUser?.name || 'User',
      fromEmail: currentUser?.email || 'user@example.com',
      to: composeData.to,
      cc: composeData.cc,
      bcc: composeData.bcc,
      clientId: composeModal.email?.clientId || clients[0]?.id || 'c1',
      subject: composeData.subject || '(No Subject)',
      preview: composeData.body.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...',
      body: composeData.body,
      date: fmt(today),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
      taskLinked: null,
      attachments: [],
      folder: 'sent'
    };
    
    try {
      if (composeModal.email?.folder === 'drafts') {
        await deleteEmail(composeModal.email!.id);
      }
      await addEmail(newEmail);
      toast('Message sent successfully', 'success');
      setComposeModal({ isOpen: false, type: 'compose' });
      if (currentFolder === 'sent') {
        setSelectedEmail(newEmail);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast('Failed to send message', 'error');
    }
  };

  const handleClose = async () => {
    if (composeData.body.trim() || composeData.subject.trim() || composeData.to.trim()) {
      const draftEmail: Email = {
        id: composeModal.email?.folder === 'drafts' ? composeModal.email.id : genUUID(),
        from: currentUser?.name || 'User',
        fromEmail: currentUser?.email || 'user@example.com',
        to: composeData.to,
        cc: composeData.cc,
        bcc: composeData.bcc,
        clientId: composeModal.email?.clientId || clients[0]?.id || 'c1',
        subject: composeData.subject || '(No Subject)',
        preview: composeData.body.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...',
        body: composeData.body,
        date: fmt(today),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true,
        taskLinked: null,
        attachments: [],
        folder: 'drafts'
      };
      
      try {
        if (composeModal.email?.folder === 'drafts') {
          await updateEmail(draftEmail.id, draftEmail);
        } else {
          await addEmail(draftEmail);
        }
        toast('Draft saved', 'success');
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    }
    setComposeModal({ isOpen: false, type: 'compose' });
  };

  const handleDiscard = async () => {
    if (composeModal.email?.folder === 'drafts') {
      try {
        await deleteEmail(composeModal.email!.id);
        toast('Draft discarded', 'success');
      } catch (error) {
        console.error('Error discarding draft:', error);
      }
    }
    setComposeModal({ isOpen: false, type: 'compose' });
  };

  const filteredEmails = emails.filter(e => {
    const folder = e.folder || 'inbox';
    if (folder !== currentFolder) return false;
    if (search && !e.subject.toLowerCase().includes(search.toLowerCase()) && !e.from.toLowerCase().includes(search.toLowerCase())) return false;
    if (clientFilter && e.clientId !== clientFilter) return false;
    return true;
  });

  const handleEmailClick = async (email: Email) => {
    if (email.folder === 'drafts') {
      setComposeData({
        to: email.to || '',
        cc: email.cc || '',
        bcc: email.bcc || '',
        subject: email.subject === '(No Subject)' ? '' : email.subject,
        body: email.body || ''
      });
      setComposeModal({ isOpen: true, type: 'compose', email });
      return;
    }
    setSelectedEmail(email);
    setMobileView('detail');
    if (!email.read) {
      try {
        await updateEmail(email.id, { read: true });
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const createTaskFromEmail = () => {
    setIsTaskModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col animate-slide-up bg-[#f4f5f7] p-4 lg:p-8 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-[24px] font-serif font-bold text-gray-900">Email & Inbox</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-blue-600 transition-colors w-full sm:w-[250px]">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input 
              placeholder="Search tasks, clients..." 
              className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
            />
          </div>
          <button className="flex-1 sm:flex-none bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Filter size={14} /> Filter
          </button>
          <button onClick={() => openCompose('compose')} className="flex-1 sm:flex-none bg-[#d9534f] hover:bg-[#c9302c] text-white px-4 py-1.5 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 transition-colors">
            <Plus size={14} /> Compose
          </button>
        </div>
      </div>

      {/* Email Integration Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <h2 className="text-[18px] font-serif font-bold text-gray-900">Email Integration</h2>
          <span className="text-[13px] text-gray-500">Connected: {currentUser?.email || 'rajesh@kdkfirm.in'}</span>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500 hover:bg-gray-50 transition-colors cursor-pointer"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-xl flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[500px] shadow-sm">
        
        {/* Sidebar: Folders */}
        <div className={`w-full lg:w-[200px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col bg-gray-50/50 p-3 max-h-[150px] lg:max-h-none overflow-y-auto ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            <button 
              onClick={() => { setCurrentFolder('inbox'); setSelectedEmail(null); }}
              className={`flex-1 lg:w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${currentFolder === 'inbox' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Inbox size={16} className={currentFolder === 'inbox' ? 'text-blue-600' : 'text-gray-400'} />
                Inbox
              </div>
              {emails.filter(e => (!e.folder || e.folder === 'inbox') && !e.read).length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-bold ml-2">
                  {emails.filter(e => (!e.folder || e.folder === 'inbox') && !e.read).length}
                </span>
              )}
            </button>
            <button 
              onClick={() => { setCurrentFolder('sent'); setSelectedEmail(null); }}
              className={`flex-1 lg:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${currentFolder === 'sent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <SendIcon size={16} className={currentFolder === 'sent' ? 'text-blue-600' : 'text-gray-400'} />
              Sent
            </button>
            <button 
              onClick={() => { setCurrentFolder('drafts'); setSelectedEmail(null); }}
              className={`flex-1 lg:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${currentFolder === 'drafts' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FileText size={16} className={currentFolder === 'drafts' ? 'text-blue-600' : 'text-gray-400'} />
              Drafts
            </button>
            <button 
              onClick={() => { setCurrentFolder('trash'); setSelectedEmail(null); }}
              className={`flex-1 lg:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${currentFolder === 'trash' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Trash2 size={16} className={currentFolder === 'trash' ? 'text-blue-600' : 'text-gray-400'} />
              Trash
            </button>
          </div>
        </div>

        {/* Middle Pane: Email List */}
        <div className={`w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col bg-white ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex-1 lg:flex-none'}`}>
          <div className="p-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-600 transition-colors">
              <input 
                placeholder="Search emails..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                <Inbox size={48} className="mb-4 opacity-20" />
                <p className="text-[14px] font-medium">No emails found</p>
                <p className="text-[12px] mt-1">Try changing your filters or search query.</p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <div 
                  key={email.id} 
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${selectedEmail?.id === email.id ? 'bg-orange-50/30' : ''}`}
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      {!email.read && <div className="w-2 h-2 rounded-full bg-[#d9534f] shrink-0" />}
                      <span className={`text-[13.5px] truncate ${!email.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {currentFolder === 'sent' || currentFolder === 'drafts' ? `To: ${email.to || '(No Recipient)'}` : email.from}
                      </span>
                    </div>
                    <span className={`text-[11px] shrink-0 ${!email.read ? 'font-semibold text-gray-600' : 'text-gray-400'}`}>{email.time}</span>
                  </div>
                  <div className={`text-[13px] truncate mb-1 ${!email.read ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{email.subject}</div>
                  <div className="text-[12px] text-gray-500 truncate">{email.preview}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Email Detail */}
        <div className={`flex-1 flex flex-col bg-white min-w-0 ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
          {selectedEmail ? (
            <>
              <div className="p-4 lg:p-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2 mb-4 lg:hidden">
                  <button 
                    onClick={() => setMobileView('list')}
                    className="p-2 -ml-2 text-gray-500 hover:text-gray-900"
                  >
                    <X size={20} />
                  </button>
                  <span className="text-[14px] font-bold text-gray-700">Back to List</span>
                </div>
                <h2 className="text-[18px] lg:text-[22px] font-serif font-bold text-gray-900 mb-4">{selectedEmail.subject}</h2>
                
                <div className="text-[12px] lg:text-[13px] text-gray-600 mb-4">
                  From: <span className="font-semibold text-gray-900">{selectedEmail.from}</span> &lt;{selectedEmail.fromEmail}&gt; · To: {selectedEmail.to || 'rajesh@kdkfirm.in'}
                  {selectedEmail.cc && ` · CC: ${selectedEmail.cc}`}
                  {selectedEmail.bcc && ` · BCC: ${selectedEmail.bcc}`}
                  {' '}· {selectedEmail.date} · {selectedEmail.time}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentFolder === 'inbox' && (
                    <>
                      {!selectedEmail.taskLinked ? (
                        <button 
                          className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                          onClick={createTaskFromEmail}
                        >
                          <Plus size={14} /> <span className="hidden sm:inline">Create Task</span><span className="sm:hidden">Task</span>
                        </button>
                      ) : (
                        <button className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 cursor-default">
                          <CheckCircle2 size={14} /> <span className="hidden sm:inline">Task Linked</span>
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => toast('Meeting scheduled successfully', 'success')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Calendar size={14} /> <span className="hidden sm:inline">Schedule Meeting</span><span className="sm:hidden">Meet</span>
                  </button>
                  <button onClick={() => openCompose('reply', selectedEmail)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Reply size={14} /> <span className="hidden sm:inline">Reply</span>
                  </button>
                  <button onClick={() => openCompose('forward', selectedEmail)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Forward size={14} /> <span className="hidden sm:inline">Forward</span>
                  </button>
                  <button onClick={() => document.getElementById('email-attachment-upload')?.click()} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Paperclip size={14} /> <span className="hidden sm:inline">Attachments</span> {selectedEmail.attachments.length > 0 && `(${selectedEmail.attachments.length})`}
                  </button>
                  <button onClick={() => toast('Email linked to client', 'success')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <LinkIcon size={14} /> <span className="hidden sm:inline">Link to Client</span><span className="sm:hidden">Link</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
                <div 
                  className="text-[14px] text-gray-800 leading-relaxed flex-1 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body.includes('<') ? selectedEmail.body : selectedEmail.body.replace(/\n/g, '<br>') }}
                />
                
                {/* AI Suggestion Box at the bottom of the email body */}
                {currentFolder === 'inbox' && (
                  <div className="mt-8 bg-orange-50/50 border border-orange-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-[#d9534f]">
                        <Bot size={16} /> AI Summary & Suggested Reply
                      </div>
                      {aiStatus && (
                        <div className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${aiStatus.configured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {aiStatus.configured ? `AI Active (${aiStatus.key_source})` : 'AI Inactive'}
                        </div>
                      )}
                    </div>
                    {isSummarizing ? (
                      <div className="flex items-center gap-2 text-[13px] text-gray-500 animate-pulse">
                        <div className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                        Generating AI summary...
                      </div>
                    ) : emailSummary ? (
                      <>
                        <div className="text-[13px] text-gray-700 leading-relaxed mb-3">
                          <strong>Summary:</strong> {emailSummary.overview}
                        </div>
                        <div className="bg-white border border-orange-100 rounded p-3 text-[13px] text-gray-600 italic">
                          {emailSummary.suggestedReply}
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <button 
                            onClick={() => openCompose('reply', selectedEmail, emailSummary.suggestedReply)}
                            className="text-[#d9534f] text-[13px] font-medium hover:underline flex items-center gap-1"
                          >
                            <Reply size={14} /> Use this draft to reply
                          </button>
                          <button 
                            onClick={() => setRetryCount(prev => prev + 1)}
                            className="text-gray-500 text-[12px] hover:underline flex items-center gap-1"
                          >
                            <Settings size={12} /> Regenerate
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="text-[13px] text-gray-500">Failed to generate summary.</div>
                        <button 
                          onClick={() => setRetryCount(prev => prev + 1)}
                          className="text-[#d9534f] text-[12px] font-medium hover:underline w-fit"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Mail size={32} className="text-gray-300" />
              </div>
              <p className="text-[15px] font-medium text-gray-600 mb-1">Select an email to read</p>
            </div>
          )}
        </div>
      </div>

      {isTaskModalOpen && selectedEmail && (
        <TaskModal
          task={{
            id: '',
            title: emailSummary?.title || `Follow up: ${selectedEmail.subject}`,
            clientId: selectedEmail.clientId || '',
            type: 'Other',
            status: 'To Do',
            priority: (selectedEmail.subject + " " + selectedEmail.body).toLowerCase().includes('urgent') ? 'High' : 'Medium',
            assigneeId: currentUser?.id || 'u1',
            reviewerId: '',
            dueDate: fmt(today),
            createdAt: fmt(today),
            recurring: 'One-time',
            description: emailSummary ? `<p><strong>Task Overview:</strong> ${emailSummary.overview}</p><p><strong>Action Items:</strong></p><ul>${emailSummary.steps.map(s => `<li>${s}</li>`).join('')}</ul>` : selectedEmail.body,
            tags: ['email', 'ai-suggested'],
            subtasks: [],
            comments: [],
            attachments: selectedEmail.attachments.map((a, i) => ({ id: `att-${i}`, name: a, url: '#', type: a.endsWith('.pdf') ? 'pdf' : 'other', size: '1 MB' })),
            activity: [{ text: 'Task created from email', at: fmt(today) }]
          }}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}

      {composeModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-slide-up h-[80vh]">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-[14px] font-bold text-gray-700">
                {composeModal.type === 'compose' ? 'New Message' : composeModal.type === 'reply' ? 'Reply' : 'Forward'}
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center">
                <span className="text-[13px] text-gray-500 w-12">To</span>
                <EmailAutocompleteInput 
                  value={composeData.to}
                  onChange={(val: string) => setComposeData({ ...composeData, to: val })}
                  users={users}
                  clients={clients}
                />
                <button 
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="text-[12px] text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100"
                >
                  Cc/Bcc
                </button>
              </div>
              
              {showCcBcc && (
                <>
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center">
                    <span className="text-[13px] text-gray-500 w-12">Cc</span>
                    <EmailAutocompleteInput 
                      value={composeData.cc}
                      onChange={(val: string) => setComposeData({ ...composeData, cc: val })}
                      users={users}
                      clients={clients}
                    />
                  </div>
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center">
                    <span className="text-[13px] text-gray-500 w-12">Bcc</span>
                    <EmailAutocompleteInput 
                      value={composeData.bcc}
                      onChange={(val: string) => setComposeData({ ...composeData, bcc: val })}
                      users={users}
                      clients={clients}
                    />
                  </div>
                </>
              )}
              
              <div className="px-4 py-2 border-b border-gray-100 flex items-center">
                <span className="text-[13px] text-gray-500 w-12">Subject</span>
                <input 
                  type="text" 
                  value={composeData.subject}
                  onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
                  className="flex-1 text-[14px] outline-none font-medium"
                />
              </div>

              <div className="flex-1 flex relative flex-col">
                <div className="flex-1 overflow-y-auto">
                  <RichTextEditor 
                    content={composeData.body}
                    onChange={(content) => setComposeData({ ...composeData, body: content })}
                    placeholder="Write your email here..."
                  />
                </div>
                
                {aiDraft && (
                  <div className="absolute right-4 top-4 bottom-4 w-[400px] bg-orange-50 border border-orange-200 rounded-xl shadow-lg flex flex-col overflow-hidden animate-fade-in z-10">
                    <div className="p-3 border-b border-orange-100 bg-orange-100/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-orange-800">
                        <Bot size={16} /> AI Suggestion
                      </div>
                      <button onClick={() => setAiDraft(null)} className="text-orange-600 hover:bg-orange-200 p-1 rounded">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto text-[13px] text-gray-700">
                      <div className="mb-3">
                        <span className="font-bold text-gray-900">Subject:</span> {aiDraft.subject}
                      </div>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiDraft.body }} />
                    </div>
                    <div className="p-3 border-t border-orange-100 bg-white flex gap-2">
                      <button 
                        onClick={() => {
                          setComposeData({ ...composeData, subject: aiDraft.subject, body: aiDraft.body });
                          setAiDraft(null);
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-1.5 rounded-lg text-[12px] font-bold transition-colors"
                      >
                        Use Draft
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input type="file" id="email-attachment-upload" className="hidden" multiple onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    toast(`${e.target.files.length} file(s) attached`, 'success');
                  }
                }} />
                <button onClick={() => document.getElementById('email-attachment-upload')?.click()} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors" title="Attach files">
                  <Paperclip size={18} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button 
                  onClick={handleAiDraft}
                  disabled={isDrafting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold text-orange-600 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Bot size={16} /> {isDrafting ? 'Drafting...' : composeData.body.trim() ? 'AI Rephrase' : 'AI Draft'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleDiscard} className="text-[13px] font-medium text-gray-600 hover:text-gray-900">
                  Discard
                </button>
                <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-[13px] font-bold flex items-center gap-2 transition-colors shadow-sm">
                  <Send size={16} /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
