import { GoogleGenAI } from "@google/genai";
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import axios from 'axios';
import cookieParser from 'cookie-parser';

dotenv.config();

// Initialize Supabase Admin client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
// CRITICAL: We MUST use the service_role key for the admin client to bypass RLS.
// Falling back to the anon key will cause 403 Forbidden errors for many backend operations.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// AI Initialization
const geminiKey = process.env.CUSTOM_GEMINI_KEY || process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: geminiKey });

// Google OAuth Setup
const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/auth/google/callback`
);

console.log('[Server] OAuth Config:');
console.log('  - APP_URL:', process.env.APP_URL);
console.log('  - GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set');
console.log('  - GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/auth/google/callback`);

// Microsoft OAuth Setup
const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

console.log('[Server] Initializing Supabase...');
const isPlaceholderUrl = !supabaseUrl || supabaseUrl === 'your_supabase_project_url';
const isPlaceholderKey = !supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key';

if (isPlaceholderUrl) {
  console.error('[Server] ❌ CRITICAL: SUPABASE_URL is not configured! Please set it in the AI Studio Secrets.');
} else {
  const maskedUrl = supabaseUrl.replace(/(https:\/\/)(.*)(\.supabase\.co)/, '$1***$3');
  console.log('[Server] Supabase URL:', maskedUrl);
}

if (isPlaceholderKey) {
  console.error('[Server] ❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not configured! Please set it in the AI Studio Secrets.');
  console.error('[Server] 💡 Without this key, backend operations like email sync will fail with "Permission Denied" (403) errors.');
  if (supabaseAnonKey) {
    console.warn('[Server] ⚠️ Found an ANON key, but it cannot be used for admin operations. Please provide the SERVICE_ROLE key.');
  }
} else {
  // Diagnostic: Check if it's likely a service_role key
  try {
    const parts = supabaseServiceKey.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('[Server] Supabase Key Role:', payload.role);
      if (payload.role !== 'service_role') {
        console.warn('[Server] ⚠️ WARNING: The provided key is an "' + payload.role + '" key, NOT a "service_role" key.');
        console.warn('[Server] ⚠️ Row Level Security (RLS) WILL be enforced on the server, which will cause 403 Forbidden errors for many operations.');
        console.warn('[Server] ⚠️ Please ensure you have copied the "service_role" secret from Supabase Settings > API.');
      } else {
        console.log('[Server] ✅ Using service_role key. RLS will be bypassed for server-side operations.');
      }
    }
  } catch (e) {
    console.warn('[Server] Could not decode Supabase key for diagnostics');
  }
}

let supabaseAdmin: any = null;
let isServiceRole = false;

try {
  if (supabaseUrl && !isPlaceholderUrl && supabaseServiceKey && !isPlaceholderKey) {
    // Diagnostic: Check if it's likely a service_role key
    try {
      const parts = supabaseServiceKey.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.role === 'service_role') {
          isServiceRole = true;
        }
      }
    } catch (e) {}

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    console.log(`[Server] Supabase Admin client initialized. Role: ${isServiceRole ? 'service_role' : 'ANON (WARNING)'}`);
    if (!isServiceRole) {
      console.warn('[Server] ❌ CRITICAL WARNING: The key provided for SUPABASE_SERVICE_ROLE_KEY does not appear to be a service_role key. It is likely an anon key. RLS will NOT be bypassed.');
    }
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
    console.log('[Server] No auth header found');
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  // Debug: Decode token without verification to see claims
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = payload.exp;
      const diff = expiresAt - now;
      
      console.log(`[Server] Token Debug: User=${payload.email}, Exp=${new Date(expiresAt * 1000).toISOString()}, ValidFor=${diff}s`);
      
      if (diff < 0) {
        console.warn('[Server] ⚠️ Token is EXPIRED by ' + Math.abs(diff) + ' seconds');
      }
    }
  } catch (e) {
    console.warn('[Server] Could not decode token for debugging');
  }

  try {
    if (supabaseAdmin) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error) {
        console.error('[Server] Supabase auth.getUser error:', error.message);
        
        // If the token is expired, return a 401 so the frontend can refresh
        if (error.message.includes('expired')) {
          return res.status(401).json({ 
            error: 'Token expired', 
            code: 'TOKEN_EXPIRED',
            suggestion: 'Please refresh your session or log out and back in.' 
          });
        }
        
        // If it's an invalid JWT, it might be a project mismatch
        if (error.message.includes('invalid JWT') || error.message.includes('signature')) {
          return res.status(401).json({ 
            error: 'Invalid authentication token', 
            code: 'INVALID_TOKEN',
            suggestion: 'This often happens after changing Supabase credentials or if the token is from a different project. Please try logging out and logging back in.' 
          });
        }

        // For any other error, return 401
        return res.status(401).json({ 
          error: error.message || 'Authentication failed', 
          code: 'AUTH_ERROR' 
        });
      }
      if (user) {
        req.user = user;
        console.log('[Server] User authenticated:', user.email);
      } else {
        console.log('[Server] No user found for token');
      }
    } else {
      console.error('[Server] supabaseAdmin is not initialized');
      return res.status(500).json({ error: 'Supabase Admin client not initialized' });
    }
  } catch (e) {
    console.error('[Server] Auth verification failed:', e);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
  next();
};

