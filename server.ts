import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { INIT_TASKS, INIT_CLIENTS, INIT_USERS, INIT_DEADLINES, INIT_TEMPLATES, INIT_MEETINGS, INIT_NOTES, INIT_PASSWORDS, INIT_DOCS, INIT_FOLDERS, INIT_EMAILS, INIT_TASK_TYPES, INIT_WORKFLOWS } from './src/data';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qbahoewrmbrhxmstnvje.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

import { GoogleGenAI, Type } from "@google/genai";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Removed top-level AI instance to ensure we always use the latest key from environment

// Seed Data
async function seedData() {
  console.log('Checking if database needs seeding...');
  
  try {
    const { data: tasks } = await supabase.from('tasks').select('id').limit(1);
    if (tasks && tasks.length > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }
  } catch (e) {
    console.log('Error checking tasks, tables might not exist yet:', e);
    return;
  }

  console.log('Seeding database with sample data...');

  // Map string IDs to UUIDs for tables that require UUIDs
  const idMap: Record<string, string> = {};
  const genId = (oldId: string) => {
    if (!idMap[oldId]) idMap[oldId] = crypto.randomUUID();
    return idMap[oldId];
  };

  try {
    // 1. Workflows
    const workflows = INIT_WORKFLOWS.map(w => ({ ...w, id: genId(w.id) }));
    await supabase.from('workflows').insert(workflows);

    // 2. Task Types
    const taskTypes = INIT_TASK_TYPES.map(tt => ({ ...tt, id: genId(tt.id), workflow_id: genId(tt.workflowId) }));
    await supabase.from('task_types').insert(taskTypes);

    // 3. Profiles (Users)
    // Note: Profiles usually reference auth.users. 
    // For seeding, we'll just insert them as is, but in a real app they'd be created on signup.
    const profiles = INIT_USERS.map(u => ({ ...u, id: genId(u.id) }));
    await supabase.from('profiles').insert(profiles);

    // 4. Clients
    const clients = INIT_CLIENTS.map(c => ({ 
      ...c, 
      id: genId(c.id), 
      manager: genId(c.manager) 
    }));
    await supabase.from('clients').insert(clients);

    // 5. Tasks
    const tasks = INIT_TASKS.map(t => ({
      ...t,
      client_id: genId(t.clientId),
      assignee_id: genId(t.assigneeId),
      reviewer_id: genId(t.reviewerId),
      parent_id: t.parentId ? t.parentId : null // Tasks use text IDs, so no mapping needed for KDK-1
    }));
    await supabase.from('tasks').insert(tasks);

    // 6. Deadlines
    const deadlines = INIT_DEADLINES.map(d => ({ ...d, id: genId(d.id) }));
    await supabase.from('deadlines').insert(deadlines);

    // 7. Templates
    const templates = INIT_TEMPLATES.map(t => ({ ...t, id: genId(t.id) }));
    await supabase.from('templates').insert(templates);

    // 8. Meetings
    const meetings = INIT_MEETINGS.map(m => ({
      ...m,
      id: genId(m.id),
      client_id: genId(m.clientId),
      attendees: m.attendees.map(a => genId(a))
    }));
    await supabase.from('meetings').insert(meetings);

    // 9. Notes
    const notes = INIT_NOTES.map(n => ({ ...n, id: genId(n.id) }));
    await supabase.from('notes').insert(notes);

    // 10. Passwords
    const passwords = INIT_PASSWORDS.map(p => ({ ...p, id: genId(p.id), client_id: genId(p.clientId) }));
    await supabase.from('passwords').insert(passwords);

    // 11. Folders
    const folders = INIT_FOLDERS.map(f => ({ ...f, id: genId(f.id), parent_id: f.parentId ? genId(f.parentId) : null, client_id: f.clientId ? genId(f.clientId) : null }));
    await supabase.from('folders').insert(folders);

    // 12. Documents
    const docs = INIT_DOCS.map(d => ({ ...d, id: genId(d.id), folder_id: genId(d.folderId), client_id: d.clientId ? genId(d.clientId) : null, uploaded_by: genId(d.uploadedBy) }));
    await supabase.from('documents').insert(docs);

    // 13. Emails
    const emails = INIT_EMAILS.map(e => ({
      ...e,
      id: genId(e.id),
      client_id: e.clientId ? genId(e.clientId) : null,
      task_linked: e.taskLinked ? e.taskLinked : null, // Tasks use text IDs
      from_name: e.from,
      from_email: e.fromEmail,
      to_email: e.to
    }));
    // Remove original keys that don't match DB schema
    const cleanedEmails = emails.map(({ from, fromEmail, to, taskLinked, ...rest }) => rest);
    await supabase.from('emails').insert(cleanedEmails);

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Error during seeding:', err);
  }
}

async function startServer() {
  await seedData();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error });
    res.json(data);
  });

  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, options } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    if (error) return res.status(400).json({ error });
    res.json(data);
  });

  app.get('/api/auth/session', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error });
    res.json({ user });
  });

  // Data Routes
  app.get('/api/data/:table', async (req, res) => {
    const { table } = req.params;
    const { data, error } = await supabase.from(table).select('*');
    if (error) return res.status(400).json({ error });
    res.json(data);
  });

  app.post('/api/data/:table', async (req, res) => {
    const { table } = req.params;
    const { data, error } = await supabase.from(table).insert(req.body).select();
    if (error) return res.status(400).json({ error });
    res.json(data);
  });

  app.patch('/api/data/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    const { data, error } = await supabase.from(table).update(req.body).eq('id', id).select();
    if (error) return res.status(400).json({ error });
    res.json(data);
  });

  app.delete('/api/data/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return res.status(400).json({ error });
    res.json({ success: true });
  });

  // Gemini AI Route
  app.get('/api/ai/status', (req, res) => {
    const key = process.env.CUSTOM_GEMINI_KEY || process.env.GEMINI_API_KEY;
    const isConfigured = !!key && key !== "AI Studio Free Tier" && key.startsWith('AIza');
    res.json({ 
      configured: isConfigured,
      model: "gemini-3-flash-preview",
      key_source: process.env.CUSTOM_GEMINI_KEY ? 'custom' : 'system'
    });
  });

  app.post('/api/ai/generate', async (req, res) => {
    const { prompt, responseSchema } = req.body;
    let apiKey = process.env.CUSTOM_GEMINI_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) apiKey = apiKey.trim();
    
    // Ignore the placeholder string if it's passed literally
    if (apiKey === "AI Studio Free Tier" || !apiKey?.startsWith('AIza')) {
      apiKey = process.env.CUSTOM_GEMINI_KEY?.trim();
    }

    console.log('AI Request received. Key found:', !!apiKey);
    if (apiKey) {
      console.log('Key starts with:', apiKey.substring(0, 8), '... length:', apiKey.length);
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
      console.log('Gemini Response:', response.text);
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Gemini Error:', error);
      let errorMessage = error.message;
      if (errorMessage.includes('API key not valid')) {
        errorMessage = 'The Gemini API key provided is invalid. Please update it in the application settings.';
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
