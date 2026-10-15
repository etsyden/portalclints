import { apiRequest } from './client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
      body: JSON.stringify({
        refreshToken,
      }),
    },
    {
      skipRefresh: true,
    },
  );

  saveAuth(result);

  return result;
}

export async function logout(): Promise<void> {
  const refreshToken =
    localStorage.getItem('refreshToken');

  try {
    if (refreshToken) {
      await apiRequest(
        '/auth/logout',
        {
          method: 'POST',
          body: JSON.stringify({
            refreshToken,
          }),
        },
        {
          skipRefresh: true,
        },
      );
    }
  } finally {
    clearAuth();
  }
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me');
}

export function saveAuth(result: LoginResponse) {
  localStorage.setItem(
    'accessToken',
    result.accessToken,
  );

  localStorage.setItem(
    'refreshToken',
    result.refreshToken,
  );

  localStorage.setItem(
    'user',
    JSON.stringify(result.user),
  );
}

export function clearAuth() {
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
    return JSON.parse(user);
  } catch {
    return null;
  }
}