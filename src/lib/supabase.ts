// This is a proxy that redirects Supabase calls to our server-side API
// to keep keys and secrets hidden from the browser.

const apiFetch = async (path: string, options: any = {}) => {
  const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw data.error || new Error(data.message || 'API Error');
  return { data, error: null };
};

export const supabase: any = {
  auth: {
    getSession: async () => {
      const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
      return { data: { session }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
      try {
        const { data } = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        if (data.session) {
          localStorage.setItem('sb-session', JSON.stringify(data.session));
        }
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    signUp: async ({ email, password, options }: any) => {
      try {
        const { data } = await apiFetch('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, options })
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      localStorage.removeItem('sb-session');
      return { error: null };
    },
    setSession: async ({ access_token, refresh_token }: any) => {
      localStorage.setItem('sb-session', JSON.stringify({ access_token, refresh_token }));
      return { data: { session: { access_token, refresh_token } }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      const handleStorage = () => {
        const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
        callback('SIGNED_IN', session);
      };
      window.addEventListener('storage', handleStorage);
      setTimeout(handleStorage, 0); // Trigger initial
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handleStorage) } } };
    }
  },
  from: (table: string) => {
    const createQuery = (path: string, options: any = {}) => {
      const promise = apiFetch(path, options);
      
      const chain: any = promise;
      chain.eq = (column: string, value: any) => {
        const newPath = path.includes('?') ? `${path}&${column}=eq.${value}` : `${path}?${column}=eq.${value}`;
        return createQuery(newPath, options);
      };
      chain.contains = (column: string, value: any) => {
        const newPath = path.includes('?') ? `${path}&${column}=cs.${JSON.stringify(value)}` : `${path}?${column}=cs.${JSON.stringify(value)}`;
        return createQuery(newPath, options);
      };
      chain.select = (query: string = '*') => {
        const newPath = path.includes('?') ? `${path}&select=${query}` : `${path}?select=${query}`;
        return createQuery(newPath, options);
      };
      chain.limit = () => chain; // Mock limit
      return chain;
    };

    return {
      select: (query: string = '*') => createQuery(`/data/${table}?select=${query}`),
      insert: (data: any) => {
        const promise = createQuery(`/data/${table}`, { method: 'POST', body: JSON.stringify(data) });
        return promise;
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => createQuery(`/data/${table}/${value}`, { method: 'PATCH', body: JSON.stringify(data) })
      }),
      delete: () => ({
        eq: (column: string, value: any) => createQuery(`/data/${table}/${value}`, { method: 'DELETE' })
      })
    };
  }
};
