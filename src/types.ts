export interface User {
  id: string;
  profile_id?: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  color: string;
  active: boolean;
  avatar?: string;
}

export interface Client {
  id: string;
  profile_id?: string;
  name: string;
  pan: string;
  gstin: string;
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
  profile_id?: string;
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
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  activity: Activity[];
}

export interface TaskTypeConfig {
  id: string;
  profile_id?: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  workflowId?: string;
}

export interface WorkflowTransition {
  from: string;
  to: string[];
}

export interface Workflow {
  id: string;
  profile_id?: string;
  name: string;
  description?: string;
  statuses: string[];
  transitions: WorkflowTransition[];
}

export interface Deadline {
  id: string;
  profile_id?: string;
  title: string;
  desc: string;
  category: string;
  dueDate: string;
  clients: number;
  form: string;
  section: string;
}

export interface Template {
  id: string;
  profile_id?: string;
  name: string;
  category: string;
  recurring: string;
  estHours: string;
  description: string;
  color: string;
  subtasks: string[];
}

export interface Email {
  id: string;
  profile_id?: string;
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
  profile_id?: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Password {
  id: string;
  profile_id?: string;
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
  profile_id?: string;
  folderId: string;
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
  profile_id?: string;
  name: string;
  parentId: string | null;
  clientId: string | null;
  icon: string;
}

export interface Meeting {
  id: string;
  profile_id?: string;
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
