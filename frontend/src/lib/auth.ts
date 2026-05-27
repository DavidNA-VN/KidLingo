import { apiRequest } from "./api";

export type UserRole = "TEACHER" | "PARENT";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
};

const TOKEN_KEY = "doodle_english_token";
const USER_KEY = "doodle_english_user";

export function getStoredToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeSession(session: LoginResponse): void {
  window.localStorage.setItem(TOKEN_KEY, session.access_token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(payload: RegisterPayload): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMe(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/auth/me", { token });
}
