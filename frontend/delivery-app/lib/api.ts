const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.16.164.30:8080';

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  // Using a mock driver UUID for testing until auth is fully implemented
  const mockDriverId = "11111111-1111-1111-1111-111111111111"; 
  
  if (body) {
    body.driver_id = mockDriverId;
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
