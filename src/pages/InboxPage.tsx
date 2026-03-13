import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Search, Filter, Plus, Calendar, Reply, Forward, Paperclip, Link as LinkIcon, Settings, Bot, CheckCircle2, Mail, X, Send, Inbox, Send as SendIcon, FileText, Trash2 } from 'lucide-react';
import { Email } from '../types';
import { TaskModal } from '../components/ui/TaskModal';
import { fmt, today } from '../utils';
import { GoogleGenAI, Type } from '@google/genai';
import { RichTextEditor } from '../components/ui/RichTextEditor';

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
  const { emails, setEmails, clients, users } = useApp();
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const prompt = composeData.body.trim()
        ? `Please rephrase and improve the following email draft to be more professional and clear. Return a JSON object with two keys: "subject" (a concise, professional subject line) and "body" (the improved email body in HTML format, using <p>, <br>, <strong> etc. for formatting). Do not include any extra conversational text or markdown code blocks outside the JSON.\n\nOriginal Subject: ${composeData.subject}\nOriginal Body: ${composeData.body}`
        : `Please write a professional email draft based on the subject: "${composeData.subject}". Return a JSON object with two keys: "subject" (a concise, professional subject line) and "body" (the email body in HTML format, using <p>, <br>, <strong> etc. for formatting). Do not include any extra conversational text or markdown code blocks outside the JSON.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING }
            },
            required: ["subject", "body"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      setAiDraft({ subject: result.subject || composeData.subject, body: result.body || 'Failed to generate draft.' });
    } catch (error) {
      console.error(error);
      toast('Failed to generate AI draft', 'error');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSend = () => {
    if (!composeData.to) {
      toast('Please specify at least one recipient', 'error');
      return;
    }
    
    const newEmail: Email = {
      id: `email-${Date.now()}`,
      from: 'Rajesh Kumar',
      fromEmail: 'rajesh@kdkfirm.in',
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
    
    let updatedEmails = [newEmail, ...emails];
    if (composeModal.email?.folder === 'drafts') {
      updatedEmails = updatedEmails.filter(e => e.id !== composeModal.email!.id);
    }
    
    setEmails(updatedEmails);
    toast('Message sent successfully', 'success');
    setComposeModal({ isOpen: false, type: 'compose' });
    if (currentFolder === 'sent') {
      setSelectedEmail(newEmail);
    }
  };

  const handleClose = () => {
    if (composeData.body.trim() || composeData.subject.trim() || composeData.to.trim()) {
      const draftEmail: Email = {
        id: composeModal.email?.folder === 'drafts' ? composeModal.email.id : `email-${Date.now()}`,
        from: 'Rajesh Kumar',
        fromEmail: 'rajesh@kdkfirm.in',
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
      
      if (composeModal.email?.folder === 'drafts') {
        setEmails(emails.map(e => e.id === draftEmail.id ? draftEmail : e));
      } else {
        setEmails([draftEmail, ...emails]);
      }
      toast('Draft saved', 'success');
    }
    setComposeModal({ isOpen: false, type: 'compose' });
  };

  const handleDiscard = () => {
    if (composeModal.email?.folder === 'drafts') {
      setEmails(emails.filter(e => e.id !== composeModal.email!.id));
      toast('Draft discarded', 'success');
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

  const handleEmailClick = (email: Email) => {
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
    if (!email.read) {
      setEmails(emails.map(e => e.id === email.id ? { ...e, read: true } : e));
    }
  };

  const createTaskFromEmail = () => {
    setIsTaskModalOpen(true);
  };

  const getAITaskDetails = (email: Email) => {
    const text = (email.subject + " " + email.body).toLowerCase();
    
    if (text.includes('notice') || text.includes('defective')) {
      return {
        title: `Respond to Notice u/s 139(9): ${email.from}`,
        overview: "Tax notice received regarding computation mismatch in Schedule BP.",
        steps: [
          "Download notice from Income Tax Portal.",
          "Review mismatch in Schedule BP.",
          "File rectified return within 15 days."
        ]
      };
    }
    
    if (text.includes('document') || text.includes('attached')) {
      return {
        title: `File GSTR-3B (Oct 2024) for ${email.from.split(' ')[0]}`,
        overview: "Documents received for GSTR-3B filing (Oct 2024).",
        steps: [
          "Reconcile 47 purchase invoices and HDFC bank statements.",
          "Apply ₹1,42,000 ITC credit from September.",
          "File GSTR-3B before Nov 20th."
        ]
      };
    }
    
    if (text.includes('audit') && text.includes('meeting')) {
      return {
        title: `Schedule Audit Discussion with ${email.from.split(' ')[0]}`,
        overview: "Client requested meeting to discuss FY 23-24 audit findings.",
        steps: [
          "Review draft audit report.",
          "Schedule meeting for Thursday/Friday afternoon."
        ]
      };
    }

    if (text.includes('salary') || text.includes('tds')) {
      return {
        title: `Process Q2 TDS for ${email.from.split(' ')[0]}`,
        overview: "Q2 salary register received for 48 employees.",
        steps: [
          "Verify total salary (₹38,42,000) and TDS (₹3,12,400).",
          "File 24Q TDS return.",
          "Generate Form 16/16A."
        ]
      };
    }

    return {
      title: `Follow up: ${email.subject}`,
      overview: "General client communication.",
      steps: [
        "Review email and take necessary action."
      ]
    };
  };

  const generateTaskDescription = (email: Email) => {
    const details = getAITaskDetails(email);
    const stepsHtml = details.steps.map(step => `<li>${step}</li>`).join('');
    
    return `<p><strong>Task Overview:</strong> ${details.overview}</p>
