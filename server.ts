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
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('[Server] Initializing Supabase...');
const isPlaceholderUrl = !supabaseUrl || supabaseUrl === 'your_supabase_project_url';
const isPlaceholderKey = !supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key' || supabaseServiceKey === 'your_supabase_anon_key';

if (isPlaceholderUrl) {
  console.error('[Server] CRITICAL: SUPABASE_URL is not configured! Please set it in the AI Studio Secrets.');
} else {
  console.log('[Server] Supabase URL:', supabaseUrl);
}

if (isPlaceholderKey) {
  console.error('[Server] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not configured! Please set it in the AI Studio Secrets.');
} else {
  // Diagnostic: Check if it's likely a service_role key
  try {
    const parts = supabaseServiceKey.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('[Server] Supabase Key Role:', payload.role);
      if (payload.role !== 'service_role') {
        console.warn('[Server] ⚠️ WARNING: The provided key is an "' + payload.role + '" key, NOT a "service_role" key.');
        console.warn('[Server] ⚠️ Row Level Security (RLS) WILL be enforced on the server, which may cause 403 Forbidden errors.');
        console.warn('[Server] ⚠️ Please ensure you have copied the "service_role" secret from Supabase Settings > API.');
      } else {
        console.log('[Server] ✅ Using service_role key. RLS will be bypassed.');
      }
    }
  } catch (e) {
    console.warn('[Server] Could not decode Supabase key for diagnostics');
  }
}

let supabaseAdmin: any = null;
try {
  if (supabaseUrl && !isPlaceholderUrl && supabaseServiceKey && !isPlaceholderKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    console.log('[Server] Supabase Admin client initialized successfully');
  } else {
    console.warn('[Server] Supabase Admin client NOT initialized due to missing or placeholder credentials');
  }
} catch (e: any) {
  console.error('[Server] Failed to initialize Supabase Admin client:', e.message);
}

// Helper to get a Supabase client for a specific request
const getSupabaseClient = (req: any) => {
  // We always use the admin client to bypass RLS on the server side.
  // Multi-tenancy is handled by the 'tenant_id' filter passed from the frontend.
  return supabaseAdmin;
};

