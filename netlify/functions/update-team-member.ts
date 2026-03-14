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
    const { id, name, email, role, designation, color, active, avatar } = payload;

    if (!id || !name || !email) {
      return json(400, { error: 'Id, name, and email are required' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const profile = {
      id,
      name,
      email,
      role: role || 'Staff',
      designation: designation || '',
      color: color || '#2563eb',
      active: active ?? true,
      avatar_url: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    const { error } = await supabaseAdmin.from('profiles').update(profile).eq('id', id);
    if (error) {
      return json(400, { error: error.message });
    }

    return json(200, {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        designation: profile.designation,
        color: profile.color,
        active: profile.active,
        avatar: profile.avatar_url,
      },
    });
  } catch (error: any) {
    return json(500, { error: error?.message || 'Unexpected error' });
  }
};
