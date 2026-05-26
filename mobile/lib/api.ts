import type {
  User,
  Property,
  Agent,
  AgentReview,
  ReceivedMessage,
  SentMessage,
  PropertyVisiting,
  VisitingRow,
  Meeting,
  CreatePropertyPayload,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    // React Native's native HTTP stack persists cookies automatically,
    // so the httpOnly `token` cookie is sent on every request.
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.error ?? json.message ?? `Request failed with status ${res.status}`);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      throw e;
    }
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

  async uploadImage(type: 'avatar' | 'cover', uri: string, mimeType: string) {
    const form = new FormData();
    form.append('type', type);
    form.append('file', { uri, name: `${type}.jpg`, type: mimeType } as unknown as Blob);
    const res = await fetch(`${BASE_URL}/api/user/upload-image`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        throw new Error(json.error ?? `Upload failed with status ${res.status}`);
      } catch (e) {
        if (e instanceof SyntaxError) throw new Error(text || `Upload failed with status ${res.status}`);
        throw e;
      }
    }
    return res.json() as Promise<{ publicUrl: string }>;
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

  coverImage(id: number) {
    return request<{ coverImage: string | null }>(`/api/properties/${id}/cover-image`);
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
      method: 'PATCH',
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
  received() {
    return request<ReceivedMessage[]>('/api/messages?tab=received');
  },

  sent() {
    return request<SentMessage[]>('/api/messages?tab=sent');
  },

  send(receiverId: number, subject: string, message: string) {
    return request<{ success: true; id: number }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, subject, message }),
    });
  },

  markSeen(id: number) {
    return request<{ success: true }>('/api/messages', {
      method: 'PATCH',
      body: JSON.stringify({ id }),
    });
  },
};

// ─── Visitings ────────────────────────────────────────────────────────────────

export const visitings = {
  my() {
    return request<VisitingRow[]>('/api/visitings/my');
  },

  check(propertyId: number) {
    return request<{
      booked: boolean;
      visitDate?: string;
      hour?: number;
      status?: 'pending' | 'confirmed' | 'cancelled';
      visitingId?: number;
    }>(`/api/visitings?propertyId=${propertyId}`);
  },

  create(propertyId: number, visitDate: string, hour: number, notes?: string) {
    return request<PropertyVisiting>('/api/visitings', {
      method: 'POST',
      body: JSON.stringify({ propertyId, visitDate, hour, notes }),
    });
  },

  deleteVisiting(id: number) {
    return request<{ deleted: boolean }>(`/api/visitings/${id}`, { method: 'DELETE' });
  },

  busySlots(propertyId: number) {
    return request<{ visitDate: string; hour: number }[]>(
      `/api/visitings/busy-slots?propertyId=${propertyId}`
    );
  },

  accept(id: number) {
    return request<PropertyVisiting>(`/api/visitings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    });
  },

  decline(id: number) {
    return request<PropertyVisiting>(`/api/visitings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
  },
};

// ─── Meetings ─────────────────────────────────────────────────────────────────

export const meetings = {
  my(page = 1) {
    return request<{ rows: Meeting[]; total: number }>(`/api/meetings/my?page=${page}`);
  },

  sold(data: { meetingId: number; propertyName: string; buyer: string; transactionType: 'bought' | 'rented' }) {
    return request<{ id: number }>('/api/meetings/sold', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminUserResult = {
  id: number;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  location: string | null;
  createdAt: string;
  officePhone: string | null;
  mobilePhone: string | null;
  contactEmail: string | null;
};

export type AdminCandidate = {
  id: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  personalInfo: string | null;
  education: string | null;
  workExperience: string | null;
  skills: string | null;
  availability: string | null;
  createdAt: string;
};

export const admin = {
  stats() {
    return request<{ properties: number; agents: number; users: number; forSale: number; forRent: number }>(
      '/api/admin/stats'
    );
  },

  monthlyProperties() {
    return request<{ year: number; sold: number[]; rented: number[]; listed: number[] }>(
      '/api/admin/monthly-properties'
    );
  },

  searchUsers(query: string) {
    return request<AdminUserResult[]>(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
  },

  makeAgent(data: { userId: number; name: string; specialty: string; city: string; image: string; phone: string; email: string }) {
    return request<{ id: number }>('/api/admin/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  agentCandidates() {
    return request<AdminCandidate[]>('/api/admin/agent-candidates');
  },

  acceptCandidate(id: number, specialty: string) {
    return request<{ id: number }>(`/api/admin/agent-candidates/${id}`, {
      method: 'POST',
      body: JSON.stringify({ specialty }),
    });
  },

  declineCandidate(id: number) {
    return request<{ deleted: boolean }>(`/api/admin/agent-candidates/${id}`, {
      method: 'DELETE',
    });
  },
};
