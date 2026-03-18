// This client proxies all calls to the backend API to keep keys secure.
export const supabase: any = {
  auth: {
    getSession: async () => {
      const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
      return { data: { session }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        
        localStorage.setItem('sb-session', JSON.stringify(data.session));
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    signUp: async ({ email, password, options }: any) => {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: options?.data?.full_name }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Signup failed');
        
        localStorage.setItem('sb-session', JSON.stringify(data.session));
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      localStorage.removeItem('sb-session');
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      const handleStorage = () => {
        const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
        callback('SIGNED_IN', session);
      };
      window.addEventListener('storage', handleStorage);
      setTimeout(handleStorage, 0);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handleStorage) } } };
    }
  },
  from: (table: string) => {
    const mockQuery = {
      select: (columns: string = '*') => {
        const query: any = {
          eq: (field: string, value: any) => {
            query._eq = { field, value };
            return query;
          },
          single: async () => {
            const url = new URL(`/api/data/${table}`, window.location.origin);
            url.searchParams.append('select', columns);
            if (query._eq) {
              url.searchParams.append('eq_field', query._eq.field);
              url.searchParams.append('eq_value', query._eq.value);
            }
            const res = await fetch(url.toString());
            const data = await res.json();
            if (!res.ok) return { data: null, error: new Error(data.error || 'Fetch failed') };
            return { data: Array.isArray(data) ? data[0] : data, error: null };
          },
          maybeSingle: async () => {
            const url = new URL(`/api/data/${table}`, window.location.origin);
            url.searchParams.append('select', columns);
            if (query._eq) {
              url.searchParams.append('eq_field', query._eq.field);
              url.searchParams.append('eq_value', query._eq.value);
            }
            const res = await fetch(url.toString());
            const data = await res.json();
            if (!res.ok) return { data: null, error: new Error(data.error || 'Fetch failed') };
            return { data: Array.isArray(data) ? data[0] : data, error: null };
          },
          order: () => query,
          limit: () => query,
          then: async (cb: any) => {
            const url = new URL(`/api/data/${table}`, window.location.origin);
            url.searchParams.append('select', columns);
            if (query._eq) {
              url.searchParams.append('eq_field', query._eq.field);
              url.searchParams.append('eq_value', query._eq.value);
            }
            const res = await fetch(url.toString());
            const data = await res.json();
            cb({ 
              data: res.ok ? (Array.isArray(data) ? data : []) : null, 
              error: res.ok ? null : new Error(data.error || 'Fetch failed') 
            });
          }
        };
        return query;
      },
      insert: async (payload: any) => {
        const res = await fetch(`/api/data/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        return { 
          data: res.ok ? data : null, 
          error: res.ok ? null : new Error(data.error || 'Insert failed') 
        };
      },
      update: (payload: any) => {
        const query: any = {
          eq: (field: string, value: any) => {
            query._eq = { field, value };
            return query;
          },
          select: () => ({
            single: async () => {
              const res = await fetch(`/api/data/${table}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, id: query._eq?.value }),
              });
              const data = await res.json();
              return { 
                data: res.ok ? data : null, 
                error: res.ok ? null : new Error(data.error || 'Update failed') 
              };
            }
          })
        };
        return query;
      },
      delete: () => {
        const query: any = {
          eq: (field: string, value: any) => {
            query._eq = { field, value };
            return query;
          },
          then: async (cb: any) => {
            const url = new URL(`/api/data/${table}`, window.location.origin);
            url.searchParams.append('id', query._eq?.value);
            const res = await fetch(url.toString(), { method: 'DELETE' });
            cb({ error: res.ok ? null : new Error('Delete failed') });
          }
        };
        return query;
      }
    };
    return mockQuery;
  }
};
