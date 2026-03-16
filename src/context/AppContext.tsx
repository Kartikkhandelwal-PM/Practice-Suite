import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, Client, User, Deadline, Template, Meeting, Note, Password, Document, Folder, Email, TaskTypeConfig, Workflow, AppNotification } from '../types';
import { INIT_TASKS, INIT_CLIENTS, INIT_USERS, INIT_DEADLINES, INIT_TEMPLATES, INIT_MEETINGS, INIT_NOTES, INIT_PASSWORDS, INIT_DOCS, INIT_FOLDERS, INIT_EMAILS, INIT_TASK_TYPES, INIT_WORKFLOWS } from '../data';
import { aiApi, authApi, dataApi, sessionStore } from '../lib/api';
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
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
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
}

const AppCtx = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INIT_TASKS);
  const [clients, setClients] = useState<Client[]>(INIT_CLIENTS);
  const [users, setUsers] = useState<User[]>(INIT_USERS);
  const [deadlines, setDeadlines] = useState<Deadline[]>(INIT_DEADLINES);
  const [templates, setTemplates] = useState<Template[]>(INIT_TEMPLATES);
  const [meetings, setMeetings] = useState<Meeting[]>(INIT_MEETINGS);
  const [notes, setNotes] = useState<Note[]>(INIT_NOTES);
  const [passwords, setPasswords] = useState<Password[]>(INIT_PASSWORDS);
  const [docs, setDocs] = useState<Document[]>(INIT_DOCS);
  const [folders, setFolders] = useState<Folder[]>(INIT_FOLDERS);
  const [emails, setEmails] = useState<Email[]>(INIT_EMAILS);
  const [taskTypes, setTaskTypes] = useState<TaskTypeConfig[]>(INIT_TASK_TYPES);
  const [workflows, setWorkflows] = useState<Workflow[]>(INIT_WORKFLOWS);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'n1', userId: 'u1', text: 'Priya Nair mentioned you in task "GSTR-3B Filing"', at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), read: false, type: 'mention', link: '/tasks' },
    { id: 'n2', userId: 'u1', text: 'Meeting "Audit Review" starts in 15 minutes', at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), read: false, type: 'meeting', link: '/meetings' },
    { id: 'n3', userId: 'u1', text: 'New document uploaded for Sharma & Sons', at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true, type: 'task', link: '/documents' },
    { id: 'n4', userId: 'u1', text: 'Task "ITR Filing - Agarwal" marked as complete', at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), read: true, type: 'task', link: '/tasks' }
  ]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const session = sessionStore.get();
      await handleAuthChange(session);
    };

    const handleAuthChange = async (session: any) => {
      setIsAuthenticated(!!session);
      if (session?.access_token) {
        const { user } = await authApi.getCurrentUser();
        // Check if profile exists, if not create it
        const profiles = await dataApi.list<User>('profiles');
        const profile = profiles[0];

        let finalProfile = profile;
        if (!profile) {
          // Profile not found, create it
          const newProfile = {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: 'Admin',
            designation: 'Tax Professional',
            color: '#2563eb',
            active: true,
            avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`
          };
          try {
            await dataApi.insert('profiles', newProfile);
          } catch (insertError) {
            console.error('Error creating profile:', insertError);
          }
          finalProfile = newProfile;
        } else {
          finalProfile = {
            ...profile,
            name: profile.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: profile.email || user.email || ''
          };
        }

        setCurrentUser(finalProfile);
        // Fetch all data from Supabase for this user
        await fetchAppData(user.id, user.email);
      } else {
        setCurrentUser(null);
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
      }
      setIsLoading(false);
    };

    const fetchAppData = async (userId: string, email: string) => {
      try {
        const results = await Promise.all([
          dataApi.list<Task>('tasks'),
          dataApi.list<Client>('clients'),
          dataApi.list<User>('profiles'),
          dataApi.list<Deadline>('deadlines'),
          dataApi.list<Template>('templates'),
          dataApi.list<Meeting>('meetings'),
          dataApi.list<Note>('notes'),
          dataApi.list<Password>('passwords'),
          dataApi.list<Document>('documents'),
          dataApi.list<Folder>('folders'),
          dataApi.list<Email>('emails'),
          dataApi.list<TaskTypeConfig>('task_types'),
          dataApi.list<Workflow>('workflows'),
          dataApi.list<AppNotification>('notifications')
        ]) as any[];

        const tasksData = results[0] || [];
        const clientsData = results[1] || [];
        const profilesData = (results[2] || []).map((p: any) => ({
          ...p,
          name: p.name || p.full_name || p.email?.split('@')[0] || 'User',
          email: p.email || ''
        }));
        const deadlinesData = results[3] || [];
        const templatesData = results[4] || [];
        const meetingsData = results[5] || [];
        const notesData = results[6] || [];
        const passwordsData = results[7] || [];
        const docsData = results[8] || [];
        const foldersData = results[9] || [];
        const emailsData = results[10] || [];
        const taskTypesData = results[11] || [];
        const workflowsData = results[12] || [];
        const notificationsData = results[13] || [];

        // Demo Seeding Logic
        if (email.toLowerCase() === 'kartikkhandelwal1104@gmail.com' && tasksData.length === 0) {
          console.log('Demo user detected with empty database. Seeding...');
          try {
            await aiApi.seedDemo();
            await fetchAppData(userId, email);
            return;
          } catch (seedErr) {
            console.error('Error triggering demo seed:', seedErr);
          }
        }

        setTasks(tasksData);
        setClients(clientsData);
        setUsers(profilesData);
        setDeadlines(deadlinesData);
        setTemplates(templatesData);
        setMeetings(meetingsData);
        setNotes(notesData);
        setPasswords(passwordsData);
        setDocs(docsData);
        setFolders(foldersData);
        setEmails(emailsData);
        setTaskTypes(taskTypesData);
        setWorkflows(workflowsData);
        setNotifications(notificationsData);
      } catch (err) {
        console.error('Error fetching app data:', err);
      }
    };

    initializeAuth();
  }, []);

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
    dataApi.insert('notifications', newNotif).catch((error) => console.error('Error creating notification:', error));
  };

  // Persistence wrappers
  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await dataApi.update('tasks', id, updates);
  };

  const addTask = async (task: Task) => {
    setTasks(prev => [task, ...prev]);
    await dataApi.insert('tasks', task);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await dataApi.remove('tasks', id);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await dataApi.update('clients', id, updates);
  };

  const addClient = async (client: Client) => {
    setClients(prev => [client, ...prev]);
    await dataApi.insert('clients', client);
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await dataApi.remove('clients', id);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    await dataApi.update('notes', id, updates);
  };

  const addNote = async (note: Note) => {
    const noteWithProfile = { ...note, profile_id: currentUser?.id };
    setNotes(prev => [noteWithProfile, ...prev]);
    await dataApi.insert('notes', noteWithProfile);
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await dataApi.remove('notes', id);
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    await dataApi.update('meetings', id, updates);
  };

  const addMeeting = async (meeting: Meeting) => {
    const meetingWithProfile = { ...meeting, profile_id: currentUser?.id };
    setMeetings(prev => [meetingWithProfile, ...prev]);
    await dataApi.insert('meetings', meetingWithProfile);
  };

  const deleteMeeting = async (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    await dataApi.remove('meetings', id);
  };

  const updatePassword = async (id: string, updates: Partial<Password>) => {
    setPasswords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    await dataApi.update('passwords', id, updates);
  };

  const addPassword = async (password: Password) => {
    const passwordWithProfile = { ...password, profile_id: currentUser?.id };
    setPasswords(prev => [passwordWithProfile, ...prev]);
    await dataApi.insert('passwords', passwordWithProfile);
  };

  const deletePassword = async (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
    await dataApi.remove('passwords', id);
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    await dataApi.update('documents', id, updates);
  };

  const addDocument = async (doc: Document) => {
    const docWithProfile = { ...doc, profile_id: currentUser?.id };
    setDocs(prev => [docWithProfile, ...prev]);
    await dataApi.insert('documents', docWithProfile);
  };

  const deleteDocument = async (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    await dataApi.remove('documents', id);
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    await dataApi.update('folders', id, updates);
  };

  const addFolder = async (folder: Folder) => {
    const folderWithProfile = { ...folder, profile_id: currentUser?.id };
    setFolders(prev => [folderWithProfile, ...prev]);
    await dataApi.insert('folders', folderWithProfile);
  };

  const deleteFolder = async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    await dataApi.remove('folders', id);
  };

  const updateTaskType = async (id: string, updates: Partial<TaskTypeConfig>) => {
    setTaskTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await dataApi.update('task_types', id, updates);
  };

  const addTaskType = async (taskType: TaskTypeConfig) => {
    const taskTypeWithProfile = { ...taskType, profile_id: currentUser?.id };
    setTaskTypes(prev => [taskTypeWithProfile, ...prev]);
    await dataApi.insert('task_types', taskTypeWithProfile);
  };

  const deleteTaskType = async (id: string) => {
    setTaskTypes(prev => prev.filter(t => t.id !== id));
    await dataApi.remove('task_types', id);
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    await dataApi.update('workflows', id, updates);
  };

  const addWorkflow = async (workflow: Workflow) => {
    const workflowWithProfile = { ...workflow, profile_id: currentUser?.id };
    setWorkflows(prev => [workflowWithProfile, ...prev]);
    await dataApi.insert('workflows', workflowWithProfile);
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    await dataApi.remove('workflows', id);
  };

  const updateDeadline = async (id: string, updates: Partial<Deadline>) => {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    await dataApi.update('deadlines', id, updates);
  };

  const addDeadline = async (deadline: Deadline) => {
    const deadlineWithProfile = { ...deadline, profile_id: currentUser?.id };
    setDeadlines(prev => [deadlineWithProfile, ...prev]);
    await dataApi.insert('deadlines', deadlineWithProfile);
  };

  const deleteDeadline = async (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
    await dataApi.remove('deadlines', id);
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await dataApi.update('templates', id, updates);
  };

  const addTemplate = async (template: Template) => {
    const templateWithProfile = { ...template, profile_id: currentUser?.id };
    setTemplates(prev => [templateWithProfile, ...prev]);
    await dataApi.insert('templates', templateWithProfile);
  };

  const deleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    await dataApi.remove('templates', id);
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    await dataApi.update('emails', id, updates);
  };

  const addEmail = async (email: Email) => {
    const emailWithProfile = { ...email, profile_id: currentUser?.id };
    setEmails(prev => [emailWithProfile, ...prev]);
    await dataApi.insert('emails', emailWithProfile);
  };

  const deleteEmail = async (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    await dataApi.remove('emails', id);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    await dataApi.update('profiles', id, updates);
  };

  const addUser = async (user: User) => {
    setUsers(prev => [user, ...prev]);
    await dataApi.insert('profiles', user);
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    await dataApi.remove('profiles', id);
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
      notifications, setNotifications,
      sidebarCollapsed, setSidebarCollapsed,
      mobileMenuOpen, setMobileMenuOpen,
      isAuthenticated, setIsAuthenticated,
      currentUser, setCurrentUser,
      isLoading,
      notify,
      updateTask, addTask, deleteTask,
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
      updateUser, addUser, deleteUser
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
