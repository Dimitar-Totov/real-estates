import type {
  User,
  Property,
  Agent,
  AgentReview,
  Message,
  PropertyVisiting,
  CreatePropertyPayload,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Stored auth token (set after login)
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const auth = {
  login(email: string, password: string) {
    return request<{ message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(username: string, email: string, password: string) {
    return request<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  logout() {
    return request<{ message: string }>('/api/auth/logout', { method: 'POST' });
  },
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const users = {
  me() {
    return request<User>('/api/user/me');
  },

  updateMe(data: Partial<Pick<User, 'location' | 'facebookUrl' | 'linkedinUrl' | 'twitterUrl' | 'officePhone' | 'mobilePhone' | 'contactEmail'>>) {
    return request<User>('/api/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ─── Properties ───────────────────────────────────────────────────────────────

export const properties = {
  list(params?: { city?: string; type?: string; status?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<Property[]>(`/api/properties${query ? `?${query}` : ''}`);
  },

  get(id: number) {
    return request<Property>(`/api/properties/${id}`);
  },

  create(payload: CreatePropertyPayload) {
    return request<Property | { pending: true; id: number }>('/api/properties', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  my() {
    return request<Property[]>('/api/properties/my');
  },
};

// ─── Agents ───────────────────────────────────────────────────────────────────

export const agents = {
  list() {
    return request<Agent[]>('/api/agents');
  },

  reviews(agentId: number, page = 1) {
    return request<{ reviews: AgentReview[]; total: number; pages: number }>(
      `/api/agents/${agentId}/reviews?page=${page}`
    );
  },

  rate(agentId: number, rating: number) {
    return request<{ message: string }>(`/api/agents/${agentId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  },

  comment(agentId: number, comment: string) {
    return request<{ message: string }>(`/api/agents/${agentId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  myRating(agentId: number) {
    return request<{ rating: number | null; comment: string | null }>(
      `/api/agents/${agentId}/my-rating`
    );
  },
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messages = {
  list() {
    return request<Message[]>('/api/messages');
  },

  send(receiverId: number, subject: string, message: string) {
    return request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, subject, message }),
    });
  },
};

// ─── Visitings ────────────────────────────────────────────────────────────────

export const visitings = {
  my() {
    return request<PropertyVisiting[]>('/api/visitings/my');
  },

  create(propertyId: number, visitDate: string, hour: string, notes?: string) {
    return request<PropertyVisiting>('/api/visitings', {
      method: 'POST',
      body: JSON.stringify({ propertyId, visitDate, hour, notes }),
    });
  },

  busySlots(propertyId: number, date: string) {
    return request<string[]>(`/api/visitings/busy-slots?propertyId=${propertyId}&date=${date}`);
  },
};
