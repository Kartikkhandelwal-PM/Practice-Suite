import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Search, Filter, Plus, Calendar, Reply, Forward, Paperclip, Link as LinkIcon, Settings, Bot, CheckCircle2, Mail, X, Send } from 'lucide-react';
import { Email } from '../types';
import { TaskModal } from '../components/ui/TaskModal';
import { fmt, today } from '../utils';

export function InboxPage() {
  const { emails, setEmails, clients } = useApp();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(emails[0] || null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [composeModal, setComposeModal] = useState<{ isOpen: boolean, type: 'compose' | 'reply' | 'forward', email?: Email | null }>({ isOpen: false, type: 'compose' });

  const filteredEmails = emails.filter(e => {
    if (search && !e.subject.toLowerCase().includes(search.toLowerCase()) && !e.from.toLowerCase().includes(search.toLowerCase())) return false;
    if (clientFilter && e.clientId !== clientFilter) return false;
    return true;
  });

  const handleEmailClick = (email: Email) => {
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
          <button onClick={() => setComposeModal({ isOpen: true, type: 'compose' })} className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-4 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors">
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
        
        {/* Left Pane: Email List */}
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
            {filteredEmails.map(email => (
              <div 
                key={email.id} 
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${selectedEmail?.id === email.id ? 'bg-orange-50/30' : ''}`}
                onClick={() => handleEmailClick(email)}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2 truncate pr-2">
                    {!email.read && <div className="w-2 h-2 rounded-full bg-[#d9534f] shrink-0" />}
                    <span className={`text-[13.5px] truncate ${!email.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>{email.from}</span>
                  </div>
                  <span className={`text-[11px] shrink-0 ${!email.read ? 'font-semibold text-gray-600' : 'text-gray-400'}`}>{email.time}</span>
                </div>
                <div className={`text-[13px] truncate mb-1 ${!email.read ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{email.subject}</div>
                <div className="text-[12px] text-gray-500 truncate">{email.preview}</div>
              </div>
            ))}
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
                  <button className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Calendar size={14} /> Schedule Meeting
                  </button>
                  <button onClick={() => setComposeModal({ isOpen: true, type: 'reply', email: selectedEmail })} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Reply size={14} /> Reply
                  </button>
                  <button onClick={() => setComposeModal({ isOpen: true, type: 'forward', email: selectedEmail })} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Forward size={14} /> Forward
                  </button>
                  <button className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Paperclip size={14} /> Attachments {selectedEmail.attachments.length > 0 && `(${selectedEmail.attachments.length})`}
                  </button>
                  <button className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <LinkIcon size={14} /> Link to Client
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
                <div className="text-[14px] text-gray-800 whitespace-pre-wrap leading-relaxed flex-1">
                  {selectedEmail.body}
                </div>
                
                {/* AI Suggestion Box at the bottom of the email body */}
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
                    onClick={() => setComposeModal({ isOpen: true, type: 'reply', email: selectedEmail })}
                    className="mt-3 text-[#d9534f] text-[13px] font-medium hover:underline flex items-center gap-1"
                  >
                    <Reply size={14} /> Use this draft to reply
                  </button>
                </div>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-[16px] font-semibold text-gray-900">
                {composeModal.type === 'compose' ? 'New Message' : composeModal.type === 'reply' ? 'Reply' : 'Forward'}
              </h3>
              <button onClick={() => setComposeModal({ isOpen: false, type: 'compose' })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
              <input 
                type="text" 
                placeholder="To" 
                defaultValue={composeModal.type === 'reply' ? composeModal.email?.fromEmail : ''}
                className="w-full border-b border-gray-200 pb-2 text-[14px] outline-none focus:border-blue-500"
              />
              <input 
                type="text" 
                placeholder="Subject" 
                defaultValue={composeModal.type === 'reply' ? `Re: ${composeModal.email?.subject}` : composeModal.type === 'forward' ? `Fwd: ${composeModal.email?.subject}` : ''}
                className="w-full border-b border-gray-200 pb-2 text-[14px] outline-none focus:border-blue-500"
              />
              <textarea 
                placeholder="Write your message here..." 
                className="w-full flex-1 min-h-[200px] text-[14px] outline-none resize-none pt-2"
                defaultValue={composeModal.type === 'reply' ? `\n\n${getAIDraftReply(composeModal.email!)}\n\n---------- Original message ---------\nFrom: ${composeModal.email?.from} <${composeModal.email?.fromEmail}>\nDate: ${composeModal.email?.date} ${composeModal.email?.time}\nSubject: ${composeModal.email?.subject}\nTo: ${composeModal.email?.to}\n\n${composeModal.email?.body}` : composeModal.type === 'forward' ? `\n\n---------- Forwarded message ---------\nFrom: ${composeModal.email?.from} <${composeModal.email?.fromEmail}>\nDate: ${composeModal.email?.date} ${composeModal.email?.time}\nSubject: ${composeModal.email?.subject}\nTo: ${composeModal.email?.to}\n\n${composeModal.email?.body}` : ''}
              />
            </div>
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <button className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <Paperclip size={18} />
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setComposeModal({ isOpen: false, type: 'compose' })} className="px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                  Discard
                </button>
                <button onClick={() => {
                  toast('Message sent successfully', 'success');
                  setComposeModal({ isOpen: false, type: 'compose' });
                }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 transition-colors">
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
