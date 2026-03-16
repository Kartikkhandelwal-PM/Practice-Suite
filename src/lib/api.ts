const SESSION_KEY = 'kdk_session';

export interface StoredSession {
  access_token: string;
  refresh_token?: string;
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  };
}

async function apiFetch<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  const authToken = token || getStoredSession()?.access_token;
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const response = await fetch(`/api${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const sessionStore = {
  get: (): StoredSession | null => getStoredSession(),
  set: (session: StoredSession | null) => {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clear: () => localStorage.removeItem(SESSION_KEY),
};

function getStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export const authApi = {
  async login(email: string, password: string) {
    return apiFetch<{ session: StoredSession; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  async signup(email: string, password: string, fullName: string) {
    return apiFetch<{ session: StoredSession | null; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      }),
    });
  },
  async getCurrentUser() {
    return apiFetch<{ user: any }>('/auth/me');
  },
  logout() {
    sessionStore.clear();
  },
};

export const dataApi = {
  async list<T>(table: string): Promise<T[]> {
    return apiFetch<T[]>(`/data/${table}`);
  },
  async insert<T>(table: string, payload: T): Promise<T[]> {
    return apiFetch<T[]>(`/data/${table}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update<T>(table: string, id: string, payload: Partial<T>): Promise<T[]> {
    return apiFetch<T[]>(`/data/${table}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async remove(table: string, id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/data/${table}/${id}`, {
      method: 'DELETE',
    });
  },
};

export const aiApi = {
  async status() {
    return apiFetch<{ configured: boolean; model: string; key_source?: string }>('/ai/status');
  },
  async generate(prompt: string, responseSchema: Record<string, any>) {
    return apiFetch<{ text: string }>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, responseSchema }),
    });
  },
  async seedDemo() {
    return apiFetch<{ success: boolean; seeded: boolean }>('/seed-demo', { method: 'POST' });
  },
};
