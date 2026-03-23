import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, Client, User, Deadline, Template, Meeting, Note, Password, Document, Folder, Email, TaskTypeConfig, Workflow, AppNotification, Permission, Role } from '../types';
import { INIT_TASKS, INIT_CLIENTS, INIT_DEADLINES, INIT_TEMPLATES, INIT_MEETINGS, INIT_NOTES, INIT_PASSWORDS, INIT_DOCS, INIT_FOLDERS, INIT_EMAILS, INIT_TASK_TYPES, INIT_WORKFLOWS, INIT_PERMISSIONS, INIT_ROLES, INIT_USERS } from '../data';
import { supabase } from '../lib/supabase';
import { genUUID } from '../utils';
import { useToast } from './ToastContext';

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
  supabaseConfigured: boolean;
  setSupabaseConfigured: React.Dispatch<React.SetStateAction<boolean>>;
  supabaseStatus: {
    configured: boolean;
    connected: boolean;
    error?: any;
    tableStatus?: Record<string, boolean>;
  };
  setSupabaseStatus: React.Dispatch<React.SetStateAction<{
    configured: boolean;
    connected: boolean;
    error?: any;
    tableStatus?: Record<string, boolean>;
  }>>;
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
  seedSampleData: (user?: User, force?: boolean) => Promise<void>;
}

