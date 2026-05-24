// src/lib/auth.ts
import { writable, derived } from 'svelte/store';

type AuthUser = {
  userID: number;
  username: string;
  role: 'admin' | 'user';
  applicationID: string | null;
} | null;

function createAuth() {
  const user = writable<AuthUser>(null);

  // Read from localStorage on init
  function init() {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem('loandb_user');
    if (stored) {
      try { user.set(JSON.parse(stored)); } catch { user.set(null); }
    }
  }

  function login(userData: AuthUser) {
    user.set(userData);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('loandb_user', JSON.stringify(userData));
    }
  }

  function logout() {
    user.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('loandb_user');
    }
  }

  const isLoggedIn = derived(user, $u => $u !== null);
  const isAdmin    = derived(user, $u => $u?.role === 'admin');

  return { user, isLoggedIn, isAdmin, init, login, logout };
}

export const auth = createAuth();