<p><strong>Action Items:</strong></p>
<ul>
${stepsHtml}
</ul>`;
  };

  const getAIDraftReply = (email: Email) => {
    const text = (email.subject + " " + email.body).toLowerCase();
    
    if (text.includes('notice') || text.includes('defective')) {
      return `Dear ${email.from.split(' ')[0]},\n\nWe have received the notice u/s 139(9) regarding the defective return. Our team is reviewing the computation mismatch in Schedule BP. We will prepare the rectified computation and share it with you for approval before filing the response within the 15-day deadline.\n\nRegards,\nRajesh`;
    }
    
    if (text.includes('document') || text.includes('attached')) {
      return `Dear ${email.from.split(' ')[0]},\n\nThank you for sharing the documents for the October GSTR-3B filing. We have received the 47 invoices, bank statements, and noted the ₹1,42,000 ITC credit. We will prepare the computation and share it with you shortly before the 20th Nov deadline.\n\nRegards,\nRajesh`;
    }
    
    if (text.includes('audit') && text.includes('meeting')) {
      return `Dear ${email.from.split(' ')[0]},\n\nThanks for reaching out. I am available this Thursday at 3:00 PM to discuss the FY 23-24 audit findings. Let me know if this time works for you, and I will send over a calendar invite.\n\nRegards,\nRajesh`;
    }

    if (text.includes('salary') || text.includes('tds')) {
      return `Dear ${email.from.split(' ')[0]},\n\nReceived the Q2 salary register and Form 12BA. We will process the TDS computation for the 48 employees and proceed with the 24Q filing.\n\nRegards,\nRajesh`;
    }

    return `Dear ${email.from.split(' ')[0]},\n\nThank you for your email. We have received it and will get back to you shortly.\n\nRegards,\nRajesh`;
  };

  return (
    <div className="flex-1 flex flex-col animate-slide-up bg-[#f4f5f7]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-[24px] font-serif font-bold text-gray-900">Email & Inbox</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-blue-600 transition-colors w-[250px]">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input 
              placeholder="Search tasks, clients, compliance" 
              className="border-none bg-transparent outline-none text-[13px] w-full text-gray-900"
            />
          </div>
          <button className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <Filter size={14} /> Filter
          </button>
          <button onClick={() => openCompose('compose')} className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-4 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors">
            <Plus size={14} /> Compose
          </button>
        </div>
      </div>

      {/* Email Integration Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-serif font-bold text-gray-900">Email Integration</h2>
          <span className="text-[13px] text-gray-500">Connected: rajesh@kdkfirm.in</span>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500 hover:bg-gray-50 transition-colors cursor-pointer"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-xl flex-1 flex overflow-hidden min-h-[500px] shadow-sm">
        
        {/* Sidebar: Folders */}
        <div className="w-[200px] shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/50 p-3">
          <div className="space-y-1">
            <button 
              onClick={() => { setCurrentFolder('inbox'); setSelectedEmail(null); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${currentFolder === 'inbox' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Inbox size={16} className={currentFolder === 'inbox' ? 'text-blue-600' : 'text-gray-400'} />
                Inbox
              </div>
              {emails.filter(e => (!e.folder || e.folder === 'inbox') && !e.read).length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
                  {emails.filter(e => (!e.folder || e.folder === 'inbox') && !e.read).length}
                </span>
              )}
            </button>
            <button 
              onClick={() => { setCurrentFolder('sent'); setSelectedEmail(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${currentFolder === 'sent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <SendIcon size={16} className={currentFolder === 'sent' ? 'text-blue-600' : 'text-gray-400'} />
              Sent
            </button>
            <button 
              onClick={() => { setCurrentFolder('drafts'); setSelectedEmail(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${currentFolder === 'drafts' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FileText size={16} className={currentFolder === 'drafts' ? 'text-blue-600' : 'text-gray-400'} />
              Drafts
            </button>
            <button 
              onClick={() => { setCurrentFolder('trash'); setSelectedEmail(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${currentFolder === 'trash' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Trash2 size={16} className={currentFolder === 'trash' ? 'text-blue-600' : 'text-gray-400'} />
              Trash
            </button>
          </div>
        </div>

        {/* Middle Pane: Email List */}
        <div className="w-[320px] shrink-0 border-r border-gray-200 flex flex-col bg-white">
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
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {selectedEmail ? (
            <>
              <div className="p-6 border-b border-gray-100 shrink-0">
                <h2 className="text-[22px] font-serif font-bold text-gray-900 mb-4">{selectedEmail.subject}</h2>
                
                <div className="text-[13px] text-gray-600 mb-4">
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
                          <Plus size={14} /> Create Task
                        </button>
                      ) : (
                        <button className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 cursor-default">
                          <CheckCircle2 size={14} /> Task Linked: {selectedEmail.taskLinked}
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => toast('Meeting scheduled successfully', 'success')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Calendar size={14} /> Schedule Meeting
                  </button>
                  <button onClick={() => openCompose('reply', selectedEmail)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Reply size={14} /> Reply
                  </button>
                  <button onClick={() => openCompose('forward', selectedEmail)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Forward size={14} /> Forward
                  </button>
                  <button onClick={() => document.getElementById('email-attachment-upload')?.click()} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Paperclip size={14} /> Attachments {selectedEmail.attachments.length > 0 && `(${selectedEmail.attachments.length})`}
                  </button>
                  <button onClick={() => toast('Email linked to client', 'success')} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <LinkIcon size={14} /> Link to Client
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
                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#d9534f] mb-2">
                      <Bot size={16} /> AI Summary & Suggested Reply
                    </div>
                    <div className="text-[13px] text-gray-700 leading-relaxed mb-3">
                      <strong>Summary:</strong> {getAITaskDetails(selectedEmail).overview}
                    </div>
                    <div className="bg-white border border-orange-100 rounded p-3 text-[13px] text-gray-600 italic">
                      {getAIDraftReply(selectedEmail)}
                    </div>
                    <button 
                      onClick={() => openCompose('reply', selectedEmail, getAIDraftReply(selectedEmail))}
                      className="mt-3 text-[#d9534f] text-[13px] font-medium hover:underline flex items-center gap-1"
                    >
                      <Reply size={14} /> Use this draft to reply
                    </button>
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
            title: getAITaskDetails(selectedEmail).title,
            clientId: selectedEmail.clientId || '',
            type: 'Other',
            status: 'To Do',
            priority: (selectedEmail.subject + " " + selectedEmail.body).toLowerCase().includes('urgent') ? 'High' : 'Medium',
            assigneeId: 'u1',
            reviewerId: '',
            dueDate: fmt(today),
            createdAt: fmt(today),
            recurring: 'One-time',
            description: generateTaskDescription(selectedEmail),
            tags: ['email', 'ai-suggested'],
            subtasks: [],
            comments: [],
            attachments: selectedEmail.attachments.map((a, i) => ({ id: `att-${i}`, name: a, url: '#', type: a.endsWith('.pdf') ? 'pdf' : 'other', size: '1 MB' })),
            activity: []
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