// Middleware to verify JWT if present
const verifyAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Allow unauthenticated for now, or block if needed
  }
  
  const token = authHeader.split(' ')[1];
  try {
    if (supabaseAdmin) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        req.user = user;
      }
    }
  } catch (e) {
    console.error('[Server] Auth verification failed:', e);
  }
  next();
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Helper to safely log errors without causing EPIPE or other issues
  const logError = (message: string, error: any) => {
    const safeError = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : (typeof error === 'object' ? { ...error } : error);
    
    // Avoid logging massive objects
    const logObj = JSON.parse(JSON.stringify(safeError));
    if (logObj.details && typeof logObj.details === 'object') {
      // Truncate details if too large
      const detailsStr = JSON.stringify(logObj.details);
      if (detailsStr.length > 1000) {
        logObj.details = detailsStr.substring(0, 1000) + '... [TRUNCATED]';
      }
    }
    
    console.error(`[Server] ${message}:`, logObj);
    return logObj;
  };

  // Middleware to check Supabase credentials
  const checkSupabase = (req: any, res: any, next: any) => {
    if (isPlaceholderUrl || isPlaceholderKey) {
      return res.status(500).json({ 
        error: 'Supabase credentials are not configured.',
        details: 'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the AI Studio Secrets.',
        isConfigError: true
      });
    }
    next();
  };

  // Health check and diagnostics
  app.get('/api/health', async (req, res) => {
    const diagnostics: any = {
      status: 'ok',
      supabaseConfigured: !isPlaceholderUrl && !isPlaceholderKey,
      env: {
        url: isPlaceholderUrl ? 'MISSING' : 'PRESENT',
        key: isPlaceholderKey ? 'MISSING' : 'PRESENT'
      },
      tableStatus: {}
    };

    if (diagnostics.supabaseConfigured) {
      try {
        const client = getSupabaseClient(req);
        
        // Check key role again for health check
        try {
          const parts = supabaseServiceKey.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            diagnostics.keyRole = payload.role;
          }
        } catch (e) {}

        // Try a very simple query to test connection
        const { data, error } = await client.from('user_profiles').select('id').limit(1);
        
        if (error) {
          diagnostics.supabaseConnection = error.code === '42P01' ? 'TABLE_MISSING' : 'FAILED';
          diagnostics.supabaseError = {
            message: error.message,
            code: error.code,
            hint: error.hint
          };
          
          if (error.code === '42501') {
            diagnostics.authIssue = 'Permission Denied (42501). This confirms RLS is blocking the server. Please ensure you are using the SERVICE_ROLE key, not the ANON key.';
          }
        } else {
          diagnostics.supabaseConnection = 'SUCCESS';
          diagnostics.sampleData = data;
        }

        // Check all critical tables
        const tables = ['user_profiles', 'clients', 'tasks', 'notes', 'workflows', 'task_types', 'roles', 'permissions'];
        for (const table of tables) {
          const { error: tError } = await client.from(table).select('id').limit(1);
          diagnostics.tableStatus[table] = !tError || tError.code !== '42P01';
        }
      } catch (err: any) {
        diagnostics.supabaseConnection = 'CRASHED';
        diagnostics.supabaseError = err.message;
      }
    }

    res.json(diagnostics);
  });

  // Auth Endpoints
  app.post('/api/auth/login', checkSupabase, async (req, res) => {
    const { email, password } = req.body;
    try {
      const client = getSupabaseClient(req);
      const { data, error } = await client.auth.signInWithPassword({
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
      const client = getSupabaseClient(req);
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });

      if (error) throw error;

      res.json({ user: data.user, session: data.session });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Data Endpoints (Generic proxy for Supabase tables)
  app.get('/api/data/:table', checkSupabase, verifyAuth, async (req, res) => {
    const { table } = req.params;
    const { select = '*', eq_field, eq_value, or } = req.query;
    
    console.log(`[Server] Incoming GET /api/data/${table}`);
    
    try {
      const client = getSupabaseClient(req);
      if (!client) throw new Error('Supabase client not initialized');
      
      let query = client.from(table).select(select as string);
      
      // Handle multiple eq filters
      const eqFields = Array.isArray(eq_field) ? eq_field : (eq_field ? [eq_field] : []);
      const eqValues = Array.isArray(eq_value) ? eq_value : (eq_value ? [eq_value] : []);
      
      eqFields.forEach((field, index) => {
        const value = eqValues[index];
        if (field && value) {
          query = query.eq(field as string, value as string);
        }
      });

      if (or) {
        query = query.or(or as string);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`[Server] Supabase Fetch Error from ${table}:`, JSON.stringify(error, null, 2));
        const safeError = logError(`Supabase Fetch Error from ${table}`, error);
        let status = 500;
        if (error.code === '42501') {
          status = 403; // Permission denied
        }
        if (error.code === '42P01') status = 404; // Table not found
        if (error.code === '42703') status = 400; // Column not found
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(status).json({ 
          error: error.message, 
          details: safeError,
          code: error.code,
          hint: error.hint,
          isPermissionError: error.code === '42501'
        });
      }
      console.log(`[Server] Supabase Fetch Success from ${table}:`, data?.length || 0, 'items');
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } catch (error: any) {
      console.error(`[Server] Unexpected Error fetching from ${table}:`, error);
      const safeError = logError(`Unexpected Error fetching from ${table}`, error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: error.message, details: safeError });
    }
  });

  app.post('/api/data/:table', checkSupabase, verifyAuth, async (req, res) => {
    const { table } = req.params;
    const { upsert, on_conflict } = req.query;
    const payload = req.body;
    
    console.log(`[Server] Incoming POST /api/data/${table}`);
    
    if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0 && !Array.isArray(payload))) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: "Empty payload provided" });
    }
    
    try {
      const client = getSupabaseClient(req);
      if (!client) throw new Error('Supabase client not initialized');
      
      let query: any = client.from(table);
      
      if (upsert === 'true') {
        query = query.upsert(payload, { onConflict: on_conflict as string });
      } else {
        query = query.insert(payload);
      }

      const { data, error } = await query.select();
      
      if (error) {
        console.error(`[Server] Supabase ${upsert === 'true' ? 'Upsert' : 'Insert'} Error into ${table}:`, JSON.stringify(error, null, 2));
        const safeError = logError(`Supabase ${upsert === 'true' ? 'Upsert' : 'Insert'} Error into ${table}`, error);
        let status = 500;
        if (error.code === '42501') status = 403;
        if (error.code === '42P01') status = 404;
        if (error.code === '42703') status = 400;
        if (error.code === '23503') status = 400;
        if (error.code === '23505') status = 409;
        if (error.code === '23502') status = 400;
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(status).json({ 
          error: error.message, 
          details: safeError,
          code: error.code,
          hint: error.hint,
          isPermissionError: error.code === '42501'
        });
      }
      console.log(`[Server] Supabase ${upsert === 'true' ? 'Upsert' : 'Insert'} Success into ${table}:`, data?.length || 0, 'items');
      res.setHeader('Content-Type', 'application/json');
      res.json(Array.isArray(payload) ? data : data?.[0]);
    } catch (error: any) {
      console.error(`[Server] Unexpected Error inserting into ${table}:`, error);
      const safeError = logError(`Unexpected Error inserting into ${table}`, error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: error.message, details: safeError });
    }
  });

  app.put('/api/data/:table', checkSupabase, verifyAuth, async (req, res) => {
    const { table } = req.params;
    const payload = req.body;
    const { eq_field, eq_value } = req.query;
    
    if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: "Empty payload provided" });
    }
    
    console.log(`[Server] PUT /api/data/${table}`);
    
    try {
      const client = getSupabaseClient(req);
      if (!client) throw new Error('Supabase client not initialized');
      
      let query = client.from(table).update(payload);
      
      if (Array.isArray(eq_field)) {
        (eq_field as string[]).forEach((field, i) => {
          query = query.eq(field, (eq_value as string[])[i]);
        });
      } else if (eq_field) {
        query = query.eq(eq_field as string, eq_value as string);
      } else if (payload.id) {
        query = query.eq('id', payload.id);
        const { id, ...rest } = payload;
        query = client.from(table).update(rest).eq('id', id);
      } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: "Missing update criteria (id or eq_field)" });
      }
      
      const { data, error } = await query.select();
      
      if (error) {
        console.error(`[Server] Supabase Update Error on ${table}:`, JSON.stringify(error, null, 2));
        const safeError = logError(`Supabase Update Error on ${table}`, error);
        const status = error.code === '42501' ? 403 : 500;
        res.setHeader('Content-Type', 'application/json');
        return res.status(status).json({ 
          error: error.message, 
          details: safeError,
          code: error.code,
          hint: error.hint,
          isPermissionError: error.code === '42501'
        });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.json(data?.[0] || payload);
    } catch (error: any) {
      const safeError = logError(`Unexpected Error updating ${table}`, error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: error.message, details: safeError });
    }
  });

  app.delete('/api/data/:table', checkSupabase, verifyAuth, async (req, res) => {
    const { table } = req.params;
    const { eq_field, eq_value, id } = req.query;
    
    console.log(`[Server] DELETE /api/data/${table}`);
    
    try {
      const client = getSupabaseClient(req);
      if (!client) throw new Error('Supabase client not initialized');
      
      let query = client.from(table).delete();
      
      if (Array.isArray(eq_field)) {
        (eq_field as string[]).forEach((field, i) => {
          query = query.eq(field, (eq_value as string[])[i]);
        });
      } else if (eq_field) {
        query = query.eq(eq_field as string, eq_value as string);
      } else if (id) {
        query = query.eq('id', id as string);
      } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: "Missing delete criteria (id or eq_field)" });
      }
      
      const { error } = await query;
      
      if (error) {
        console.error(`[Server] Supabase Delete Error on ${table}:`, JSON.stringify(error, null, 2));
        const safeError = logError(`Supabase Delete Error on ${table}`, error);
        const status = error.code === '42501' ? 403 : 500;
        res.setHeader('Content-Type', 'application/json');
        return res.status(status).json({ 
          error: error.message, 
          details: safeError,
          code: error.code,
          hint: error.hint,
          isPermissionError: error.code === '42501'
        });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.json({ success: true });
    } catch (error: any) {
      const safeError = logError(`Unexpected Error deleting from ${table}`, error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: error.message, details: safeError });
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

  // Catch-all for API routes that don't exist
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[Server] Global Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
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
