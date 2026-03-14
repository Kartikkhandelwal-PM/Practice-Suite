import { createClient } from '@supabase/supabase-js';

type Event = {
  httpMethod?: string;
  body?: string | null;
};

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export const handler = async (event: Event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Missing Supabase server environment variables' });
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { id } = payload;

    if (!id) {
      return json(400, { error: 'User id is required' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      return json(400, { error: error.message });
    }

    return json(200, { success: true });
  } catch (error: any) {
    return json(500, { error: error?.message || 'Unexpected error' });
  }
};
