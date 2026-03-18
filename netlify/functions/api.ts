import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize client only if URL is provided to avoid crash at startup
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseServiceKey) : null;

export const handler: Handler = async (event, context) => {
  if (!supabase) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Supabase configuration missing on server. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables.' })
    };
  }
  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    // Config Route
    if (path === '/config' && method === 'GET') {
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
          supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
        }) 
      };
    }

    // Auth Routes
    if (path === '/auth/login' && method === 'POST') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      return { statusCode: error ? 400 : 200, headers, body: JSON.stringify({ session: data.session, user: data.user, error }) };
    }

    if (path === '/auth/signup' && method === 'POST') {
      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: { data: body.options?.data }
      });
      return { statusCode: error ? 400 : 200, headers, body: JSON.stringify({ session: data.session, user: data.user, error }) };
    }

    if (path === '/auth/session' && method === 'GET') {
      const authHeader = event.headers.authorization;
      if (!authHeader) return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token provided' }) };
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error) return { statusCode: 401, headers, body: JSON.stringify({ error }) };
      
      return { statusCode: 200, headers, body: JSON.stringify({ user, error: null }) };
    }

    // AI Status Route
    if (path === '/ai/status' && method === 'GET') {
      const custom = process.env.CUSTOM_GEMINI_KEY?.trim();
      const system = process.env.GEMINI_API_KEY?.trim();
      let key = null;
      let source = 'none';

      if (custom && custom.startsWith('AIza') && custom.length > 20) {
        key = custom;
        source = 'custom';
      } else if (system && system.startsWith('AIza') && system.length > 20) {
        key = system;
        source = 'system';
      }
      
      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          configured: !!key,
          model: "gemini-2.0-flash",
          key_source: source
        }) 
      };
    }

    // AI Route
    if (path === '/ai/generate' && method === 'POST') {
      const { prompt, responseSchema } = body;
      const custom = process.env.CUSTOM_GEMINI_KEY?.trim();
      const system = process.env.GEMINI_API_KEY?.trim();
      let apiKey = null;
      let source = 'none';

      if (custom && custom.startsWith('AIza') && custom.length > 20) {
        apiKey = custom;
        source = 'custom';
      } else if (system && system.startsWith('AIza') && system.length > 20) {
        apiKey = system;
        source = 'system';
      }

      if (!apiKey) {
        return { 
          statusCode: 500, 
          headers, 
          body: JSON.stringify({ 
            error: 'Gemini API key not configured. Please add CUSTOM_GEMINI_KEY to your environment variables in AI Studio settings.' 
          }) 
        };
      }
      
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        });
        return { statusCode: 200, headers, body: JSON.stringify({ text: response.text }) };
      } catch (error: any) {
        console.error(`Gemini Error (${source}):`, error);
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
        return { 
          statusCode: isQuotaError ? 429 : 500, 
          headers, 
          body: JSON.stringify({ 
            error: isQuotaError ? "AI Quota Exceeded. Please wait a minute or provide a different API key in settings." : error.message,
            details: error.message
          }) 
        };
      }
    }

    // Data Routes (Generic Proxy)
    const dataMatch = path.match(/^\/data\/([^/]+)(?:\/([^/]+))?$/);
    if (dataMatch) {
      const table = dataMatch[1];
      const id = dataMatch[2];
      const queryParams = event.queryStringParameters || {};

      if (method === 'GET') {
        let query = supabase.from(table).select(queryParams.select || '*');
        
        // Handle basic filters
        Object.entries(queryParams).forEach(([key, value]) => {
          if (key === 'select') return;
          if (typeof value === 'string' && value.startsWith('eq.')) {
            query = query.eq(key, value.substring(3));
          } else if (typeof value === 'string' && value.startsWith('cs.')) {
            try {
              query = query.contains(key, JSON.parse(value.substring(3)));
            } catch (e) {}
          }
        });

        const { data, error } = await query;
        return { statusCode: error ? 400 : 200, headers, body: JSON.stringify(data || { error }) };
      }

      if (method === 'POST') {
        const { data, error } = await supabase.from(table).insert(body).select();
        return { statusCode: error ? 400 : 201, headers, body: JSON.stringify(data || { error }) };
      }

      if (method === 'PATCH' && id) {
        const { data, error } = await supabase.from(table).update(body).eq('id', id).select();
        return { statusCode: error ? 400 : 200, headers, body: JSON.stringify(data || { error }) };
      }

      if (method === 'DELETE' && id) {
        const { error } = await supabase.from(table).delete().eq('id', id);
        return { statusCode: error ? 400 : 200, headers, body: JSON.stringify({ success: !error, error }) };
      }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not Found', path }) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
