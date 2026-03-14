import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, Client, User, Deadline, Template, Meeting, Note, Password, Document, Folder, Email, TaskTypeConfig, Workflow, AppNotification } from '../types';
import { INIT_TASKS, INIT_CLIENTS, INIT_USERS, INIT_DEADLINES, INIT_TEMPLATES, INIT_MEETINGS, INIT_NOTES, INIT_PASSWORDS, INIT_DOCS, INIT_FOLDERS, INIT_EMAILS, INIT_TASK_TYPES, INIT_WORKFLOWS } from '../data';
import { supabase } from '../lib/supabase';
import { genUUID } from '../utils';

const fromProfile = (row: any): User => ({
  id: row.id,
  name: row.name ?? '',
  email: row.email ?? '',
  role: row.role ?? 'Staff',
  designation: row.designation ?? '',
  color: row.color ?? '#2563eb',
  active: row.active ?? true,
  avatar: row.avatar ?? row.avatar_url ?? ''
});

const toProfile = (user: Partial<User>) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  designation: user.designation,
  color: user.color,
  active: user.active,
  avatar_url: user.avatar
});

const fromDeadline = (row: any): Deadline => ({
  id: row.id,
  title: row.title ?? '',
  desc: row.description ?? '',
  category: row.category ?? '',
  dueDate: row.due_date ?? '',
  clients: row.clients_count ?? 0,
  form: row.form ?? '',
  section: row.section ?? ''
});

const toDeadline = (deadline: Partial<Deadline>) => ({
  id: deadline.id,
  title: deadline.title,
  description: deadline.desc,
  category: deadline.category,
  due_date: deadline.dueDate,
  clients_count: deadline.clients,
  form: deadline.form,
  section: deadline.section
});

const fromTemplate = (row: any): Template => ({
  id: row.id,
  name: row.name ?? '',
  category: row.category ?? '',
  recurring: row.recurring ?? '',
  estHours: row.est_hours ?? '',
  description: row.description ?? '',
  color: row.color ?? '',
  subtasks: row.subtasks ?? []
});

const toTemplate = (template: Partial<Template>) => ({
  id: template.id,
  name: template.name,
  category: template.category,
  recurring: template.recurring,
  est_hours: template.estHours,
  description: template.description,
  color: template.color,
  subtasks: template.subtasks
});

const fromTask = (row: any): Task => ({
  id: row.id,
  title: row.title ?? '',
  clientId: row.client_id ?? '',
  type: row.type ?? '',
  issueType: row.issue_type ?? '',
  status: row.status ?? 'To Do',
  priority: row.priority ?? 'Medium',
  assigneeId: row.assignee_id ?? '',
  reviewerId: row.reviewer_id ?? '',
  reporterId: row.reporter_id ?? '',
  dueDate: row.due_date ?? '',
  createdAt: row.created_at ?? '',
  recurring: row.recurring ?? '',
  description: row.description ?? '',
  tags: row.tags ?? [],
  parentId: row.parent_id ?? undefined,
  subtasks: row.subtasks ?? [],
  comments: row.comments ?? [],
  attachments: row.attachments ?? [],
  activity: row.activity ?? [],
  linkedTasks: row.linked_tasks ?? []
});

const toTask = (task: Partial<Task>) => ({
  id: task.id,
  title: task.title,
  client_id: task.clientId || null,
  type: task.type,
  issue_type: task.issueType,
  status: task.status,
  priority: task.priority,
  assignee_id: task.assigneeId || null,
  reviewer_id: task.reviewerId || null,
  reporter_id: task.reporterId || null,
  due_date: task.dueDate || null,
  recurring: task.recurring,
  description: task.description,
  tags: task.tags,
  parent_id: task.parentId || null,
  subtasks: task.subtasks,
  comments: task.comments,
  attachments: task.attachments,
  activity: task.activity
});

const fromEmail = (row: any): Email => ({
  id: row.id,
  from: row.from ?? row.from_name ?? '',
  fromEmail: row.from_email ?? '',
  to: row.to ?? row.to_email ?? '',
  cc: row.cc ?? '',
  bcc: row.bcc ?? '',
  clientId: row.client_id ?? '',
  subject: row.subject ?? '',
  preview: row.preview ?? '',
  body: row.body ?? '',
  date: row.date ?? '',
  time: row.time ?? '',
  read: row.read ?? false,
  starred: row.starred ?? false,
  snoozed: row.snoozed ?? false,
  labels: row.labels ?? [],
  taskLinked: row.task_linked ?? null,
  attachments: row.attachments ?? [],
  folder: row.folder ?? 'inbox'
});

