import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import {
  INIT_CLIENTS,
  INIT_DEADLINES,
  INIT_DOCS,
  INIT_EMAILS,
  INIT_FOLDERS,
  INIT_MEETINGS,
  INIT_NOTES,
  INIT_PASSWORDS,
  INIT_TASKS,
  INIT_TASK_TYPES,
  INIT_TEMPLATES,
  INIT_USERS,
  INIT_WORKFLOWS,
} from '../../src/data';

const DEMO_EMAIL = 'kartikkhandelwal1104@gmail.com';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

const tableConfig: Record<
  string,
  {
    ownerField?: string;
    listQuery?: (query: any, userId: string) => any;
    assignOwner?: (payload: any, userId: string) => any;
  }
> = {
  profiles: {
    listQuery: (query: any, userId: string) => query.eq('id', userId),
  },
  tasks: {
    ownerField: 'profile_id',
  },
  clients: {
    ownerField: 'profile_id',
  },
  deadlines: {
    ownerField: 'profile_id',
  },
  templates: {
    ownerField: 'profile_id',
  },
  emails: {
    ownerField: 'profile_id',
  },
  notes: {
    ownerField: 'user_id',
    assignOwner: (payload: any, userId: string) => ({ ...payload, user_id: userId }),
  },
  passwords: {
    ownerField: 'profile_id',
  },
  documents: {
    ownerField: 'profile_id',
    assignOwner: (payload: any, userId: string) => ({
      ...payload,
      profile_id: userId,
      uploaded_by: payload.uploaded_by || userId,
    }),
  },
  folders: {
    ownerField: 'profile_id',
  },
  meetings: {
    ownerField: 'profile_id',
    assignOwner: (payload: any, userId: string) => ({
      ...payload,
      profile_id: userId,
      attendees: Array.isArray(payload.attendees) ? Array.from(new Set([userId, ...payload.attendees])) : [userId],
    }),
  },
  task_types: {
    ownerField: 'profile_id',
  },
  workflows: {
    ownerField: 'profile_id',
  },
  notifications: {
    ownerField: 'user_id',
    assignOwner: (payload: any, userId: string) => ({ ...payload, user_id: payload.user_id || userId }),
  },
};

const appToDbMap: Record<string, Record<string, string>> = {
  profiles: { avatar: 'avatar_url' },
  tasks: {
    clientId: 'client_id',
    issueType: 'issue_type',
    assigneeId: 'assignee_id',
    reviewerId: 'reviewer_id',
    reporterId: 'reporter_id',
    dueDate: 'due_date',
    createdAt: 'created_at',
    parentId: 'parent_id',
  },
  deadlines: { desc: 'description', dueDate: 'due_date', clients: 'clients_count' },
  templates: { estHours: 'est_hours' },
  emails: {
    from: 'from_name',
    fromEmail: 'from_email',
    to: 'to_email',
    clientId: 'client_id',
    taskLinked: 'task_linked',
  },
  notes: { createdAt: 'created_at', updatedAt: 'updated_at' },
  passwords: { clientId: 'client_id', lastUpdated: 'last_updated' },
  documents: {
    folderId: 'folder_id',
    clientId: 'client_id',
    uploadedBy: 'uploaded_by',
    uploadedAt: 'uploaded_at',
  },
  folders: { parentId: 'parent_id', clientId: 'client_id' },
  meetings: { clientId: 'client_id', meetLink: 'meet_link' },
  task_types: { workflowId: 'workflow_id' },
  notifications: { userId: 'user_id' },
};

const dbToAppMap = Object.fromEntries(
  Object.entries(appToDbMap).map(([table, map]) => [
    table,
    Object.fromEntries(Object.entries(map).map(([appKey, dbKey]) => [dbKey, appKey])),
  ]),
);

const parseBody = (body: string | null) => {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

const mapRecord = (table: string, record: any, direction: 'toDb' | 'toApp') => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return record;
  const mapping = direction === 'toDb' ? appToDbMap[table] || {} : dbToAppMap[table] || {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    const mappedKey = mapping[key] || key;
    result[mappedKey] = value;
  }
  if (table === 'profiles' && direction === 'toApp' && result.avatar_url && !result.avatar) {
    result.avatar = result.avatar_url;
  }
  return result;
};

const mapRows = (table: string, rows: any) => {
  if (Array.isArray(rows)) return rows.map((row) => mapRecord(table, row, 'toApp'));
  return mapRecord(table, rows, 'toApp');
};

const getToken = (event: Parameters<Handler>[0]) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '').trim();
};

