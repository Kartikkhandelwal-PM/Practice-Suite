// This is a proxy client that calls the backend API to keep keys hidden
const API_BASE = '/api';

export const supabase = {
  auth: {
    getSession: async () => {
      const token = localStorage.getItem('sb-token');
      if (!token) return { data: { session: null }, error: null };
      try {
        const res = await fetch(`${API_BASE}/auth/session`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw data.error;
        return { data: { session: { user: data.user, access_token: token } }, error: null };
      } catch (error) {
        return { data: { session: null }, error };
      }
    },
    signInWithPassword: async ({ email, password }: any) => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw data.error;
        if (data.session?.access_token) {
          localStorage.setItem('sb-token', data.session.access_token);
          supabase.auth._notify('SIGNED_IN', data.session);
        }
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    signUp: async ({ email, password, options }: any) => {
      try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, options })
        });
        const data = await res.json();
        if (!res.ok) throw data.error;
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      localStorage.removeItem('sb-token');
      supabase.auth._notify('SIGNED_OUT', null);
      return { error: null };
    },
    _listeners: [] as any[],
    _notify: (event: string, session: any) => {
      supabase.auth._listeners.forEach(cb => cb(event, session));
    },
    onAuthStateChange: (callback: any) => {
      supabase.auth._listeners.push(callback);
      return { data: { subscription: { unsubscribe: () => {
        supabase.auth._listeners = supabase.auth._listeners.filter(cb => cb !== callback);
      } } } };
    }
  },
  from: (table: string) => ({
    select: (query?: string) => {
      const promise = (async () => {
        const res = await fetch(`${API_BASE}/data/${table}`);
        const data = await res.json();
        return { data, error: res.ok ? null : data.error };
      })();
      return Object.assign(promise, {
        single: async () => {
          const res = await fetch(`${API_BASE}/data/${table}`);
          const data = await res.json();
          return { data: data[0] || null, error: res.ok ? null : data.error };
        },
        eq: (field: string, value: any) => ({
          single: async () => {
            const res = await fetch(`${API_BASE}/data/${table}`);
            const data = await res.json();
            const item = data.find((i: any) => i[field] === value);
            return { data: item || null, error: res.ok ? null : data.error };
          }
        })
      });
    },
    insert: (body: any) => {
      const promise = (async () => {
        const res = await fetch(`${API_BASE}/data/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        return { data, error: res.ok ? null : data.error };
      })();
      return promise;
    },
    update: (body: any) => ({
      eq: (field: string, value: any) => {
        const promise = (async () => {
          const res = await fetch(`${API_BASE}/data/${table}/${value}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await res.json();
          return { data, error: res.ok ? null : data.error };
        })();
        return promise;
      }
    }),
    delete: () => ({
      eq: (field: string, value: any) => {
        const promise = (async () => {
          const res = await fetch(`${API_BASE}/data/${table}/${value}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          return { error: res.ok ? null : data.error };
        })();
        return promise;
      }
    })
  })
};
