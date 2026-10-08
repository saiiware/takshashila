import type { Language, User } from "@/types";

const STORAGE_KEY = "skillsetu.user";
const SIMULATED_DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SignupPayload {
  name: string;
  contact: string;
  password: string;
  preferredLanguage: Language;
}

export interface LoginPayload {
  contact: string;
  password: string;
}

/**
 * Mock signup. The real version will POST to /auth/register and return a
 * token issued by FastAPI; for now we just persist the user locally so the
 * rest of the app has something to work with.
 */
export async function signup(payload: SignupPayload): Promise<User> {
  await delay(SIMULATED_DELAY_MS);
  const user: User = {
    id: `user-${Date.now()}`,
    name: payload.name.trim(),
    contact: payload.contact.trim(),
    preferredLanguage: payload.preferredLanguage,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

/**
 * Mock login. Accepts any password for any contact that has previously
 * signed up in this browser, or creates a lightweight session if none
 * exists yet — real credential checking happens once /auth/login is live.
 */
export async function login(payload: LoginPayload): Promise<User> {
  await delay(SIMULATED_DELAY_MS);
  const existing = getStoredUser();
  if (existing && existing.contact === payload.contact.trim()) {
    return existing;
  }
  const user: User = {
    id: `user-${Date.now()}`,
    name: payload.contact.split(/[@\s]/)[0] || "Learner",
    contact: payload.contact.trim(),
    preferredLanguage: "en",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const user = JSON.parse(raw) as User;
  if (user.preferredLanguage !== "en") {
    user.preferredLanguage = "en";
  }
  return user;
}

export function updateStoredUser(updates: Partial<User>): User | null {
  const existing = getStoredUser();
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}
