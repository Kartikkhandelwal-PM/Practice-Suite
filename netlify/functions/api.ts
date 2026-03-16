import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable.');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event, context) => {
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
      const { data, error } = await supabase.auth.getSession();
      return { statusCode: 200, headers, body: JSON.stringify({ session: data.session, error }) };
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

      if (method === 'GET') {
        const { data, error } = await supabase.from(table).select('*');
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
