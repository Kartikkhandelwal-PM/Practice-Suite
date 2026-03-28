const authCallbacks: Set<(event: string, session: any) => void> = new Set();

const triggerAuthChange = (event: string, session: any) => {
  authCallbacks.forEach(cb => cb(event, session));
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const getSession = () => JSON.parse(localStorage.getItem('sb-session') || 'null');
  let session = getSession();
  
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
  };

  let res = await fetch(url, { ...options, headers });
  
  // If 401, try to refresh once
  if (res.status === 401) {
    try {
      if (!session?.refresh_token) throw new Error('No refresh token');
      
      console.log('[Auth] Token expired, attempting auto-refresh...');
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.session) {
          localStorage.setItem('sb-session', JSON.stringify(data.session));
          triggerAuthChange('SIGNED_IN', data.session);
          
          // Retry original request with new token
          const newHeaders = {
            ...headers,
            'Authorization': `Bearer ${data.session.access_token}`
          };
          res = await fetch(url, { ...options, headers: newHeaders });
          console.log('[Auth] Auto-refresh successful, retried request.');
        }
      } else {
        console.warn('[Auth] Auto-refresh failed with status:', refreshRes.status);
      }
    } catch (e) {
      console.error('[Auth] Auto-refresh failed:', e);
    }
  }
  
  return res;
};

// This client proxies all calls to the backend API to keep keys secure.
export const supabase: any = {
  auth: {
    getSession: async () => {
      const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
      return { data: { session }, error: null };
    },
    refreshSession: async () => {
      try {
        const session = JSON.parse(localStorage.getItem('sb-session') || 'null');
        if (!session?.refresh_token) throw new Error('No refresh token available');
        
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Refresh failed');
        }
        
        const data = await response.json();
        localStorage.setItem('sb-session', JSON.stringify(data.session));
        triggerAuthChange('SIGNED_IN', data.session);
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
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
    const createBuilder = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', initialPayload?: any, initialOptions?: any) => {
      const builder: any = {
        _method: method,
        _payload: initialPayload,
        _options: initialOptions,
        _eq: [] as { field: string, value: any }[],
        _or: null as string | null,
        _select: '*',
        _limit: null as number | null,
        _order: null as { column: string, ascending: boolean } | null,
        _single: false,
        _maybeSingle: false,

        select: (columns: string = '*') => {
          builder._select = columns;
          return builder;
        },
        eq: (field: string, value: any) => {
          builder._eq.push({ field, value });
          return builder;
        },
        or: (filters: string) => {
          builder._or = filters;
          return builder;
        },
        order: (column: string, { ascending = true } = {}) => {
          builder._order = { column, ascending };
          return builder;
        },
        limit: (count: number) => {
          builder._limit = count;
          return builder;
        },
        single: () => {
          builder._single = true;
          return builder;
        },
        maybeSingle: () => {
          builder._maybeSingle = true;
          return builder;
        },
        then: async (resolve: any, reject: any) => {
          try {
            const url = new URL(`/api/data/${table}`, window.location.origin);
            
            // Add query params
            if (builder._method === 'GET' || builder._method === 'PUT' || builder._method === 'DELETE') {
              builder._eq.forEach((e: any) => {
                url.searchParams.append('eq_field', e.field);
                url.searchParams.append('eq_value', e.value);
              });
              if (builder._or) url.searchParams.append('or', builder._or);
            }
            
            if (builder._method === 'GET') {
              url.searchParams.append('select', builder._select);
              if (builder._limit) url.searchParams.append('limit', builder._limit.toString());
            }

            if (builder._method === 'POST' && builder._options?.upsert) {
              url.searchParams.append('upsert', 'true');
              if (builder._options?.onConflict) url.searchParams.append('on_conflict', builder._options.onConflict);
            }

            // If .select() was called on a POST/PUT, we should tell the backend to return data
            if ((builder._method === 'POST' || builder._method === 'PUT') && builder._select) {
              url.searchParams.append('select', builder._select);
            }

            const res = await apiFetch(url.toString(), {
              method: builder._method,
              body: builder._payload ? JSON.stringify(builder._payload) : undefined
            });

            const text = await res.text();
            if (!text) {
              const result = { 
                data: builder._method === 'GET' ? (builder._single || builder._maybeSingle ? null : []) : null, 
                error: res.ok ? null : new Error(`Server returned empty response with status ${res.status}`) 
              };
              if (resolve) resolve(result);
              return result;
            }

            try {
              const data = JSON.parse(text);
              if (!res.ok) {
                let errorMsg = data.error || `${builder._method} failed with status ${res.status}`;
                if (res.status === 403) {
                  errorMsg = `Permission Denied (403): ${errorMsg}. This typically happens when RLS is enabled but the backend is not using a valid Service Role Key.`;
                }
                if (data.isGatewayError || res.status === 502 || res.status === 504) {
                  errorMsg = `Supabase Gateway Error (${res.status}): Your Supabase project might be paused or starting up. Please check your Supabase Dashboard.`;
                }
                const error: any = new Error(errorMsg);
                error.isConfigError = data.isConfigError;
                error.details = data.details;
                error.isGatewayError = data.isGatewayError || res.status === 502 || res.status === 504;
                const result = { data: null, error };
                if (resolve) resolve(result);
                return result;
              }

              let finalData = data;
              if (builder._method === 'GET') {
                if (builder._single) finalData = Array.isArray(data) ? data[0] : data;
                else if (builder._maybeSingle) finalData = (Array.isArray(data) && data.length > 0) ? data[0] : (data || null);
                else finalData = Array.isArray(data) ? data : (data ? [data] : []);
              } else if (builder._method === 'POST' || builder._method === 'PUT') {
                // For insert/upsert/update, if we used .select(), the server returns the data
                // If the payload was an object (not array), return single object
                if (!Array.isArray(builder._payload) && Array.isArray(data)) {
                  finalData = data[0];
                }
              }

              const result = { data: finalData, error: null };
              if (resolve) resolve(result);
              return result;
            } catch (e) {
              let errorMsg = `Failed to parse JSON response (${res.status})`;
              if (res.status === 403 || res.status === 500) {
                if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
                  errorMsg = `Permission Denied or Server Error (${res.status}): The server returned an error page instead of JSON. This often happens when a proxy intercepts a 403 or 500 error.`;
                }
              }
              if (res.status === 502 || res.status === 504 || text.includes('<!DOCTYPE html>') || text.includes('Error code 502')) {
                errorMsg = `Supabase Gateway Error (${res.status}): The server returned an error page. Your Supabase project might be paused or starting up.`;
              }
              const result = { data: null, error: new Error(`${errorMsg}: ${text.substring(0, 200)}...`) };
              if (resolve) resolve(result);
              return result;
            }
          } catch (err) {
            const result = { data: null, error: err };
            if (resolve) resolve(result);
            return result;
          }
        }
      };
      return builder;
    };

    return {
      select: (columns: string = '*') => createBuilder('GET').select(columns),
      insert: (payload: any) => createBuilder('POST', payload).select(),
      upsert: (payload: any, options?: any) => createBuilder('POST', payload, { upsert: true, ...options }).select(),
      update: (payload: any) => createBuilder('PUT', payload).select(),
      delete: () => createBuilder('DELETE')
    };
  }
};
