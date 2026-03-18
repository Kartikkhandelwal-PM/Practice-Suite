import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('[Server] Initializing Supabase...');
if (!supabaseUrl.startsWith('http')) {
  console.error('[Server] CRITICAL: SUPABASE_URL is invalid! It should start with https://');
} else {
  console.log('[Server] Supabase URL:', supabaseUrl);
}

if (supabaseServiceKey) {
  console.log('[Server] Service Role Key found (length):', supabaseServiceKey.length);
  console.log('[Server] Service Role Key starts with:', supabaseServiceKey.substring(0, 10) + '...');
} else {
  console.error('[Server] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Auth Endpoints
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      res.json({ user: data.user, session: data.session });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        try {
          await supabase.from('user_profiles').insert({
            id: data.user.id,
            full_name: name
          });
        } catch (profileErr) {
          console.error('Error creating user profile:', profileErr);
        }
      }

      res.json({ user: data.user, session: data.session });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Data Endpoints (Generic proxy for Supabase tables)
  app.get('/api/data/:table', async (req, res) => {
    const { table } = req.params;
    const { select = '*', eq_field, eq_value } = req.query;
    
    console.log(`[Server] GET /api/data/${table} - Select: ${select}, Eq: ${eq_field}=${eq_value}`);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Server] Supabase credentials missing!');
      return res.status(500).json({ error: 'Supabase credentials missing on server' });
    }

    try {
      let query = supabase.from(table).select(select as string);
      
      if (eq_field && eq_value) {
        query = query.eq(eq_field as string, eq_value as string);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`[Server] Supabase Fetch Error from ${table}:`, JSON.stringify(error, null, 2));
        return res.status(error.code === '42501' ? 403 : 500).json({ error: error.message, details: error });
      }
      console.log(`[Server] Supabase Fetch Success from ${table}:`, data?.length || 0, 'items');
      res.json(data);
    } catch (error: any) {
      console.error(`[Server] Unexpected Error fetching from ${table}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/data/:table', async (req, res) => {
    const { table } = req.params;
    const payload = req.body;
    
    console.log(`[Server] POST /api/data/${table} - Payload:`, payload);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Server] Supabase credentials missing!');
      return res.status(500).json({ error: 'Supabase credentials missing on server' });
    }

    try {
      const { data, error } = await supabase.from(table).insert(payload).select();
      if (error) {
        console.error(`[Server] Supabase Insert Error into ${table}:`, JSON.stringify(error, null, 2));
        return res.status(error.code === '42501' ? 403 : 500).json({ error: error.message, details: error });
      }
      console.log(`[Server] Supabase Insert Success into ${table}:`, data?.length || 0, 'items');
      res.json(Array.isArray(payload) ? data : data?.[0]);
    } catch (error: any) {
      console.error(`[Server] Unexpected Error inserting into ${table}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/data/:table', async (req, res) => {
    const { table } = req.params;
    const { id, ...payload } = req.body;
    
    try {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
      if (error) {
        console.error(`[Server] Supabase Update Error on ${table}:`, JSON.stringify(error, null, 2));
        return res.status(error.code === '42501' ? 403 : 500).json({ error: error.message, details: error });
      }
      res.json(data?.[0]);
    } catch (error: any) {
      console.error(`[Server] Unexpected Error updating ${table}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/data/:table', async (req, res) => {
    const { table } = req.params;
    const { id } = req.query;
    
    try {
      const { error } = await supabase.from(table).delete().eq('id', id as string);
      if (error) {
        console.error(`[Server] Supabase Delete Error on ${table}:`, JSON.stringify(error, null, 2));
        return res.status(error.code === '42501' ? 403 : 500).json({ error: error.message, details: error });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error(`[Server] Unexpected Error deleting from ${table}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Summary Endpoints
  app.post('/api/ai/generate', async (req, res) => {
    const { prompt, type } = req.body;
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));

    let resultText = "";
    if (type === 'summary' || prompt.includes('summary')) {
      resultText = JSON.stringify({
        title: "GSTR-3B Filing & Reconciliation",
        overview: "This task involves the monthly GSTR-3B filing. It requires reconciliation of GSTR-2B data and verification of tax liability.",
        steps: [
          "Download GSTR-2B for the current month",
          "Reconcile ITC with purchase register",
          "Verify tax liability from GSTR-1",
          "File GSTR-3B before the 20th"
        ],
        suggestedReply: "<p>Dear Client,</p><p>We have received your documents for GSTR-3B filing. We are currently reconciling the data and will update you shortly.</p><p>Best regards,<br>KDK Practice Suite</p>"
      });
    } else if (type === 'email' || prompt.includes('professional')) {
      resultText = JSON.stringify({
        subject: "Update on your Tax Compliance",
        body: "<p>Dear Client,</p><p>This is a follow-up regarding your tax compliance status. We have processed the initial documents and everything looks in order.</p><p>Best regards,<br>KDK Practice Suite</p>"
      });
    } else {
      resultText = "AI processing completed successfully (Mock Mode).";
    }

    res.json({ text: resultText });
  });

  app.get('/api/ai/status', (req, res) => {
    res.json({ configured: !!process.env.GEMINI_API_KEY, model: "gemini-1.5-flash" });
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
