import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Settings, X, Check, Menu, MessageSquare, Calendar, ListTodo, LogOut, UserCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';
import { Avatar } from '../ui/Avatar';

export function Topbar() {
  const { 
    notifications, setNotifications, 
    sidebarCollapsed, setSidebarCollapsed, 
    mobileMenuOpen, setMobileMenuOpen, 
    currentUser, setCurrentUser, 
    users, logout, 
    tasks, clients, docs 
  } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { confirm } = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();

  // Map path to title
  const getTitle = () => {
    return (
      <>
        <span className="hidden sm:inline">KDK Practice Suite</span>
        <span className="sm:hidden">Practice Suite</span>
      </>
    );
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => n.userId === currentUser?.id ? { ...n, read: true } : n));
    toast('All marked as read');
  };

  const handleNotificationClick = (n: AppNotification) => {
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (n.link) navigate(n.link);
    setShowNotifications(false);
  };

  // Global Search Logic
  const searchResults = searchQuery.trim().length > 1 ? [
    ...tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(t => ({ id: t.id, title: t.title, type: 'Task', link: `/tasks?id=${t.id}` })),
    ...clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => ({ id: c.id, title: c.name, type: 'Client', link: `/clients?id=${c.id}` })),
    ...docs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map(d => ({ id: d.id, title: d.name, type: 'Document', link: `/documents?id=${d.id}` }))
  ].slice(0, 8) : [];

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      danger: true,
    });
    if (confirmed) {
      logout();
      navigate('/');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention': return <MessageSquare size={14} className="text-blue-600" />;
      case 'meeting': return <Calendar size={14} className="text-purple-600" />;
      case 'task': return <ListTodo size={14} className="text-emerald-600" />;
      default: return <Bell size={14} className="text-gray-600" />;
    }
  };

  return (
    <div className="h-[64px] bg-white border-b border-gray-200 flex items-center px-4 md:px-6 shrink-0 z-50 relative">
      <div className="flex items-center gap-3 md:w-[240px] flex-1 md:flex-none min-w-0">
        <button 
          className="md:hidden w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={20} />
        </button>
        <h1 className="font-serif text-[16px] font-bold text-gray-900 truncate">
          {getTitle()}
        </h1>
      </div>
      
      <div className="flex-1 flex justify-center px-4 hidden md:flex">
        <div className="w-full max-w-lg relative" ref={searchRef}>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-200">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input 
              placeholder="Search tasks, clients, documents..." 
              className="border-none bg-transparent outline-none text-[14px] w-full text-gray-900 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[100] animate-slide-down">
              <div className="p-2">
                {searchResults.map((res, i) => (
                  <button
                    key={`${res.type}-${res.id}-${i}`}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left transition-colors"
                    onClick={() => {
                      navigate(res.link);
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[13.5px] font-semibold text-gray-900">{res.title}</span>
                      <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{res.type}</span>
                    </div>
                    <Search size={14} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="md:w-[240px] flex items-center justify-end gap-1 md:gap-2 relative shrink-0">
        <div ref={notificationRef} className="relative">
          <button 
            className={`w-[38px] h-[38px] rounded-lg flex items-center justify-center transition-colors relative ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div className="absolute top-[8px] right-[8px] w-[8px] h-[8px] rounded-full bg-red-600 border-[2px] border-white" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-[48px] right-0 w-[300px] sm:w-[340px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slide-down z-[60]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <span className="font-bold text-[14px] text-gray-900">Notifications</span>
                <button className="text-[12px] text-blue-600 hover:underline font-semibold" onClick={markAllRead}>Mark all as read</button>
              </div>
              <div className="max-h-[360px] overflow-y-auto scrollbar-hide">
                {userNotifications.length > 0 ? (
                  userNotifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/20' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-snug ${!n.read ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>{n.text}</p>
                          <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-[13px] text-gray-400 font-medium">No new notifications</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                <button className="text-[12px] text-gray-500 font-medium hover:text-gray-900">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative ml-2">
          <button 
            className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded-lg transition-colors"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {currentUser && <Avatar user={currentUser} size={32} />}
          </button>

          {showUserMenu && (
            <div className="absolute top-[48px] right-0 w-[240px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slide-down z-[60]">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="font-bold text-[14px] text-gray-900 truncate">{currentUser?.name}</div>
                <div className="text-[12px] text-gray-500 truncate">{currentUser?.email}</div>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Switch User</div>
                {users.map(u => (
                  <button
                    key={u.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${currentUser?.id === u.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserMenu(false);
                      toast(`Switched to ${u.name}`);
                    }}
                  >
                    <Avatar user={u} size={24} />
                    <span className="text-[13px] font-medium flex-1 truncate">{u.name}</span>
                    {currentUser?.id === u.id && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span className="text-[13px] font-medium">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
