
const API_URL = 'http://localhost:3000';

interface ApiRequestOptions {
  skipRefresh?: boolean;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }

        const result: AuthResponse = await response.json();

        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
        localStorage.setItem('user', JSON.stringify(result.user));

        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function sendRequest(
  path: string,
  options: RequestInit,
  token: string | null,
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // ������������� ���������� ����� ����� ���������������� ����������.
  headers.delete('Authorization');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}


export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  requestOptions: ApiRequestOptions = {},
): Promise<T> {
  const isAuthRequest =
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/refresh';

  const token = isAuthRequest
    ? null
    : localStorage.getItem('accessToken');

  let response = await sendRequest(path, options, token);

  if (
    response.status === 401 &&
    !requestOptions.skipRefresh &&
    !isAuthRequest
  ) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const newToken = localStorage.getItem('accessToken');
      response = await sendRequest(path, options, newToken);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}



