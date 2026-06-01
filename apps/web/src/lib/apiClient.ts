const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001";

type ApiRequestOptions = RequestInit & {
  authToken?: string;
};

export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (options.authToken) {
    headers.set("Authorization", `Bearer ${options.authToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${message}`
    );
  }

  return response.json() as Promise<T>;
}