export const app = express();
const PORT = 3000;

// Rewrite Netlify function paths so Express routes match correctly
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '') || '/';
  }
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

  // Helper to safely log errors without causing EPIPE or other issues
  const logError = (message: string, error: any) => {
    const safeError = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : (typeof error === 'object' ? { ...error } : error);
    
    // Avoid logging massive objects
    const logObj = JSON.parse(JSON.stringify(safeError));
    
    // Check if the error message is actually an HTML page (common with 502/504 gateway errors)
    if (logObj.message && typeof logObj.message === 'string' && logObj.message.includes('<!DOCTYPE html>')) {
      logObj.isGatewayError = true;
      logObj.originalMessage = logObj.message;
      logObj.message = 'Supabase Gateway Error (502/504). This usually means your Supabase project is paused, starting up, or experiencing a temporary outage. Please check your Supabase Dashboard.';
    }

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
      const missing = [];
      if (isPlaceholderUrl) missing.push('SUPABASE_URL');
      if (isPlaceholderKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      
      return res.status(500).json({ 
        error: 'Supabase credentials are not configured.',
        details: `Please set the following in AI Studio Secrets: ${missing.join(', ')}`,
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
        const tables = ['user_profiles', 'clients', 'tasks', 'notes', 'workflows', 'task_types', 'roles', 'permissions', 'user_tokens', 'emails'];
        for (const table of tables) {
          const { count, error: tError } = await client.from(table).select('*', { count: 'exact', head: true });
          diagnostics.tableStatus[table] = !tError || tError.code !== '42P01';
          if (!tError) {
            diagnostics[`${table}_count`] = count;
          }
        }
      } catch (err: any) {
        diagnostics.supabaseConnection = 'CRASHED';
        diagnostics.supabaseError = err.message;
      }
    }

    res.json(diagnostics);
  });

  // Detailed Supabase Debug Endpoint
  app.get('/api/debug/supabase', async (req, res) => {
    const debug: any = {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'MISSING',
      key_present: !!supabaseServiceKey,
      key_length: supabaseServiceKey?.length,
      is_service_role: isServiceRole,
      env_keys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
      timestamp: new Date().toISOString()
    };

    if (supabaseAdmin) {
      try {
        // Test query 1: auth.users (requires admin)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        debug.auth_test = authError ? { error: authError.message, code: authError.code } : { success: true, count: authData?.users?.length };

        // Test query 2: user_tokens (the problematic table)
        const { data: tokenData, error: tokenError } = await supabaseAdmin.from('user_tokens').select('*').limit(1);
        debug.tokens_test = tokenError ? { error: tokenError.message, code: tokenError.code } : { success: true, count: tokenData?.length };

        // Test query 3: user_profiles
        const { data: profileData, error: profileError } = await supabaseAdmin.from('user_profiles').select('*').limit(1);
        debug.profiles_test = profileError ? { error: profileError.message, code: profileError.code } : { success: true, count: profileData?.length };
      } catch (err: any) {
        debug.crash = err.message;
      }
    } else {
      debug.admin_status = 'NOT_INITIALIZED';
    }

    res.json(debug);
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

  app.post('/api/auth/refresh', checkSupabase, async (req, res) => {
    const { refresh_token } = req.body;
    try {
      const client = getSupabaseClient(req);
      const { data, error } = await client.auth.refreshSession({ refresh_token });
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

  // OAuth Endpoints
  app.get('/api/auth/google/url', verifyAuth, (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const url = googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent',
      state: req.user.id
    });
    res.json({ url });
  });

  app.get('/auth/google/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    try {
      const { tokens } = await googleOAuth2Client.getToken(code as string);
      
      // Get user email
      const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
      googleOAuth2Client.setCredentials(tokens);
      const userInfo = await oauth2.userinfo.get();

      const { data: profile, error: profileError } = await supabaseAdmin.from('user_profiles').select('tenant_id').eq('id', userId).single();
      
      if (profileError || !profile) {
        console.error('Profile not found for user:', userId, profileError);
        return res.status(404).send('User profile not found');
      }

      const { error: tokenError } = await supabaseAdmin.from('user_tokens').upsert({
        user_id: userId,
        tenant_id: profile.tenant_id,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        email: userInfo.data.email
      }, { onConflict: 'user_id,provider' });

      if (tokenError) {
        console.error('Error saving Google tokens:', JSON.stringify(tokenError, null, 2));
        let errorMsg = tokenError.message;
        if (tokenError.code === '42501') {
          errorMsg = 'Permission denied saving tokens. This usually means RLS is blocking the request. ';
          if (!isServiceRole) {
            errorMsg += '❌ CRITICAL: The server is NOT using a "service_role" key. RLS is being enforced on the backend, which is incorrect. Please ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in AI Studio Secrets.';
          } else {
            errorMsg += 'The server IS using a "service_role" key, but Postgres still returned 42501. This is highly unusual and may indicate a configuration issue in Supabase or that the key provided is actually an ANON key despite its claims.';
          }
        }
        return res.status(500).send(`Authentication failed: ${errorMsg}`);
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
                window.close();
              } else {
                window.location.href = '/settings';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/auth/microsoft/url', verifyAuth, (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI || `${process.env.APP_URL}/auth/microsoft/callback`,
      response_mode: 'query',
      scope: 'offline_access Mail.Read User.Read Mail.Send',
      state: req.user.id
    });
    res.json({ url: `${MS_AUTH_URL}?${params.toString()}` });
  });

  app.get('/auth/microsoft/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    try {
      const response = await axios.post(MS_TOKEN_URL, new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI || `${process.env.APP_URL}/auth/microsoft/callback`,
        grant_type: 'authorization_code'
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const tokens = response.data;
      
      // Get user info
      const userRes = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      const { data: profile, error: profileError } = await supabaseAdmin.from('user_profiles').select('tenant_id').eq('id', userId).single();

      if (profileError || !profile) {
        console.error('Profile not found for user:', userId, profileError);
        return res.status(404).send('User profile not found');
      }

      const { error: tokenError } = await supabaseAdmin.from('user_tokens').upsert({
        user_id: userId,
        tenant_id: profile.tenant_id,
        provider: 'microsoft',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry: new Date(Date.now() + tokens.expires_in * 1000),
        email: userRes.data.mail || userRes.data.userPrincipalName
      }, { onConflict: 'user_id,provider' });

      if (tokenError) {
        console.error('Error saving Microsoft tokens:', JSON.stringify(tokenError, null, 2));
        let errorMsg = tokenError.message;
        if (tokenError.code === '42501') {
          errorMsg = 'Permission denied saving tokens. This usually means RLS is blocking the request. ';
          if (!isServiceRole) {
            errorMsg += '❌ CRITICAL: The server is NOT using a "service_role" key. RLS is being enforced on the backend, which is incorrect. Please ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in AI Studio Secrets.';
          } else {
            errorMsg += 'The server IS using a "service_role" key, but Postgres still returned 42501. This is highly unusual and may indicate a configuration issue in Supabase or that the key provided is actually an ANON key despite its claims.';
          }
        }
        return res.status(500).send(`Authentication failed: ${errorMsg}`);
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'microsoft' }, '*');
                window.close();
              } else {
                window.location.href = '/settings';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Microsoft OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Helper to extract email and name from headers
  const extractEmailAddress = (str: string): string => {
    if (!str) return '';
    const match = str.match(/<([^>]+)>/);
    if (match) return match[1].trim();
    const emailMatch = str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) return emailMatch[1].trim();
    return str.trim();
  };

  const extractNameFromEmail = (str: string): string => {
    if (!str) return 'Unknown';
    const match = str.match(/^([^<]+)/);
    if (match && match[1].trim()) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
    const email = extractEmailAddress(str);
    if (email && email.includes('@')) {
      return email.split('@')[0];
    }
    return str || 'Unknown';
  };

  const refreshMicrosoftToken = async (userId: string, refreshToken: string) => {
    try {
      console.log(`[Server] Refreshing Microsoft token for user ${userId}...`);
      const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'offline_access Mail.Read Mail.Send User.Read'
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
      const expiry = new Date(Date.now() + expires_in * 1000).toISOString();

      // Update in Supabase
      await supabaseAdmin.from('user_tokens')
        .update({ 
          access_token, 
          refresh_token: new_refresh_token || refreshToken, 
          expiry,
          updated_at: new Date().toISOString()
        })
        .match({ user_id: userId, provider: 'microsoft' });

      console.log(`[Server] Microsoft token refreshed successfully for user ${userId}`);
      return access_token;
    } catch (error: any) {
      console.error('[Server] Error refreshing Microsoft token:', error.response?.data || error.message);
      throw error;
    }
  };

  // Email Integration Endpoints
  app.get('/api/emails/sync', verifyAuth, async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { selective } = req.query;
    const isSelective = selective === 'true';
    
    console.log(`[Server] Syncing emails for user: ${req.user.id} (Selective: ${isSelective})`);
    
    try {
      const client = getSupabaseClient(req);
      if (!client) {
        return res.status(500).json({ 
          error: 'Supabase client not initialized',
          details: 'Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correctly configured.'
        });
      }

      const { data: tokens, error: tokenError } = await client.from('user_tokens').select('*').eq('user_id', req.user.id);
      
      console.log(`[Server] Tokens fetched for user ${req.user.id}:`, tokens?.map(t => ({ provider: t.provider, email: t.email, has_refresh: !!t.refresh_token })));
      
      if (tokenError) {
        console.error('[Server] Error fetching user tokens:', tokenError);
        let errorMsg = 'Failed to fetch user tokens';
        if (tokenError.code === '42P01') {
          errorMsg = 'The "user_tokens" table is missing. Please run the SQL setup script in your Supabase SQL Editor.';
        } else if (tokenError.code === '42501') {
          errorMsg = 'Permission denied for "user_tokens". This usually means RLS is blocking the request.';
          if (!isServiceRole) {
            errorMsg += ' ❌ CRITICAL: The server is NOT using a "service_role" key. RLS is being enforced on the backend, which is incorrect. Please ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in AI Studio Secrets.';
          } else {
            errorMsg += ' The server IS using a "service_role" key, but Postgres still returned 42501. Check your RLS policies.';
          }
        }

        let status = 500;
        if (tokenError.code === '42501') {
          status = isServiceRole ? 403 : 500;
        }
        
        return res.status(status).json({ 
          error: errorMsg,
          details: tokenError,
          code: tokenError.code
        });
      }
      
      if (!tokens || tokens.length === 0) {
        console.log('[Server] No email accounts connected for user:', req.user.id);
        return res.json({ 
          emails: [], 
          message: 'No email accounts connected. Please go to Settings to connect your Gmail or Outlook account.' 
        });
      }

      // Fetch client and user emails for selective sync
      let allowedEmails: Set<string> = new Set();
      if (isSelective) {
        const [{ data: clientsData }, { data: usersData }, { data: profileData }] = await Promise.all([
          client.from('clients').select('email'),
          client.from('user_profiles').select('email'),
          client.from('user_profiles').select('allowed_sync_emails').eq('id', req.user.id).single()
        ]);
        
        if (clientsData) clientsData.forEach(c => c.email && allowedEmails.add(c.email.toLowerCase()));
        if (usersData) usersData.forEach(u => u.email && allowedEmails.add(u.email.toLowerCase()));
        if (profileData?.allowed_sync_emails && Array.isArray(profileData.allowed_sync_emails)) {
          profileData.allowed_sync_emails.forEach((e: string) => allowedEmails.add(e.toLowerCase()));
        }
        console.log(`[Server] Selective sync enabled. Allowed emails: ${allowedEmails.size}`);
      }

      console.log(`[Server] Found ${tokens.length} connected accounts for user ${req.user.id}`);
      let allEmails: any[] = [];
      let syncErrors: any[] = [];

      for (const token of tokens) {
        console.log(`[Server] Syncing provider: ${token.provider} for email: ${token.email}`);
        try {
          if (token.provider === 'google') {
            if (!token.access_token) {
              console.error(`[Server] No access token for Google account: ${token.email}`);
              continue;
            }
            
            googleOAuth2Client.setCredentials({
              access_token: token.access_token,
              refresh_token: token.refresh_token,
              expiry_date: token.expiry ? new Date(token.expiry).getTime() : null
            });

            // Check if token needs refresh
            if (token.expiry && new Date(token.expiry).getTime() < Date.now() + 60000) {
              console.log(`[Server] Refreshing Google token for user ${req.user.id}...`);
              const { credentials } = await googleOAuth2Client.refreshAccessToken();
              await client.from('user_tokens').update({
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token || token.refresh_token,
                expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
                updated_at: new Date().toISOString()
              }).match({ user_id: req.user.id, provider: 'google' });
            }

            const gmail = google.gmail({ version: 'v1', auth: googleOAuth2Client });
            
            console.log(`[Server] Calling Gmail API messages.list for ${token.email}...`);
            const listRes = await gmail.users.messages.list({ userId: 'me', maxResults: 15 });
            console.log(`[Server] Gmail API list response for ${token.email}:`, {
              status: listRes.status,
              messagesCount: listRes.data.messages?.length || 0
            });
            
            if (listRes.data.messages) {
              for (const msg of listRes.data.messages) {
                try {
                  console.log(`[Server] Fetching Gmail message detail: ${msg.id}`);
                  const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
                  const headers = detail.data.payload?.headers;
                  const subject = headers?.find(h => h.name === 'Subject')?.value || '(No Subject)';
                  const fromHeader = headers?.find(h => h.name === 'From')?.value || 'Unknown';
                  const toHeader = headers?.find(h => h.name === 'To')?.value || '';
                  const date = headers?.find(h => h.name === 'Date')?.value || '';
                  
                  const fromEmail = extractEmailAddress(fromHeader);
                  const fromName = extractNameFromEmail(fromHeader);
                  const toEmail = extractEmailAddress(toHeader);

                  // Filter for selective sync
                  if (isSelective && !allowedEmails.has(fromEmail.toLowerCase())) {
                    console.log(`[Server] Skipping email from ${fromEmail} (not in allowed list)`);
                    continue;
                  }

                  // Extract full body
                  let body = detail.data.snippet || '';
                  const payload = detail.data.payload;
                  if (payload) {
                    const getBody = (part: any): string => {
                      if (part.body?.data) {
                        const b64 = part.body.data.replace(/-/g, '+').replace(/_/g, '/');
                        return Buffer.from(b64, 'base64').toString('utf-8');
                      }
                      if (part.parts) {
                        for (const subPart of part.parts) {
                          const subBody = getBody(subPart);
                          if (subBody) return subBody;
                        }
                      }
                      return '';
                    };

                    // Try to find HTML part first, then plain text
                    const findPart = (parts: any[], mimeType: string): any => {
                      for (const part of parts) {
                        if (part.mimeType === mimeType) return part;
                        if (part.parts) {
                          const subPart = findPart(part.parts, mimeType);
                          if (subPart) return subPart;
                        }
                      }
                      return null;
                    };

                    const htmlPart = findPart(payload.parts || [payload], 'text/html');
                    const textPart = findPart(payload.parts || [payload], 'text/plain');
                    
                    if (htmlPart) body = getBody(htmlPart);
                    else if (textPart) body = getBody(textPart);
                    else if (payload.body?.data) {
                      const b64 = payload.body.data.replace(/-/g, '+').replace(/_/g, '/');
                      body = Buffer.from(b64, 'base64').toString('utf-8');
                    }
                  }

                  // Generate preview by stripping HTML tags
                  const preview = body.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...';

                  console.log(`[Server] Processed Gmail message: ${msg.id} | Subject: ${subject} | From: ${fromEmail} | To: ${toEmail}`);
                  
                  allEmails.push({
                    id: `google-${msg.id}`,
                    provider: 'google',
                    from: fromName,
                    fromEmail: fromEmail,
                    toEmail: toEmail,
                    subject,
                    body,
                    preview,
                    date: new Date(date).toISOString().split('T')[0], // YYYY-MM-DD for better sorting
                    time: new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: !detail.data.labelIds?.includes('UNREAD'),
                    starred: detail.data.labelIds?.includes('STARRED'),
                    labels: detail.data.labelIds || [],
                    folder: 'inbox'
                  });
                } catch (msgErr) {
                  console.error(`[Server] Error fetching Google message ${msg.id}:`, msgErr);
                }
              }
            }
          } else if (token.provider === 'microsoft') {
              console.log(`[Server] Calling Microsoft Graph API for ${token.email}...`);
              
              let accessToken = token.access_token;
              // Check if token needs refresh
              if (token.expiry && new Date(token.expiry).getTime() < Date.now() + 60000) {
                accessToken = await refreshMicrosoftToken(req.user.id, token.refresh_token);
              }

              const outlookRes = await axios.get('https://graph.microsoft.com/v1.0/me/messages?$top=15&$select=id,subject,from,toRecipients,receivedDateTime,isRead,flag,body,bodyPreview', {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              
              console.log(`[Server] Microsoft API response for ${token.email}:`, {
                status: outlookRes.status,
                messagesCount: outlookRes.data.value?.length || 0
              });

              for (const msg of outlookRes.data.value) {
                const fromName = msg.from?.emailAddress?.name || 'Unknown';
                const fromEmail = msg.from?.emailAddress?.address || 'Unknown';
                const toEmail = msg.toRecipients?.[0]?.emailAddress?.address || '';

                // Filter for selective sync
                if (isSelective && !allowedEmails.has(fromEmail.toLowerCase())) {
                  console.log(`[Server] Skipping email from ${fromEmail} (not in allowed list)`);
                  continue;
                }

                console.log(`[Server] Processed Microsoft message: ${msg.id} | Subject: ${msg.subject} | From: ${fromEmail} | To: ${toEmail}`);

                const bodyContent = msg.body?.content || msg.bodyPreview || '';
                const preview = bodyContent.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...';

                allEmails.push({
                  id: `microsoft-${msg.id}`,
                  provider: 'microsoft',
                  from: fromName,
                  fromEmail: fromEmail,
                  toEmail: toEmail,
                  subject: msg.subject,
                  body: bodyContent,
                  preview,
                  date: new Date(msg.receivedDateTime).toISOString().split('T')[0],
                  time: new Date(msg.receivedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  read: msg.isRead,
                  starred: msg.flag?.flagStatus === 'flagged',
                  folder: 'inbox'
                });
              }
            }
          } catch (tokenErr) {
          console.error(`[Server] Error syncing for token ${token.provider}:`, tokenErr);
        }
      }

      console.log(`[Server] Total emails fetched from providers: ${allEmails.length}`);
      
      // Background: Save to Supabase for persistence
      if (allEmails.length > 0) {
        try {
          const { data: profile, error: profileError } = await supabaseAdmin.from('user_profiles').select('tenant_id').eq('id', req.user.id).single();
          
          if (profileError) {
            console.error('[Server] Error fetching profile for sync:', profileError);
          } else if (profile) {
            console.log(`[Server] Persisting ${allEmails.length} emails for tenant: ${profile.tenant_id}`);
            
            // Use a Map to ensure unique IDs in the upsert batch
            const emailMap = new Map();
            allEmails.forEach(e => {
              emailMap.set(e.id, {
                id: e.id,
                tenant_id: profile.tenant_id,
                provider: e.provider,
                from_name: e.from,
                from_email: e.fromEmail,
                to_email: e.toEmail || '',
                subject: e.subject,
                body: e.body || '',
                preview: (e.body || '').substring(0, 200),
                date: e.date,
                time: e.time,
                read: e.read || false,
                starred: e.starred || false,
                labels: e.labels || [],
                folder: e.folder || 'inbox',
                attachments: e.attachments || [],
                updated_at: new Date().toISOString()
              });
            });
            
            const emailsToUpsert = Array.from(emailMap.values());
            
            console.log(`[Server] Upserting ${emailsToUpsert.length} unique emails to Supabase...`);
            const { error: upsertError } = await supabaseAdmin.from('emails').upsert(emailsToUpsert, { onConflict: 'id' });
            if (upsertError) {
              console.error('[Server] Error upserting emails:', upsertError);
              console.error('[Server] Error Details:', JSON.stringify(upsertError, null, 2));
              // Log the first email to check for data issues
              if (emailsToUpsert.length > 0) {
                console.log('[Server] Sample email for upsert:', JSON.stringify(emailsToUpsert[0], null, 2));
              }
            } else {
              console.log('[Server] Emails upserted successfully to Supabase');
            }
          }
        } catch (persistErr) {
          console.error('[Server] Critical error in persistence logic:', persistErr);
        }
      }

      console.log(`[Server] Sync complete for user ${req.user.id}. Total emails: ${allEmails.length}`);

      res.json({
        emails: allEmails,
        syncErrors: syncErrors.length > 0 ? syncErrors : undefined,
        count: allEmails.length
      });
    } catch (error) {
      console.error('Email Sync Error:', error);
      res.status(500).json({ error: 'Failed to sync emails' });
    }
  });

  app.post('/api/emails/process', verifyAuth, async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { subject, body, from } = req.body;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `
          Analyze the following email and extract a task if applicable.
          Return a JSON object with:
          - title: Short descriptive title
          - description: Detailed description of what needs to be done
          - priority: High, Medium, or Low
          - dueDate: Suggested due date in YYYY-MM-DD format (if mentioned, otherwise null)
          - tags: Array of relevant tags
          
          Email Subject: ${subject}
          Email From: ${from}
          Email Body: ${body}
        ` }] }],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty AI response');
      
      // Clean JSON from markdown if present
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      res.json(JSON.parse(jsonStr));
    } catch (error) {
      console.error('AI Processing Error:', error);
      res.status(500).json({ error: 'Failed to process email with AI' });
    }
  });

  app.post('/api/emails/send', verifyAuth, async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { to, subject, body, cc, bcc, provider: requestedProvider } = req.body;
    
    if (!to) return res.status(400).json({ error: 'Recipient is required' });

    try {
      const client = getSupabaseClient(req);
      const { data: tokens, error: tokenError } = await client.from('user_tokens').select('*').eq('user_id', req.user.id);
      
      if (tokenError || !tokens || tokens.length === 0) {
        return res.status(400).json({ error: 'No email accounts connected' });
      }

      // Find the correct token
      let token = tokens[0];
      if (requestedProvider) {
        token = tokens.find(t => t.provider === requestedProvider) || tokens[0];
      }

      if (token.provider === 'google') {
        googleOAuth2Client.setCredentials({
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expiry_date: token.expiry ? new Date(token.expiry).getTime() : null
        });

        // Check if token needs refresh
        if (token.expiry && new Date(token.expiry).getTime() < Date.now() + 60000) {
          console.log(`[Server] Refreshing Google token for user ${req.user.id} before sending...`);
          const { credentials } = await googleOAuth2Client.refreshAccessToken();
          await client.from('user_tokens').update({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || token.refresh_token,
            expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
            updated_at: new Date().toISOString()
          }).match({ user_id: req.user.id, provider: 'google' });
        }

        const gmail = google.gmail({ version: 'v1', auth: googleOAuth2Client });
        
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
          `To: ${to}`,
          cc ? `Cc: ${cc}` : null,
          bcc ? `Bcc: ${bcc}` : null,
          `Subject: ${utf8Subject}`,
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          '',
          body,
        ].filter(Boolean);
        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });
      } else if (token.provider === 'microsoft') {
        let accessToken = token.access_token;

        // Check if token needs refresh
        if (token.expiry && new Date(token.expiry).getTime() < Date.now() + 60000) {
          accessToken = await refreshMicrosoftToken(req.user.id, token.refresh_token);
        }

        const message = {
          message: {
            subject: subject,
            body: {
              contentType: 'HTML',
              content: body,
            },
            toRecipients: to.split(',').map((email: string) => ({
              emailAddress: { address: email.trim() },
            })),
            ccRecipients: cc ? cc.split(',').map((email: string) => ({
              emailAddress: { address: email.trim() },
            })) : [],
            bccRecipients: bcc ? bcc.split(',').map((email: string) => ({
              emailAddress: { address: email.trim() },
            })) : [],
          },
        };

        await axios.post('https://graph.microsoft.com/v1.0/me/sendMail', message, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('[Server] Error sending email:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to send email', details: error.response?.data || error.message });
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
        const safeError = logError(`Supabase Fetch Error from ${table}`, error);
        
        let errorMsg = safeError.message;
        if (error.code === '42P01') {
          errorMsg = `Table "${table}" is missing. Please run the SQL setup script in your Supabase SQL Editor.`;
          console.error(`[Server] 💡 ${errorMsg}`);
        } else if (error.code === '42501') {
          errorMsg = `Permission denied for "${table}". This usually means RLS is blocking the request.`;
          if (!isServiceRole) {
            errorMsg += ' ❌ CRITICAL: The server is NOT using a "service_role" key. RLS is being enforced on the backend, which is incorrect. Please ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in AI Studio Secrets.';
          } else {
            errorMsg += ' The server IS using a "service_role" key, but Postgres still returned 42501. This is highly unusual and may indicate a configuration issue in Supabase or that the key provided is actually an ANON key despite its claims.';
          }
          console.error(`[Server] 💡 ${errorMsg}`);
        } else if (safeError.isGatewayError) {
          errorMsg = `Supabase Gateway Error (502/504). Please check if your Supabase project is paused or starting up.`;
          console.error(`[Server] ⚠️ ${errorMsg}`);
        }

        let status = 500;
        if (error.code === '42P01') status = 404; // Table not found
        if (error.code === '42703') status = 400; // Column not found
        if (safeError.isGatewayError) status = 502; // Bad Gateway
        
        // We use 500 for 42501 (Permission Denied) to prevent nginx from intercepting 
        // the JSON response and returning a generic HTML 403 error page.
        if (error.code === '42501') status = 500;
        
        // We use 500 for 42501 (Permission Denied) to prevent nginx from intercepting 
        // the JSON response and returning a generic HTML 403 error page.
        if (error.code === '42501') status = 500;
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(status).json({ 
          error: errorMsg, 
          details: safeError,
          code: error.code,
          hint: error.hint,
          isPermissionError: error.code === '42501',
          isMissingTable: error.code === '42P01',
          isGatewayError: safeError.isGatewayError
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
        
        let errorMsg = safeError.message;
        if (error.code === '42501') {
          errorMsg = `Permission denied for "${table}". This usually means RLS is blocking the request.`;
          if (!isServiceRole) {
            errorMsg += ' ❌ CRITICAL: The server is NOT using a "service_role" key. RLS is being enforced on the backend, which is incorrect. Please ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in AI Studio Secrets.';
          } else {
            errorMsg += ' The server IS using a "service_role" key, but Postgres still returned 42501. Check your RLS policies.';
          }
        }

        let status = 500;
        if (error.code === '42501') {
          // Use 500 instead of 403 to prevent nginx from intercepting JSON and returning HTML
          status = 500;
        }
        if (error.code === '42P01') status = 404;
        if (error.code === '42703') status = 400;
        if (error.code === '23503') status = 400;
        if (error.code === '23505') status = 409;
        if (error.code === '23502') status = 400;
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(status).json({ 
          error: errorMsg, 
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
        console.error(`[Server] Supabase Update Error on ${table}:`, error);
        console.error(`[Server] Error Details:`, JSON.stringify(error, null, 2));
        console.error(`[Server] Update Payload:`, JSON.stringify(payload, null, 2));
        const safeError = logError(`Supabase Update Error on ${table}`, error);
        
        let errorMsg = safeError.message;
        if (error.code === '42501') {
          errorMsg = `Permission denied for "${table}". This usually means RLS is blocking the request.`;
          if (!isServiceRole) {
            errorMsg += ' ❌ CRITICAL: The server is NOT using a "service_role" key. RLS is being enforced on the backend, which is incorrect. Please ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in AI Studio Secrets.';
          } else {
            errorMsg += ' The server IS using a "service_role" key, but Postgres still returned 42501. Check your RLS policies.';
          }
        }

        let status = 500;
        if (error.code === '42501') {
          // Use 500 instead of 403 to prevent nginx from intercepting JSON and returning HTML
          status = 500;
        }
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(status).json({ 
          error: errorMsg, 
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
        
        let errorMsg = safeError.message;
        if (error.code === '42501') {
          errorMsg = `Permission denied for "${table}". This usually means RLS is blocking the request.`;
          if (!isServiceRole) {
            errorMsg += ' ❌ CRITICAL: The server is NOT using a "service_role" key. RLS is being enforced on the backend, which is incorrect. Please ensure SUPABASE_SERVICE_ROLE_KEY is correctly set in AI Studio Secrets.';
          } else {
            errorMsg += ' The server IS using a "service_role" key, but Postgres still returned 42501. Check your RLS policies.';
          }
        }

        let status = 500;
        if (error.code === '42501') {
          // Use 500 instead of 403 to prevent nginx from intercepting JSON and returning HTML
          status = 500;
        }
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(status).json({ 
          error: errorMsg, 
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
  app.post('/api/ai/generate', verifyAuth, async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { prompt, type = 'summary', context = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`[AI] Generating ${type} for user: ${req.user.id}`);

    try {
      if (!geminiKey) {
        throw new Error('GEMINI_API_KEY or CUSTOM_GEMINI_KEY is not configured');
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `You are an expert AI assistant for a Chartered Accountant practice management suite. 
            The user needs a ${type}. 
            
            Context: ${JSON.stringify(context)}
            
            User Prompt: ${prompt}
            
            If type is 'summary', return a JSON object with: title, overview (string), steps (array of strings), and suggestedReply (HTML string).
            If type is 'email', return a JSON object with: subject (string) and body (HTML string).
            Otherwise, return a plain text response.
            
            Return ONLY the JSON or text, no markdown formatting like \`\`\`json.` }]
          }
        ]
      });

      let resultText = response.text || "";

      // Cleanup potential markdown formatting if model ignored instructions
      if (resultText.trim().startsWith('```')) {
        resultText = resultText.replace(/```json\n?/, '').replace(/```\n?/, '').replace(/\n?```/, '');
      }

      res.json({ text: resultText.trim() });
    } catch (error: any) {
      console.error('[AI] Error:', error);
      res.status(500).json({ error: 'AI generation failed', details: error.message });
    }
  });

  app.get('/api/debug/emails', verifyAuth, async (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const { data: profile } = await supabaseAdmin.from('user_profiles').select('tenant_id').eq('id', req.user.id).single();
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      
      const { data: emails, error } = await supabaseAdmin.from('emails').select('*').eq('tenant_id', profile.tenant_id).limit(10);
      const { count } = await supabaseAdmin.from('emails').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id);
      
      res.json({
        tenant_id: profile.tenant_id,
        emailsCount: count,
        sampleEmails: emails,
        error: error
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/ai/status', (req, res) => {
    res.json({ 
      configured: !!geminiKey, 
      model: "gemini-3-flash-preview",
      key_source: process.env.CUSTOM_GEMINI_KEY ? 'CUSTOM_GEMINI_KEY' : (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'none')
    });
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

  // Only start the server if we are not running in a Netlify serverless environment
  if (process.env.NETLIFY !== 'true' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    async function startDevServer() {
      // Vite middleware for development
      if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
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
    startDevServer();
  }
