const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.164.30:8080';

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any, token?: string) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
};
