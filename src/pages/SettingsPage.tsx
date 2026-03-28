import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { supabase, apiFetch } from '../lib/supabase';
import { Settings, Users, Bell, Link as LinkIcon, Shield, Plus, Edit2, Trash2, Check, X, Mail, Sliders, Zap, LogOut, CheckCircle2, AlertCircle, Copy, Info, FolderOpen, Hash } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { User, TaskTypeConfig, Workflow, Role, Permission } from '../types';
import { ROLE_COLORS } from '../data';
import { genUUID } from '../utils';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { IconRenderer } from '../components/ui/IconRenderer';

export function SettingsPage() {
  const { 
    users, taskTypes, workflows, roles, permissions, clients,
    updateUser, addUser, deleteUser, 
    updateTaskType, addTaskType, deleteTaskType, 
    updateWorkflow, addWorkflow, deleteWorkflow,
    updateRole, addRole, deleteRole, logout,
    currentUser, seedData,
    connectedAccounts, fetchConnections,
    allowedSyncEmails, updateAllowedSyncEmails,
    updateCloudStorageSettings,
    hasPermission
  } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();

  const handleLogout = async () => {
    if (await confirm({ title: 'Logout', message: 'Are you sure you want to logout?', danger: true })) {
      await logout();
      toast('Logged out successfully', 'success');
    }
  };

  const [tab, setTab] = useState<'profile' | 'team' | 'integrations' | 'notifications' | 'configurations'>('profile');

  React.useEffect(() => {
    // Redirect to first allowed tab if current tab is not allowed
    if (tab === 'team' && !hasPermission('manage_team')) setTab('profile');
    if (tab === 'integrations' && !hasPermission('manage_settings')) setTab('profile');
    if (tab === 'configurations' && !hasPermission('manage_settings')) setTab('profile');
  }, [tab, hasPermission]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  React.useEffect(() => {
    fetchConnections();
  }, [currentUser]);

  const handleConnect = async (provider: 'google' | 'microsoft' | 'google_drive' | 'onedrive') => {
    setIsConnecting(provider);
    try {
      const response = await apiFetch(`/api/auth/${provider}/url`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }

      const { url } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        `connect_${provider}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error: any) {
      console.error(`Error connecting to ${provider}:`, error);
      toast(error.message || `Failed to connect to ${provider}`, 'error');
    } finally {
      setIsConnecting(null);
    }
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        toast(`${event.data.provider === 'google' ? 'Gmail' : 'Outlook'} connected successfully!`, 'success');
        fetchConnections();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  const [userModal, setUserModal] = useState<'create' | 'edit' | null>(null);
  const [userForm, setUserForm] = useState<User | null>(null);

  const [taskTypeModal, setTaskTypeModal] = useState<'create' | 'edit' | null>(null);
  const [taskTypeForm, setTaskTypeForm] = useState<TaskTypeConfig | null>(null);

  const [workflowModal, setWorkflowModal] = useState<'create' | 'edit' | null>(null);
  const [workflowForm, setWorkflowForm] = useState<Workflow | null>(null);
  const [workflowStatusesInput, setWorkflowStatusesInput] = useState('');

  const [roleModal, setRoleModal] = useState<'create' | 'edit' | null>(null);
  const [roleForm, setRoleForm] = useState<Role | null>(null);
  const [customEmail, setCustomEmail] = useState('');

  const toggleSyncEmail = async (email: string, checked: boolean) => {
    if (!currentUser) return;
    const currentEmails = allowedSyncEmails || [];
    let newEmails: string[];
    if (checked) {
      newEmails = [...new Set([...currentEmails, email])];
    } else {
      newEmails = currentEmails.filter(e => e !== email);
    }
    try {
      await updateAllowedSyncEmails(newEmails);
    } catch (error) {
      console.error('Error updating sync list:', error);
      toast('Failed to update sync list', 'error');
    }
  };

  const addCustomEmail = async () => {
    if (!customEmail || !customEmail.includes('@')) {
      toast('Please enter a valid email', 'error');
      return;
    }
    if (allowedSyncEmails?.includes(customEmail)) {
      toast('Email already in list', 'error');
      return;
    }
    await toggleSyncEmail(customEmail, true);
    setCustomEmail('');
  };

  const openUserCreate = () => {
    const defaultRole = roles.find(r => r.name === 'Staff') || roles[0];
    setUserForm({ id: genUUID(), name: '', email: '', role: defaultRole?.name || 'Staff', roleId: defaultRole?.id, designation: '', color: ROLE_COLORS[defaultRole?.name || 'Staff'] || '#2563eb', active: true });
    setUserModal('create');
  };

  const openUserEdit = (u: User) => {
    setUserForm({ ...u, roleId: u.roleId || roles.find(r => r.name === u.role)?.id });
    setUserModal('edit');
  };

  const saveUser = async () => {
    if (!userForm?.name || !userForm?.email) {
      toast('Name and email are required', 'error');
      return;
    }
    try {
      if (userModal === 'create') {
        await addUser(userForm);
        toast('User created', 'success');
      } else {
        await updateUser(userForm.id, userForm);
        toast('User updated', 'success');
      }
      setUserModal(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast('Failed to save user', 'error');
    }
  };

  const delUser = async (id: string) => {
    if (await confirm({ title: 'Delete User', message: 'Are you sure you want to delete this user?', danger: true })) {
      try {
        await deleteUser(id);
        toast('User deleted', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast('Failed to delete user', 'error');
      }
    }
  };

  const openTaskTypeCreate = () => {
    setTaskTypeForm({ id: genUUID(), name: '', icon: 'check-square', color: '#3b82f6', description: '' });
    setTaskTypeModal('create');
  };

  const openTaskTypeEdit = (t: TaskTypeConfig) => {
    setTaskTypeForm({ ...t });
    setTaskTypeModal('edit');
  };

  const saveTaskType = async () => {
    if (!taskTypeForm?.name) {
      toast('Name is required', 'error');
      return;
    }
    try {
      if (taskTypeModal === 'create') {
        await addTaskType(taskTypeForm);
        toast('Task Type created', 'success');
      } else {
        await updateTaskType(taskTypeForm.id, taskTypeForm);
        toast('Task Type updated', 'success');
      }
      setTaskTypeModal(null);
    } catch (error) {
      console.error('Error saving task type:', error);
      toast('Failed to save task type', 'error');
    }
  };

  const openWorkflowCreate = () => {
    setWorkflowForm({ id: genUUID(), name: '', description: '', statuses: ['To Do', 'In Progress', 'Completed'], transitions: [] });
    setWorkflowStatusesInput('To Do, In Progress, Completed');
    setWorkflowModal('create');
  };

  const openWorkflowEdit = (w: Workflow) => {
    setWorkflowForm({ ...w });
    setWorkflowStatusesInput(w.statuses.join(', '));
    setWorkflowModal('edit');
  };

  const saveWorkflow = async () => {
    if (!workflowForm?.name) {
      toast('Name is required', 'error');
      return;
    }
    try {
      if (workflowModal === 'create') {
        await addWorkflow(workflowForm);
        toast('Workflow created', 'success');
      } else {
        await updateWorkflow(workflowForm.id, workflowForm);
        toast('Workflow updated', 'success');
      }
      setWorkflowModal(null);
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast('Failed to save workflow', 'error');
    }
  };

  const saveRole = async () => {
    if (!roleForm?.name) {
      toast('Role name is required', 'error');
      return;
    }
    try {
      if (roleModal === 'create') {
        await addRole(roleForm);
        toast('Role created', 'success');
      } else {
        await updateRole(roleForm.id, roleForm);
        toast('Role updated', 'success');
      }
      setRoleModal(null);
    } catch (error) {
      console.error('Error saving role:', error);
      toast('Failed to save role', 'error');
    }
  };

  const USER_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#7c3aed', '#ec4899', '#14b8a6'];
  const ICONS = ['check-square', 'git-merge', 'bug', 'zap', 'circle', 'alert-circle', 'file-text', 'settings', 'star'];

  return (
    <div className="flex-1 flex flex-col animate-slide-up">
      <PageHeader 
        title="Settings" 
        description="Manage your workspace, team, and integrations"
      />

      <div className="bg-white border border-gray-200 rounded-xl flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        {/* Sidebar */}
        <div className="w-full md:w-[220px] shrink-0 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col bg-gray-50/50 p-3 overflow-x-auto">
          <div className="flex md:flex-col gap-1 min-w-max md:min-w-0">
            <button 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setTab('profile')}
            >
              <Settings size={16} /> <span className="whitespace-nowrap">Profile & Workspace</span>
            </button>
            {hasPermission('manage_team') && (
              <button 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'team' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setTab('team')}
              >
                <Users size={16} /> <span className="whitespace-nowrap">Team & Access</span>
              </button>
            )}
            {hasPermission('manage_settings') && (
              <button 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'integrations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setTab('integrations')}
              >
                <LinkIcon size={16} /> <span className="whitespace-nowrap">Integrations</span>
              </button>
            )}
            <button 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setTab('notifications')}
            >
              <Bell size={16} /> <span className="whitespace-nowrap">Notifications & Alerts</span>
            </button>
            {hasPermission('manage_settings') && (
              <button 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'configurations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setTab('configurations')}
              >
                <Sliders size={16} /> <span className="whitespace-nowrap">Configurations</span>
              </button>
            )}
            
            <div className="mt-auto pt-4 border-t border-gray-200 space-y-1">
              <button 
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                onClick={handleLogout}
              >
                <LogOut size={16} /> <span className="whitespace-nowrap">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-white">
          {tab === 'profile' && (
            <div className="max-w-2xl">
              <h2 className="text-[16px] font-semibold text-gray-900 mb-4">Workspace Settings</h2>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Workspace Name</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-600" defaultValue="KDK Practice Suite" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Timezone</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-600 bg-white">
                    <option>Asia/Kolkata (IST)</option>
                    <option>UTC</option>
                  </select>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors mt-4">
                  Save Changes
                </button>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <h2 className="text-[16px] font-semibold text-gray-900 mb-2">Account Settings</h2>
                <p className="text-[13px] text-gray-500 mb-4">Manage your account and subscription preferences.</p>
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="max-w-5xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">Team Members</h2>
                  <p className="text-[13px] text-gray-500">Manage your practice staff and their access levels.</p>
                </div>
                <button 
                  onClick={openUserCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
                >
                  <Plus size={18} /> Add Team Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Shield size={20} />
                    </div>
                    <h3 className="text-[14px] font-bold text-gray-900">Role-Based Access</h3>
                  </div>
                  <p className="text-[12px] text-blue-700 leading-relaxed">
                    Define what each team member can see and do. Admins have full control, while Staff can only manage assigned tasks.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Users size={20} />
                    </div>
                    <h3 className="text-[14px] font-bold text-gray-900">Collaboration</h3>
                  </div>
                  <p className="text-[12px] text-emerald-700 leading-relaxed">
                    Team members can mention each other in comments, share documents, and collaborate on complex compliance tasks.
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <Zap size={20} />
                    </div>
                    <h3 className="text-[14px] font-bold text-gray-900">Activity Tracking</h3>
                  </div>
                  <p className="text-[12px] text-purple-700 leading-relaxed">
                    Every action is logged. Track who created, updated, or completed tasks for better accountability and audit trails.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role & Designation</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar user={user} size={40} />
                            <div>
                              <div className="text-[14px] font-bold text-gray-900">{user.name}</div>
                              <div className="text-[12px] text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span 
                              className="inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 border"
                              style={{ 
                                backgroundColor: `${ROLE_COLORS[user.role] || '#f3f4f6'}20`, 
                                color: ROLE_COLORS[user.role] || '#4b5563',
                                borderColor: `${ROLE_COLORS[user.role] || '#e5e7eb'}40`
                              }}
                            >
                              {user.role}
                            </span>
                            <span className="text-[12px] text-gray-600 font-medium">{user.designation}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openUserEdit(user)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit User"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => deleteUser(user.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                    <Shield size={18} className="text-blue-600" />
                    Roles & Permissions
                  </h3>
                  <button 
                    onClick={() => {
                      setRoleForm({ id: genUUID(), name: '', description: '', permissions: [] });
                      setRoleModal('create');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[12px] font-bold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    Create Role
                  </button>
                </div>

                <div className="space-y-4">
                  {roles.map(role => (
                    <div key={role.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: role.color || '#3b82f6' }} />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-[14px] font-bold text-gray-900">{role.name}</h4>
                              {role.isSystem && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase tracking-wider">System</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{role.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setRoleForm({ ...role });
                              setRoleModal('edit');
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          {!role.isSystem && (
                            <button 
                              onClick={async () => {
                                if (await confirm({ title: 'Delete Role', message: `Are you sure you want to delete the "${role.name}" role?`, danger: true })) {
                                  await deleteRole(role.id);
                                  toast('Role deleted', 'success');
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Permissions</div>
                        <div className="flex flex-wrap gap-2">
                          {(role.permissions || []).map(pid => {
                            const p = permissions.find(x => x.id === pid);
                            if (!p) return null;
                            return (
                              <span 
                                key={pid} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200"
                                title={p.description}
                              >
                                <Check size={10} className="text-emerald-500" />
                                {p.name}
                              </span>
                            );
                          })}
                          {(!role.permissions || role.permissions.length === 0) && (
                            <span className="text-[11px] text-gray-400 italic">No permissions assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="max-w-4xl">
              <h2 className="text-[16px] font-semibold text-gray-900 mb-4">Connected Apps & Storage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">Email Integration</h3>
                      <p className="text-[12px] text-gray-500">Sync client communications automatically.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">Gmail / Google Workspace</span>
                      </div>
                      <button 
                        onClick={() => handleConnect('google')}
                        disabled={isConnecting === 'google'}
                        className={`${connectedAccounts.includes('google') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700'} px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50`}
                      >
                        {connectedAccounts.includes('google') ? (
                          <span className="flex items-center gap-1.5"><Check size={14} /> Connected</span>
                        ) : isConnecting === 'google' ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">Outlook / Office 365</span>
                      </div>
                      <button 
                        onClick={() => handleConnect('microsoft')}
                        disabled={isConnecting === 'microsoft'}
                        className={`${connectedAccounts.includes('microsoft') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700'} px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50`}
                      >
                        {connectedAccounts.includes('microsoft') ? (
                          <span className="flex items-center gap-1.5"><Check size={14} /> Connected</span>
                        ) : isConnecting === 'microsoft' ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <FolderOpen size={24} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">Cloud Storage</h3>
                      <p className="text-[12px] text-gray-500">Store and sync documents in the cloud.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <img src="https://www.gstatic.com/images/branding/product/1x/drive_48dp.png" alt="Google Drive" className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">Google Drive</span>
                      </div>
                      <button 
                        onClick={() => handleConnect('google_drive')}
                        disabled={isConnecting === 'google_drive'}
                        className={`${connectedAccounts.includes('google_drive') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700'} px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50`}
                      >
                        {isConnecting === 'google_drive' ? 'Connecting...' : connectedAccounts.includes('google_drive') ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_OneDrive_logo.svg" alt="OneDrive" className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-medium text-gray-700">OneDrive</span>
                      </div>
                      <button 
                        onClick={() => handleConnect('onedrive')}
                        disabled={isConnecting === 'onedrive'}
                        className={`${connectedAccounts.includes('onedrive') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700'} px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50`}
                      >
                        {isConnecting === 'onedrive' ? 'Connecting...' : connectedAccounts.includes('onedrive') ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cloud Storage Settings */}
              {(connectedAccounts.includes('google_drive') || connectedAccounts.includes('onedrive')) && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-gray-400" />
                    Cloud Storage Settings
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-blue-600">
                          <Zap size={20} />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-gray-900">Auto-Sync Documents</div>
                          <div className="text-[12px] text-gray-500">Automatically upload all new documents to connected cloud storage.</div>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={currentUser?.cloudStorageSettings?.autoSync ?? true}
                          onChange={(e) => updateCloudStorageSettings({ 
                            ...currentUser?.cloudStorageSettings || { autoSync: true, clientSpecificFolders: true }, 
                            autoSync: e.target.checked 
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-emerald-600">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-gray-900">Client-Specific Folders</div>
                          <div className="text-[12px] text-gray-500">Organize documents into client-named folders in your cloud drive.</div>
                        </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={currentUser?.cloudStorageSettings?.clientSpecificFolders ?? true}
                          onChange={(e) => updateCloudStorageSettings({ 
                            ...currentUser?.cloudStorageSettings || { autoSync: true, clientSpecificFolders: true }, 
                            clientSpecificFolders: e.target.checked 
                          })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

                <div className="border border-gray-200 rounded-xl p-4 flex items-start gap-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                    <Zap size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-gray-900">WhatsApp Business</h3>
                    <p className="text-[12px] text-gray-500 mb-3">Send automated task updates and reminders to clients via WhatsApp.</p>
                    <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-green-700 transition-colors">
                      Connect WhatsApp
                    </button>
                  </div>
                </div>

              {/* Selective Sync Section */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-[16px] font-bold text-gray-900">Mail Sync Configuration</h2>
                    <p className="text-[13px] text-gray-500">Select which client emails to synchronize with your practice suite.</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[12px] font-bold">
                      <Zap size={14} />
                      {allowedSyncEmails.length > 0 ? `${allowedSyncEmails.length} Emails Selected` : 'Syncing All Clients'}
                    </div>
                    {currentUser?.lastEmailSyncAt && (
                      <span className="text-[10px] text-gray-400">Last synced: {new Date(currentUser.lastEmailSyncAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Client Emails</h4>
                      <div className="flex gap-3">
                        <button 
                          className="text-[11px] text-blue-600 hover:underline font-bold"
                          onClick={() => updateAllowedSyncEmails(clients.map(c => c.email.toLowerCase()))}
                        >
                          Select All
                        </button>
                        <button 
                          className="text-[11px] text-gray-500 hover:underline font-bold"
                          onClick={() => updateAllowedSyncEmails([])}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {clients.map(client => {
                        const email = client.email.toLowerCase();
                        const isSelected = allowedSyncEmails.includes(email);
                        return (
                          <label 
                            key={client.id} 
                            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                              isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600/20"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) {
                                  updateAllowedSyncEmails([...allowedSyncEmails, email]);
                                } else {
                                  updateAllowedSyncEmails(allowedSyncEmails.filter(e => e !== email));
                                }
                              }}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] font-bold text-gray-900 truncate">{client.name}</span>
                              <span className="text-[11px] text-gray-500 truncate">{client.email}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Custom Emails</h4>
                      <div className="flex gap-2">
                        <input 
                          id="custom-email-input"
                          type="email" 
                          placeholder="Enter email address..." 
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-600 w-64"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget;
                              const email = input.value.trim().toLowerCase();
                              if (email && email.includes('@')) {
                                updateAllowedSyncEmails([...allowedSyncEmails, email]);
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById('custom-email-input') as HTMLInputElement;
                            const email = input.value.trim().toLowerCase();
                            if (email && email.includes('@')) {
                              updateAllowedSyncEmails([...allowedSyncEmails, email]);
                              input.value = '';
                            }
                          }}
                          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[12px] font-bold hover:bg-blue-700"
                        >
                          <Plus size={14} /> Add Email
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allowedSyncEmails.filter(email => !clients.some(c => c.email.toLowerCase() === email)).map(email => (
                        <div key={email} className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg group">
                          <span className="text-[12px] text-gray-700 font-medium">{email}</span>
                          <button 
                            onClick={() => updateAllowedSyncEmails(allowedSyncEmails.filter(e => e !== email))}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {allowedSyncEmails.filter(email => !clients.some(c => c.email.toLowerCase() === email)).length === 0 && (
                        <p className="text-[12px] text-gray-400 italic">No custom emails added.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <div className="flex gap-3">
                      <Zap className="text-blue-600 shrink-0" size={18} />
                      <div className="text-[12px] text-blue-800 leading-relaxed">
                        {allowedSyncEmails.length === 0 ? (
                          <><strong>Default Sync:</strong> All client emails will be synced automatically since no specific selection is made.</>
                        ) : (
                          <><strong>Selective Sync Active:</strong> Only emails from the {allowedSyncEmails.length} selected addresses will be fetched and displayed in your inbox.</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="max-w-2xl">
              <h2 className="text-[16px] font-semibold text-gray-900 mb-4">Notification & Alert Preferences</h2>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Internal Alerts (Team)</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900">Daily Digest Email</div>
                        <div className="text-[12px] text-gray-500">Summary of tasks due today and overdue items.</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900">Task Assignment Alerts</div>
                        <div className="text-[12px] text-gray-500">Real-time alerts when a task is assigned to you.</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900">Statutory Deadline Nudges</div>
                        <div className="text-[12px] text-gray-500">Alert team 7 days before a statutory deadline.</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Client Alerts (External)</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900">Document Request Reminders</div>
                        <div className="text-[12px] text-gray-500">Auto-remind clients for missing documents via WhatsApp/Email.</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                      <div>
                        <div className="text-[13px] font-semibold text-gray-900">Payment Reminders</div>
                        <div className="text-[12px] text-gray-500">Notify clients when an invoice is overdue.</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}



          {tab === 'configurations' && (
            <div className="max-w-4xl">
              {/* Project Prefix Section */}
              <div className="mb-8 p-6 border border-blue-100 rounded-2xl bg-blue-50/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Hash size={20} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-gray-900">Project ID Prefix</h2>
                    <p className="text-[12px] text-gray-500">Set the prefix for your task IDs (e.g., KDK-1, PRJ-1)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    className="w-32 px-4 py-2 border border-gray-200 rounded-xl text-[14px] font-bold outline-none focus:border-blue-600 uppercase" 
                    value={currentUser?.projectPrefix || 'KDK'} 
                    onChange={e => updateUser(currentUser!.id, { projectPrefix: e.target.value.toUpperCase() })}
                    maxLength={5}
                  />
                  <div className="text-[13px] text-gray-500 italic">
                    Example Task ID: <span className="font-bold text-blue-600">{(currentUser?.projectPrefix || 'KDK')}-123</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-semibold text-gray-900">Task Types</h2>
                  <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors" onClick={openTaskTypeCreate}>
                    <Plus size={14} /> Add Type
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {taskTypes.map(type => (
                    <div key={type.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: type.color }}>
                          <IconRenderer name={type.icon} size={16} />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-gray-900">{type.name}</div>
                          <div className="text-[11px] text-gray-500">{type.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors" onClick={() => openTaskTypeEdit(type)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => deleteTaskType(type.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-semibold text-gray-900">Workflows</h2>
                  <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors" onClick={openWorkflowCreate}>
                    <Plus size={14} /> Add Workflow
                  </button>
                </div>
                <div className="space-y-4">
                  {workflows.map(wf => (
                    <div key={wf.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[14px] font-semibold text-gray-900">{wf.name}</div>
                          <div className="text-[12px] text-gray-500">{wf.description}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors" onClick={() => openWorkflowEdit(wf)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => deleteWorkflow(wf.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {wf.statuses.map((status, i) => (
                          <React.Fragment key={status}>
                            <div className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[12px] font-medium border border-gray-200">
                              {status}
                            </div>
                            {i < wf.statuses.length - 1 && (
                              <div className="text-gray-300 text-[10px]">→</div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {userModal && userForm && (
        <Modal
          title={userModal === 'create' ? 'Add Team Member' : 'Edit Team Member'}
          onClose={() => setUserModal(null)}
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setUserModal(null)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={saveUser}>Save User</button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Full Name *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Email Address *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Role</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 bg-white" 
                  value={userForm.roleId || roles.find(r => r.name === userForm.role)?.id || ''} 
                  onChange={e => {
                    const selectedRole = roles.find(r => r.id === e.target.value);
                    const roleName = selectedRole?.name || 'Staff';
                    setUserForm({ 
                      ...userForm, 
                      roleId: e.target.value, 
                      role: roleName,
                      color: ROLE_COLORS[roleName] || userForm.color
                    });
                  }}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Designation</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" value={userForm.designation} onChange={e => setUserForm({ ...userForm, designation: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Avatar Color</label>
              <div className="flex gap-2">
                {USER_COLORS.map(c => (
                  <div 
                    key={c} 
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${userForm.color === c ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`} 
                    style={{ background: c }} 
                    onClick={() => setUserForm({ ...userForm, color: c })} 
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="active-user" className="w-4 h-4 text-blue-600" checked={userForm.active} onChange={e => setUserForm({ ...userForm, active: e.target.checked })} />
              <label htmlFor="active-user" className="text-[13px] text-gray-700 font-medium">Account Active</label>
            </div>
          </div>
        </Modal>
      )}

      {/* Task Type Modal */}
      {taskTypeModal && taskTypeForm && (
        <Modal
          title={taskTypeModal === 'create' ? 'Add Task Type' : 'Edit Task Type'}
          onClose={() => setTaskTypeModal(null)}
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setTaskTypeModal(null)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={saveTaskType}>Save Type</button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Type Name *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" value={taskTypeForm.name} onChange={e => setTaskTypeForm({ ...taskTypeForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Description</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" value={taskTypeForm.description || ''} onChange={e => setTaskTypeForm({ ...taskTypeForm, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(icon => (
                  <div 
                    key={icon} 
                    className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${taskTypeForm.icon === icon ? 'bg-blue-50 text-blue-600 border-2 border-blue-600' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`} 
                    onClick={() => setTaskTypeForm({ ...taskTypeForm, icon })} 
                  >
                    <IconRenderer name={icon} size={16} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Color</label>
              <div className="flex gap-2">
                {USER_COLORS.map(c => (
                  <div 
                    key={c} 
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${taskTypeForm.color === c ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`} 
                    style={{ background: c }} 
                    onClick={() => setTaskTypeForm({ ...taskTypeForm, color: c })} 
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Workflow</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 bg-white"
                value={taskTypeForm.workflowId || ''}
                onChange={e => setTaskTypeForm({ ...taskTypeForm, workflowId: e.target.value })}
              >
                <option value="">Default (No Workflow)</option>
                {workflows.map(wf => (
                  <option key={wf.id} value={wf.id}>{wf.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Workflow Modal */}
      {workflowModal && workflowForm && (
        <Modal
          title={workflowModal === 'create' ? 'Add Workflow' : 'Edit Workflow'}
          onClose={() => setWorkflowModal(null)}
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setWorkflowModal(null)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={saveWorkflow}>Save Workflow</button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Workflow Name *</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" value={workflowForm.name} onChange={e => setWorkflowForm({ ...workflowForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Description</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" value={workflowForm.description || ''} onChange={e => setWorkflowForm({ ...workflowForm, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5">Statuses (comma separated)</label>
              <input 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600" 
                value={workflowStatusesInput} 
                onChange={e => {
                  const val = e.target.value;
                  setWorkflowStatusesInput(val);
                  
                  const newStatuses = val.split(',').map(s => s.trim()).filter(Boolean);
                  // Keep existing transitions that are still valid
                  const newTransitions = workflowForm.transitions
                    .filter(t => newStatuses.includes(t.from))
                    .map(t => ({
                      ...t,
                      to: t.to.filter(s => newStatuses.includes(s))
                    }));
                  
                  // Add missing transitions
                  newStatuses.forEach(s => {
                    if (!newTransitions.find(t => t.from === s)) {
                      newTransitions.push({ from: s, to: [] });
                    }
                  });

                  setWorkflowForm({ 
                    ...workflowForm, 
                    statuses: newStatuses,
                    transitions: newTransitions
                  });
                }} 
                placeholder="e.g. To Do, In Progress, Done"
              />
            </div>
            {workflowForm.statuses.length > 0 && (
              <div>
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-2">Allowed Transitions</label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {workflowForm.statuses.map(status => {
                    const transition = workflowForm.transitions.find(t => t.from === status) || { from: status, to: [] };
                    return (
                      <div key={status} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                        <div className="text-[13px] font-semibold text-gray-900 mb-2">{status} <span className="text-gray-500 font-normal">can transition to:</span></div>
                        <div className="flex flex-wrap gap-2">
                          {workflowForm.statuses.filter(s => s !== status).map(targetStatus => (
                            <label key={targetStatus} className="flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-50">
                              <input 
                                type="checkbox" 
                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                                checked={transition.to.includes(targetStatus)}
                                onChange={e => {
                                  const isChecked = e.target.checked;
                                  setWorkflowForm(prev => {
                                    if (!prev) return prev;
                                    const newTransitions = prev.transitions.map(t => {
                                      if (t.from === status) {
                                        return {
                                          ...t,
                                          to: isChecked ? [...t.to, targetStatus] : t.to.filter(s => s !== targetStatus)
                                        };
                                      }
                                      return t;
                                    });
                                    return { ...prev, transitions: newTransitions };
                                  });
                                }}
                              />
                              <span className="text-[12px] text-gray-700">{targetStatus}</span>
                            </label>
                          ))}
                          {workflowForm.statuses.length <= 1 && (
                            <span className="text-[12px] text-gray-500 italic">Add more statuses to define transitions</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Role Modal */}
      {roleModal && roleForm && (
        <Modal
          title={roleModal === 'create' ? 'Create New Role' : 'Edit Role'}
          onClose={() => setRoleModal(null)}
          footer={
            <>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => setRoleModal(null)}>Cancel</button>
              <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-blue-600 text-white hover:bg-blue-700" onClick={saveRole}>Save Role</button>
            </>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Role Name *</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" 
                  value={roleForm.name} 
                  onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} 
                  placeholder="e.g. Senior Auditor"
                  disabled={roleForm.isSystem}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Role Color</label>
                <div className="flex gap-2 items-center h-[38px]">
                  {USER_COLORS.map(c => (
                    <div 
                      key={c} 
                      className={`w-6 h-6 rounded-full cursor-pointer transition-all hover:scale-110 ${roleForm.color === c ? 'ring-2 ring-offset-2 ring-blue-600' : 'border border-gray-200'}`} 
                      style={{ background: c }} 
                      onClick={() => setRoleForm({ ...roleForm, color: c })} 
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 min-h-[80px]" 
                value={roleForm.description} 
                onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Briefly describe the responsibilities of this role..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wider">Permissions</label>
                <div className="flex gap-3">
                  <button 
                    className="text-[11px] text-blue-600 hover:underline font-bold"
                    onClick={() => setRoleForm({ ...roleForm, permissions: permissions.map(p => p.id) })}
                  >
                    Select All
                  </button>
                  <button 
                    className="text-[11px] text-gray-500 hover:underline font-bold"
                    onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(
                  permissions.reduce((acc, p) => {
                    const module = p.module || 'Other';
                    if (!acc[module]) acc[module] = [];
                    acc[module].push(p);
                    return acc;
                  }, {} as Record<string, Permission[]>)
                ).map(([module, modulePerms]) => (
                  <div key={module} className="bg-gray-50/50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-[12px] font-bold text-gray-900 uppercase tracking-tight">{module}</h5>
                      <button 
                        className="text-[10px] text-gray-500 hover:text-blue-600 font-bold"
                        onClick={() => {
                          const moduleIds = modulePerms.map(p => p.id);
                          const allSelected = moduleIds.every(id => roleForm.permissions.includes(id));
                          if (allSelected) {
                            setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter(id => !moduleIds.includes(id)) });
                          } else {
                            setRoleForm({ ...roleForm, permissions: [...new Set([...roleForm.permissions, ...moduleIds])] });
                          }
                        }}
                      >
                        {modulePerms.every(p => roleForm.permissions.includes(p.id)) ? 'Deselect Module' : 'Select Module'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {modulePerms.map(p => (
                        <label key={p.id} className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          roleForm.permissions.includes(p.id) 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}>
                          <div className="pt-0.5">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600/20"
                              checked={roleForm.permissions.includes(p.id)}
                              onChange={e => {
                                const checked = e.target.checked;
                                setRoleForm(prev => {
                                  if (!prev) return prev;
                                  const newPerms = checked 
                                    ? [...prev.permissions, p.id] 
                                    : prev.permissions.filter(id => id !== p.id);
                                  return { ...prev, permissions: newPerms };
                                });
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12.5px] font-bold text-gray-900 leading-tight">{p.name}</span>
                            <span className="text-[10px] text-gray-500 leading-tight mt-0.5">{p.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
