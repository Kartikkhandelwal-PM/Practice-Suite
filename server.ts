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
import crypto from 'crypto';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Removed top-level AI instance to ensure we always use the latest key from environment

// Seed Data Function
async function seedUserData(userId: string, userSupabase: any) {
  console.log(`Seeding database for user: ${userId}...`);

  // Map string IDs to UUIDs for tables that require UUIDs
  const idMap: Record<string, string> = {};
  const genId = (oldId: string) => {
    if (!idMap[oldId]) idMap[oldId] = crypto.randomUUID();
    return idMap[oldId];
  };

  try {
    // 1. Workflows
    const workflows = INIT_WORKFLOWS.map(w => ({ ...w, id: genId(w.id) }));
    await userSupabase.from('workflows').insert(workflows);

    // 2. Task Types
    const taskTypes = INIT_TASK_TYPES.map(tt => ({ ...tt, id: genId(tt.id), workflowId: genId(tt.workflowId) }));
    await userSupabase.from('task_types').insert(taskTypes);

    // 3. Profiles (Users)
    const profiles = INIT_USERS.map(u => ({
      id: genId(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
      designation: u.designation,
      color: u.color,
      active: u.active,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`
    }));
    await userSupabase.from('profiles').insert(profiles);

    // 4. Clients
    const clients = INIT_CLIENTS.map(c => ({ 
      ...c, 
      id: genId(c.id), 
      manager: genId(c.manager)
    }));
    await userSupabase.from('clients').insert(clients);

    // 5. Tasks
    const tasks = INIT_TASKS.map(t => ({
      ...t,
      clientId: genId(t.clientId),
      assigneeId: userId,
      reviewerId: genId(t.reviewerId),
      reporterId: userId,
      parentId: t.parentId ? genId(t.parentId) : null
    }));
    await userSupabase.from('tasks').insert(tasks);

    // 6. Deadlines
    const deadlines = INIT_DEADLINES.map(d => ({ ...d, id: genId(d.id) }));
    await userSupabase.from('deadlines').insert(deadlines);

    // 7. Templates
    const templates = INIT_TEMPLATES.map(t => ({ ...t, id: genId(t.id) }));
    await userSupabase.from('templates').insert(templates);

    // 8. Meetings
    const meetings = INIT_MEETINGS.map(m => ({
      ...m,
      id: genId(m.id),
      clientId: genId(m.clientId),
      attendees: [userId, ...m.attendees.map(a => genId(a))]
    }));
    await userSupabase.from('meetings').insert(meetings);

    // 9. Notes
    const notes = INIT_NOTES.map(n => ({ ...n, id: genId(n.id) }));
    await userSupabase.from('notes').insert(notes);

    // 10. Passwords
    const passwords = INIT_PASSWORDS.map(p => ({
      ...p,
      id: genId(p.id),
      clientId: genId(p.clientId)
    }));
    await userSupabase.from('passwords').insert(passwords);

    // 11. Folders
    const folders = INIT_FOLDERS.map(f => ({
      ...f,
      id: genId(f.id),
      parentId: f.parentId ? genId(f.parentId) : null,
      clientId: f.clientId ? genId(f.clientId) : null
    }));
    await userSupabase.from('folders').insert(folders);

    // 12. Documents
    const docs = INIT_DOCS.map(d => ({
      ...d,
      id: genId(d.id),
      folderId: genId(d.folderId),
      clientId: d.clientId ? genId(d.clientId) : null,
      uploadedBy: userId
    }));
    await userSupabase.from('documents').insert(docs);

    // 13. Emails
    const emails = INIT_EMAILS.map(e => ({
      ...e,
      id: genId(e.id),
      clientId: e.clientId ? genId(e.clientId) : null,
      taskLinked: e.taskLinked ? genId(e.taskLinked) : null
    }));
    await userSupabase.from('emails').insert(emails);

    console.log(`Seeding completed for user: ${userId}`);
    return { success: true };
  } catch (err) {
    console.error('Error during seeding:', err);
    throw err;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Seeding endpoint
  app.post('/api/seed-demo', async (req, res) => {
    const { userId, email, token } = req.body;
    if (email.toLowerCase() !== 'kartikkhandelwal1104@gmail.com') {
      return res.status(403).json({ error: 'Seeding only allowed for demo account.' });
    }
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    try {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });
      const result = await seedUserData(userId, userSupabase);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // If login fails for demo user, try to sign them up automatically
    if (error && email.toLowerCase() === 'kartikkhandelwal1104@gmail.com') {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: 'Demo User',
            avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'
          }
        }
      });
      
      if (signUpError) return res.status(400).json({ error: signUpError });
      return res.json(signUpData);
    }

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

  // --- Gemini AI Integration ---
  const getGeminiConfig = () => {
    const custom = process.env.CUSTOM_GEMINI_KEY?.trim();
    const system = process.env.GEMINI_API_KEY?.trim();
    
    // Prioritize CUSTOM_GEMINI_KEY if it's a valid key
    if (custom && custom.startsWith('AIza') && custom.length > 20) {
      return { key: custom, source: 'custom' };
    }
    
    // Fallback to GEMINI_API_KEY if it's a valid key
    if (system && system.startsWith('AIza') && system.length > 20) {
      return { key: system, source: 'system' };
    }
    
    return { key: null, source: 'none' };
  };

  async function generateWithRetry(ai: any, params: any, maxRetries = 3) {
    let lastError;
    const models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-3.1-pro-preview"];
    
    for (let i = 0; i < maxRetries; i++) {
      // Try different models on each retry if it's a quota issue
      const currentModel = models[i % models.length];
      const currentParams = { ...params, model: currentModel };
      
      try {
        console.log(`Attempting AI generation with model: ${currentModel} (Attempt ${i + 1}/${maxRetries})`);
        return await ai.models.generateContent(currentParams);
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        const isQuotaError = errorMsg.includes('429') || 
                            errorMsg.includes('quota') || 
                            errorMsg.includes('RESOURCE_EXHAUSTED');
        
        const isAuthError = errorMsg.includes('API_KEY_INVALID') || 
                           errorMsg.includes('401') || 
                           errorMsg.includes('403');

        if (isAuthError) {
          throw new Error("AI Integration Error: The API key provided is invalid or does not have permission to use this model. Please check your AI Studio settings.");
        }

        if (isQuotaError && i < maxRetries - 1) {
          // Exponential backoff: 2s, 4s, 8s... + jitter
          const delay = Math.pow(2, i + 1) * 1000 + Math.random() * 1000;
          console.log(`AI Quota exceeded for ${currentModel}, retrying with next model in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not a quota error or we're out of retries, throw a descriptive error
        if (isQuotaError) {
          throw new Error("AI Quota Limit Reached: You have exceeded the free tier usage limits for all available models. Please wait a minute or provide a personal Google AI API key (CUSTOM_GEMINI_KEY) in settings for higher limits.");
        }
        
        throw new Error(`AI Service Error: ${errorMsg || "An unexpected error occurred during generation."}`);
      }
    }
    throw lastError;
  }

  app.get('/api/ai/status', (req, res) => {
    const { key, source } = getGeminiConfig();
    res.json({ 
      configured: !!key,
      model: "gemini-3-flash-preview (with fallback)",
      key_source: source
    });
  });

  app.post('/api/ai/generate', async (req, res) => {
    const { prompt, responseSchema } = req.body;
    const { key: apiKey, source } = getGeminiConfig();

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'AI Configuration Missing: Gemini API key not found. Please add CUSTOM_GEMINI_KEY to your environment variables in AI Studio settings.' 
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await generateWithRetry(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error(`Gemini Error (${source}):`, error);
      const errorMsg = error?.message || String(error);
      res.status(errorMsg.includes('Quota') ? 429 : 500).json({ 
        error: errorMsg,
        details: error?.stack
      });
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
