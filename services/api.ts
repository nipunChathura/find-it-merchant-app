import {
    API_BASE_URL,
    API_ENDPOINTS,
    type LoginRequestBody,
    type LoginResponse,
} from '@/constants/api';

async function request<T>(
  path: string,
  options: RequestInit & { body?: object } = {}
): Promise<T> {
  const { body, ...init } = options;
  const url = `${API_BASE_URL}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers ?? {}),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      body: body ? JSON.stringify(body) : init.body,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    if (message.includes('Network request failed') || message.includes('Failed to fetch')) {
      throw new Error(
        `Cannot reach server at ${url}. Check that the backend is running and the URL is correct (use 10.0.2.2 for Android emulator, your PC IP for a physical device).`
      );
    }
    throw err;
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  let data = {} as T & { responseMessage?: string };
  if (isJson) {
    data = (await res.json().catch(() => ({}))) as T & { responseMessage?: string };
  }

  if (!res.ok) {
    throw new Error(
      (data.responseMessage as string) ?? `Request failed: ${res.status}`
    );
  }
  return data as T;
}

export async function login(body: LoginRequestBody): Promise<LoginResponse> {
  return request<LoginResponse>(API_ENDPOINTS.login, {
    method: 'POST',
    body,
  });
}
