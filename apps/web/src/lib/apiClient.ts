const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001";

type ApiRequestOptions = RequestInit & {
  authToken?: string;
  timeoutMs?: number;
};

export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { authToken, timeoutMs, ...requestOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? globalThis.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  const headers = new Headers(requestOptions.headers);

  headers.set("Content-Type", "application/json");

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers,
      cache: "no-store",
      signal: controller?.signal ?? requestOptions.signal,
    });

    if (!response.ok) {
      const message = await response.text();

      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${message}`
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (controller?.signal.aborted) {
      const timeoutError = new Error(
        `API request timed out after ${timeoutMs}ms`
      );
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }

    throw error;
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }
  }
}
