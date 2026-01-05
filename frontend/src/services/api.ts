import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  User,
  UserProfile,
  Occupation,
  OccupationSearchResult,
  OccupationSkill,
  PromotionPath,
  UserSkill,
  Evidence,
  EvidenceCreate,
  GapAnalysis,
  GapCoaching,
  GeneratedDocument,
  DocumentGenerateRequest,
  CheckinLog,
  LoginCredentials,
  RegisterData,
  AuthTokens,
} from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = localStorage.getItem('access_token');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const setRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('refresh_token', token);
  } else {
    localStorage.removeItem('refresh_token');
  }
};

// Request interceptor to add auth header
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/token/refresh/', {
            refresh: refreshToken,
          });

          setAccessToken(response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch {
          // Refresh failed, clear tokens
          setAccessToken(null);
          setRefreshToken(null);
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await api.post('/auth/login/', credentials);
    setAccessToken(response.data.access);
    setRefreshToken(response.data.refresh);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthTokens> => {
    const response = await api.post('/auth/registration/', data);
    setAccessToken(response.data.access);
    setRefreshToken(response.data.refresh);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout/');
    setAccessToken(null);
    setRefreshToken(null);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
};

// User/Profile API
export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/profile/');
    return response.data;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.patch('/profile/', data);
    return response.data;
  },

  getCheckinSettings: async () => {
    const response = await api.get('/checkins/settings/');
    return response.data;
  },

  updateCheckinSettings: async (data: {
    checkin_enabled?: boolean;
    checkin_day?: number;
    checkin_time?: string;
  }) => {
    const response = await api.patch('/checkins/settings/', data);
    return response.data;
  },
};

// Occupation API
export const occupationApi = {
  search: async (query: string, limit = 10): Promise<OccupationSearchResult[]> => {
    const response = await api.get('/occupations/search/', {
      params: { q: query, limit },
    });
    return response.data;
  },

  getById: async (code: string): Promise<Occupation> => {
    const response = await api.get(`/occupations/${code}/`);
    return response.data;
  },

  getSkills: async (code: string, minImportance = 2.5): Promise<OccupationSkill[]> => {
    const response = await api.get(`/occupations/${code}/skills/`, {
      params: { min_importance: minImportance },
    });
    return response.data;
  },

  getPaths: async (code: string, limit = 6): Promise<PromotionPath[]> => {
    const response = await api.get(`/occupations/${code}/paths/`, {
      params: { limit },
    });
    return response.data;
  },

  interpret: async (title: string, description?: string) => {
    const response = await api.post('/occupations/interpret/', {
      title,
      description,
    });
    return response.data;
  },
};

// User Skills API
export const skillsApi = {
  getUserSkills: async (): Promise<UserSkill[]> => {
    const response = await api.get('/profile/skills/');
    return response.data;
  },

  addUserSkill: async (data: {
    skill?: string;
    skill_name: string;
    proficiency: 1 | 2 | 3;
    is_custom?: boolean;
  }): Promise<UserSkill> => {
    const response = await api.post('/profile/skills/', data);
    return response.data;
  },

  bulkUpdateSkills: async (
    skills: Array<{
      skill?: string;
      skill_name: string;
      proficiency: 1 | 2 | 3;
      is_custom?: boolean;
    }>
  ) => {
    const response = await api.post('/profile/skills/bulk/', { skills });
    return response.data;
  },

  deleteUserSkill: async (id: string): Promise<void> => {
    await api.delete(`/profile/skills/${id}/`);
  },
};

// Evidence API
export const evidenceApi = {
  getAll: async (skillId?: string): Promise<Evidence[]> => {
    const response = await api.get('/evidence/', {
      params: skillId ? { skill: skillId } : {},
    });
    return response.data;
  },

  getById: async (id: string): Promise<Evidence> => {
    const response = await api.get(`/evidence/${id}/`);
    return response.data;
  },

  create: async (data: EvidenceCreate): Promise<Evidence> => {
    const response = await api.post('/evidence/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<EvidenceCreate>): Promise<Evidence> => {
    const response = await api.patch(`/evidence/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/evidence/${id}/`);
  },

  enhance: async (id: string): Promise<{
    enhanced: string;
    placeholders: string[];
    tip?: string;
  }> => {
    const response = await api.post(`/evidence/${id}/enhance/`);
    return response.data;
  },
};

// Gap Analysis API
export const analysisApi = {
  getAnalysis: async (): Promise<GapAnalysis> => {
    const response = await api.get('/analysis/');
    return response.data;
  },

  refreshAnalysis: async (): Promise<GapAnalysis> => {
    const response = await api.post('/analysis/refresh/');
    return response.data;
  },

  getCoaching: async (skillId: string): Promise<GapCoaching> => {
    const response = await api.get(`/analysis/coaching/${skillId}/`);
    return response.data;
  },
};

// Document API
export const documentApi = {
  generate: async (data: DocumentGenerateRequest): Promise<GeneratedDocument> => {
    const response = await api.post('/documents/generate/', data);
    return response.data;
  },

  getAll: async (): Promise<GeneratedDocument[]> => {
    const response = await api.get('/documents/');
    return response.data;
  },

  getById: async (id: string): Promise<GeneratedDocument> => {
    const response = await api.get(`/documents/${id}/`);
    return response.data;
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Check-in API
export const checkinApi = {
  getAll: async (): Promise<CheckinLog[]> => {
    const response = await api.get('/checkins/');
    return response.data;
  },

  submit: async (data: {
    wins?: EvidenceCreate[];
    skill_updates?: Array<{
      skill: string;
      proficiency: 1 | 2 | 3;
    }>;
    notes?: string;
  }): Promise<CheckinLog> => {
    const response = await api.post('/checkins/', data);
    return response.data;
  },
};

export default api;
