import * as api from './api';

// Storage keys
const TOKEN_KEY = "merch_auth_token";
const REFRESH_TOKEN_KEY = "merch_refresh_token";
const USER_EMAIL_KEY = "merch_user_email";
const USER_ROLE_KEY = "merch_user_role";
const USER_NAME_KEY = "merch_user_name";

// ============================================
// Authentication Check
// ============================================

export function isAuthed(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function isAdmin(): boolean {
  return localStorage.getItem(USER_ROLE_KEY) === 'admin';
}

// ============================================
// Login with Real Backend
// ============================================

export async function login(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    // Call real backend API
    const response = await api.login(email, password);

    // Store tokens and user info
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_EMAIL_KEY, response.user.email);
    localStorage.setItem(USER_ROLE_KEY, response.user.role);
    localStorage.setItem(USER_NAME_KEY, response.user.full_name || '');

    return { ok: true };
  } catch (error) {
    // Return error message from backend
    const message = error instanceof Error ? error.message : 'Login failed';
    return { ok: false, message };
  }
}

// ============================================
// Register New User
// ============================================

export async function register(
  email: string,
  password: string,
  fullName: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await api.register(email, password, fullName);

    // Store tokens and user info
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_EMAIL_KEY, response.user.email);
    localStorage.setItem(USER_ROLE_KEY, response.user.role);
    localStorage.setItem(USER_NAME_KEY, response.user.full_name || '');

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return { ok: false, message };
  }
}

// ============================================
// Logout
// ============================================

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  // Call backend to invalidate refresh token
  if (refreshToken) {
    try {
      await api.logout(refreshToken);
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error);
    }
  }

  // Clear all stored data
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}

// ============================================
// Get User Info
// ============================================

export function getUserEmail(): string | null {
  return localStorage.getItem(USER_EMAIL_KEY);
}

export function getUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

export function getUserRole(): 'user' | 'admin' | null {
  const role = localStorage.getItem(USER_ROLE_KEY);
  return role as 'user' | 'admin' | null;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}
