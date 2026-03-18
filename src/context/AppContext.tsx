import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, Client, User, Deadline, Template, Meeting, Note, Password, Document, Folder, Email, TaskTypeConfig, Workflow, AppNotification, Permission, Role } from '../types';
import { INIT_TASKS, INIT_CLIENTS, INIT_USERS, INIT_DEADLINES, INIT_TEMPLATES, INIT_MEETINGS, INIT_NOTES, INIT_PASSWORDS, INIT_DOCS, INIT_FOLDERS, INIT_EMAILS, INIT_TASK_TYPES, INIT_WORKFLOWS, INIT_PERMISSIONS, INIT_ROLES } from '../data';
import { supabase } from '../lib/supabase';
import { genUUID } from '../utils';

interface AppContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  deadlines: Deadline[];
  setDeadlines: React.Dispatch<React.SetStateAction<Deadline[]>>;
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  meetings: Meeting[];
  setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  passwords: Password[];
  setPasswords: React.Dispatch<React.SetStateAction<Password[]>>;
  docs: Document[];
  setDocs: React.Dispatch<React.SetStateAction<Document[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  taskTypes: TaskTypeConfig[];
  setTaskTypes: React.Dispatch<React.SetStateAction<TaskTypeConfig[]>>;
  workflows: Workflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  permissions: Permission[];
  setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>;
  complianceCategories: string[];
  setComplianceCategories: React.Dispatch<React.SetStateAction<string[]>>;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  notify: (userId: string, text: string, type: AppNotification['type'], link?: string) => void;
  hasPermission: (permissionId: string) => boolean;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addTask: (task: Task) => Promise<string>;
  addTasks: (tasks: Task[]) => Promise<string[]>;
  deleteTask: (id: string) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  addNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
  addMeeting: (meeting: Meeting) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  updatePassword: (id: string, updates: Partial<Password>) => Promise<void>;
  addPassword: (password: Password) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  addDocument: (doc: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  addFolder: (folder: Folder) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  updateTaskType: (id: string, updates: Partial<TaskTypeConfig>) => Promise<void>;
  addTaskType: (taskType: TaskTypeConfig) => Promise<void>;
  deleteTaskType: (id: string) => Promise<void>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<void>;
  addWorkflow: (workflow: Workflow) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  updateDeadline: (id: string, updates: Partial<Deadline>) => Promise<void>;
  addDeadline: (deadline: Deadline) => Promise<void>;
  deleteDeadline: (id: string) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  addTemplate: (template: Template) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  updateEmail: (id: string, updates: Partial<Email>) => Promise<void>;
  addEmail: (email: Email) => Promise<void>;
  deleteEmail: (id: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
  addRole: (role: Role) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  login: (session: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AppCtx = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskTypeConfig[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [roles, setRoles] = useState<Role[]>(INIT_ROLES);
  const [permissions, setPermissions] = useState<Permission[]>(INIT_PERMISSIONS);
  const [complianceCategories, setComplianceCategories] = useState<string[]>(['GST', 'TDS', 'ITR', 'ROC', 'Advance Tax', 'Labour', 'MCA']);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-session');
    
    // Clear all state
    setTasks([]);
    setClients([]);
    setUsers([]);
    setDeadlines([]);
    setTemplates([]);
    setMeetings([]);
    setNotes([]);
    setPasswords([]);
    setDocs([]);
    setFolders([]);
    setEmails([]);
    setTaskTypes([]);
    setWorkflows([]);
    setNotifications([]);
    
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const login = async (session: any) => {
    if (!session || !session.user) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    localStorage.setItem('sb-session', JSON.stringify(session));
    const user = session.user;
    const isSampleUser = user.email === 'kartikkhandelwal1104@gmail.com';
    
    // Set basic user info
    const userObj: User = {
      id: user.id,
      name: user.user_metadata?.full_name || 'User',
      email: user.email || '',
      role: 'Admin', // Default to Admin for now, or fetch from user_profiles
      designation: 'Tax Professional',
      color: '#2563eb',
      active: true,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'User')}&background=0D8ABC&color=fff`
    };
    
    // Fetch data from backend
    try {
      const { data: tasksData } = await supabase.from('tasks').select('*');
      const { data: clientsData } = await supabase.from('clients').select('*');
      
      if (Array.isArray(tasksData) && tasksData.length > 0) {
        setTasks(tasksData);
      } else if (isSampleUser) {
        setTasks(INIT_TASKS);
      } else {
        setTasks([]);
      }

      if (Array.isArray(clientsData) && clientsData.length > 0) {
        setClients(clientsData);
      } else if (isSampleUser) {
        setClients(INIT_CLIENTS);
      } else {
        setClients([]);
      }
      
      // Fallback to local storage for other non-table data or use more tables
      const storageKey = `app-data-${user.id}`;
      const persistedData = localStorage.getItem(storageKey);
      
      if (persistedData) {
        const data = JSON.parse(persistedData);
        setDeadlines(data.deadlines || []);
        setTemplates(data.templates || []);
        setMeetings(data.meetings || []);
        setNotes(data.notes || []);
        setPasswords(data.passwords || []);
        setDocs(data.docs || []);
        setFolders(data.folders || []);
        setEmails(data.emails || []);
        setTaskTypes(data.taskTypes || []);
        setWorkflows(data.workflows || []);
        setRoles(data.roles || INIT_ROLES);
        setPermissions(data.permissions || INIT_PERMISSIONS);
      } else if (isSampleUser) {
        // Load sample data only for the primary user
        setDeadlines(INIT_DEADLINES);
        setTemplates(INIT_TEMPLATES);
        setMeetings(INIT_MEETINGS);
        setNotes(INIT_NOTES);
        setPasswords(INIT_PASSWORDS);
        setDocs(INIT_DOCS);
        setFolders(INIT_FOLDERS);
        setEmails(INIT_EMAILS);
        setTaskTypes(INIT_TASK_TYPES);
        setWorkflows(INIT_WORKFLOWS);
        setRoles(INIT_ROLES);
        setPermissions(INIT_PERMISSIONS);
      } else {
        // Fresh state for other users
        setDeadlines([]);
        setTemplates([]);
        setMeetings([]);
        setNotes([]);
        setPasswords([]);
        setDocs([]);
        setFolders([]);
        setEmails([]);
        setTaskTypes([]);
        setWorkflows([]);
        setRoles(INIT_ROLES);
        setPermissions(INIT_PERMISSIONS);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }

    setCurrentUser(userObj);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const sessionStr = localStorage.getItem('sb-session');
      if (sessionStr) {
        await login(JSON.parse(sessionStr));
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Persistence Effect
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const storageKey = `app-data-${currentUser.id}`;
      const dataToPersist = {
        tasks, clients, users, deadlines, templates, meetings, notes, passwords, docs, folders, emails, taskTypes, workflows, notifications, complianceCategories, roles, permissions
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToPersist));
    }
  }, [tasks, clients, users, deadlines, templates, meetings, notes, passwords, docs, folders, emails, taskTypes, workflows, notifications, complianceCategories, roles, permissions, isAuthenticated, currentUser]);

  const notify = (userId: string, text: string, type: AppNotification['type'], link?: string) => {
    const newNotif: AppNotification = {
      id: genUUID(),
      userId,
      text,
      at: new Date().toISOString(),
      read: false,
      type,
      link
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const hasPermission = (permissionId: string) => {
    if (!currentUser) return false;
    // If user is Admin, they have all permissions
    if (currentUser.role === 'Admin') return true;
    
    const userRole = roles.find(r => r.name === currentUser.role);
    if (!userRole) return false;
    
    return userRole.permissions.includes(permissionId);
  };

  // Persistence wrappers (Local only for now)
  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTask = async (task: Task): Promise<string> => {
    let finalId = task.id;
    setTasks(prev => {
      let finalTask = { ...task };
      if (!task.id.startsWith('KDK-') || task.id.length > 20) {
        let max = 0;
        prev.forEach(t => {
          if (t.id.startsWith('KDK-')) {
            const num = parseInt(t.id.split('-')[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
        finalId = `KDK-${max + 1}`;
        finalTask.id = finalId;
      }
      return [finalTask, ...prev];
    });
    // Note: finalId might not be accurate if setTasks is deferred, but in most cases it's synchronous enough for immediate use, or we should use addTasks for bulk.
    return finalId;
  };

  const addTasks = async (newTasks: Task[]): Promise<string[]> => {
    let finalIds: string[] = [];
    setTasks(prev => {
      let max = 0;
      prev.forEach(t => {
        if (t.id.startsWith('KDK-')) {
          const num = parseInt(t.id.split('-')[1], 10);
          if (!isNaN(num) && num > max) max = num;
        }
      });
      
      const idMap: Record<string, string> = {};
      
      const tasksToAdd = newTasks.map((task, idx) => {
        let finalTask = { ...task };
        if (!task.id.startsWith('KDK-') || task.id.length > 20) {
          const newId = `KDK-${max + 1 + idx}`;
          idMap[task.id] = newId;
          finalTask.id = newId;
        }
        finalIds.push(finalTask.id);
        return finalTask;
      });
      
      // Update parentIds if they were changed
      tasksToAdd.forEach(t => {
        if (t.parentId && idMap[t.parentId]) {
          t.parentId = idMap[t.parentId];
        }
      });
      
      return [...tasksToAdd, ...prev];
    });
    return finalIds;
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addClient = async (client: Client) => {
    setClients(prev => [client, ...prev]);
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const addNote = async (note: Note) => {
    const noteWithProfile = { ...note, profile_id: currentUser?.id };
    setNotes(prev => [noteWithProfile, ...prev]);
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const addMeeting = async (meeting: Meeting) => {
    const meetingWithProfile = { ...meeting, profile_id: currentUser?.id };
    setMeetings(prev => [meetingWithProfile, ...prev]);
  };

  const deleteMeeting = async (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const updatePassword = async (id: string, updates: Partial<Password>) => {
    setPasswords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addPassword = async (password: Password) => {
    const passwordWithProfile = { ...password, profile_id: currentUser?.id };
    setPasswords(prev => [passwordWithProfile, ...prev]);
  };

  const deletePassword = async (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addDocument = async (doc: Document) => {
    const docWithProfile = { ...doc, profile_id: currentUser?.id };
    setDocs(prev => [docWithProfile, ...prev]);
  };

  const deleteDocument = async (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addFolder = async (folder: Folder) => {
    const folderWithProfile = { ...folder, profile_id: currentUser?.id };
    setFolders(prev => [folderWithProfile, ...prev]);
  };

  const deleteFolder = async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  const updateTaskType = async (id: string, updates: Partial<TaskTypeConfig>) => {
    setTaskTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTaskType = async (taskType: TaskTypeConfig) => {
    const taskTypeWithProfile = { ...taskType, profile_id: currentUser?.id };
    setTaskTypes(prev => [taskTypeWithProfile, ...prev]);
  };

  const deleteTaskType = async (id: string) => {
    setTaskTypes(prev => prev.filter(t => t.id !== id));
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const addWorkflow = async (workflow: Workflow) => {
    const workflowWithProfile = { ...workflow, profile_id: currentUser?.id };
    setWorkflows(prev => [workflowWithProfile, ...prev]);
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const updateDeadline = async (id: string, updates: Partial<Deadline>) => {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const addDeadline = async (deadline: Deadline) => {
    const deadlineWithProfile = { ...deadline, profile_id: currentUser?.id };
    setDeadlines(prev => [deadlineWithProfile, ...prev]);
  };

  const deleteDeadline = async (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addTemplate = async (template: Template) => {
    const templateWithProfile = { ...template, profile_id: currentUser?.id };
    setTemplates(prev => [templateWithProfile, ...prev]);
  };

  const deleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addEmail = async (email: Email) => {
    const emailWithProfile = { ...email, profile_id: currentUser?.id };
    setEmails(prev => [emailWithProfile, ...prev]);
  };

  const deleteEmail = async (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const addUser = async (user: User) => {
    setUsers(prev => [user, ...prev]);
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateRole = async (id: string, updates: Partial<Role>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addRole = async (role: Role) => {
    setRoles(prev => [role, ...prev]);
  };

  const deleteRole = async (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  return (
    <AppCtx.Provider value={{
      tasks, setTasks,
      clients, setClients,
      users, setUsers,
      deadlines, setDeadlines,
      templates, setTemplates,
      meetings, setMeetings,
      notes, setNotes,
      passwords, setPasswords,
      docs, setDocs,
      folders, setFolders,
      emails, setEmails,
      taskTypes, setTaskTypes,
      workflows, setWorkflows,
      roles, setRoles,
      permissions, setPermissions,
      notifications, setNotifications,
      complianceCategories, setComplianceCategories,
      sidebarCollapsed, setSidebarCollapsed,
      mobileMenuOpen, setMobileMenuOpen,
      isAuthenticated, setIsAuthenticated,
      currentUser, setCurrentUser,
      isLoading,
      notify,
      hasPermission,
      updateTask, addTask, addTasks, deleteTask,
      updateClient, addClient, deleteClient,
      updateNote, addNote, deleteNote,
      updateMeeting, addMeeting, deleteMeeting,
      updatePassword, addPassword, deletePassword,
      updateDocument, addDocument, deleteDocument,
      updateFolder, addFolder, deleteFolder,
      updateTaskType, addTaskType, deleteTaskType,
      updateWorkflow, addWorkflow, deleteWorkflow,
      updateDeadline, addDeadline, deleteDeadline,
      updateTemplate, addTemplate, deleteTemplate,
      updateEmail, addEmail, deleteEmail,
      updateUser, addUser, deleteUser,
      updateRole, addRole, deleteRole,
      login, logout
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