const toEmail = (email: Partial<Email>) => ({
  id: email.id,
  from_name: email.from,
  from_email: email.fromEmail,
  to_email: email.to,
  cc: email.cc,
  bcc: email.bcc,
  client_id: email.clientId || null,
  subject: email.subject,
  preview: email.preview,
  body: email.body,
  date: email.date || null,
  time: email.time,
  read: email.read,
  starred: email.starred,
  snoozed: email.snoozed,
  labels: email.labels,
  task_linked: email.taskLinked,
  attachments: email.attachments,
  folder: email.folder
});

const fromNote = (row: any): Note => ({
  id: row.id,
  title: row.title ?? '',
  content: row.content ?? '',
  color: row.color ?? '',
  pinned: row.pinned ?? false,
  createdAt: row.created_at ?? '',
  updatedAt: row.updated_at ?? ''
});

const toNote = (note: Partial<Note>, currentUserId?: string | null) => ({
  id: note.id,
  user_id: currentUserId || null,
  title: note.title,
  content: note.content,
  color: note.color,
  pinned: note.pinned,
  created_at: note.createdAt,
  updated_at: note.updatedAt
});

const fromPassword = (row: any): Password => ({
  id: row.id,
  clientId: row.client_id ?? '',
  portal: row.portal ?? '',
  url: row.url ?? '',
  username: row.username ?? '',
  password: row.password ?? '',
  notes: row.notes ?? '',
  category: row.category ?? '',
  strength: row.strength ?? 0,
  lastUpdated: row.last_updated ?? ''
});

const toPassword = (password: Partial<Password>) => ({
  id: password.id,
  client_id: password.clientId || null,
  portal: password.portal,
  url: password.url,
  username: password.username,
  password: password.password,
  notes: password.notes,
  category: password.category,
  strength: password.strength,
  last_updated: password.lastUpdated || null
});

const fromDocument = (row: any): Document => ({
  id: row.id,
  folderId: row.folder_id ?? '',
  name: row.name ?? '',
  type: row.type ?? '',
  size: row.size ?? '',
  clientId: row.client_id ?? null,
  tags: row.tags ?? [],
  uploadedBy: row.uploaded_by ?? '',
  uploadedAt: row.uploaded_at ?? '',
  description: row.description ?? '',
  data: row.data ?? ''
});

const toDocument = (doc: Partial<Document>) => ({
  id: doc.id,
  folder_id: doc.folderId || null,
  name: doc.name,
  type: doc.type,
  size: doc.size,
  client_id: doc.clientId,
  tags: doc.tags,
  uploaded_by: doc.uploadedBy || null,
  uploaded_at: doc.uploadedAt || null,
  description: doc.description,
  data: doc.data
});

const fromFolder = (row: any): Folder => ({
  id: row.id,
  name: row.name ?? '',
  parentId: row.parent_id ?? null,
  clientId: row.client_id ?? null,
  icon: row.icon ?? 'folder'
});

const toFolder = (folder: Partial<Folder>) => ({
  id: folder.id,
  name: folder.name,
  parent_id: folder.parentId,
  client_id: folder.clientId,
  icon: folder.icon
});

const fromMeeting = (row: any): Meeting => ({
  id: row.id,
  title: row.title ?? '',
  clientId: row.client_id ?? '',
  type: row.type ?? '',
  platform: row.platform ?? '',
  meetLink: row.meet_link ?? '',
  date: row.date ?? '',
  time: row.time ?? '',
  duration: row.duration ?? 0,
  attendees: row.attendees ?? [],
  description: row.description ?? '',
  notes: row.notes ?? '',
  status: row.status ?? 'scheduled'
});

const toMeeting = (meeting: Partial<Meeting>) => ({
  id: meeting.id,
  title: meeting.title,
  client_id: meeting.clientId || null,
  type: meeting.type,
  platform: meeting.platform,
  meet_link: meeting.meetLink,
  date: meeting.date || null,
  time: meeting.time,
  duration: meeting.duration,
  attendees: meeting.attendees,
  description: meeting.description,
  notes: meeting.notes,
  status: meeting.status
});

const fromTaskType = (row: any): TaskTypeConfig => ({
  id: row.id,
  name: row.name ?? '',
  icon: row.icon ?? '',
  color: row.color ?? '',
  description: row.description ?? '',
  workflowId: row.workflow_id ?? undefined
});

const toTaskType = (taskType: Partial<TaskTypeConfig>) => ({
  id: taskType.id,
  name: taskType.name,
  icon: taskType.icon,
  color: taskType.color,
  description: taskType.description,
  workflow_id: taskType.workflowId || null
});

