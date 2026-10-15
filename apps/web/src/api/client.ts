const API_URL = 'http://localhost:3000';

interface ApiRequestOptions {
  skipRefresh?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken =
    localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(
      `${API_URL}/auth/refresh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }

        const result = await response.json();

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

        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  requestOptions: ApiRequestOptions = {},
): Promise<T> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && !requestOptions.skipRefresh) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const newToken =
        localStorage.getItem('accessToken');

      const retryResponse = await fetch(
        `${API_URL}${path}`,
        {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(newToken
              ? {
                Authorization: `Bearer ${newToken}`,
              }
              : {}),
            ...options.headers,
          },
        },
      );

      if (!retryResponse.ok) {
        const error =
          await retryResponse.json().catch(() => null);

        throw new Error(
          error?.message ||
          `API error: ${retryResponse.status}`,
        );
      }

      return retryResponse.json();
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    window.location.href = '/login';

    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error =
      await response.json().catch(() => null);

    throw new Error(
      error?.message ||
      `API error: ${response.status}`,
    );
  }

  return response.json();
}