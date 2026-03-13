import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, Client, User, Deadline, Template, Meeting, Note, Password, Document, Folder, Email, TaskTypeConfig, Workflow, AppNotification } from '../types';
import { INIT_TASKS, INIT_CLIENTS, INIT_USERS, INIT_DEADLINES, INIT_TEMPLATES, INIT_MEETINGS, INIT_NOTES, INIT_PASSWORDS, INIT_DOCS, INIT_FOLDERS, INIT_EMAILS, INIT_TASK_TYPES, INIT_WORKFLOWS } from '../data';

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
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  notify: (userId: string, text: string, type: AppNotification['type'], link?: string) => void;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(INIT_USERS[0]);

  const notify = (userId: string, text: string, type: AppNotification['type'], link?: string) => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      text,
      at: new Date().toISOString(),
      read: false,
      type,
      link
    };
    setNotifications(prev => [newNotif, ...prev]);
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
      isAuthenticated, setIsAuthenticated,
      currentUser, setCurrentUser,
      notify
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
