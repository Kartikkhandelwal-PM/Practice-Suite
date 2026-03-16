import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, Client, User, Deadline, Template, Meeting, Note, Password, Document, Folder, Email, TaskTypeConfig, Workflow, AppNotification } from '../types';
import { INIT_TASKS, INIT_CLIENTS, INIT_USERS, INIT_DEADLINES, INIT_TEMPLATES, INIT_MEETINGS, INIT_NOTES, INIT_PASSWORDS, INIT_DOCS, INIT_FOLDERS, INIT_EMAILS, INIT_TASK_TYPES, INIT_WORKFLOWS } from '../data';
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
      const { data: { session } } = await supabase.auth.getSession();
      handleAuthChange(session);
    };

    const handleAuthChange = async (session: any) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        // Check if profile exists, if not create it
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile not found, create it
          const newProfile = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: 'Admin',
            designation: 'Tax Professional',
            color: '#2563eb',
            active: true,
            avatar_url: session.user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${session.user.email}&background=random`
          };
          await supabase.from('profiles').insert(newProfile);
          setCurrentUser(newProfile);
        } else if (profile) {
          setCurrentUser(profile);
        }

        // Fetch all data from Supabase
        fetchAppData();
      } else {
        setCurrentUser(null);
        // Reset to initial data or empty
        setTasks(INIT_TASKS);
        setClients(INIT_CLIENTS);
        setUsers(INIT_USERS);
      }
      setIsLoading(false);
    };

    const fetchAppData = async () => {
      try {
        const results = await Promise.all([
          supabase.from('tasks').select('*'),
          supabase.from('clients').select('*'),
          supabase.from('profiles').select('*'),
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
          supabase.from('notifications').select('*')
        ]) as any[];

        const tasksData = results[0].data;
        const clientsData = results[1].data;
        const profilesData = results[2].data;
        const deadlinesData = results[3].data;
        const templatesData = results[4].data;
        const meetingsData = results[5].data;
        const notesData = results[6].data;
        const passwordsData = results[7].data;
        const docsData = results[8].data;
        const foldersData = results[9].data;
        const emailsData = results[10].data;
        const taskTypesData = results[11].data;
        const workflowsData = results[12].data;
        const notificationsData = results[13].data;

        if (tasksData && tasksData.length > 0) setTasks(tasksData as any);
        if (clientsData && clientsData.length > 0) setClients(clientsData as any);
        if (profilesData && profilesData.length > 0) setUsers(profilesData as any);
        if (deadlinesData && deadlinesData.length > 0) setDeadlines(deadlinesData as any);
        if (templatesData && templatesData.length > 0) setTemplates(templatesData as any);
        if (meetingsData && meetingsData.length > 0) setMeetings(meetingsData as any);
        if (notesData && notesData.length > 0) setNotes(notesData as any);
        if (passwordsData && passwordsData.length > 0) setPasswords(passwordsData as any);
        if (docsData && docsData.length > 0) setDocs(docsData as any);
        if (foldersData && foldersData.length > 0) setFolders(foldersData as any);
        if (emailsData && emailsData.length > 0) setEmails(emailsData as any);
        if (taskTypesData && taskTypesData.length > 0) setTaskTypes(taskTypesData as any);
        if (workflowsData && workflowsData.length > 0) setWorkflows(workflowsData as any);
        if (notificationsData && notificationsData.length > 0) setNotifications(notificationsData as any);
      } catch (err) {
        console.error('Error fetching app data:', err);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
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
    supabase.from('notifications').insert(newNotif);
  };

  // Persistence wrappers
  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addTask = async (task: Task) => {
    setTasks(prev => [task, ...prev]);
    const { error } = await supabase.from('tasks').insert(task);
    if (error) throw error;
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const { error } = await supabase.from('clients').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addClient = async (client: Client) => {
    setClients(prev => [client, ...prev]);
    const { error } = await supabase.from('clients').insert(client);
    if (error) throw error;
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    const { error } = await supabase.from('notes').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addNote = async (note: Note) => {
    setNotes(prev => [note, ...prev]);
    const { error } = await supabase.from('notes').insert(note);
    if (error) throw error;
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    const { error } = await supabase.from('meetings').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addMeeting = async (meeting: Meeting) => {
    setMeetings(prev => [meeting, ...prev]);
    const { error } = await supabase.from('meetings').insert(meeting);
    if (error) throw error;
  };

  const deleteMeeting = async (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) throw error;
  };

  const updatePassword = async (id: string, updates: Partial<Password>) => {
    setPasswords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const { error } = await supabase.from('passwords').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addPassword = async (password: Password) => {
    setPasswords(prev => [password, ...prev]);
    const { error } = await supabase.from('passwords').insert(password);
    if (error) throw error;
  };

  const deletePassword = async (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('passwords').delete().eq('id', id);
    if (error) throw error;
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const { error } = await supabase.from('documents').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addDocument = async (doc: Document) => {
    setDocs(prev => [doc, ...prev]);
    const { error } = await supabase.from('documents').insert(doc);
    if (error) throw error;
  };

  const deleteDocument = async (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    const { error } = await supabase.from('folders').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addFolder = async (folder: Folder) => {
    setFolders(prev => [folder, ...prev]);
    const { error } = await supabase.from('folders').insert(folder);
    if (error) throw error;
  };

  const deleteFolder = async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) throw error;
  };

  const updateTaskType = async (id: string, updates: Partial<TaskTypeConfig>) => {
    setTaskTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await supabase.from('task_types').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addTaskType = async (taskType: TaskTypeConfig) => {
    setTaskTypes(prev => [taskType, ...prev]);
    const { error } = await supabase.from('task_types').insert(taskType);
    if (error) throw error;
  };

  const deleteTaskType = async (id: string) => {
    setTaskTypes(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('task_types').delete().eq('id', id);
    if (error) throw error;
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    const { error } = await supabase.from('workflows').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addWorkflow = async (workflow: Workflow) => {
    setWorkflows(prev => [workflow, ...prev]);
    const { error } = await supabase.from('workflows').insert(workflow);
    if (error) throw error;
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    const { error } = await supabase.from('workflows').delete().eq('id', id);
    if (error) throw error;
  };

  const updateDeadline = async (id: string, updates: Partial<Deadline>) => {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const { error } = await supabase.from('deadlines').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addDeadline = async (deadline: Deadline) => {
    setDeadlines(prev => [deadline, ...prev]);
    const { error } = await supabase.from('deadlines').insert(deadline);
    if (error) throw error;
  };

  const deleteDeadline = async (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
    const { error } = await supabase.from('deadlines').delete().eq('id', id);
    if (error) throw error;
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await supabase.from('templates').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addTemplate = async (template: Template) => {
    setTemplates(prev => [template, ...prev]);
    const { error } = await supabase.from('templates').insert(template);
    if (error) throw error;
  };

  const deleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) throw error;
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    const { error } = await supabase.from('emails').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addEmail = async (email: Email) => {
    setEmails(prev => [email, ...prev]);
    const { error } = await supabase.from('emails').insert(email);
    if (error) throw error;
  };

  const deleteEmail = async (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from('emails').delete().eq('id', id);
    if (error) throw error;
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addUser = async (user: User) => {
    setUsers(prev => [user, ...prev]);
    const { error } = await supabase.from('profiles').insert(user);
    if (error) throw error;
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
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
