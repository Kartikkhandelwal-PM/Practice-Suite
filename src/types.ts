export interface User {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  designation: string;
  color: string;
  active: boolean;
  avatarUrl?: string;
  dashboardImageUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  pan: string;
  gstin: string;
  type?: string;
  category: string;
  services: string[];
  manager: string;
  email: string;
  phone: string;
  address: string;
  onboarded: string;
  active: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  assigneeId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  replies?: Comment[];
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface Activity {
  text: string;
  at: string;
}

export interface Task {
  id: string;
  title: string;
  clientId: string;
  type: string;
  issueType?: string;
  status: string;
  priority: string;
  assigneeId: string;
  reviewerId: string;
  reporterId?: string;
  dueDate: string;
  createdAt: string;
  recurring: string;
  description: string;
  tags: string[];
  parentId?: string;
  linkedTasks?: string[];
  dependencies?: string[];
  statutoryDeadline?: string;
  period?: string; // e.g., "2024-10"
  uniqueKey?: string; // tenant_id:client_id:type:period
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  activity: Activity[];
}

export interface TaskTypeConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  category?: string;
  description?: string;
  workflowId?: string;
}

export interface WorkflowTransition {
  from: string;
  to: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  statuses: string[];
  transitions: WorkflowTransition[];
}

export interface Deadline {
  id: string;
  title: string;
  desc: string;
  category: string;
  priority?: string;
  dueDate: string;
  clients: number;
  form: string;
  section: string;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  category: string;
  recurring: string;
  estHours: string;
  description: string;
  color: string;
  subtasks: string[];
}

export interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to?: string;
  cc?: string;
  bcc?: string;
  clientId: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  time: string;
  read: boolean;
  starred?: boolean;
  snoozed?: boolean;
  labels?: string[];
  taskLinked: string | null;
  attachments: string[];
  folder?: 'inbox' | 'sent' | 'drafts' | 'trash';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  color: string;
  pinned: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Password {
  id: string;
  clientId: string;
  portal: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  category: string;
  strength: number;
  lastUpdated: string;
}

export interface Document {
  id: string;
  folderId: string | null;
  name: string;
  type: string;
  size: string;
  clientId: string | null;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  description: string;
  data?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  clientId: string | null;
  icon: string;
}

export interface Meeting {
  id: string;
  title: string;
  clientId: string;
  type: string;
  platform: string;
  meetLink: string;
  date: string;
  time: string;
  duration: number;
  attendees: string[];
  description: string;
  notes?: string;
  status: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  text: string;
  at: string;
  read: boolean;
  type: 'mention' | 'task' | 'meeting';
  link?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Array of permission IDs
  isSystem?: boolean;
}
