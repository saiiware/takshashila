// Central place to point the frontend at the real backend once it exists.
// Nothing in this file is called yet — every service currently returns
// mock data — but every endpoint the backend will need is listed here so
// wiring it up later is a matter of swapping the mock functions, not
// restructuring the app.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const API_ENDPOINTS = {
  register: "/auth/register",
  login: "/auth/login",
  courses: "/courses",
  courseById: (id: string) => `/courses/${id}`,
  enroll: (id: string) => `/courses/${id}/enroll`,
  videoById: (id: string) => `/videos/${id}`,
  progress: "/progress",
  askAI: "/ai/ask",
  transcribeSpeech: "/speech/transcribe",
  synthesizeSpeech: "/speech/synthesize",
} as const;

/**
 * Thin wrapper around fetch, ready for the real backend. Every current
 * service function bypasses this and returns mock data directly — swap
 * those implementations to call `apiRequest` once FastAPI is live.
 */
export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
