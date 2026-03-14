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
    const { email, password, name, role, designation, color, active } = payload;

    if (!email || !password || !name) {
      return json(400, { error: 'Name, email, and password are required' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (authError || !authData.user) {
      return json(400, { error: authError?.message || 'Failed to create auth user' });
    }

    const profile = {
      id: authData.user.id,
      name,
      email,
      role: role || 'Staff',
      designation: designation || '',
      color: color || '#2563eb',
      active: active ?? true,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(profile);
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return json(400, { error: profileError.message });
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