const requireUser = async (event: Parameters<Handler>[0]) => {
  const token = getToken(event);
  if (!token) {
    return { error: { statusCode: 401, body: { error: 'Missing authorization token.' } } };
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: { statusCode: 401, body: { error: error?.message || 'Invalid session.' } } };
  }
  return { token, user: data.user };
};

const json = (statusCode: number, body: any) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

async function seedUserData(userId: string) {
  const idMap: Record<string, string> = {};
  const genId = (oldId: string) => {
    if (!idMap[oldId]) idMap[oldId] = crypto.randomUUID();
    return idMap[oldId];
  };

  const workflows = INIT_WORKFLOWS.map((w) => ({
    ...mapRecord('workflows', w, 'toDb'),
    id: genId(w.id),
    profile_id: userId,
  }));
  await supabase.from('workflows').insert(workflows);

  const taskTypes = INIT_TASK_TYPES.map((tt) => ({
    ...mapRecord('task_types', tt, 'toDb'),
    id: genId(tt.id),
    workflow_id: genId(tt.workflowId || ''),
    profile_id: userId,
  }));
  await supabase.from('task_types').insert(taskTypes);

  const profiles = INIT_USERS.map((u) => ({
    id: genId(u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    designation: u.designation,
    color: u.color,
    active: u.active,
    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`,
  }));
  profiles.unshift({
    id: userId,
    name: 'Demo User',
    email: DEMO_EMAIL,
    role: 'Admin',
    designation: 'Practice Owner',
    color: '#2563eb',
    active: true,
    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(DEMO_EMAIL)}&background=random`,
  });
  await supabase.from('profiles').upsert(profiles, { onConflict: 'id' });

  const clients = INIT_CLIENTS.map((c) => ({
    ...mapRecord('clients', c, 'toDb'),
    id: genId(c.id),
    manager: userId,
    profile_id: userId,
  }));
  await supabase.from('clients').insert(clients);

  const tasks = INIT_TASKS.map((t) => ({
    ...mapRecord('tasks', t, 'toDb'),
    profile_id: userId,
    client_id: genId(t.clientId),
    assignee_id: userId,
    reviewer_id: userId,
    reporter_id: userId,
    parent_id: t.parentId ? genId(t.parentId) : null,
  }));
  await supabase.from('tasks').insert(tasks);

  const deadlines = INIT_DEADLINES.map((d) => ({
    ...mapRecord('deadlines', d, 'toDb'),
    id: genId(d.id),
    profile_id: userId,
  }));
  await supabase.from('deadlines').insert(deadlines);

  const templates = INIT_TEMPLATES.map((t) => ({
    ...mapRecord('templates', t, 'toDb'),
    id: genId(t.id),
    profile_id: userId,
  }));
  await supabase.from('templates').insert(templates);

  const meetings = INIT_MEETINGS.map((m) => ({
    ...mapRecord('meetings', m, 'toDb'),
    id: genId(m.id),
    client_id: genId(m.clientId),
    attendees: [userId],
    profile_id: userId,
  }));
  await supabase.from('meetings').insert(meetings);

  const notes = INIT_NOTES.map((n) => ({
    ...mapRecord('notes', n, 'toDb'),
    id: genId(n.id),
    user_id: userId,
  }));
  await supabase.from('notes').insert(notes);

  const passwords = INIT_PASSWORDS.map((p) => ({
    ...mapRecord('passwords', p, 'toDb'),
    id: genId(p.id),
    client_id: genId(p.clientId),
    profile_id: userId,
  }));
  await supabase.from('passwords').insert(passwords);

  const folders = INIT_FOLDERS.map((f) => ({
    ...mapRecord('folders', f, 'toDb'),
    id: genId(f.id),
    parent_id: f.parentId ? genId(f.parentId) : null,
    client_id: f.clientId ? genId(f.clientId) : null,
    profile_id: userId,
  }));
  await supabase.from('folders').insert(folders);

  const documents = INIT_DOCS.map((d) => ({
    ...mapRecord('documents', d, 'toDb'),
    id: genId(d.id),
    folder_id: genId(d.folderId),
    client_id: d.clientId ? genId(d.clientId) : null,
    uploaded_by: userId,
    profile_id: userId,
  }));
  await supabase.from('documents').insert(documents);

  const emails = INIT_EMAILS.map((e) => ({
    ...mapRecord('emails', e, 'toDb'),
    id: genId(e.id),
    client_id: e.clientId ? genId(e.clientId) : null,
    task_linked: e.taskLinked ? e.taskLinked : null,
    profile_id: userId,
  }));
  await supabase.from('emails').insert(emails);
}

const getGeminiConfig = () => {
  const custom = process.env.CUSTOM_GEMINI_KEY?.trim();
  const system = process.env.GEMINI_API_KEY?.trim();
  if (custom && custom.startsWith('AIza') && custom.length > 20) return { key: custom, source: 'custom' };
  if (system && system.startsWith('AIza') && system.length > 20) return { key: system, source: 'system' };
  return { key: null, source: 'none' };
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '') || '/';
  const method = event.httpMethod;
  const body = parseBody(event.body);

  try {
    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = body;
      let result = await supabase.auth.signInWithPassword({ email, password });

      if (result.error && String(email || '').toLowerCase() === DEMO_EMAIL) {
        const signUpResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: 'Demo User',
            },
          },
        });
        if (signUpResult.error) return json(400, { error: signUpResult.error.message });
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) return json(400, { error: result.error.message });
      return json(200, { session: result.data.session, user: result.data.user });
    }

    if (path === '/auth/signup' && method === 'POST') {
      const { email, password, options } = body;
      const { data, error } = await supabase.auth.signUp({ email, password, options });
      if (error) return json(400, { error: error.message });
      return json(200, { session: data.session, user: data.user });
    }

    if (path === '/auth/me' && method === 'GET') {
      const auth = await requireUser(event);
      if ('error' in auth) return json(auth.error.statusCode, auth.error.body);
      return json(200, { user: auth.user });
    }

    if (path === '/seed-demo' && method === 'POST') {
      const auth = await requireUser(event);
      if ('error' in auth) return json(auth.error.statusCode, auth.error.body);
      if (auth.user.email?.toLowerCase() !== DEMO_EMAIL) {
        return json(403, { error: 'Seeding is only allowed for the demo account.' });
      }

      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', auth.user.id);
      if ((count || 0) > 0) return json(200, { success: true, seeded: false });

      await seedUserData(auth.user.id);
      return json(200, { success: true, seeded: true });
    }

    if (path === '/ai/status' && method === 'GET') {
      const { key, source } = getGeminiConfig();
      return json(200, {
        configured: !!key,
        model: 'gemini-2.0-flash',
        key_source: source,
      });
    }

    if (path === '/ai/generate' && method === 'POST') {
      const auth = await requireUser(event);
      if ('error' in auth) return json(auth.error.statusCode, auth.error.body);

      const { prompt, responseSchema } = body;
      const { key } = getGeminiConfig();
      if (!key) return json(500, { error: 'Gemini API key is not configured on the backend.' });

      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
        return json(200, { text: response.text });
      } catch (error: any) {
        const message = error?.message || 'AI request failed.';
        return json(message.includes('429') || message.toLowerCase().includes('quota') ? 429 : 500, { error: message });
      }
    }

    const dataMatch = path.match(/^\/data\/([^/]+)(?:\/([^/]+))?$/);
    if (dataMatch) {
      const auth = await requireUser(event);
      if ('error' in auth) return json(auth.error.statusCode, auth.error.body);

      const [, table, id] = dataMatch;
      const config = tableConfig[table];
      if (!config) return json(400, { error: `Unsupported table: ${table}` });

      if (method === 'GET') {
        let query = supabase.from(table).select('*');
        if (table === 'profiles' && auth.user.email?.toLowerCase() === DEMO_EMAIL) {
          query = query;
        } else {
          query = config.listQuery ? config.listQuery(query, auth.user.id) : config.ownerField ? query.eq(config.ownerField, auth.user.id) : query;
        }
        const { data, error } = await query;
        if (error) return json(400, { error: error.message });
        return json(200, mapRows(table, data || []));
      }

      const dbBody = mapRecord(table, body, 'toDb');

      if (method === 'POST') {
        const payload = config.assignOwner ? config.assignOwner(dbBody, auth.user.id) : config.ownerField ? { ...dbBody, [config.ownerField]: auth.user.id } : dbBody;
        const { data, error } = await supabase.from(table).insert(payload).select();
        if (error) return json(400, { error: error.message });
        return json(201, mapRows(table, data || []));
      }

      if (method === 'PATCH' && id) {
        let query = supabase.from(table).update(dbBody).eq('id', id);
        query = config.ownerField ? query.eq(config.ownerField, auth.user.id) : query;
        const { data, error } = await query.select();
        if (error) return json(400, { error: error.message });
        return json(200, mapRows(table, data || []));
      }

      if (method === 'DELETE' && id) {
        let query = supabase.from(table).delete().eq('id', id);
        query = config.ownerField ? query.eq(config.ownerField, auth.user.id) : query;
        const { error } = await query;
        if (error) return json(400, { error: error.message });
        return json(200, { success: true });
      }
    }

    return json(404, { error: 'Not found', path });
  } catch (error: any) {
    return json(500, { error: error?.message || 'Unexpected server error.' });
  }
};
