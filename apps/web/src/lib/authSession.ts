export type AuthSession = {
  user: {
    name: string;
    email: string;
    role: string;
  };
  token: string;
  expiresAt: number;
};

const AUTH_SESSION_KEY = "money_signal_auth_session";

export function createMockSession(email: string): AuthSession {
  return {
    user: {
      name: "BD Analyst",
      email,
      role: "Institutional",
    },
    token: `mock-token-${Date.now()}`,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24,
  };
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as AuthSession;

    if (!session.expiresAt || session.expiresAt < Date.now()) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthSession());
}