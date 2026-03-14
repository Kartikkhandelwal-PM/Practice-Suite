import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Plus, Calendar as CalendarIcon, List, Video, MapPin, Clock, Users, ChevronLeft, ChevronRight, ExternalLink, MoreVertical, Search, Filter, Trash2, Edit2, Info, CheckCircle2, Zap } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '../components/ui/Modal';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { Avatar } from '../components/ui/Avatar';
import { Meeting } from '../types';
import { genUUID, fmt, today, daysLeft, fmtDateShort } from '../utils';

const PLATFORMS = [
  { id: 'google_meet', label: 'Google Meet', color: '#4285f4', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg' },
  { id: 'zoom', label: 'Zoom', color: '#2d8cff', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg' },
  { id: 'microsoft_teams', label: 'Microsoft Teams', color: '#5558af', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Microsoft_Teams_logo_%282019%E2%80%93present%29.svg' },
  { id: 'skype', label: 'Skype', color: '#00aff0', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Skype_logo.svg' },
  { id: 'slack', label: 'Slack', color: '#4a154b', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg' },
  { id: 'phone', label: 'Phone Call', color: '#059669', icon: 'phone' },
  { id: 'in_person', label: 'In Person', color: '#d97706', icon: 'map-pin' },
];

export function MeetingCalendarPage() {
  const { meetings, clients, users, currentUser, addMeeting, updateMeeting, deleteMeeting } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [view, setView] = useState<'calendar' | 'list' | 'upcoming'>('upcoming');
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Meeting | null>(null);
  const [search, setSearch] = useState('');

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    clients.find(c => c.id === m.clientId)?.name.toLowerCase().includes(search.toLowerCase())
  );

  const getMeetingsForDate = (date: Date) => {
    const ds = fmt(date);
    return filteredMeetings.filter(m => m.date === ds);
  };

  const calDays: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const openNew = (date?: Date) => {
    const d = date || today;
    setForm({ id: genUUID(), title: '', clientId: '', type: 'Video Call', platform: 'google_meet', meetLink: '', date: fmt(d), time: '10:00', duration: 60, attendees: [currentUser?.id || 'u1'], description: '', notes: '', status: 'scheduled' });
    setIsModalOpen(true);
  };
  
  const openEdit = (m: Meeting) => {
    setForm({ ...m, attendees: [...m.attendees] });
    setIsModalOpen(true);
  };

  const save = async () => {
    if (!form?.title || !form?.date || !form?.time) { toast('Title, date and time are required', 'error'); return; }
    try {
      if (meetings.find(m => m.id === form.id)) {
        await updateMeeting(form.id, form);
      } else {
        await addMeeting(form);
      }
      toast(form.id && meetings.find(m => m.id === form.id) ? 'Meeting updated' : 'Meeting scheduled', 'success');
      setIsModalOpen(false);
      setForm(null);
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast('Failed to save meeting', 'error');
    }
  };

  const delMeeting = async (id: string) => {
    if (await confirm({ title: 'Delete Meeting', message: 'Are you sure you want to delete this meeting?', danger: true })) {
      try {
        await deleteMeeting(id);
        toast('Meeting deleted');
      } catch (error) {
        console.error('Error deleting meeting:', error);
        toast('Failed to delete meeting', 'error');
      }
    }
  };

  const toggleAttendee = (id: string) => {
    setForm(f => f ? { ...f, attendees: f.attendees.includes(id) ? f.attendees.filter(x => x !== id) : [...f.attendees, id] } : null);
  };

  const upcoming = filteredMeetings.filter(m => (daysLeft(m.date) ?? -1) >= 0).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const past = filteredMeetings.filter(m => (daysLeft(m.date) ?? 0) < 0).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex-1 flex flex-col animate-slide-up">
      <PageHeader 
        title="Meeting Calendar" 
        description="Schedule and manage client consultations and team meetings."
        action={
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200" onClick={() => openNew()}>
            <Plus size={18} /> Schedule Meeting
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200 shrink-0">
            <button 
              onClick={() => setView('upcoming')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${view === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Clock size={16} /> <span className="hidden xs:inline">Upcoming</span>
            </button>
            <button 
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={16} /> <span className="hidden xs:inline">List</span>
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${view === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarIcon size={16} /> <span className="hidden xs:inline">Calendar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Main Content Area */}
        <div className="w-full">
          {view === 'calendar' ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50/50 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"><ChevronLeft size={20} /></button>
                    <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"><ChevronRight size={20} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <div className="relative flex-1 sm:flex-none">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                       placeholder="Search meetings..." 
                       className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[13px] outline-none focus:border-blue-600 w-full sm:w-64 transition-all"
                       value={search}
                       onChange={e => setSearch(e.target.value)}
                     />
                   </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 bg-gray-200 gap-[1px]">
                    {calDays.map((d, i) => {
                      if (!d) return <div key={`empty-${i}`} className="bg-gray-50 min-h-[120px] sm:min-h-[160px]"></div>;
                      const ds = fmt(d);
                      const dm = getMeetingsForDate(d);
                      const isToday = fmt(today) === ds;
                      const isSel = selectedDate === ds;
                      
                      return (
                        <div 
                          key={ds} 
                          className={`bg-white min-h-[120px] sm:min-h-[160px] p-2 cursor-pointer transition-colors relative group ${isToday ? 'bg-blue-50/30' : 'hover:bg-gray-50'} ${isSel ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}`}
                          onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                        >
                          <div className={`text-[12px] sm:text-[13px] font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg mb-2 ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700'}`}>
                            {d.getDate()}
                          </div>
                          <div className="space-y-1.5 overflow-y-auto max-h-[80px] sm:max-h-[110px] custom-scrollbar">
                            {dm.map(m => {
                              const pl = PLATFORMS.find(p => p.id === m.platform);
                              return (
                                <button 
                                  key={m.id}
                                  onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                                  className="w-full text-left px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all truncate bg-white border border-gray-100 hover:border-blue-300 hover:shadow-md flex items-center gap-2 group/item"
                                  style={{ borderLeft: `3px sm:border-left-4 solid ${pl?.color || '#2563eb'}` }}
                                >
                                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center shrink-0">
                                    {pl?.logo ? (
                                      <img 
                                        src={pl.logo} 
                                        alt="" 
                                        className="w-full h-full object-contain" 
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 rounded text-[8px] font-bold">' + pl.label.charAt(0) + '</div>';
                                        }}
                                      />
                                    ) : (
                                      <Video size={12} className="text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="truncate text-gray-900">{m.title}</div>
                                    <div className="text-[8px] sm:text-[9px] text-gray-400 font-medium">{m.time}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <button 
                            className="absolute bottom-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md active:scale-90"
                            onClick={(e) => { e.stopPropagation(); openNew(d); }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'list' ? (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      placeholder="Search meetings, clients..." 
                      className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-600 w-full transition-all"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-all w-full sm:w-auto justify-center">
                    <Filter size={16} /> Filters
                  </button>
                </div>
                <div className="text-[13px] text-gray-500 font-medium">
                  Showing <span className="text-gray-900 font-bold">{filteredMeetings.length}</span> meetings
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMeetings.map(m => {
                  const client = clients.find(c => c.id === m.clientId);
                  const pl = PLATFORMS.find(p => p.id === m.platform) || PLATFORMS[4];
                  const dl = daysLeft(m.date) ?? 0;
                  
                  return (
                    <motion.div 
                      key={m.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden flex flex-col"
                      onClick={() => openEdit(m)}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-blue-100/50 transition-colors" />
                      
                      <div className="flex items-start justify-between mb-4 relative">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform p-2">
                            {pl.logo ? (
                              <img 
                                src={pl.logo} 
                                alt={pl.label} 
                                className="w-full h-full object-contain" 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 rounded text-[14px] font-bold">' + pl.label.charAt(0) + '</div>';
                                }}
                              />
                            ) : (
                              <Video size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{m.title}</h3>
                            <p className="text-[12px] text-gray-500 font-medium">{client?.name}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${dl < 0 ? 'bg-gray-100 text-gray-500' : dl === 0 ? 'bg-red-50 text-red-600' : dl <= 2 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          {dl < 0 ? 'Completed' : dl === 0 ? 'Today' : dl === 1 ? 'Tomorrow' : fmtDateShort(m.date)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5 relative">
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon size={14} className="text-gray-400" />
                          <span className="text-[12.5px] font-medium">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-[12.5px] font-medium">{m.time} ({m.duration}m)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 col-span-2">
                          <Users size={14} className="text-gray-400" />
                          <div className="flex -space-x-2">
                            {m.attendees.slice(0, 3).map((uid, i) => (
                              <Avatar key={i} user={users.find(u => u.id === uid)} size={24} className="border-2 border-white" />
                            ))}
                            {m.attendees.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                +{m.attendees.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[12px] text-gray-500 font-medium ml-1">{m.attendees.length} participants</span>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center gap-2 relative">
                        {m.meetLink ? (
                          <a 
                            href={m.meetLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <ExternalLink size={14} /> Join Meeting
                          </a>
                        ) : (
                          <div className="flex-1 bg-gray-50 text-gray-400 py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2">
                            <MapPin size={14} /> In-Person
                          </div>
                        )}
                        <button 
                          className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          onClick={(e) => { e.stopPropagation(); delMeeting(m.id); }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-blue-600" />
                    Upcoming Today
                  </h3>
                  <div className="space-y-4">
                    {meetings.filter(m => m.date === fmt(today)).length > 0 ? (
                      meetings.filter(m => m.date === fmt(today)).map(m => {
                        const pl = PLATFORMS.find(p => p.id === m.platform);
                        return (
                          <div key={m.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer group bg-white shadow-sm" onClick={() => openEdit(m)}>
                            <div className="hidden sm:block w-1.5 rounded-full group-hover:w-2 transition-all" style={{ backgroundColor: pl?.color || '#3b82f6' }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {pl?.logo ? (
                                  <img 
                                    src={pl.logo} 
                                    alt="" 
                                    className="w-4 h-4 object-contain" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-4 h-4 flex items-center justify-center bg-blue-50 text-blue-600 rounded text-[8px] font-bold">' + (pl?.label?.charAt(0) || 'M') + '</div>';
                                    }}
                                  />
                                ) : (
                                  <Video size={14} className="text-gray-400" />
                                )}
                                <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">{pl?.label}</span>
                              </div>
                              <div className="text-[15px] font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{m.title}</div>
                              <div className="text-[13px] text-gray-500 font-medium mt-1 flex items-center gap-2">
                                <Clock size={14} /> {m.time} • {m.duration} mins
                              </div>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                              <div className="flex -space-x-2">
                                {m.attendees.map(uid => (
                                  <Avatar key={uid} user={users.find(u => u.id === uid)} size={28} className="border-2 border-white shadow-sm" />
                                ))}
                              </div>
                              {m.meetLink && (
                                <a 
                                  href={m.meetLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  onClick={e => e.stopPropagation()}
                                  className="text-blue-600 hover:text-blue-700 font-bold text-[12px] flex items-center gap-1"
                                >
                                  Join <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <CalendarIcon size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-[14px] text-gray-400 font-medium mb-4">No meetings scheduled for today</p>
                        <button 
                          onClick={() => openNew(today)}
                          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-4 py-2 rounded-xl text-[13px] font-bold inline-flex items-center gap-2 transition-all shadow-sm"
                        >
                          <Plus size={16} /> Schedule Meeting
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarIcon size={20} className="text-purple-600" />
                    Next 7 Days
                  </h3>
                  <div className="space-y-4">
                    {upcoming.filter(m => m.date !== fmt(today)).slice(0, 5).map(m => {
                      const pl = PLATFORMS.find(p => p.id === m.platform);
                      return (
                        <div key={m.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer group bg-white shadow-sm" onClick={() => openEdit(m)}>
                          <div className="hidden sm:block w-1.5 rounded-full group-hover:w-2 transition-all" style={{ backgroundColor: pl?.color || '#8b5cf6' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {pl?.logo ? (
                                <img 
                                  src={pl.logo} 
                                  alt="" 
                                  className="w-4 h-4 object-contain" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-4 h-4 flex items-center justify-center bg-purple-50 text-purple-600 rounded text-[8px] font-bold">' + (pl?.label?.charAt(0) || 'M') + '</div>';
                                  }}
                                />
                              ) : (
                                <Video size={14} className="text-gray-400" />
                              )}
                              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">{pl?.label}</span>
                            </div>
                            <div className="text-[14px] font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{m.title}</div>
                            <div className="text-[12px] text-gray-500 font-medium mt-1 flex items-center gap-2">
                              <CalendarIcon size={12} /> {new Date(m.date).toLocaleDateString()} • {m.time}
                            </div>
                          </div>
                          <div className="flex -space-x-2 self-center">
                            {m.attendees.map(uid => (
                              <Avatar key={uid} user={users.find(u => u.id === uid)} size={24} className="border-2 border-white shadow-sm" />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <h3 className="text-[15px] font-bold mb-4 relative">Quick Stats</h3>
                  <div className="space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-blue-100">Total this month</span>
                      <span className="text-xl font-bold">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-blue-100">Avg. duration</span>
                      <span className="text-xl font-bold">45m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-blue-100">Client consultations</span>
                      <span className="text-xl font-bold">18</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && form && (
          <Modal
            title={
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-600" />
                {meetings.find(m => m.id === form.id) ? 'Edit Meeting' : 'Schedule New Meeting'}
              </div>
            }
            onClose={() => setIsModalOpen(false)}
            size="lg"
            footer={
              <div className="flex items-center justify-end gap-2 w-full">
                <button className="px-4 py-2 rounded-xl font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="px-4 py-2 rounded-xl font-bold text-[13px] bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md" onClick={save}>
                  {meetings.find(m => m.id === form.id) ? 'Save Changes' : 'Schedule Meeting'}
                </button>
              </div>
            }
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Meeting Title *</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all" 
                    placeholder="e.g., GST Consultation - ABC Corp"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Client</label>
                  <SearchableSelect options={clients.map(c => ({ value: c.id, label: c.name }))} value={form.clientId} onChange={v => setForm({ ...form, clientId: v })} placeholder="Select Client" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Platform</label>
                  <SearchableSelect options={PLATFORMS.map(p => ({ value: p.id, label: p.label }))} value={form.platform} onChange={v => setForm({ ...form, platform: v })} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Date *</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all" 
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Start Time *</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all" 
                      value={form.time}
                      onChange={e => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Duration (min)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all" 
                      value={form.duration}
                      onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Attendees</label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {users.map(u => {
                      const isSelected = form.attendees.includes(u.id);
                      return (
                        <div 
                          key={u.id} 
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                          onClick={() => toggleAttendee(u.id)}
                        >
                          <Avatar user={u} size={20} />
                          <span className={`text-[12px] ${isSelected ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'}`}>{u.name.split(' ')[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {(form.platform === 'google_meet' || form.platform === 'zoom' || form.platform === 'microsoft_teams') && (
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Meeting Link</label>
                    <input 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all" 
                      placeholder="https://meet.google.com/..."
                      value={form.meetLink || ''}
                      onChange={e => setForm({ ...form, meetLink: e.target.value })}
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Agenda</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all min-h-[80px]" 
                    placeholder="Meeting agenda..."
                    value={form.description || ''}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-2">Meeting Notes / MOM</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all min-h-[120px]" 
                    placeholder="Write meeting notes or minutes of meeting here..."
                    value={form.notes || ''}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-[13px] text-blue-800">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p>Calendar invites and automated reminders will be sent to attendees when email integration is connected.</p>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
