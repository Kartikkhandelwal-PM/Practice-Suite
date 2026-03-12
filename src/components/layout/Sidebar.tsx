import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  ListTodo, 
  LayoutTemplate, 
  StickyNote, 
  KeyRound, 
  FolderOpen, 
  CalendarDays,
  Users,
  FileText,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Sidebar() {
  const { users, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const currentUser = users[0]; // Assuming first user is logged in

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'inbox', label: 'Inbox', icon: Mail, path: '/inbox' },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare, path: '/kanban' },
    { id: 'tasks', label: 'All Tasks', icon: ListTodo, path: '/tasks' },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, path: '/templates' },
    { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
    { id: 'documents', label: 'Documents', icon: FolderOpen, path: '/documents' },
    { id: 'meetings', label: 'Meetings', icon: CalendarDays, path: '/meetings' },
    { id: 'notes', label: 'Sticky Notes', icon: StickyNote, path: '/notes' },
    { id: 'passwords', label: 'Passwords', icon: KeyRound, path: '/passwords' },
    { id: 'compliance', label: 'Compliance', icon: FileText, path: '/compliance' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'} shrink-0 bg-[#0d1117] flex flex-col h-screen transition-all duration-300 relative z-[100] overflow-hidden`}>
      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-6'} h-[64px] border-b border-white/10 shrink-0 relative transition-all duration-300`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-lg shadow-black/20 overflow-hidden">
            <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M 12 12 L 38 12 L 12 64 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
              <path d="M 55 12 L 88 12 L 88 43 L 18 85 Z" fill="#f57c73" stroke="#f57c73" strokeWidth="8" strokeLinejoin="round" />
              <path d="M 42 88 L 88 60 L 88 88 Z" fill="#3a749b" stroke="#3a749b" strokeWidth="8" strokeLinejoin="round" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
              <div className="font-serif text-[15px] font-semibold text-white tracking-tight whitespace-nowrap">KDK Practice</div>
              <div className="text-[9px] text-white/35 tracking-widest uppercase whitespace-nowrap">Suite</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        {!sidebarCollapsed && <div className="text-[9px] font-bold tracking-widest uppercase text-white/20 px-4 pt-2 pb-1 animate-in fade-in">Menu</div>}
        <div className="space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              title={sidebarCollapsed ? item.label : ''}
              className={({ isActive }) => 
                `flex items-center gap-2.5 px-4 py-2 mx-2 rounded-lg text-[13px] font-medium transition-all relative ${
                  isActive ? 'bg-blue-600/25 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/85'
                } ${sidebarCollapsed ? 'justify-center px-0 mx-2' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-blue-600 rounded-r-sm" />}
                  <item.icon size={18} className={isActive ? 'opacity-100' : 'opacity-80'} />
                  {!sidebarCollapsed && <span className="truncate animate-in fade-in slide-in-from-left-2">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`w-full h-9 rounded-lg flex items-center gap-2.5 text-white/50 hover:bg-white/5 hover:text-white transition-all ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}`}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span className="text-[12px] font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>

        <div className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentUser.name.split(' ').map(w => w[0]).join('')}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 animate-in fade-in">
              <div className="text-[12.5px] font-semibold text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-white/40 truncate">{currentUser.role}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
