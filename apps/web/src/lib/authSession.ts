type ClerkSession = {
  getToken: () => Promise<string | null>;
};

type BrowserClerk = {
  session?: ClerkSession | null;
};

declare global {
  interface Window {
    Clerk?: BrowserClerk;
  }
}

export async function getClerkAuthToken() {
  if (typeof window === "undefined") return null;

  return window.Clerk?.session?.getToken() ?? null;
}
