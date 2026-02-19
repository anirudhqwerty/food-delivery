export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://172.16.167.253:8080";

export async function apiRequest(
  path: string,
  method: string,
  body?: any,
  token?: string,
) {
  const headers: any = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") ?? "";
  let data: any;

  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(
      text
        ? `Expected JSON response but received ${contentType || "text"}: ${text}`
        : `Expected JSON response but server returned ${contentType || "text"}`
    );
  }

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

// communication layer
