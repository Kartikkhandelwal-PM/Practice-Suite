const authCallbacks: Set<(event: string, session: any) => void> = new Set();

const triggerAuthChange = (event: string, session: any) => {
  authCallbacks.forEach(cb => cb(event, session));
};

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
        const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              if (!response.ok) {
                let errorMsg = data.error || `Login failed with status ${response.status}`;
                if (response.status === 403) {
                  errorMsg = `Permission Denied (403): ${errorMsg}. Please ensure your Supabase Service Role Key is correctly configured in the backend.`;
                }
                throw new Error(errorMsg);
              }
              localStorage.setItem('sb-session', JSON.stringify(data.session));
              triggerAuthChange('SIGNED_IN', data.session);
              return { data, error: null };
            } else {
              const text = await response.text();
              let errorMsg = `Server returned non-JSON response (${response.status})`;
              if (response.status === 403) {
                errorMsg = `Permission Denied (403): The server returned an error page. This usually means the request was blocked by a security layer or the backend is misconfigured.`;
              }
              throw new Error(`${errorMsg}: ${text.substring(0, 200)}...`);
            }
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
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || `Signup failed with status ${response.status}`);
          localStorage.setItem('sb-session', JSON.stringify(data.session));
          triggerAuthChange('SIGNED_UP', data.session);
          return { data, error: null };
        } else {
          const text = await response.text();
          throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}...`);
        }
      } catch (error: any) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      localStorage.removeItem('sb-session');
      triggerAuthChange('SIGNED_OUT', null);
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      authCallbacks.add(callback);
      
      const handleStorage = (e?: StorageEvent) => {
        if (!e || e.key === 'sb-session') {
          const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
          callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        }
      };
      
      window.addEventListener('storage', handleStorage);
      
      // Initial trigger
      const initialSession = JSON.parse(localStorage.getItem('sb-session') || 'null');
      setTimeout(() => callback(initialSession ? 'INITIAL_SESSION' : 'SIGNED_OUT', initialSession), 0);
      
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              authCallbacks.delete(callback);
              window.removeEventListener('storage', handleStorage);
            } 
          } 
        } 
      };
    }
  },
  channel: () => {
    const mockChannel: any = {
      on: () => mockChannel,
      subscribe: () => ({ unsubscribe: () => {} })
    };
    return mockChannel;
  },
  removeChannel: () => {},
  from: (table: string) => {
    const createQuery = () => {
      const query: any = {
        _eq: [] as { field: string, value: any }[],
        _or: null as string | null,
        _select: '*',
        _limit: null as number | null,
        _order: null as { column: string, ascending: boolean } | null,

        select: (columns: string = '*') => {
          query._select = columns;
          return query;
        },
        eq: (field: string, value: any) => {
          query._eq.push({ field, value });
          return query;
        },
        or: (filters: string) => {
          query._or = filters;
          return query;
        },
        order: (column: string, { ascending = true } = {}) => {
          query._order = { column, ascending };
          return query;
        },
        limit: (count: number) => {
          query._limit = count;
          return query;
        },
        upsert: async (payload: any, { onConflict }: { onConflict?: string } = {}) => {
          try {
            const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
            const url = new URL(`/api/data/${table}`, window.location.origin);
            url.searchParams.append('upsert', 'true');
            if (onConflict) url.searchParams.append('on_conflict', onConflict);
            
            const res = await fetch(url.toString(), {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
              },
              body: JSON.stringify(payload)
            });
            
            const text = await res.text();
            if (!text) return { data: null, error: res.ok ? null : new Error(`Server returned empty response with status ${res.status}`) };
            
            try {
              const data = JSON.parse(text);
              if (!res.ok) {
                const error: any = new Error(data.error || `Upsert failed with status ${res.status}`);
                error.isConfigError = data.isConfigError;
                error.details = data.details;
                return { data: null, error };
              }
              return { data, error: null };
            } catch (e) {
              return { data: null, error: new Error(`Failed to parse JSON response: ${text.substring(0, 100)}...`) };
            }
          } catch (err) {
            return { data: null, error: err };
          }
        },
        single: async () => {
          try {
            const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
            const url = new URL(`/api/data/${table}`, window.location.origin);
            url.searchParams.append('select', query._select);
            query._eq.forEach((e: any) => {
              url.searchParams.append('eq_field', e.field);
              url.searchParams.append('eq_value', e.value);
            });
            if (query._or) url.searchParams.append('or', query._or);
            
            const res = await fetch(url.toString(), {
              headers: {
                ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
              }
            });
            const text = await res.text();
            if (!text) return { data: null, error: res.ok ? null : new Error(`Server returned empty response with status ${res.status}`) };
            
            try {
              const data = JSON.parse(text);
              if (!res.ok) {
                let errorMsg = data.error || `Fetch failed with status ${res.status}`;
                if (res.status === 403) {
                  errorMsg = `Permission Denied (403): ${errorMsg}. This typically happens when RLS is enabled but the backend is not using a valid Service Role Key.`;
                }
                const error: any = new Error(errorMsg);
                error.isConfigError = data.isConfigError;
                error.details = data.details;
                return { data: null, error };
              }
              return { data: Array.isArray(data) ? data[0] : data, error: null };
            } catch (e) {
              let errorMsg = `Failed to parse JSON response (${res.status})`;
              if (res.status === 403) {
                errorMsg = `Permission Denied (403): The server returned an error page instead of JSON.`;
              }
              return { data: null, error: new Error(`${errorMsg}: ${text.substring(0, 200)}...`) };
            }
          } catch (err) {
            return { data: null, error: err };
          }
        },
        maybeSingle: async () => {
          try {
            const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
            const url = new URL(`/api/data/${table}`, window.location.origin);
            url.searchParams.append('select', query._select);
            query._eq.forEach((e: any) => {
              url.searchParams.append('eq_field', e.field);
              url.searchParams.append('eq_value', e.value);
            });
            if (query._or) url.searchParams.append('or', query._or);
            
            const res = await fetch(url.toString(), {
              headers: {
                ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
              }
            });
            const text = await res.text();
            if (!text) return { data: null, error: null };
            
            try {
              const data = JSON.parse(text);
              if (!res.ok) return { data: null, error: new Error(data.error || `Fetch failed with status ${res.status}`) };
              const result = Array.isArray(data) ? data[0] : data;
              return { data: result || null, error: null };
            } catch (e) {
              return { data: null, error: new Error(`Failed to parse JSON response: ${text.substring(0, 100)}...`) };
            }
          } catch (err) {
            return { data: null, error: err };
          }
        },
        then: async (resolve: any, reject: any) => {
          try {
            const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
            const url = new URL(`/api/data/${table}`, window.location.origin);
            url.searchParams.append('select', query._select);
            query._eq.forEach((e: any) => {
              url.searchParams.append('eq_field', e.field);
              url.searchParams.append('eq_value', e.value);
            });
            if (query._or) url.searchParams.append('or', query._or);
            if (query._limit) url.searchParams.append('limit', query._limit.toString());
            
            const res = await fetch(url.toString(), {
              headers: {
                ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
              }
            });
            const text = await res.text();
            if (!text) {
              resolve({ data: res.ok ? [] : null, error: res.ok ? null : new Error(`Server returned empty response with status ${res.status}`) });
              return;
            }
            
            try {
              const data = JSON.parse(text);
              resolve({ 
                data: res.ok ? (Array.isArray(data) ? data : []) : null, 
                error: res.ok ? null : new Error(data.error || `Fetch failed with status ${res.status}`) 
              });
            } catch (e) {
              resolve({ data: null, error: new Error(`Failed to parse JSON response: ${text.substring(0, 100)}...`) });
            }
          } catch (err) {
            resolve({ data: null, error: err });
          }
        }
      };
      return query;
    };

    return {
      select: (columns: string = '*') => createQuery().select(columns),
      upsert: (payload: any, options?: any) => createQuery().upsert(payload, options),
      insert: (payload: any) => {
        const query: any = {
          select: () => ({
            single: async () => {
              const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
              const res = await fetch(`/api/data/${table}`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify(payload),
              });
              const contentType = res.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                if (!res.ok) {
                  const error: any = new Error(data.error || `Insert failed with status ${res.status}`);
                  error.isConfigError = data.isConfigError;
                  error.details = data.details;
                  return { data: null, error };
                }
                return { 
                  data: Array.isArray(data) ? data[0] : data, 
                  error: null 
                };
              } else {
                const text = await res.text();
                return { data: null, error: new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}...`) };
              }
            }
          }),
          then: async (resolve: any) => {
            try {
              const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
              const res = await fetch(`/api/data/${table}`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify(payload),
              });
              const contentType = res.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                if (!res.ok) {
                  const error: any = new Error(data.error || `Insert failed with status ${res.status}`);
                  error.isConfigError = data.isConfigError;
                  error.details = data.details;
                  return resolve({ data: null, error });
                }
                resolve({ data, error: null });
              } else {
                const text = await res.text();
                resolve({ data: null, error: new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}...`) });
              }
            } catch (err) {
              resolve({ data: null, error: err });
            }
          }
        };
        return query;
      },
      update: (payload: any) => {
        const query: any = {
          _eqs: [] as { field: string, value: any }[],
          eq: (field: string, value: any) => {
            query._eqs.push({ field, value });
            return query;
          },
          select: () => ({
            single: async () => {
              const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
              const url = new URL(`/api/data/${table}`, window.location.origin);
              query._eqs.forEach((e: any) => {
                url.searchParams.append('eq_field', e.field);
                url.searchParams.append('eq_value', e.value);
              });
              
              const res = await fetch(url.toString(), {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify(payload),
              });
              
              const text = await res.text();
              if (!text) return { data: null, error: res.ok ? null : new Error(`Server returned empty response with status ${res.status}`) };
              
              try {
                const data = JSON.parse(text);
                return { 
                  data: res.ok ? data : null, 
                  error: res.ok ? null : new Error(data.error || `Update failed with status ${res.status}`) 
                };
              } catch (e) {
                return { data: null, error: new Error(`Failed to parse JSON response: ${text.substring(0, 100)}...`) };
              }
            }
          }),
          then: async (resolve: any) => {
            try {
              const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
              const url = new URL(`/api/data/${table}`, window.location.origin);
              query._eqs.forEach((e: any) => {
                url.searchParams.append('eq_field', e.field);
                url.searchParams.append('eq_value', e.value);
              });
              
              const res = await fetch(url.toString(), {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify(payload),
              });
              
              const text = await res.text();
              if (!text) {
                resolve({ data: null, error: res.ok ? null : new Error(`Server returned empty response with status ${res.status}`) });
                return;
              }
              
              try {
                const data = JSON.parse(text);
                resolve({ 
                  data: res.ok ? data : null, 
                  error: res.ok ? null : new Error(data.error || `Update failed with status ${res.status}`) 
                });
              } catch (e) {
                resolve({ data: null, error: new Error(`Failed to parse JSON response: ${text.substring(0, 100)}...`) });
              }
            } catch (err) {
              resolve({ data: null, error: err });
            }
          }
        };
        return query;
      },
      delete: () => {
        const query: any = {
          _eqs: [] as { field: string, value: any }[],
          eq: (field: string, value: any) => {
            query._eqs.push({ field, value });
            return query;
          },
          then: async (cb: any) => {
            const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
            const url = new URL(`/api/data/${table}`, window.location.origin);
            query._eqs.forEach((e: any) => {
              url.searchParams.append('eq_field', e.field);
              url.searchParams.append('eq_value', e.value);
            });
            const res = await fetch(url.toString(), { 
              method: 'DELETE',
              headers: {
                ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
              }
            });
            cb({ error: res.ok ? null : new Error('Delete failed') });
          }
        };
        return query;
      }
    };
  }
};
