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
  seedSampleData: () => Promise<void>;
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

  const seedSampleData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // Seed Users (Profiles)
      const usersToInsert = INIT_USERS.map(u => {
        const dbUser: any = { ...u, full_name: u.name, avatar_url: u.avatarUrl || null };
        delete dbUser.avatarUrl;
        delete dbUser.name;
        delete dbUser.role;
        return dbUser;
      });
      // Add current user profile if not already in INIT_USERS
      if (!usersToInsert.find(u => u.id === currentUser.id)) {
        usersToInsert.push({
          id: currentUser.id,
          full_name: currentUser.name || 'User',
          email: currentUser.email,
          active: true
        });
      }
      await supabase.from('user_profiles').upsert(usersToInsert);

      // Seed Workflows
      const workflowsToInsert = INIT_WORKFLOWS.map(w => ({ ...w, profile_id: currentUser.id }));
      await supabase.from('workflows').insert(workflowsToInsert);

      // Seed Task Types
      const taskTypesToInsert = INIT_TASK_TYPES.map(tt => ({ 
        ...tt, 
        profile_id: currentUser.id,
        workflow_id: tt.workflowId
      }));
      // Remove workflowId from the object before insert
      taskTypesToInsert.forEach((tt: any) => delete tt.workflowId);
      await supabase.from('task_types').insert(taskTypesToInsert);

      // Seed Tasks
      const tasksToInsert = INIT_TASKS.map(t => {
        const dbTask: any = { 
          ...t, 
          profile_id: currentUser.id,
          client_id: t.clientId, 
          assigned_to: t.assigneeId || currentUser.id, 
          reviewer_id: t.reviewerId || currentUser.id, 
          reporter_id: t.reporterId || currentUser.id,
          due_date: t.dueDate, 
          issue_type: t.issueType, 
          parent_id: t.parentId, 
          statutory_deadline: t.statutoryDeadline, 
          linked_tasks: t.linkedTasks, 
          created_at: t.createdAt 
        };
        delete dbTask.clientId; delete dbTask.assigneeId; delete dbTask.reviewerId; delete dbTask.dueDate; delete dbTask.issueType; delete dbTask.parentId; delete dbTask.statutoryDeadline; delete dbTask.linkedTasks; delete dbTask.createdAt;
        delete dbTask.reporterId; delete dbTask.activity;
        return dbTask;
      });
      await supabase.from('tasks').insert(tasksToInsert);

      // Seed Clients
      const clientsToInsert = INIT_CLIENTS.map(c => {
        const dbClient: any = { ...c, profile_id: currentUser.id, onboarded_at: c.onboarded };
        delete dbClient.onboarded;
        return dbClient;
      });
      await supabase.from('clients').insert(clientsToInsert);

      // Seed Deadlines
      const deadlinesToInsert = INIT_DEADLINES.map(d => ({
        ...d,
        profile_id: currentUser.id,
        due_date: d.dueDate,
        description: d.desc
      }));
      await supabase.from('deadlines').insert(deadlinesToInsert);

      // Reload data
      const sessionStr = localStorage.getItem('sb-session');
      if (sessionStr) {
        await login(JSON.parse(sessionStr));
      }
    } catch (error) {
      console.error('Error seeding data:', error);
    } finally {
      setIsLoading(false);
    }
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
      console.log('Loading data for user:', user.email);
      
      // Check if user profile exists, if not create it (Trigger handles this but good to have fallback)
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle();
      if (!profile) {
        console.log('Creating new user profile...');
        await supabase.from('user_profiles').insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email,
          active: true
        });
      } else {
        userObj.name = profile.full_name || userObj.name;
        userObj.designation = profile.designation || userObj.designation;
        userObj.role = profile.role_id ? 'Admin' : userObj.role; // Simplified for now
      }

      const [
        { data: tasksData },
        { data: clientsData },
        { data: deadlinesData },
        { data: templatesData },
        { data: meetingsData },
        { data: notesData },
        { data: passwordsData },
        { data: docsData },
        { data: foldersData },
        { data: emailsData },
        { data: taskTypesData },
        { data: workflowsData },
        { data: rolesData },
        { data: permissionsData }
      ] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('deadlines').select('*'),
        supabase.from('templates').select('*'),
        supabase.from('meetings').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('passwords').select('*'),
        supabase.from('documents').select('*'),
        supabase.from('folders').select('*'),
        supabase.from('emails').select('*'),
        supabase.from('task_types').select('*'),
        supabase.from('workflows').select('*'),
        supabase.from('roles').select('*'),
        supabase.from('permissions').select('*')
      ]);
      
      // Map and set tasks
      if (Array.isArray(tasksData) && tasksData.length > 0) {
        console.log('Loaded tasks:', tasksData.length);
        setTasks(tasksData.map(t => ({
          ...t,
          clientId: t.client_id,
          assigneeId: t.assigned_to,
          reviewerId: t.reviewer_id,
          reporterId: t.reporter_id,
          dueDate: t.due_date,
          createdAt: t.created_at,
          issueType: t.issue_type,
          statutoryDeadline: t.statutory_deadline,
          parentId: t.parent_id,
          linkedTasks: t.linked_tasks,
          dependencies: t.dependencies
        })));
      } else {
        setTasks([]);
      }

      // Map and set clients
      if (Array.isArray(clientsData) && clientsData.length > 0) {
        console.log('Loaded clients:', clientsData.length);
        setClients(clientsData.map(c => ({
          ...c,
          onboarded: c.onboarded_at
        })));
      } else {
        setClients([]);
      }

      // Set other data
      const setAndSeed = async (table: string, data: any[], setter: any, mapper?: any) => {
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Loaded ${table}:`, data.length);
          setter(mapper ? data.map(mapper) : data);
        } else {
          setter([]);
        }
      };

      await Promise.all([
        setAndSeed('deadlines', deadlinesData || [], setDeadlines, (d: any) => ({ ...d, dueDate: d.due_date, desc: d.description })),
        setAndSeed('templates', templatesData || [], setTemplates, (t: any) => ({ ...t, estHours: t.est_hours })),
        setAndSeed('meetings', meetingsData || [], setMeetings, (m: any) => ({ ...m, clientId: m.client_id, meetLink: m.meet_link })),
        setAndSeed('notes', notesData || [], setNotes, (n: any) => ({ ...n, createdAt: n.created_at, updatedAt: n.updated_at })),
        setAndSeed('passwords', passwordsData || [], setPasswords, (p: any) => ({ ...p, clientId: p.client_id, lastUpdated: p.updated_at })),
        setAndSeed('documents', docsData || [], setDocs, (d: any) => ({ ...d, folderId: d.folder_id, clientId: d.client_id, uploadedBy: d.uploaded_by, uploadedAt: d.created_at })),
        setAndSeed('folders', foldersData || [], setFolders, (f: any) => ({ ...f, parentId: f.parent_id, clientId: f.client_id })),
        setAndSeed('emails', emailsData || [], setEmails, (e: any) => ({ ...e, fromEmail: e.from_email, to: e.to_email, clientId: e.client_id, taskLinked: e.task_linked })),
        setAndSeed('task_types', taskTypesData || [], setTaskTypes, (tt: any) => ({ ...tt, workflowId: tt.workflow_id })),
        setWorkflows(Array.isArray(workflowsData) && workflowsData.length > 0 ? workflowsData : []),
        setRoles(Array.isArray(rolesData) && rolesData.length > 0 ? rolesData : INIT_ROLES),
        setPermissions(Array.isArray(permissionsData) && permissionsData.length > 0 ? permissionsData : INIT_PERMISSIONS)
      ]);

      // Fallback to local storage for remaining non-table data
      const storageKey = `app-data-${user.id}`;
      const persistedData = localStorage.getItem(storageKey);
      if (persistedData) {
        const data = JSON.parse(persistedData);
        if (!tasksData?.length) setTasks(data.tasks || []);
        if (!clientsData?.length) setClients(data.clients || []);
      }

      setIsAuthenticated(true);
      setCurrentUser(userObj);
      setIsLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
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
        complianceCategories, sidebarCollapsed
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToPersist));
    }
  }, [complianceCategories, sidebarCollapsed, isAuthenticated, currentUser]);

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

  // Persistence wrappers
  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.clientId !== undefined) { dbUpdates.client_id = updates.clientId || null; delete dbUpdates.clientId; }
    if (updates.assigneeId !== undefined) { dbUpdates.assigned_to = updates.assigneeId || null; delete dbUpdates.assigneeId; }
    if (updates.reviewerId !== undefined) { dbUpdates.reviewer_id = updates.reviewerId || null; delete dbUpdates.reviewerId; }
    if (updates.reporterId !== undefined) { dbUpdates.reporter_id = updates.reporterId || null; delete dbUpdates.reporterId; }
    if (updates.dueDate !== undefined) { dbUpdates.due_date = updates.dueDate || null; delete dbUpdates.dueDate; }
    if (updates.issueType !== undefined) { dbUpdates.issue_type = updates.issueType || null; delete dbUpdates.issueType; }
    if (updates.parentId !== undefined) { dbUpdates.parent_id = updates.parentId || null; delete dbUpdates.parentId; }
    if (updates.statutoryDeadline !== undefined) { dbUpdates.statutory_deadline = updates.statutoryDeadline || null; delete dbUpdates.statutoryDeadline; }
    if (updates.linkedTasks !== undefined) { dbUpdates.linked_tasks = updates.linkedTasks || null; delete dbUpdates.linkedTasks; }
    if (updates.createdAt !== undefined) { dbUpdates.created_at = updates.createdAt || null; delete dbUpdates.createdAt; }
    
    // Remove properties that don't exist in DB
    delete dbUpdates.subtasks;
    delete dbUpdates.comments;
    delete dbUpdates.attachments;
    delete dbUpdates.activity;
    
    await supabase.from('tasks').update(dbUpdates).eq('id', id);
  };

  const addTask = async (task: Task): Promise<string> => {
    let finalId = task.id;
    // Ensure default type if missing
    const taskType = task.type || (taskTypes.length > 0 ? taskTypes[0].name : 'GST');
    let finalTask = { ...task, profile_id: currentUser?.id, type: taskType };
    
    setTasks(prev => {
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

    const dbTask: any = { 
      ...finalTask,
      client_id: finalTask.clientId || null,
      assigned_to: finalTask.assigneeId || null,
      reviewer_id: finalTask.reviewerId || null,
      reporter_id: finalTask.reporterId || currentUser?.id || null,
      due_date: finalTask.dueDate || null,
      issue_type: finalTask.issueType || 'Task',
      parent_id: finalTask.parentId || null,
      statutory_deadline: finalTask.statutoryDeadline || null,
      linked_tasks: finalTask.linkedTasks || [],
      created_at: finalTask.createdAt || new Date().toISOString()
    };
    delete dbTask.clientId;
    delete dbTask.assigneeId;
    delete dbTask.reviewerId;
    delete dbTask.dueDate;
    delete dbTask.issueType;
    delete dbTask.parentId;
    delete dbTask.statutoryDeadline;
    delete dbTask.linkedTasks;
    delete dbTask.createdAt;
    delete dbTask.reporterId;
    delete dbTask.activity;
    delete dbTask.subtasks;
    delete dbTask.comments;
    delete dbTask.attachments;

    await supabase.from('tasks').insert(dbTask);
    return finalId;
  };

  const addTasks = async (newTasks: Task[]): Promise<string[]> => {
    let finalIds: string[] = [];
    let tasksToInsert: any[] = [];
    
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
        const taskType = task.type || (taskTypes.length > 0 ? taskTypes[0].name : 'GST');
        let finalTask = { ...task, profile_id: currentUser?.id, type: taskType };
        if (!task.id.startsWith('KDK-') || task.id.length > 20) {
          const newId = `KDK-${max + 1 + idx}`;
          idMap[task.id] = newId;
          finalTask.id = newId;
        }
        finalIds.push(finalTask.id);
        return finalTask;
      });
      
      tasksToAdd.forEach(t => {
        if (t.parentId && idMap[t.parentId]) {
          t.parentId = idMap[t.parentId];
        }
        
        const dbTask: any = { 
          ...t,
          client_id: t.clientId || null,
          assigned_to: t.assigneeId || null,
          reviewer_id: t.reviewerId || null,
          reporter_id: t.reporterId || currentUser?.id || null,
          due_date: t.dueDate || null,
          issue_type: t.issueType || 'Task',
          parent_id: t.parentId || null,
          statutory_deadline: t.statutoryDeadline || null,
          linked_tasks: t.linkedTasks || [],
          created_at: t.createdAt || new Date().toISOString()
        };
        delete dbTask.clientId;
        delete dbTask.assigneeId;
        delete dbTask.reviewerId;
        delete dbTask.dueDate;
        delete dbTask.issueType;
        delete dbTask.parentId;
        delete dbTask.statutoryDeadline;
        delete dbTask.linkedTasks;
        delete dbTask.createdAt;
        delete dbTask.reporterId;
        delete dbTask.activity;
        delete dbTask.subtasks;
        delete dbTask.comments;
        delete dbTask.attachments;
        tasksToInsert.push(dbTask);
      });
      
      return [...tasksToAdd, ...prev];
    });
    
    if (tasksToInsert.length > 0) {
      await supabase.from('tasks').insert(tasksToInsert);
    }
    return finalIds;
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.onboarded) { dbUpdates.onboarded_at = updates.onboarded; delete dbUpdates.onboarded; }
    
    await supabase.from('clients').update(dbUpdates).eq('id', id);
  };

  const addClient = async (client: Client) => {
    const clientWithProfile = { ...client, profile_id: currentUser?.id };
    setClients(prev => [clientWithProfile, ...prev]);
    
    const dbClient: any = { ...clientWithProfile, onboarded_at: client.onboarded };
    delete dbClient.onboarded;
    
    await supabase.from('clients').insert(dbClient);
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await supabase.from('clients').delete().eq('id', id);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    const now = new Date().toISOString();
    const dbUpdates: any = { ...updates, updated_at: now };
    if (updates.createdAt) { dbUpdates.created_at = updates.createdAt; delete dbUpdates.createdAt; }
    if (updates.updatedAt) { delete dbUpdates.updatedAt; } // Always use DB timestamp
    await supabase.from('notes').update(dbUpdates).eq('id', id);
  };

  const addNote = async (note: Note) => {
    const noteWithProfile = { ...note, profile_id: currentUser?.id };
    setNotes(prev => [noteWithProfile, ...prev]);
    const now = new Date().toISOString();
    const dbNote: any = { 
      ...noteWithProfile, 
      created_at: note.createdAt || now, 
      updated_at: now 
    };
    delete dbNote.createdAt;
    delete dbNote.updatedAt;
    
    console.log('Attempting to save note to DB:', dbNote);
    const { error } = await supabase.from('notes').insert(dbNote);
    if (error) {
      console.error('Failed to save note to database:', error);
    } else {
      console.log('Note saved to database successfully');
    }
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    const dbUpdates: any = { ...updates };
    if (updates.clientId) { dbUpdates.client_id = updates.clientId; delete dbUpdates.clientId; }
    if (updates.meetLink) { dbUpdates.meet_link = updates.meetLink; delete dbUpdates.meetLink; }
    await supabase.from('meetings').update(dbUpdates).eq('id', id);
  };

  const addMeeting = async (meeting: Meeting) => {
    const meetingWithProfile = { ...meeting, profile_id: currentUser?.id };
    setMeetings(prev => [meetingWithProfile, ...prev]);
    const dbMeeting: any = { ...meetingWithProfile, client_id: meeting.clientId, meet_link: meeting.meetLink };
    delete dbMeeting.clientId;
    delete dbMeeting.meetLink;
    await supabase.from('meetings').insert(dbMeeting);
  };

  const deleteMeeting = async (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    await supabase.from('meetings').delete().eq('id', id);
  };

  const updatePassword = async (id: string, updates: Partial<Password>) => {
    setPasswords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const dbUpdates: any = { ...updates };
    if (updates.clientId) { dbUpdates.client_id = updates.clientId; delete dbUpdates.clientId; }
    if (updates.lastUpdated) { dbUpdates.updated_at = updates.lastUpdated; delete dbUpdates.lastUpdated; }
    await supabase.from('passwords').update(dbUpdates).eq('id', id);
  };

  const addPassword = async (password: Password) => {
    const passwordWithProfile = { ...password, profile_id: currentUser?.id };
    setPasswords(prev => [passwordWithProfile, ...prev]);
    const dbPassword: any = { 
      ...passwordWithProfile, 
      client_id: password.clientId,
      updated_at: password.lastUpdated
    };
    delete dbPassword.clientId;
    delete dbPassword.lastUpdated;
    await supabase.from('passwords').insert(dbPassword);
  };

  const deletePassword = async (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
    await supabase.from('passwords').delete().eq('id', id);
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const dbUpdates: any = { ...updates };
    if (updates.folderId) { dbUpdates.folder_id = updates.folderId; delete dbUpdates.folderId; }
    if (updates.clientId) { dbUpdates.client_id = updates.clientId; delete dbUpdates.clientId; }
    if (updates.uploadedBy) { dbUpdates.uploaded_by = updates.uploadedBy; delete dbUpdates.uploadedBy; }
    if (updates.uploadedAt) { dbUpdates.created_at = updates.uploadedAt; delete dbUpdates.uploadedAt; }
    await supabase.from('documents').update(dbUpdates).eq('id', id);
  };

  const addDocument = async (doc: Document) => {
    const docWithProfile = { ...doc, profile_id: currentUser?.id };
    setDocs(prev => [docWithProfile, ...prev]);
    const dbDoc: any = { 
      ...docWithProfile, 
      folder_id: doc.folderId, 
      client_id: doc.clientId, 
      uploaded_by: doc.uploadedBy,
      created_at: doc.uploadedAt
    };
    delete dbDoc.folderId;
    delete dbDoc.clientId;
    delete dbDoc.uploadedBy;
    delete dbDoc.uploadedAt;
    await supabase.from('documents').insert(dbDoc);
  };

  const deleteDocument = async (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    await supabase.from('documents').delete().eq('id', id);
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    const dbUpdates: any = { ...updates };
    if (updates.parentId) { dbUpdates.parent_id = updates.parentId; delete dbUpdates.parentId; }
    if (updates.clientId) { dbUpdates.client_id = updates.clientId; delete dbUpdates.clientId; }
    await supabase.from('folders').update(dbUpdates).eq('id', id);
  };

  const addFolder = async (folder: Folder) => {
    const folderWithProfile = { ...folder, profile_id: currentUser?.id };
    setFolders(prev => [folderWithProfile, ...prev]);
    const dbFolder: any = { ...folderWithProfile, parent_id: folder.parentId, client_id: folder.clientId };
    delete dbFolder.parentId;
    delete dbFolder.clientId;
    await supabase.from('folders').insert(dbFolder);
  };

  const deleteFolder = async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    await supabase.from('folders').delete().eq('id', id);
  };

  const updateTaskType = async (id: string, updates: Partial<TaskTypeConfig>) => {
    setTaskTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const dbUpdates: any = { ...updates };
    if (updates.workflowId) { dbUpdates.workflow_id = updates.workflowId; delete dbUpdates.workflowId; }
    await supabase.from('task_types').update(dbUpdates).eq('id', id);
  };

  const addTaskType = async (taskType: TaskTypeConfig) => {
    const taskTypeWithProfile = { ...taskType, profile_id: currentUser?.id };
    setTaskTypes(prev => [taskTypeWithProfile, ...prev]);
    const dbTaskType: any = { ...taskTypeWithProfile, workflow_id: taskType.workflowId };
    delete dbTaskType.workflowId;
    await supabase.from('task_types').insert(dbTaskType);
  };

  const deleteTaskType = async (id: string) => {
    setTaskTypes(prev => prev.filter(t => t.id !== id));
    await supabase.from('task_types').delete().eq('id', id);
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    await supabase.from('workflows').update(updates).eq('id', id);
  };

  const addWorkflow = async (workflow: Workflow) => {
    const workflowWithProfile = { ...workflow, profile_id: currentUser?.id };
    setWorkflows(prev => [workflowWithProfile, ...prev]);
    await supabase.from('workflows').insert(workflowWithProfile);
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    await supabase.from('workflows').delete().eq('id', id);
  };

  const updateDeadline = async (id: string, updates: Partial<Deadline>) => {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const dbUpdates: any = { ...updates };
    if (updates.dueDate) { dbUpdates.due_date = updates.dueDate; delete dbUpdates.dueDate; }
    if (updates.desc) { dbUpdates.description = updates.desc; delete dbUpdates.desc; }
    await supabase.from('deadlines').update(dbUpdates).eq('id', id);
  };

  const addDeadline = async (deadline: Deadline) => {
    const deadlineWithProfile = { ...deadline, profile_id: currentUser?.id };
    setDeadlines(prev => [deadlineWithProfile, ...prev]);
    const dbDeadline: any = { ...deadlineWithProfile, due_date: deadline.dueDate, description: deadline.desc };
    delete dbDeadline.dueDate;
    delete dbDeadline.desc;
    await supabase.from('deadlines').insert(dbDeadline);
  };

  const deleteDeadline = async (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
    await supabase.from('deadlines').delete().eq('id', id);
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const dbUpdates: any = { ...updates };
    if (updates.estHours) { dbUpdates.est_hours = updates.estHours; delete dbUpdates.estHours; }
    await supabase.from('templates').update(dbUpdates).eq('id', id);
  };

  const addTemplate = async (template: Template) => {
    const templateWithProfile = { ...template, profile_id: currentUser?.id };
    setTemplates(prev => [templateWithProfile, ...prev]);
    const dbTemplate: any = { ...templateWithProfile, est_hours: template.estHours };
    delete dbTemplate.estHours;
    await supabase.from('templates').insert(dbTemplate);
  };

  const deleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    await supabase.from('templates').delete().eq('id', id);
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    const dbUpdates: any = { ...updates };
    if (updates.fromEmail) { dbUpdates.from_email = updates.fromEmail; delete dbUpdates.fromEmail; }
    if (updates.to) { dbUpdates.to_email = updates.to; delete dbUpdates.to; }
    if (updates.clientId) { dbUpdates.client_id = updates.clientId; delete dbUpdates.clientId; }
    if (updates.taskLinked) { dbUpdates.task_linked = updates.taskLinked; delete dbUpdates.taskLinked; }
    await supabase.from('emails').update(dbUpdates).eq('id', id);
  };

  const addEmail = async (email: Email) => {
    const emailWithProfile = { ...email, profile_id: currentUser?.id };
    setEmails(prev => [emailWithProfile, ...prev]);
    const dbEmail: any = { 
      ...emailWithProfile, 
      from_email: email.fromEmail, 
      to_email: email.to, 
      client_id: email.clientId,
      task_linked: email.taskLinked
    };
    delete dbEmail.fromEmail;
    delete dbEmail.to;
    delete dbEmail.clientId;
    delete dbEmail.taskLinked;
    await supabase.from('emails').insert(dbEmail);
  };

  const deleteEmail = async (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    await supabase.from('emails').delete().eq('id', id);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.name) { dbUpdates.full_name = updates.name; delete dbUpdates.name; }
    if (updates.avatarUrl) { dbUpdates.avatar_url = updates.avatarUrl; delete dbUpdates.avatarUrl; }
    
    // Remove properties that don't exist in DB
    delete dbUpdates.role;
    
    await supabase.from('user_profiles').update(dbUpdates).eq('id', id);
  };

  const addUser = async (user: User) => {
    setUsers(prev => [user, ...prev]);
    const dbUser: any = { ...user, full_name: user.name, avatar_url: user.avatarUrl };
    delete dbUser.avatarUrl;
    delete dbUser.name;
    delete dbUser.role;
    
    await supabase.from('user_profiles').insert(dbUser);
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    await supabase.from('user_profiles').delete().eq('id', id);
  };

  const updateRole = async (id: string, updates: Partial<Role>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    await supabase.from('roles').update(updates).eq('id', id);
  };

  const addRole = async (role: Role) => {
    setRoles(prev => [role, ...prev]);
    await supabase.from('roles').insert(role);
  };

  const deleteRole = async (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    await supabase.from('roles').delete().eq('id', id);
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
      login, logout, seedSampleData
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
