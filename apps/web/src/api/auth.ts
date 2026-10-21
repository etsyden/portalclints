import { apiRequest } from './client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function login(
  data: LoginData,
): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  saveAuth(result);
  return result;
}

export async function register(
  data: RegisterData,
): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  saveAuth(result);
  return result;
}

export async function refreshAccessToken(): Promise<LoginResponse> {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('Refresh token is missing');
  }

  const result = await apiRequest<LoginResponse>(
    '/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    },
    { skipRefresh: true },
  );

  saveAuth(result);
  return result;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refreshToken');

  try {
    if (refreshToken) {
      await apiRequest(
        '/auth/logout',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        },
        { skipRefresh: true },
      );
    }
  } finally {
    clearAuth();
  }
}

export async function getMe(): Promise<AuthUser> {
  const user = await apiRequest<AuthUser>('/auth/me');
  saveStoredUser(user);
  return user;
}

export function saveStoredUser(user: AuthUser): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function saveAuth(result: LoginResponse): void {
  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('refreshToken', result.refreshToken);
  saveStoredUser(result.user);
}

export function clearAuth(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getStoredUser(): AuthUser | null {
  const user = localStorage.getItem('user');

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as AuthUser;
  } catch {
    return null;
  }
}


export async function uploadAvatar(file: File): Promise<AuthUser> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:3000/auth/me/avatar', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: (() => {
      const formData = new FormData();
      formData.append('avatar', file);
      return formData;
    })(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || `Не удалось загрузить аватар (${response.status})`);
  }

  const user = await response.json() as AuthUser;
  saveStoredUser(user);
  return user;
}

export async function forgotPassword(email: string) {
  return apiRequest(
    '/auth/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    { skipRefresh: true },
  );
}

export async function resetPassword(
  token: string,
  newPassword: string,
) {
  return apiRequest(
    '/auth/reset-password',
    {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    },
    { skipRefresh: true },
  );
}