const AppCtx = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
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
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    error?: any;
    tableStatus?: Record<string, boolean>;
  }>({ configured: false, connected: false, tableStatus: {} });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check Supabase health and listen for auth changes
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setSupabaseConfigured(data.supabaseConfigured);
        setSupabaseStatus(prev => ({
          ...prev,
          configured: data.supabaseConfigured,
          connected: data.supabaseConfigured && data.supabaseConnection === 'SUCCESS',
          error: data.supabaseError || null,
          tableStatus: data.tableStatus || {}
        }));
      } catch (e) {
        console.error('[Health] Failed to check Supabase health:', e);
        setSupabaseConfigured(false);
      }
    };

    checkHealth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('[Auth] State change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session) {
          await login(session);
        } else {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear all state on sign out
        setIsAuthenticated(false);
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
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[Auth] Sign out error:', e);
      // Fallback if sign out fails
      localStorage.removeItem('sb-session');
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  const seedSampleData = async (user?: User, force: boolean = false) => {
    const activeUser = user || currentUser;
    if (!activeUser || !activeUser.tenantId) {
      console.warn('[Seeding] Cannot seed data: No active user or tenant ID');
      return;
    }
    
    const tenantId = activeUser.tenantId;
    const seedKey = `seed-in-progress-${tenantId}`;
    if (!force && localStorage.getItem(seedKey)) {
      console.log('[Seeding] Seeding already in progress for this tenant.');
      return;
    }
    
    localStorage.setItem(seedKey, 'true');
    console.log('[Seeding] Starting data seeding for tenant:', tenantId);
    setIsLoading(true);
    
    try {
      // 0. Seed Roles and Permissions
      console.log('[Seeding] Step 0: Roles and Permissions');
      toast('Setting up roles and permissions...', 'default');
      const roleIdMap: Record<string, string> = {};
      const { data: existingRoles, error: rolesError } = await supabase.from('roles').select('id, name').eq('tenant_id', tenantId);
      
      if (rolesError) console.error('[Seeding] Error checking roles:', rolesError);

      if (force || !existingRoles || existingRoles.length === 0) {
        const rolesToInsert = INIT_ROLES.map(r => {
          const newId = genUUID();
          roleIdMap[r.id] = newId;
          return { 
            id: newId, 
            tenant_id: tenantId,
            name: r.name,
            description: r.description,
            permissions: r.permissions,
            is_system: r.isSystem
          };
        });
        
        if (rolesToInsert.length > 0) {
          const { error: rError } = await supabase.from('roles').insert(rolesToInsert);
          if (rError) {
            console.error('[Seeding] Roles error:', rError);
            // If roles failed, we can't map them correctly
            return; 
          }
        }
      } else {
        existingRoles.forEach(er => {
          const match = INIT_ROLES.find(ir => ir.name === er.name);
          if (match) roleIdMap[match.id] = er.id;
        });
      }

      // Update active user's role to Admin if not already set
      const adminRoleId = roleIdMap['r1'];
      if (adminRoleId) {
        const { error: upError } = await supabase.from('user_profiles').update({ role_id: adminRoleId }).eq('id', activeUser.id);
        if (upError) console.error('[Seeding] Error updating active user role:', upError);
      }

      const { data: existingPerms } = await supabase.from('permissions').select('id').eq('tenant_id', tenantId);
      if (!existingPerms || existingPerms.length === 0) {
        const adminRoleId = roleIdMap['r1'];
        if (adminRoleId) {
          const { error: pError } = await supabase.from('permissions').insert(INIT_PERMISSIONS.map(p => ({ 
            ...p, 
            tenant_id: tenantId,
            role_id: adminRoleId
          })));
          if (pError) console.error('[Seeding] Permissions error:', pError);
        }
      }

      // 1. Seed Workflows and Task Types
      console.log('[Seeding] Step 1: Workflows and Task Types');
      toast('Setting up workflows and task types...', 'default');
      const { data: existingWorkflows } = await supabase.from('workflows').select('id, name').eq('tenant_id', tenantId);
      
      const workflowIdMap: Record<string, string> = {};
      
      if (force || !existingWorkflows || existingWorkflows.length === 0) {
        const workflowsToInsert = INIT_WORKFLOWS.map(w => {
          const newId = genUUID();
          workflowIdMap[w.id] = newId;
          return { 
            id: newId, 
            tenant_id: tenantId,
            name: w.name,
            description: w.description,
            statuses: w.statuses,
            transitions: w.transitions
          };
        });
        const { error: wError } = await supabase.from('workflows').insert(workflowsToInsert);
        if (wError) console.error('[Seeding] Workflow error:', wError);

        const taskTypesToInsert = INIT_TASK_TYPES.map(tt => {
          const newId = genUUID();
          return { 
            id: newId,
            tenant_id: tenantId,
            name: tt.name,
            category: tt.category || 'GST',
            icon: tt.icon,
            color: tt.color,
            default_workflow_id: workflowIdMap[tt.workflowId] || null
          };
        });
        const { error: ttError } = await supabase.from('task_types').insert(taskTypesToInsert);
        if (ttError) console.error('[Seeding] Task type error:', ttError);
      } else {
        existingWorkflows.forEach(ew => {
          const match = INIT_WORKFLOWS.find(iw => iw.name === ew.name);
          if (match) workflowIdMap[match.id] = ew.id;
        });
      }

      // 2. Seed User Profiles (for team members)
      console.log('[Seeding] Step 2: User Profiles');
      toast('Setting up team profiles...', 'default');
      const tenantPrefix = tenantId.substring(0, 4);
      const { data: existingProfiles } = await supabase.from('user_profiles').select('id').eq('tenant_id', tenantId);
      
      if (force || !existingProfiles || existingProfiles.length <= 1) { 
        const profilesToInsert = INIT_USERS
          .filter(u => u.id !== activeUser.id && u.email !== activeUser.email)
          .map(u => ({
            id: genUUID(),
            tenant_id: tenantId,
            full_name: u.name,
            email: u.email.replace('@', `+${tenantPrefix}@`),
            role_id: roleIdMap[u.roleId || (u.role === 'Admin' ? 'r1' : (u.role === 'Manager' ? 'r2' : 'r3'))] || null,
            active: true,
            designation: u.designation,
            color: u.color
          }));
        
        if (profilesToInsert.length > 0) {
          const { error: pError } = await supabase.from('user_profiles').insert(profilesToInsert);
          if (pError) console.error('[Seeding] User profiles error:', pError);
        }
      }

      // 3. Seed Clients
      console.log('[Seeding] Step 3: Clients');
      toast('Setting up sample clients...', 'default');
      const clientIdMap: Record<string, string> = {};
      const { data: existingClients } = await supabase.from('clients').select('id, pan').eq('tenant_id', tenantId);
      
      if (force || !existingClients || existingClients.length === 0) {
        const clientsToInsert = INIT_CLIENTS.map(c => {
          const newId = genUUID();
          clientIdMap[c.id] = newId;
          return { 
            id: newId, 
            tenant_id: tenantId,
            name: c.name,
            type: c.type || 'Company',
            category: c.category,
            pan: c.pan,
            gstin: c.gstin,
            email: c.email,
            phone: c.phone,
            address: c.address,
            manager: activeUser.id,
            services: c.services,
            onboarded_at: c.onboarded,
            status: c.active ? 'Active' : 'Inactive',
            active: c.active
          };
        });
        const { error: cError } = await supabase.from('clients').insert(clientsToInsert);
        if (cError) console.error('[Seeding] Client error:', cError);
      } else {
        existingClients.forEach((ec: any) => {
          const match = INIT_CLIENTS.find(ic => ic.pan === ec.pan);
          if (match) clientIdMap[match.id] = ec.id;
        });
      }

      // 4. Seed Tasks
      console.log('[Seeding] Step 4: Tasks');
      toast('Setting up sample tasks...', 'default');
      const taskPrefix = tenantId.substring(0, 4).toUpperCase();
      const tasksToInsert = INIT_TASKS.map(t => {
        const numMatch = t.id.match(/\d+/);
        const num = numMatch ? numMatch[0] : Math.floor(Math.random() * 1000);
        const clientId = t.clientId ? (clientIdMap[t.clientId] || t.clientId) : null;
        const period = new Date().toISOString().substring(0, 7);
        const uniqueKey = `${tenantId}:${clientId || 'no-client'}:${t.type || 'task'}:${period}:${taskPrefix}-${num}`;
        
        return { 
          id: `${taskPrefix}-${num}`,
          tenant_id: tenantId,
          client_id: clientId, 
          title: t.title,
          type: t.type,
          issue_type: t.issueType || 'Task',
          priority: t.priority,
          status: t.status,
          assigned_to: activeUser.id, 
          reviewer_id: activeUser.id, 
          reporter_id: activeUser.id,
          due_date: t.dueDate, 
          period,
          unique_key: uniqueKey,
          statutory_deadline: t.statutoryDeadline, 
          parent_id: t.parentId ? `${tenantPrefix}-${t.parentId.match(/\d+/)?.[0] || '0'}` : null, 
          linked_tasks: t.linkedTasks ? t.linkedTasks.map(lt => `${tenantPrefix}-${lt.match(/\d+/)?.[0] || '0'}`) : [], 
          recurring: t.recurring,
          description: t.description,
          tags: t.tags,
          subtasks: t.subtasks || [],
          comments: t.comments || [],
          attachments: t.attachments || [],
          activity: t.activity || [],
          created_at: t.createdAt || new Date().toISOString()
        };
      });
      const { error: tasksError } = await supabase.from('tasks').upsert(tasksToInsert, { onConflict: 'id' });
      if (tasksError) console.error('[Seeding] Task error:', tasksError);

      // 5. Seed other entities
      console.log('[Seeding] Step 5: Deadlines, Notes, Passwords, etc.');
      toast('Setting up additional resources...', 'default');
      
      const { data: existingNotes } = await supabase.from('notes').select('id').eq('tenant_id', tenantId).limit(1);
      if (force || !existingNotes || existingNotes.length === 0) {
        const deadlinesToInsert = INIT_DEADLINES.map(d => ({
          id: genUUID(),
          tenant_id: tenantId,
          title: d.title,
          description: d.desc,
          due_date: d.dueDate,
          category: d.category,
          priority: d.priority || 'Medium',
          clients: d.clients,
          form: d.form,
          section: d.section
        }));
        const { error: dError } = await supabase.from('deadlines').insert(deadlinesToInsert);
        if (dError) console.error('[Seeding] Deadlines error:', dError);

        const notesToInsert = INIT_NOTES.map(n => ({
          id: genUUID(),
          tenant_id: tenantId,
          title: n.title,
          content: n.content,
          category: n.category,
          color: n.color,
          pinned: n.pinned,
          created_by: activeUser.id,
          created_at: n.createdAt,
          updated_at: n.updatedAt
        }));
        const { error: nError } = await supabase.from('notes').insert(notesToInsert);
        if (nError) console.error('[Seeding] Notes error:', nError);

        const passwordsToInsert = INIT_PASSWORDS.map(p => ({
          id: genUUID(),
          tenant_id: tenantId,
          client_id: p.clientId ? (clientIdMap[p.clientId] || p.clientId) : null,
          portal: p.portal,
          username: p.username,
          password: p.password,
          url: p.url,
          notes: p.notes,
          category: p.category,
          strength: p.strength,
          updated_at: p.lastUpdated
        }));
        const { error: pwError } = await supabase.from('passwords').insert(passwordsToInsert);
        if (pwError) console.error('[Seeding] Passwords error:', pwError);

        const templatesToInsert = INIT_TEMPLATES.map(t => ({
          id: genUUID(),
          tenant_id: tenantId,
          name: t.name,
          type: t.type || t.category,
          category: t.category,
          recurring: t.recurring,
          est_hours: t.estHours,
          description: t.description,
          color: t.color,
          subtasks: t.subtasks
        }));
        const { error: tError } = await supabase.from('templates').insert(templatesToInsert);
        if (tError) console.error('[Seeding] Templates error:', tError);

        const meetingsToInsert = INIT_MEETINGS.map(m => ({
          id: genUUID(),
          tenant_id: tenantId,
          client_id: m.clientId ? (clientIdMap[m.clientId] || m.clientId) : null,
          title: m.title,
          description: m.description,
          type: m.type,
          platform: m.platform,
          meet_link: m.meetLink,
          date: m.date,
          time: m.time,
          duration: m.duration,
          attendees: [activeUser.id],
          status: m.status || 'scheduled'
        }));
        const { error: mError } = await supabase.from('meetings').insert(meetingsToInsert);
        if (mError) console.error('[Seeding] Meetings error:', mError);

        const folderIdMap: Record<string, string> = {};
        const foldersToInsert = INIT_FOLDERS.map(f => {
          const newId = genUUID();
          folderIdMap[f.id] = newId;
          return {
            id: newId,
            tenant_id: tenantId,
            name: f.name,
            icon: f.icon || 'folder',
            parent_id: f.parentId ? (folderIdMap[f.parentId] || f.parentId) : null,
            client_id: f.clientId ? (clientIdMap[f.clientId] || f.clientId) : null
          };
        });
        const { error: fError } = await supabase.from('folders').insert(foldersToInsert);
        if (fError) console.error('[Seeding] Folders error:', fError);

        const docsToInsert = INIT_DOCS.map(d => ({
          id: genUUID(),
          tenant_id: tenantId,
          name: d.name,
          type: d.type,
          size: d.size,
          description: d.description,
          tags: d.tags,
          folder_id: d.folderId ? (folderIdMap[d.folderId] || d.folderId) : null,
          client_id: d.clientId ? (clientIdMap[d.clientId] || d.clientId) : null,
          uploaded_by: activeUser.id,
          created_at: d.uploadedAt
        }));
        const { error: docError } = await supabase.from('documents').insert(docsToInsert);
        if (docError) console.error('[Seeding] Documents error:', docError);

        const emailsToInsert = INIT_EMAILS.map(e => ({
          id: genUUID(),
          tenant_id: tenantId,
          subject: e.subject,
          body: e.body,
          preview: e.preview,
          from_name: e.from,
          from_email: e.fromEmail,
          to_email: activeUser.email,
          date: e.date,
          time: e.time,
          read: e.read,
          client_id: e.clientId ? (clientIdMap[e.clientId] || e.clientId) : null,
          task_linked: e.taskLinked,
          attachments: e.attachments
        }));
        const { error: eError } = await supabase.from('emails').insert(emailsToInsert);
        if (eError) console.error('[Seeding] Emails error:', eError);
      }

      console.log('[Seeding] Seeding complete. Fetching updated data...');
      localStorage.setItem(`seed-success-${tenantId}`, 'true');
      
      // Instead of calling login again, we just fetch the data for this tenant
      const [
        tasksRes, clientsRes, deadlinesRes, templatesRes, meetingsRes, 
        notesRes, passwordsRes, docsRes, foldersRes, emailsRes, 
        taskTypesRes, workflowsRes, rolesRes, permissionsRes, 
        userProfilesRes, notificationsRes
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('tenant_id', tenantId),
        supabase.from('clients').select('*').eq('tenant_id', tenantId),
        supabase.from('deadlines').select('*').eq('tenant_id', tenantId),
        supabase.from('templates').select('*').eq('tenant_id', tenantId),
        supabase.from('meetings').select('*').eq('tenant_id', tenantId),
        supabase.from('notes').select('*').eq('tenant_id', tenantId),
        supabase.from('passwords').select('*').eq('tenant_id', tenantId),
        supabase.from('documents').select('*').eq('tenant_id', tenantId),
        supabase.from('folders').select('*').eq('tenant_id', tenantId),
        supabase.from('emails').select('*').eq('tenant_id', tenantId),
        supabase.from('task_types').select('*').eq('tenant_id', tenantId),
        supabase.from('workflows').select('*').eq('tenant_id', tenantId),
        supabase.from('roles').select('*').or(`tenant_id.eq.${tenantId},is_system.eq.true`),
        supabase.from('permissions').select('*'),
        supabase.from('user_profiles').select('*').eq('tenant_id', tenantId),
        supabase.from('notifications').select('*').eq('tenant_id', tenantId)
      ]);

      // Map and set data (similar to login logic)
      if (tasksRes.data) setTasks(tasksRes.data.map(t => ({ ...t, clientId: t.client_id, assigneeId: t.assigned_to, dueDate: t.due_date, createdAt: t.created_at })));
      if (clientsRes.data) setClients(clientsRes.data.map(c => ({ ...c, onboarded: c.onboarded_at })));
      if (deadlinesRes.data) setDeadlines(deadlinesRes.data.map(d => ({ ...d, dueDate: d.due_date, desc: d.description })));
      if (templatesRes.data) setTemplates(templatesRes.data.map(t => ({ ...t, estHours: t.est_hours })));
      if (meetingsRes.data) setMeetings(meetingsRes.data.map(m => ({ ...m, clientId: m.client_id, meetLink: m.meet_link })));
      if (notesRes.data) setNotes(notesRes.data);
      if (passwordsRes.data) setPasswords(passwordsRes.data);
      if (docsRes.data) setDocs(docsRes.data);
      if (foldersRes.data) setFolders(foldersRes.data);
      if (emailsRes.data) setEmails(emailsRes.data);
      if (rolesRes.data) setRoles(rolesRes.data);
      if (permissionsRes.data) setPermissions(permissionsRes.data);
      if (userProfilesRes.data) {
        setUsers(userProfilesRes.data.map((u: any) => ({
          id: u.id,
          tenantId: u.tenant_id,
          name: u.full_name || 'Unknown',
          email: u.email || '',
          role: Array.isArray(rolesRes.data) ? (rolesRes.data.find(r => r.id === u.role_id)?.name || 'Staff') : 'Staff',
          roleId: u.role_id,
          designation: u.designation || 'Staff',
          color: u.color || '#2563eb',
          active: u.active !== false,
          avatarUrl: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=0D8ABC&color=fff`,
          dashboardImageUrl: u.dashboard_image_url
        })));
      }
      if (notificationsRes.data) setNotifications(notificationsRes.data);
      if (workflowsRes.data) setWorkflows(workflowsRes.data);
      if (taskTypesRes.data) setTaskTypes(taskTypesRes.data.map((tt: any) => ({ ...tt, workflowId: tt.default_workflow_id })));
    } catch (error: any) {
      console.error('[Seeding] Critical error during data seeding:', error);
      if (error.isConfigError) {
        setSupabaseConfigured(false);
      }
    } finally {
      localStorage.removeItem(seedKey);
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

    // Prevent multiple concurrent login calls
    if (isLoading && isAuthenticated) {
      console.log('[Login] Already authenticated and loading, skipping redundant call');
      return;
    }

    setIsLoading(true);
    localStorage.setItem('sb-session', JSON.stringify(session));
    const user = session.user;
    
    // Set basic user info
    const userObj: User = {
      id: user.id,
      tenantId: user.id, // Default to user ID as tenant ID
      name: user.user_metadata?.full_name || 'User',
      email: user.email || '',
      role: 'Admin',
      designation: 'Tax Professional',
      color: '#2563eb',
      active: true,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'User')}&background=0D8ABC&color=fff`
    };
    
    // Fetch data from backend
    try {
      console.log('[Login] Starting data fetch for user:', user.email, 'Tenant ID:', userObj.tenantId);
      
      // Get user profile
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[Login] Error fetching profile:', profileError);
      }

      if (!profile) {
        console.log('[Login] No profile found. Creating new user profile...');
        // Check if the default role exists to avoid foreign key violation
        const { data: defaultRole } = await supabase.from('roles').select('id').eq('id', '00000000-0000-0000-0000-000000000001').maybeSingle();
        
        const { data: newProfile, error: insertError } = await supabase.from('user_profiles').insert({
          id: user.id,
          full_name: userObj.name,
          email: user.email,
          active: true,
          role_id: defaultRole ? '00000000-0000-0000-0000-000000000001' : null,
          tenant_id: user.id // Use user ID as tenant ID for the owner
        }).select().single();
        
        if (insertError) {
          console.error('[Login] Error creating profile:', insertError);
        } else {
          console.log('[Login] Profile created successfully:', newProfile);
          profile = newProfile;
        }
      } else {
        console.log('[Login] Profile found:', profile);
      }

      if (profile) {
        userObj.tenantId = profile.tenant_id;
        userObj.name = profile.full_name || userObj.name;
        userObj.designation = profile.designation || userObj.designation;
        userObj.avatarUrl = profile.avatar_url || userObj.avatarUrl;
        userObj.dashboardImageUrl = profile.dashboard_image_url;
        userObj.roleId = profile.role_id;
      }

      console.log('[Login] Fetching all data tables for tenant:', userObj.tenantId);
      
      // Fetch data tables sequentially to avoid potential proxy rate limits or 403 errors
      const [
        tasksRes, clientsRes, deadlinesRes, templatesRes, meetingsRes, 
        notesRes, passwordsRes, docsRes, foldersRes, emailsRes, 
        taskTypesRes, workflowsRes, rolesRes, permissionsRes, 
        userProfilesRes, notificationsRes
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('clients').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('deadlines').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('templates').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('meetings').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('notes').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('passwords').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('documents').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('folders').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('emails').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('task_types').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('workflows').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('roles').select('*').or(`tenant_id.eq.${userObj.tenantId},is_system.eq.true`),
        supabase.from('permissions').select('*'),
        supabase.from('user_profiles').select('*').eq('tenant_id', userObj.tenantId),
        supabase.from('notifications').select('*').eq('tenant_id', userObj.tenantId)
      ]);

      const tasksData = tasksRes.data;
      const tasksError = tasksRes.error;
      
      const clientsData = clientsRes.data;
      const clientsError = clientsRes.error;
      
      const deadlinesData = deadlinesRes.data;
      const deadlinesError = deadlinesRes.error;
      
      const templatesData = templatesRes.data;
      const templatesError = templatesRes.error;
      
      const meetingsData = meetingsRes.data;
      const meetingsError = meetingsRes.error;
      
      const notesData = notesRes.data;
      const notesError = notesRes.error;
      
      const passwordsData = passwordsRes.data;
      const passwordsError = passwordsRes.error;
      
      const docsData = docsRes.data;
      const docsError = docsRes.error;
      
      const foldersData = foldersRes.data;
      const foldersError = foldersRes.error;
      
      const emailsData = emailsRes.data;
      const emailsError = emailsRes.error;
      
      const taskTypesData = taskTypesRes.data;
      const taskTypesError = taskTypesRes.error;
      
      const workflowsData = workflowsRes.data;
      const workflowsError = workflowsRes.error;
      
      const rolesData = rolesRes.data;
      const rolesError = rolesRes.error;
      
      const permissionsData = permissionsRes.data;
      const permissionsError = permissionsRes.error;
      
      const userProfilesData = userProfilesRes.data;
      const userProfilesError = userProfilesRes.error;
      
      const notificationsData = notificationsRes.data;
      const notificationsError = notificationsRes.error;

      // Report errors to user
      const errors = [
        tasksError, clientsError, deadlinesError, templatesError, 
        meetingsError, notesError, passwordsError, docsError, 
        foldersError, emailsError, taskTypesError, workflowsError, 
        rolesError, permissionsError, userProfilesError, notificationsError
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('[Login] Errors encountered during data fetch:', errors);
        const firstError: any = errors[0];
        toast(`Data loading issue: ${firstError.message || 'Unknown error'}`, 'error');
        
        // Update Supabase status to show the error in the warning UI
        setSupabaseStatus(prev => ({
          ...prev,
          connected: false,
          error: firstError
        }));
      } else {
        // Reset error status if successful
        setSupabaseStatus(prev => ({
          ...prev,
          connected: true,
          error: null
        }));
      }
      
      // Map and set tasks
      if (Array.isArray(tasksData) && tasksData.length > 0) {
        console.log('Loaded tasks:', tasksData.length);
        setTasks(tasksData.map(t => {
          // Defensive parsing for JSONB fields that might be strings
          const parseJSON = (val: any) => {
            if (typeof val === 'string') {
              try { return JSON.parse(val); } catch (e) { return []; }
            }
            return Array.isArray(val) ? val : [];
          };

          return {
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
            dependencies: t.dependencies,
            subtasks: parseJSON(t.subtasks),
            comments: parseJSON(t.comments),
            attachments: parseJSON(t.attachments),
            activity: parseJSON(t.activity)
          };
        }));
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

      // Map and set users
      if (Array.isArray(userProfilesData) && userProfilesData.length > 0) {
        console.log('Loaded users:', userProfilesData.length);
        setUsers(userProfilesData.map(u => ({
          id: u.id,
          tenantId: u.tenant_id,
          name: u.full_name || 'Unknown',
          email: u.email || '',
          role: Array.isArray(rolesData) ? (rolesData.find(r => r.id === u.role_id)?.name || 'Staff') : 'Staff',
          roleId: u.role_id,
          designation: u.designation || 'Staff',
          color: u.color || '#2563eb',
          active: u.active !== false,
          avatarUrl: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=0D8ABC&color=fff`,
          dashboardImageUrl: u.dashboard_image_url
        })));
      } else {
        // If no users found, at least add the current user
        setUsers([userObj]);
      }

      // Set other data
      const setAndSeed = async (table: string, data: any[], setter: any, mapper?: any) => {
        if (Array.isArray(data)) {
          console.log(`Loaded ${table}:`, data.length);
          setter(mapper ? data.map(mapper) : data);
        } else {
          console.warn(`Data for ${table} is not an array:`, data);
          setter([]);
        }
      };

      await Promise.all([
        setAndSeed('deadlines', deadlinesData || [], setDeadlines, (d: any) => ({ ...d, dueDate: d.due_date, desc: d.description, clients: d.clients, form: d.form, section: d.section })),
        setAndSeed('templates', templatesData || [], setTemplates, (t: any) => {
          const parseJSON = (val: any) => {
            if (typeof val === 'string') {
              try { return JSON.parse(val); } catch (e) { return []; }
            }
            return Array.isArray(val) ? val : [];
          };
          return { ...t, estHours: t.est_hours, subtasks: parseJSON(t.subtasks) };
        }),
        setAndSeed('meetings', meetingsData || [], setMeetings, (m: any) => ({ ...m, clientId: m.client_id, meetLink: m.meet_link })),
        setAndSeed('notes', notesData || [], setNotes, (n: any) => ({ ...n, createdAt: n.created_at, updatedAt: n.updated_at, color: n.color, pinned: n.pinned })),
        setAndSeed('passwords', passwordsData || [], setPasswords, (p: any) => ({ ...p, clientId: p.client_id, lastUpdated: p.updated_at })),
        setAndSeed('documents', docsData || [], setDocs, (d: any) => ({ ...d, folderId: d.folder_id, clientId: d.client_id, uploadedBy: d.uploaded_by, uploadedAt: d.created_at })),
        setAndSeed('folders', foldersData || [], setFolders, (f: any) => ({ ...f, parentId: f.parent_id, clientId: f.client_id })),
        setAndSeed('emails', emailsData || [], setEmails, (e: any) => ({ ...e, fromEmail: e.from_email, to: e.to_email, clientId: e.client_id, taskLinked: e.task_linked })),
        setAndSeed('notifications', notificationsData || [], setNotifications, (n: any) => ({ ...n, at: n.created_at, userId: n.user_id })),
        setRoles(Array.isArray(rolesData) && rolesData.length > 0 ? rolesData : INIT_ROLES),
        setPermissions(Array.isArray(permissionsData) && permissionsData.length > 0 ? permissionsData : INIT_PERMISSIONS)
      ]);

      // Handle workflows and task types - seed defaults if empty
      let finalWorkflows = Array.isArray(workflowsData) ? workflowsData : [];
      let finalTaskTypes = Array.isArray(taskTypesData) ? taskTypesData.map((tt: any) => ({ ...tt, workflowId: tt.default_workflow_id })) : [];

      if (finalWorkflows.length === 0) {
        console.log('Seeding default workflows...');
        const workflowIdMap: Record<string, string> = {};
        const workflowsToInsert = INIT_WORKFLOWS.map(w => {
          const newId = genUUID();
          workflowIdMap[w.id] = newId;
          return { ...w, id: newId, tenant_id: userObj.tenantId };
        });
        const { data: newWorkflows, error: wError } = await supabase.from('workflows').insert(workflowsToInsert).select();
        
        if (wError) {
          console.error('Error seeding workflows:', wError);
          if ((wError as any).isConfigError) setSupabaseConfigured(false);
        } else if (newWorkflows) {
          finalWorkflows = newWorkflows;
        }

        if (finalTaskTypes.length === 0) {
          console.log('Seeding default task types...');
          const taskTypesToInsert = INIT_TASK_TYPES.map(tt => {
            const newId = genUUID();
            const dbTt: any = { 
              ...tt, 
              id: newId,
              tenant_id: userObj.tenantId,
              default_workflow_id: workflowIdMap[tt.workflowId] || tt.workflowId 
            };
            delete dbTt.workflowId;
            return dbTt;
          });
          const { data: newTaskTypes, error: ttError } = await supabase.from('task_types').insert(taskTypesToInsert).select();
          
          if (ttError) {
            console.error('Error seeding task types:', ttError);
            if ((ttError as any).isConfigError) setSupabaseConfigured(false);
          } else if (newTaskTypes) {
            finalTaskTypes = newTaskTypes.map((tt: any) => ({ ...tt, workflowId: tt.default_workflow_id }));
          }
        }
      } else if (finalTaskTypes.length === 0) {
        // Fallback if workflows exist but task types don't (rare but possible)
        console.log('Seeding default task types with existing workflows...');
        const defaultWorkflowId = finalWorkflows[0]?.id;
        const taskTypesToInsert = INIT_TASK_TYPES.map(tt => {
          const newId = genUUID();
          const dbTt: any = { 
            ...tt, 
            id: newId,
            tenant_id: userObj.tenantId,
            default_workflow_id: defaultWorkflowId 
          };
          delete dbTt.workflowId;
          return dbTt;
        });
        const { data: newTaskTypes, error: ttError } = await supabase.from('task_types').insert(taskTypesToInsert).select();
        
        if (ttError) {
          console.error('Error seeding task types fallback:', ttError);
          if ((ttError as any).isConfigError) setSupabaseConfigured(false);
        } else if (newTaskTypes) {
          finalTaskTypes = newTaskTypes.map((tt: any) => ({ ...tt, workflowId: tt.default_workflow_id }));
        }
      }
      setWorkflows(finalWorkflows);
      setTaskTypes(finalTaskTypes);

      // AUTO-SEED: If no roles exist, seed all sample data for a better demo experience
      if (!rolesData || rolesData.length === 0) {
        console.log('[Login] No roles found for this tenant. Triggering initial seeding...');
        // We use a small delay to ensure the profile is fully committed
        setTimeout(() => {
          seedSampleData(userObj);
        }, 1500);
      }

      // Update current user role name after roles are loaded
      if (profile && Array.isArray(rolesData)) {
        userObj.role = rolesData.find(r => r.id === profile.role_id)?.name || 'Staff';
      }
      
      // Batch state updates
      setCurrentUser(userObj);
      setIsAuthenticated(true);
      setIsLoading(false);
      
      console.log('[Login] Login successful for user:', userObj.email, 'Role:', userObj.role);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.isConfigError) {
        setSupabaseConfigured(false);
      }
      // Show a more helpful error message in the console
      if (error.message.includes('Unexpected token')) {
        console.error('The server returned an HTML response instead of JSON. This often means the API route is not found or the server crashed.');
      }
      setIsLoading(false);
    }
  };

  // Auth initialization and health check handled by the first useEffect

  // Real-time Sync Effect
  useEffect(() => {
    if (!isAuthenticated || !currentUser || !currentUser.tenantId) return;

    const tenantId = currentUser.tenantId;
    const tables = [
      'tasks', 'clients', 'deadlines', 'templates', 'meetings', 
      'notes', 'passwords', 'documents', 'folders', 'emails', 
      'task_types', 'workflows', 'roles', 'user_profiles'
    ];

    const channels = tables.map(table => {
      return supabase
        .channel(`public:${table}:tenant_id=eq.${tenantId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: table,
          filter: `tenant_id=eq.${tenantId}` 
        }, (payload) => {
          console.log(`Real-time change in ${table}:`, payload);
          // We could implement fine-grained updates here, but for now, 
          // let's just re-fetch the specific table or the whole app state
          // Re-fetching the whole state is safer for consistency
          const sessionStr = localStorage.getItem('sb-session');
          if (sessionStr) {
            login(JSON.parse(sessionStr));
          }
        })
        .subscribe();
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [isAuthenticated, currentUser?.tenantId]);

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
    // User requested all tabs to be visible for all users
    return true;
  };

  // Persistence wrappers
  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.clientId !== undefined) { dbUpdates.client_id = (updates.clientId && updates.clientId !== 'none') ? updates.clientId : null; delete dbUpdates.clientId; }
    if (updates.assigneeId !== undefined) { dbUpdates.assigned_to = (updates.assigneeId && updates.assigneeId !== 'none') ? updates.assigneeId : null; delete dbUpdates.assigneeId; }
    if (updates.reviewerId !== undefined) { dbUpdates.reviewer_id = (updates.reviewerId && updates.reviewerId !== 'none') ? updates.reviewerId : null; delete dbUpdates.reviewerId; }
    if (updates.reporterId !== undefined) { dbUpdates.reporter_id = (updates.reporterId && updates.reporterId !== 'none') ? updates.reporterId : null; delete dbUpdates.reporterId; }
    if (updates.dueDate !== undefined) { dbUpdates.due_date = updates.dueDate || null; delete dbUpdates.dueDate; }
    if (updates.issueType !== undefined) { dbUpdates.issue_type = updates.issueType || null; delete dbUpdates.issueType; }
    if (updates.parentId !== undefined) { dbUpdates.parent_id = (updates.parentId && updates.parentId !== 'none') ? updates.parentId : null; delete dbUpdates.parentId; }
    if (updates.statutoryDeadline !== undefined) { dbUpdates.statutory_deadline = updates.statutoryDeadline || null; delete dbUpdates.statutoryDeadline; }
    if (updates.linkedTasks !== undefined) { dbUpdates.linked_tasks = updates.linkedTasks || null; delete dbUpdates.linkedTasks; }
    if (updates.createdAt !== undefined) { dbUpdates.created_at = updates.createdAt || null; delete dbUpdates.createdAt; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update task in DB:', id, dbUpdates);
    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update task in database:', error, dbUpdates);
    } else {
      console.log('Task updated in database successfully');
    }
  };

  const addTask = async (task: Task): Promise<string> => {
    // Ensure default type if missing
    const taskType = task.type || (taskTypes.length > 0 ? taskTypes[0].name : 'GST');
    
    // Calculate final ID before setting state
    const tenantPrefix = currentUser?.tenantId ? currentUser.tenantId.substring(0, 4).toUpperCase() : 'KDK';
    let finalId = task.id;
    if (!task.id.startsWith(`${tenantPrefix}-`) || task.id.length > 20) {
      let max = 0;
      tasks.forEach(t => {
        if (t.id.startsWith(`${tenantPrefix}-`)) {
          const num = parseInt(t.id.split('-')[1], 10);
          if (!isNaN(num) && num > max) max = num;
        }
      });
      finalId = `${tenantPrefix}-${max + 1}`;
    }

    const finalTask = { 
      ...task, 
      id: finalId,
      type: taskType 
    };
    
    setTasks(prev => [finalTask, ...prev]);

    const dbTask: any = { 
      ...finalTask,
      tenant_id: currentUser?.tenantId,
      client_id: (finalTask.clientId && finalTask.clientId !== 'none') ? finalTask.clientId : null,
      assigned_to: (finalTask.assigneeId && finalTask.assigneeId !== 'none') ? finalTask.assigneeId : null,
      reviewer_id: (finalTask.reviewerId && finalTask.reviewerId !== 'none') ? finalTask.reviewerId : null,
      reporter_id: (finalTask.reporterId && finalTask.reporterId !== 'none') ? finalTask.reporterId : (currentUser?.id || null),
      due_date: finalTask.dueDate || null,
      issue_type: finalTask.issueType || 'Task',
      parent_id: finalTask.parentId || null,
      statutory_deadline: finalTask.statutoryDeadline || null,
      linked_tasks: finalTask.linkedTasks || [],
      period: finalTask.period || new Date().toISOString().substring(0, 7),
      unique_key: finalTask.uniqueKey || `${currentUser?.tenantId}:${(finalTask.clientId && finalTask.clientId !== 'none') ? finalTask.clientId : 'no-client'}:${finalTask.type || 'task'}:${finalTask.period || new Date().toISOString().substring(0, 7)}:${finalTask.id}`,
      created_at: finalTask.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
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
    delete dbTask.uniqueKey;
    // Do NOT delete activity, subtasks, comments, attachments as they are JSONB in DB
    
    console.log('Attempting to save/upsert task to DB:', dbTask);
    const { error } = await supabase.from('tasks').upsert(dbTask, { onConflict: 'id' });
    if (error) {
      console.error('Failed to save/upsert task to database:', error);
      toast(`Failed to save task: ${error.message}`, 'error');
      if ((error as any).isConfigError) setSupabaseConfigured(false);
    } else {
      console.log('Task saved/upserted to database successfully');
    }
    return finalId;
  };

  const addTasks = async (newTasks: Task[]): Promise<string[]> => {
    const tasksToInsert: any[] = [];
    const updatedTasks = [...tasks];
    const finalIds: string[] = [];
    const idMap: Record<string, string> = {};
    
    const tenantPrefix = currentUser?.tenantId ? currentUser.tenantId.substring(0, 4).toUpperCase() : 'KDK';
    let max = 0;
    updatedTasks.forEach(t => {
      if (t.id.startsWith(`${tenantPrefix}-`)) {
        const num = parseInt(t.id.split('-')[1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });

    newTasks.forEach((task, idx) => {
      const taskType = task.type || (taskTypes.length > 0 ? taskTypes[0].name : 'GST');
      
      let finalId = task.id;
      if (!task.id.startsWith(`${tenantPrefix}-`) || task.id.length > 20) {
        finalId = `${tenantPrefix}-${max + 1 + idx}`;
        idMap[task.id] = finalId;
      }
      
      finalIds.push(finalId);

      const finalTask = { 
        ...task, 
        id: finalId,
        type: taskType 
      };
      
      updatedTasks.unshift(finalTask);
    });

    // Handle parent_id mapping for subtasks in the same batch
    const finalTasksToInsert = updatedTasks.slice(0, newTasks.length).map(t => {
      if (t.parentId && idMap[t.parentId]) {
        t.parentId = idMap[t.parentId];
      }

      const dbTask: any = { 
        ...t,
        tenant_id: currentUser?.tenantId,
        client_id: (t.clientId && t.clientId !== 'none') ? t.clientId : null,
        assigned_to: (t.assigneeId && t.assigneeId !== 'none') ? t.assigneeId : null,
        reviewer_id: (t.reviewerId && t.reviewerId !== 'none') ? t.reviewerId : null,
        reporter_id: (t.reporterId && t.reporterId !== 'none') ? t.reporterId : (currentUser?.id || null),
        due_date: t.dueDate || null,
        issue_type: t.issueType || 'Task',
        parent_id: t.parentId || null,
        statutory_deadline: t.statutoryDeadline || null,
        linked_tasks: t.linkedTasks || [],
        period: t.period || new Date().toISOString().substring(0, 7),
        unique_key: t.uniqueKey || `${currentUser?.tenantId}:${(t.clientId && t.clientId !== 'none') ? t.clientId : 'no-client'}:${t.type || 'task'}:${t.period || new Date().toISOString().substring(0, 7)}:${t.id}`,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      delete dbTask.clientId;
      delete dbTask.assigneeId;
      delete dbTask.reviewerId;
      delete dbTask.reporterId;
      delete dbTask.dueDate;
      delete dbTask.issueType;
      delete dbTask.parentId;
      delete dbTask.statutoryDeadline;
      delete dbTask.linkedTasks;
      delete dbTask.createdAt;
      delete dbTask.uniqueKey; // Delete the camelCase version
      // Do NOT delete activity, subtasks, comments, attachments as they are JSONB in DB
      
      return dbTask;
    });

    setTasks(updatedTasks);
    if (finalTasksToInsert.length > 0) {
      console.log('Attempting to save/upsert multiple tasks to DB:', finalTasksToInsert);
      const { error } = await supabase.from('tasks').upsert(finalTasksToInsert, { onConflict: 'id' });
      if (error) {
        console.error('Failed to save/upsert multiple tasks to database:', error);
      } else {
        console.log('Multiple tasks saved/upserted to database successfully');
      }
    }
    return finalIds;
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.onboarded) { dbUpdates.onboarded_at = updates.onboarded; delete dbUpdates.onboarded; }
    if (updates.manager !== undefined) { dbUpdates.manager = (updates.manager && updates.manager !== 'none') ? updates.manager : null; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update client in DB:', id, dbUpdates);
    const { error } = await supabase.from('clients').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update client in database:', error, dbUpdates);
      toast(`Failed to update client: ${error.message}`, 'error');
      if ((error as any).isConfigError) setSupabaseConfigured(false);
    } else {
      console.log('Client updated in database successfully');
    }
  };

  const addClient = async (client: Client) => {
    const clientWithProfile = { ...client };
    setClients(prev => [clientWithProfile, ...prev]);
    
    const dbClient: any = { 
      ...clientWithProfile, 
      tenant_id: currentUser?.tenantId, 
      onboarded_at: client.onboarded || null,
      manager: (client.manager && client.manager !== 'none') ? client.manager : null
    };
    delete dbClient.onboarded;
    
    console.log('Attempting to save client to DB:', dbClient);
    const { error } = await supabase.from('clients').insert(dbClient);
    if (error) {
      console.error('Failed to save client to database:', error);
      toast(`Failed to add client: ${error.message}`, 'error');
      if ((error as any).isConfigError) setSupabaseConfigured(false);
    } else {
      console.log('Client saved to database successfully');
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await supabase.from('clients').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    const now = new Date().toISOString();
    const dbUpdates: any = { ...updates, updated_at: now };
    delete dbUpdates.createdAt; // Don't update created_at
    delete dbUpdates.updatedAt; // Always use DB timestamp
    delete dbUpdates.id; // Don't update id
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update note in DB:', id, dbUpdates);
    const { error } = await supabase.from('notes').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update note in database:', error, dbUpdates);
      toast(`Failed to update note: ${error.message}`, 'error');
      if ((error as any).isConfigError) setSupabaseConfigured(false);
    } else {
      console.log('Note updated in database successfully');
    }
  };

  const addNote = async (note: Note) => {
    const noteWithProfile = { ...note };
    setNotes(prev => [noteWithProfile, ...prev]);
    const now = new Date().toISOString();
    const dbNote: any = { 
      ...noteWithProfile, 
      tenant_id: currentUser?.tenantId,
      created_by: note.createdBy || currentUser?.id,
      created_at: now, // Always use current timestamp for DB
      updated_at: now 
    };
    delete dbNote.createdAt;
    delete dbNote.updatedAt;
    delete dbNote.createdBy;
    
    console.log('Attempting to save note to DB:', dbNote);
    const { error } = await supabase.from('notes').insert(dbNote);
    if (error) {
      console.error('Failed to save note to database:', error);
      toast(`Failed to add note: ${error.message}`, 'error');
      if ((error as any).isConfigError) setSupabaseConfigured(false);
    } else {
      console.log('Note saved to database successfully');
    }
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    console.log('Attempting to delete note from DB:', id);
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to delete note from database:', error);
    } else {
      console.log('Note deleted from database successfully');
    }
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.clientId !== undefined) { dbUpdates.client_id = (updates.clientId && updates.clientId !== 'none') ? updates.clientId : null; delete dbUpdates.clientId; }
    if (updates.meetLink !== undefined) { dbUpdates.meet_link = updates.meetLink; delete dbUpdates.meetLink; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update meeting in DB:', id, dbUpdates);
    const { error } = await supabase.from('meetings').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update meeting in database:', error, dbUpdates);
    } else {
      console.log('Meeting updated in database successfully');
    }
  };

  const addMeeting = async (meeting: Meeting) => {
    const meetingWithProfile = { ...meeting };
    setMeetings(prev => [meetingWithProfile, ...prev]);
    const dbMeeting: any = { 
      ...meetingWithProfile, 
      tenant_id: currentUser?.tenantId, 
      client_id: (meeting.clientId && meeting.clientId !== 'none') ? meeting.clientId : null, 
      meet_link: meeting.meetLink 
    };
    delete dbMeeting.clientId;
    delete dbMeeting.meetLink;
    
    console.log('Attempting to save meeting to DB:', dbMeeting);
    const { error } = await supabase.from('meetings').insert(dbMeeting);
    if (error) {
      console.error('Failed to save meeting to database:', error);
    } else {
      console.log('Meeting saved to database successfully');
    }
  };

  const deleteMeeting = async (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
    await supabase.from('meetings').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updatePassword = async (id: string, updates: Partial<Password>) => {
    setPasswords(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.clientId !== undefined) { dbUpdates.client_id = (updates.clientId && updates.clientId !== 'none') ? updates.clientId : null; delete dbUpdates.clientId; }
    if (updates.lastUpdated !== undefined) { dbUpdates.updated_at = updates.lastUpdated; delete dbUpdates.lastUpdated; }
    
    // Map portal to service for DB
    if (updates.portal !== undefined) {
      dbUpdates.service = updates.portal;
      // Keep portal for backward compatibility if needed, but error says service is required
    }

    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update password in DB:', id, dbUpdates);
    const { error } = await supabase.from('passwords').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update password in database:', error, dbUpdates);
      toast(`Failed to update password: ${error.message}`, 'error');
    } else {
      console.log('Password updated in database successfully');
    }
  };

  const addPassword = async (password: Password) => {
    const passwordWithProfile = { ...password };
    setPasswords(prev => [passwordWithProfile, ...prev]);
    const dbPassword: any = { 
      ...passwordWithProfile, 
      tenant_id: currentUser?.tenantId,
      client_id: (password.clientId && password.clientId !== 'none') ? password.clientId : null,
      service: password.portal || 'Unknown', // Map portal to service
      updated_at: password.lastUpdated || new Date().toISOString()
    };
    delete dbPassword.clientId;
    delete dbPassword.lastUpdated;
    
    console.log('Attempting to save password to DB:', dbPassword);
    const { error } = await supabase.from('passwords').insert(dbPassword);
    if (error) {
      console.error('Failed to save password to database:', error);
      toast(`Failed to save password: ${error.message}`, 'error');
    } else {
      console.log('Password saved to database successfully');
    }
  };

  const deletePassword = async (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
    await supabase.from('passwords').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.folderId !== undefined) { dbUpdates.folder_id = (updates.folderId && updates.folderId !== 'none') ? updates.folderId : null; delete dbUpdates.folderId; }
    if (updates.clientId !== undefined) { dbUpdates.client_id = (updates.clientId && updates.clientId !== 'none') ? updates.clientId : null; delete dbUpdates.clientId; }
    if (updates.uploadedBy !== undefined) { dbUpdates.uploaded_by = updates.uploadedBy; delete dbUpdates.uploadedBy; }
    if (updates.uploadedAt !== undefined) { dbUpdates.created_at = updates.uploadedAt; delete dbUpdates.uploadedAt; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update document in DB:', id, dbUpdates);
    const { error } = await supabase.from('documents').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update document in database:', error, dbUpdates);
    } else {
      console.log('Document updated in database successfully');
    }
  };

  const addDocument = async (doc: Document) => {
    const docWithProfile = { ...doc };
    setDocs(prev => [docWithProfile, ...prev]);
    const dbDoc: any = { 
      ...docWithProfile, 
      tenant_id: currentUser?.tenantId,
      folder_id: (doc.folderId && doc.folderId !== 'none') ? doc.folderId : null, 
      client_id: (doc.clientId && doc.clientId !== 'none') ? doc.clientId : null, 
      uploaded_by: doc.uploadedBy,
      created_at: doc.uploadedAt
    };
    delete dbDoc.folderId;
    delete dbDoc.clientId;
    delete dbDoc.uploadedBy;
    delete dbDoc.uploadedAt;
    
    console.log('Attempting to save document to DB:', dbDoc);
    const { error } = await supabase.from('documents').insert(dbDoc);
    if (error) {
      console.error('Failed to save document to database:', error);
    } else {
      console.log('Document saved to database successfully');
    }
  };

  const deleteDocument = async (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    await supabase.from('documents').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.parentId !== undefined) { dbUpdates.parent_id = (updates.parentId && updates.parentId !== 'none') ? updates.parentId : null; delete dbUpdates.parentId; }
    if (updates.clientId !== undefined) { dbUpdates.client_id = (updates.clientId && updates.clientId !== 'none') ? updates.clientId : null; delete dbUpdates.clientId; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update folder in DB:', id, dbUpdates);
    const { error } = await supabase.from('folders').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update folder in database:', error, dbUpdates);
    } else {
      console.log('Folder updated in database successfully');
    }
  };

  const addFolder = async (folder: Folder) => {
    const folderWithProfile = { ...folder };
    setFolders(prev => [folderWithProfile, ...prev]);
    const dbFolder: any = { 
      ...folderWithProfile, 
      tenant_id: currentUser?.tenantId, 
      parent_id: (folder.parentId && folder.parentId !== 'none') ? folder.parentId : null, 
      client_id: (folder.clientId && folder.clientId !== 'none') ? folder.clientId : null 
    };
    delete dbFolder.parentId;
    delete dbFolder.clientId;
    
    console.log('Attempting to save folder to DB:', dbFolder);
    const { error } = await supabase.from('folders').insert(dbFolder);
    if (error) {
      console.error('Failed to save folder to database:', error);
    } else {
      console.log('Folder saved to database successfully');
    }
  };

  const deleteFolder = async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    await supabase.from('folders').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateTaskType = async (id: string, updates: Partial<TaskTypeConfig>) => {
    setTaskTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.workflowId !== undefined) { dbUpdates.default_workflow_id = (updates.workflowId && updates.workflowId !== 'none') ? updates.workflowId : null; delete dbUpdates.workflowId; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update task type in DB:', id, dbUpdates);
    const { error } = await supabase.from('task_types').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update task type in database:', error, dbUpdates);
    } else {
      console.log('Task type updated in database successfully');
    }
  };

  const addTaskType = async (taskType: TaskTypeConfig) => {
    const taskTypeWithProfile = { ...taskType };
    setTaskTypes(prev => [taskTypeWithProfile, ...prev]);
    const dbTaskType: any = { 
      ...taskTypeWithProfile, 
      tenant_id: currentUser?.tenantId, 
      default_workflow_id: (taskType.workflowId && taskType.workflowId !== 'none') ? taskType.workflowId : null 
    };
    delete dbTaskType.workflowId;
    
    console.log('Attempting to save task type to DB:', dbTaskType);
    const { error } = await supabase.from('task_types').insert(dbTaskType);
    if (error) {
      console.error('Failed to save task type to database:', error);
    } else {
      console.log('Task type saved to database successfully');
    }
  };

  const deleteTaskType = async (id: string) => {
    setTaskTypes(prev => prev.filter(t => t.id !== id));
    await supabase.from('task_types').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update workflow in DB:', id, dbUpdates);
    const { error } = await supabase.from('workflows').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update workflow in database:', error, dbUpdates);
    } else {
      console.log('Workflow updated in database successfully');
    }
  };

  const addWorkflow = async (workflow: Workflow) => {
    const workflowWithProfile = { ...workflow, tenant_id: currentUser?.tenantId };
    setWorkflows(prev => [workflowWithProfile, ...prev]);
    
    console.log('Attempting to save workflow to DB:', workflowWithProfile);
    const { error } = await supabase.from('workflows').insert(workflowWithProfile);
    if (error) {
      console.error('Failed to save workflow to database:', error);
    } else {
      console.log('Workflow saved to database successfully');
    }
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    await supabase.from('workflows').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateDeadline = async (id: string, updates: Partial<Deadline>) => {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.dueDate !== undefined) { dbUpdates.due_date = updates.dueDate; delete dbUpdates.dueDate; }
    if (updates.desc !== undefined) { dbUpdates.description = updates.desc; delete dbUpdates.desc; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update deadline in DB:', id, dbUpdates);
    const { error } = await supabase.from('deadlines').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update deadline in database:', error, dbUpdates);
    } else {
      console.log('Deadline updated in database successfully');
    }
  };

  const addDeadline = async (deadline: Deadline) => {
    const deadlineWithProfile = { ...deadline };
    setDeadlines(prev => [deadlineWithProfile, ...prev]);
    const dbDeadline: any = { 
      ...deadlineWithProfile, 
      tenant_id: currentUser?.tenantId, 
      due_date: deadline.dueDate, 
      description: deadline.desc 
    };
    delete dbDeadline.dueDate;
    delete dbDeadline.desc;
    
    console.log('Attempting to save deadline to DB:', dbDeadline);
    const { error } = await supabase.from('deadlines').insert(dbDeadline);
    if (error) {
      console.error('Failed to save deadline to database:', error);
    } else {
      console.log('Deadline saved to database successfully');
    }
  };

  const deleteDeadline = async (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
    await supabase.from('deadlines').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.estHours !== undefined) { dbUpdates.est_hours = updates.estHours; delete dbUpdates.estHours; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update template in DB:', id, dbUpdates);
    const { error } = await supabase.from('templates').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update template in database:', error, dbUpdates);
    } else {
      console.log('Template updated in database successfully');
    }
  };

  const addTemplate = async (template: Template) => {
    const templateWithProfile = { ...template };
    setTemplates(prev => [templateWithProfile, ...prev]);
    const dbTemplate: any = { 
      ...templateWithProfile, 
      tenant_id: currentUser?.tenantId, 
      est_hours: template.estHours,
      type: template.type || template.category
    };
    delete dbTemplate.estHours;
    
    console.log('Attempting to save template to DB:', dbTemplate);
    const { error } = await supabase.from('templates').insert(dbTemplate);
    if (error) {
      console.error('Failed to save template to database:', error);
    } else {
      console.log('Template saved to database successfully');
    }
  };

  const deleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    await supabase.from('templates').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.fromEmail !== undefined) { dbUpdates.from_email = updates.fromEmail; delete dbUpdates.fromEmail; }
    if (updates.to !== undefined) { dbUpdates.to_email = updates.to; delete dbUpdates.to; }
    if (updates.clientId !== undefined) { dbUpdates.client_id = (updates.clientId && updates.clientId !== 'none') ? updates.clientId : null; delete dbUpdates.clientId; }
    if (updates.taskLinked !== undefined) { dbUpdates.task_linked = (updates.taskLinked && updates.taskLinked !== 'none') ? updates.taskLinked : null; delete dbUpdates.taskLinked; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update email in DB:', id, dbUpdates);
    const { error } = await supabase.from('emails').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update email in database:', error, dbUpdates);
    } else {
      console.log('Email updated in database successfully');
    }
  };

  const addEmail = async (email: Email) => {
    const emailWithProfile = { ...email };
    setEmails(prev => [emailWithProfile, ...prev]);
    const dbEmail: any = { 
      ...emailWithProfile, 
      tenant_id: currentUser?.tenantId,
      from_email: email.fromEmail, 
      to_email: email.to, 
      client_id: (email.clientId && email.clientId !== 'none') ? email.clientId : null,
      task_linked: (email.taskLinked && email.taskLinked !== 'none') ? email.taskLinked : null
    };
    delete dbEmail.fromEmail;
    delete dbEmail.to;
    delete dbEmail.clientId;
    delete dbEmail.taskLinked;
    
    console.log('Attempting to save email to DB:', dbEmail);
    const { error } = await supabase.from('emails').insert(dbEmail);
    if (error) {
      console.error('Failed to save email to database:', error);
    } else {
      console.log('Email saved to database successfully');
    }
  };

  const deleteEmail = async (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    await supabase.from('emails').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.name !== undefined) { dbUpdates.full_name = updates.name; delete dbUpdates.name; }
    if (updates.avatarUrl !== undefined) { dbUpdates.avatar_url = updates.avatarUrl; delete dbUpdates.avatarUrl; }
    if (updates.dashboardImageUrl !== undefined) { dbUpdates.dashboard_image_url = updates.dashboardImageUrl; delete dbUpdates.dashboardImageUrl; }
    if (updates.roleId !== undefined) { dbUpdates.role_id = updates.roleId; delete dbUpdates.roleId; }
    if (updates.tenantId !== undefined) { dbUpdates.tenant_id = updates.tenantId; delete dbUpdates.tenantId; }
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update user in DB:', id, dbUpdates);
    const { error } = await supabase.from('user_profiles').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update user in database:', error, dbUpdates);
    } else {
      console.log('User updated in database successfully');
    }
  };

  const addUser = async (user: User) => {
    const userWithProfile = { ...user };
    setUsers(prev => [userWithProfile, ...prev]);
    const dbUser: any = { 
      ...userWithProfile, 
      tenant_id: currentUser?.tenantId,
      full_name: user.name, 
      avatar_url: user.avatarUrl,
      role_id: user.roleId
    };
    delete dbUser.avatarUrl;
    delete dbUser.name;
    delete dbUser.roleId;
    delete dbUser.tenantId;
    
    console.log('Attempting to save user to DB:', dbUser);
    const { error } = await supabase.from('user_profiles').insert(dbUser);
    if (error) {
      console.error('Failed to save user to database:', error);
    } else {
      console.log('User saved to database successfully');
    }
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    await supabase.from('user_profiles').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
  };

  const updateRole = async (id: string, updates: Partial<Role>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    
    // Clean up undefined values
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    console.log('Attempting to update role in DB:', id, dbUpdates);
    const { error } = await supabase.from('roles').update(dbUpdates).eq('id', id).eq('tenant_id', currentUser?.tenantId);
    if (error) {
      console.error('Failed to update role in database:', error, dbUpdates);
    } else {
      console.log('Role updated in database successfully');
    }
  };

  const addRole = async (role: Role) => {
    const roleWithProfile = { ...role, tenant_id: currentUser?.tenantId };
    setRoles(prev => [roleWithProfile, ...prev]);
    
    console.log('Attempting to save role to DB:', roleWithProfile);
    const { error } = await supabase.from('roles').insert(roleWithProfile);
    if (error) {
      console.error('Failed to save role to database:', error);
    } else {
      console.log('Role saved to database successfully');
    }
  };

  const deleteRole = async (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    await supabase.from('roles').delete().eq('id', id).eq('tenant_id', currentUser?.tenantId);
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
      supabaseConfigured, setSupabaseConfigured,
      supabaseStatus, setSupabaseStatus,
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
