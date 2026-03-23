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
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Sidebar() {
  const { 
    sidebarCollapsed, setSidebarCollapsed, 
    mobileMenuOpen, setMobileMenuOpen, currentUser, 
    hasPermission, logout 
  } = useApp();

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', permission: 'view_dashboard' },
    { id: 'inbox', label: 'Inbox', icon: Mail, path: '/inbox', permission: 'view_tasks' },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare, path: '/kanban', permission: 'view_tasks' },
    { id: 'tasks', label: 'All Tasks', icon: ListTodo, path: '/tasks', permission: 'view_tasks' },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, path: '/templates', permission: 'manage_settings' },
    { id: 'clients', label: 'Clients', icon: Users, path: '/clients', permission: 'view_clients' },
    { id: 'documents', label: 'Documents', icon: FolderOpen, path: '/documents', permission: 'view_tasks' },
    { id: 'meetings', label: 'Meetings', icon: CalendarDays, path: '/meetings', permission: 'view_tasks' },
    { id: 'notes', label: 'Sticky Notes', icon: StickyNote, path: '/notes', permission: 'view_tasks' },
    { id: 'passwords', label: 'Passwords', icon: KeyRound, path: '/passwords', permission: 'manage_settings' },
    { id: 'compliance', label: 'Compliance', icon: FileText, path: '/compliance', permission: 'view_compliance' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', permission: 'manage_settings' },
  ];

  const filteredNavItems = navItems;

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className={`
        ${sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'} 
        shrink-0 bg-[#0d1117] flex flex-col h-screen transition-all duration-300 z-[100] overflow-hidden
        fixed md:relative top-0 left-0 bottom-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
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

      <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
        {!sidebarCollapsed && <div className="text-[9px] font-bold tracking-widest uppercase text-white/20 px-4 pt-2 pb-1 animate-in fade-in">Menu</div>}
        <div className="space-y-1">
          {filteredNavItems.map(item => (
            <NavLink
              key={item.id}
              to={item.path}
              title={sidebarCollapsed ? item.label : ''}
              onClick={() => setMobileMenuOpen(false)}
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
          className={`hidden md:flex w-full h-9 rounded-lg items-center gap-2.5 text-white/50 hover:bg-white/5 hover:text-white transition-all ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}`}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span className="text-[12px] font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>

        <div className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentUser?.name ? (
              currentUser.name.split(' ').length > 1 
                ? currentUser.name.split(' ').map(w => w[0]).join('') 
                : currentUser.name.slice(0, 2).toUpperCase()
            ) : '??'}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1 animate-in fade-in">
              <div className="text-[12.5px] font-semibold text-white truncate">{currentUser?.name || 'User'}</div>
              <div className="text-[11px] text-white/40 truncate">{currentUser?.role || 'Guest'}</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
        {sidebarCollapsed && (
          <button 
            onClick={handleLogout}
            className="w-full flex justify-center p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
      </div>
    </>
  );
}
