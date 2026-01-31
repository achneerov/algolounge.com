const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth API
export const authApi = {
  signIn: (email: string, password: string) =>
    apiRequest<{ user: { id: number; username: string; email: string; roleId: number }; token: string }>(
      '/api/auth/signin',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ),

  signUp: (username: string, email: string, password: string) =>
    apiRequest<{ user: { id: number; username: string; email: string; roleId: number }; token: string }>(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }
    ),
};

// Completions API
export const completionsApi = {
  getCompletions: () =>
    apiRequest<{ completedQuestions: string[] }>('/api/question-completions'),

  markCompleted: (questionFilename: string) =>
    apiRequest<{ id: number; user_id: number; question_filename: string }>(
      '/api/question-completions',
      {
        method: 'POST',
        body: JSON.stringify({ questionFilename }),
      }
    ),
};

// Favorites API
export const favoritesApi = {
  getFavorites: () =>
    apiRequest<{ favorites: string[] }>('/api/favorites'),

  addFavorite: (courseFilename: string) =>
    apiRequest<{ id: number; user_id: number; course_filename: string }>(
      '/api/favorites',
      {
        method: 'POST',
        body: JSON.stringify({ courseFilename }),
      }
    ),

  removeFavorite: (courseFilename: string) =>
    apiRequest<void>('/api/favorites', {
      method: 'DELETE',
      body: JSON.stringify({ courseFilename }),
    }),
};
