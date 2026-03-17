import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Settings, Users, Bell, Link as LinkIcon, Shield, Plus, Edit2, Trash2, Check, X, Mail, Sliders, ShieldCheck, Zap, Clock, LogOut } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { User, TaskTypeConfig, Workflow } from '../types';
import { genUUID } from '../utils';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { IconRenderer } from '../components/ui/IconRenderer';
import { supabase } from '../lib/supabase';

export function SettingsPage() {
  const { users, taskTypes, workflows, setIsAuthenticated, updateUser, addUser, deleteUser, updateTaskType, addTaskType, deleteTaskType, updateWorkflow, addWorkflow, deleteWorkflow } = useApp();
  const toast = useToast();
  const { confirm } = useConfirm();

  const handleLogout = async () => {
    if (await confirm({ title: 'Logout', message: 'Are you sure you want to logout?', danger: true })) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast(error.message, 'error');
      } else {
        setIsAuthenticated(false);
        toast('Logged out successfully', 'success');
      }
    }
  };

  const [tab, setTab] = useState<'profile' | 'team' | 'integrations' | 'notifications' | 'configurations'>('team');
  const [userModal, setUserModal] = useState<'create' | 'edit' | null>(null);
  const [userForm, setUserForm] = useState<User | null>(null);

  const [taskTypeModal, setTaskTypeModal] = useState<'create' | 'edit' | null>(null);
  const [taskTypeForm, setTaskTypeForm] = useState<TaskTypeConfig | null>(null);

  const [workflowModal, setWorkflowModal] = useState<'create' | 'edit' | null>(null);
  const [workflowForm, setWorkflowForm] = useState<Workflow | null>(null);
  const [workflowStatusesInput, setWorkflowStatusesInput] = useState('');

  const openUserCreate = () => {
    setUserForm({ id: genUUID(), name: '', email: '', role: 'Staff', designation: '', color: '#2563eb', active: true });
    setUserModal('create');
  };

  const openUserEdit = (u: User) => {
    setUserForm({ ...u });
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

  const USER_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#ec4899', '#14b8a6'];
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
            <button 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'team' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setTab('team')}
            >
              <Users size={16} /> <span className="whitespace-nowrap">Team & Access</span>
            </button>
            <button 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'integrations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setTab('integrations')}
            >
              <LinkIcon size={16} /> <span className="whitespace-nowrap">Integrations</span>
            </button>
            <button 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setTab('notifications')}
            >
              <Bell size={16} /> <span className="whitespace-nowrap">Notifications</span>
            </button>
            <button 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${tab === 'configurations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setTab('configurations')}
            >
              <Sliders size={16} /> <span className="whitespace-nowrap">Configurations</span>
            </button>
            
            <div className="mt-auto pt-4 border-t border-gray-200">
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
              <div className="space-y-4">
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
            </div>
          )}

          {tab === 'team' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-semibold text-gray-900">Team Members</h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors" onClick={openUserCreate}>
                  <Plus size={14} /> Add Member
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Designation</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] text-gray-700">
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar user={u} size={32} />
                            <div>
                              <div className="font-semibold text-gray-900">{u.name}</div>
                              <div className="text-[11px] text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">{u.designation}</td>
                        <td className="px-4 py-3">
                          {u.active ? (
                            <span className="flex items-center gap-1 text-green-600 text-[12px] font-medium"><Check size={14} /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-400 text-[12px] font-medium"><X size={14} /> Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors" onClick={() => openUserEdit(u)}>
                              <Edit2 size={14} />
                            </button>
                            <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => deleteUser(u.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="max-w-3xl">
              <h2 className="text-[16px] font-semibold text-gray-900 mb-4">Connected Apps</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-gray-900">Gmail</h3>
                    <p className="text-[12px] text-gray-500 mb-3">Sync emails and create tasks directly from your inbox.</p>
                    <button className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-gray-200 transition-colors">
                      Connected
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold text-gray-900">Outlook</h3>
                    <p className="text-[12px] text-gray-500 mb-3">Sync emails and calendar events with Microsoft Outlook.</p>
                    <button className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-blue-100 transition-colors">
                      Connect Outlook
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="max-w-2xl">
              <h2 className="text-[16px] font-semibold text-gray-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900">Email Notifications</div>
                    <div className="text-[12px] text-gray-500">Receive daily summaries and urgent alerts via email.</div>
                  </div>
                  <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900">Task Assignments</div>
                    <div className="text-[12px] text-gray-500">Notify me when a new task is assigned to me.</div>
                  </div>
                  <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <div className="text-[13px] font-semibold text-gray-900">Approaching Deadlines</div>
                    <div className="text-[12px] text-gray-500">Alert me 2 days before a task is due.</div>
                  </div>
                  <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                </div>
              </div>
            </div>
          )}

          {tab === 'configurations' && (
            <div className="max-w-4xl">
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
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] outline-none focus:border-blue-600 bg-white" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Staff</option>
                  <option>Article Clerk</option>
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
    </div>
  );
}