const fromNotification = (row: any): AppNotification => ({
  id: row.id,
  userId: row.user_id ?? '',
  text: row.text ?? '',
  at: row.at ?? '',
  read: row.read ?? false,
  type: row.type ?? 'task',
  link: row.link ?? ''
});

const toNotification = (notification: Partial<AppNotification>) => ({
  id: notification.id,
  user_id: notification.userId || null,
  text: notification.text,
  at: notification.at,
  read: notification.read,
  type: notification.type,
  link: notification.link
});

const deserializeRows = {
  tasks: (rows: any[] | null) => (rows ?? []).map(fromTask),
  clients: (rows: any[] | null) => rows ?? [],
  profiles: (rows: any[] | null) => (rows ?? []).map(fromProfile),
  deadlines: (rows: any[] | null) => (rows ?? []).map(fromDeadline),
  templates: (rows: any[] | null) => (rows ?? []).map(fromTemplate),
  meetings: (rows: any[] | null) => (rows ?? []).map(fromMeeting),
  notes: (rows: any[] | null) => (rows ?? []).map(fromNote),
  passwords: (rows: any[] | null) => (rows ?? []).map(fromPassword),
  documents: (rows: any[] | null) => (rows ?? []).map(fromDocument),
  folders: (rows: any[] | null) => (rows ?? []).map(fromFolder),
  emails: (rows: any[] | null) => (rows ?? []).map(fromEmail),
  task_types: (rows: any[] | null) => (rows ?? []).map(fromTaskType),
  workflows: (rows: any[] | null) => rows ?? [],
  notifications: (rows: any[] | null) => (rows ?? []).map(fromNotification),
};

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
  isDemoMode: boolean;
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const demoModeEnabled = localStorage.getItem('kdk-demo-mode') === 'true';
      if (demoModeEnabled) {
        setIsDemoMode(true);
        setIsAuthenticated(true);
        setCurrentUser(INIT_USERS[0] || null);
        setTasks(INIT_TASKS);
        setClients(INIT_CLIENTS);
        setUsers(INIT_USERS);
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
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      handleAuthChange(session);
    };

    const handleAuthChange = async (session: any) => {
      if (!session) {
        setIsDemoMode(false);
      }
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
          setCurrentUser(fromProfile(profile));
        }

        // Fetch all data from Supabase
        fetchAppData();
      } else {
        setCurrentUser(null);
        // Use demo data only when signed out.
        setTasks(INIT_TASKS);
        setClients(INIT_CLIENTS);
        setUsers(INIT_USERS);
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
      }
      setIsLoading(false);
    };

    const fetchAppData = async () => {
      try {
        const [
          { data: tasksData },
          { data: clientsData },
          { data: profilesData },
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
          { data: notificationsData }
        ] = await Promise.all([
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
        ]);

        setTasks(deserializeRows.tasks(tasksData));
        setClients(deserializeRows.clients(clientsData));
        setUsers(deserializeRows.profiles(profilesData));
        setDeadlines(deserializeRows.deadlines(deadlinesData));
        setTemplates(deserializeRows.templates(templatesData));
        setMeetings(deserializeRows.meetings(meetingsData));
        setNotes(deserializeRows.notes(notesData));
        setPasswords(deserializeRows.passwords(passwordsData));
        setDocs(deserializeRows.documents(docsData));
        setFolders(deserializeRows.folders(foldersData));
        setEmails(deserializeRows.emails(emailsData));
        setTaskTypes(deserializeRows.task_types(taskTypesData));
        setWorkflows(deserializeRows.workflows(workflowsData));
        setNotifications(deserializeRows.notifications(notificationsData));
      } catch (err) {
        console.error('Error fetching app data:', err);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('kdk-demo-mode') === 'true') {
        return;
      }
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
    if (isDemoMode) return;
    supabase.from('notifications').insert(toNotification(newNotif)).then();
  };

  // Persistence wrappers
  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (isDemoMode) return;
    const { error } = await supabase.from('tasks').update(toTask(updates)).eq('id', id);
    if (error) throw error;
  };

  const addTask = async (task: Task) => {
    setTasks(prev => [task, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('tasks').insert(toTask(task));
    if (error) throw error;
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (isDemoMode) return;
    const { error } = await supabase.from('clients').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addClient = async (client: Client) => {
    setClients(prev => [client, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('clients').insert(client);
    if (error) throw error;
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    if (isDemoMode) return;
    const { error } = await supabase.from('notes').update(toNote(updates, currentUser?.id)).eq('id', id);
    if (error) throw error;
  };

  const addNote = async (note: Note) => {
    setNotes(prev => [note, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('notes').insert(toNote(note, currentUser?.id));
    if (error) throw error;
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    if (isDemoMode) return;
    const { error } = await supabase.from('meetings').update(toMeeting(updates)).eq('id', id);
    if (error) throw error;
  };

  const addMeeting = async (meeting: Meeting) => {
    setMeetings(prev => [meeting, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('meetings').insert(toMeeting(meeting));
    if (error) throw error;
  };

  const deleteMeeting = async (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) throw error;
  };

  const updatePassword = async (id: string, updates: Partial<Password>) => {
    setPasswords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (isDemoMode) return;
    const { error } = await supabase.from('passwords').update(toPassword(updates)).eq('id', id);
    if (error) throw error;
  };

  const addPassword = async (password: Password) => {
    setPasswords(prev => [password, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('passwords').insert(toPassword(password));
    if (error) throw error;
  };

  const deletePassword = async (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('passwords').delete().eq('id', id);
    if (error) throw error;
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    if (isDemoMode) return;
    const { error } = await supabase.from('documents').update(toDocument(updates)).eq('id', id);
    if (error) throw error;
  };

  const addDocument = async (doc: Document) => {
    setDocs(prev => [doc, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('documents').insert(toDocument(doc));
    if (error) throw error;
  };

  const deleteDocument = async (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    if (isDemoMode) return;
    const { error } = await supabase.from('folders').update(toFolder(updates)).eq('id', id);
    if (error) throw error;
  };

  const addFolder = async (folder: Folder) => {
    setFolders(prev => [folder, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('folders').insert(toFolder(folder));
    if (error) throw error;
  };

  const deleteFolder = async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) throw error;
  };

  const updateTaskType = async (id: string, updates: Partial<TaskTypeConfig>) => {
    setTaskTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (isDemoMode) return;
    const { error } = await supabase.from('task_types').update(toTaskType(updates)).eq('id', id);
    if (error) throw error;
  };

  const addTaskType = async (taskType: TaskTypeConfig) => {
    setTaskTypes(prev => [taskType, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('task_types').insert(toTaskType(taskType));
    if (error) throw error;
  };

  const deleteTaskType = async (id: string) => {
    setTaskTypes(prev => prev.filter(t => t.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('task_types').delete().eq('id', id);
    if (error) throw error;
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    if (isDemoMode) return;
    const { error } = await supabase.from('workflows').update(updates).eq('id', id);
    if (error) throw error;
  };

  const addWorkflow = async (workflow: Workflow) => {
    setWorkflows(prev => [workflow, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('workflows').insert(workflow);
    if (error) throw error;
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('workflows').delete().eq('id', id);
    if (error) throw error;
  };

  const updateDeadline = async (id: string, updates: Partial<Deadline>) => {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    if (isDemoMode) return;
    const { error } = await supabase.from('deadlines').update(toDeadline(updates)).eq('id', id);
    if (error) throw error;
  };

  const addDeadline = async (deadline: Deadline) => {
    setDeadlines(prev => [deadline, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('deadlines').insert(toDeadline(deadline));
    if (error) throw error;
  };

  const deleteDeadline = async (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('deadlines').delete().eq('id', id);
    if (error) throw error;
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (isDemoMode) return;
    const { error } = await supabase.from('templates').update(toTemplate(updates)).eq('id', id);
    if (error) throw error;
  };

  const addTemplate = async (template: Template) => {
    setTemplates(prev => [template, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('templates').insert(toTemplate(template));
    if (error) throw error;
  };

  const deleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) throw error;
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (isDemoMode) return;
    const { error } = await supabase.from('emails').update(toEmail(updates)).eq('id', id);
    if (error) throw error;
  };

  const addEmail = async (email: Email) => {
    setEmails(prev => [email, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('emails').insert(toEmail(email));
    if (error) throw error;
  };

  const deleteEmail = async (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    if (isDemoMode) return;
    const { error } = await supabase.from('emails').delete().eq('id', id);
    if (error) throw error;
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (isDemoMode) return;
    const { error } = await supabase.from('profiles').update(toProfile(updates)).eq('id', id);
    if (error) throw error;
  };

  const addUser = async (user: User) => {
    setUsers(prev => [user, ...prev]);
    if (isDemoMode) return;
    const { error } = await supabase.from('profiles').insert(toProfile(user));
    if (error) throw error;
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isDemoMode) return;
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
      isDemoMode,
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
