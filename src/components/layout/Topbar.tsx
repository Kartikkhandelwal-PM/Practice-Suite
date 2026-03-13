import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Settings, X, Check, Menu, MessageSquare, Calendar, ListTodo, LogOut, UserCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';
import { Avatar } from '../ui/Avatar';

export function Topbar() {
  const { notifications, setNotifications, sidebarCollapsed, setSidebarCollapsed, currentUser, setCurrentUser, users, setIsAuthenticated } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Map path to title
  const getTitle = () => {
    return "KDK Practice Management";
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast('All marked as read');
  };

  const handleNotificationClick = (n: AppNotification) => {
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (n.link) navigate(n.link);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/');
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
    <div className="h-[64px] bg-white border-b border-gray-200 flex items-center px-6 shrink-0 z-50 relative">
      <div className="w-[240px] flex items-center">
        <h1 className="font-serif text-[16px] font-bold text-gray-900 truncate">
          {getTitle()}
        </h1>
      </div>
      
      <div className="flex-1 flex justify-center px-4 hidden md:flex">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-200">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input 
              placeholder="Search tasks, clients, documents..." 
              className="border-none bg-transparent outline-none text-[14px] w-full text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="w-[240px] flex items-center justify-end gap-2 relative">
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
            <div className="absolute top-[48px] right-0 w-[340px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slide-down z-[60]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <span className="font-bold text-[14px] text-gray-900">Notifications</span>
                <button className="text-[12px] text-blue-600 hover:underline font-semibold" onClick={markAllRead}>Mark all as read</button>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
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

        <button 
          className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          onClick={() => setShowSettings(true)}
        >
          <Settings size={20} />
        </button>

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
              <div className="p-2">
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

      {showSettings && (
        <Modal
          title="Settings"
          onClose={() => setShowSettings(false)}
          size="md"
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setShowSettings(false); toast('Settings saved', 'success'); }}>Save Changes</button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Theme</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white">
                <option>Light</option>
                <option>Dark</option>
                <option>System Default</option>
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Email Notifications</label>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="email-notif" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <label htmlFor="email-notif" className="text-[13px] text-gray-700">Receive daily digest</label>
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Default View</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 bg-white">
                <option>Dashboard</option>
                <option>Kanban Board</option>
                <option>Tasks List</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
