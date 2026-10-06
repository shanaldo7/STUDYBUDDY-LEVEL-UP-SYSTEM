/**
 * StudyBuddy AI - Client Authentication & Cloud Progression Sync Engine
 */

import { HunterUser, DailyQuest, ShadowSoldier, SkillNode, Flashcard, ExamMilestone } from '../types/hunter';

const TOKEN_KEY = 'studybuddy_auth_token';
const CACHED_USER_KEY = 'studybuddy_cached_user';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: HunterUser | null;
  email: string | null;
  displayName: string | null;
  avatarUrl?: string;
  isNewUser?: boolean;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export async function loginWithGoogle(email: string, displayName: string, photoUrl?: string, googleId?: string): Promise<{
  success: boolean;
  user: HunterUser;
  token: string;
  isNewUser: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName, photoUrl, googleId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    setStoredToken(data.token);
    try {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    } catch {
      // ignore
    }

    return {
      success: true,
      user: data.user,
      token: data.token,
      isNewUser: Boolean(data.isNewUser)
    };
  } catch (err: unknown) {
    console.error('[Auth Service] Login error:', err);
    throw err;
  }
}

export async function checkCurrentSession(): Promise<{
  isAuthenticated: boolean;
  user: HunterUser | null;
  email?: string;
  displayName?: string;
}> {
  const token = getStoredToken();
  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      setStoredToken(null);
      return { isAuthenticated: false, user: null };
    }

    const data = await res.json();
    return {
      isAuthenticated: true,
      user: data.user,
      email: data.email,
      displayName: data.displayName
    };
  } catch {
    // Network or server offline; check cached user
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      if (cached) {
        return { isAuthenticated: true, user: JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
    return { isAuthenticated: false, user: null };
  }
}

export async function logoutUser(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      // ignore
    }
  }
  setStoredToken(null);
  try {
    localStorage.removeItem(CACHED_USER_KEY);
    localStorage.removeItem('studybuddy_hunter_user');
  } catch {
    // ignore
  }
}

/**
 * Cloud Sync for User Progression
 */
let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleCloudSync(
  user: HunterUser,
  quests?: DailyQuest[],
  shadows?: ShadowSoldier[],
  skills?: SkillNode[],
  flashcards?: Flashcard[],
  exams?: ExamMilestone[],
  immediate = false
) {
  if (syncTimer) clearTimeout(syncTimer);

  const runSync = async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      await fetch('/api/progress/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user,
          quests,
          shadows,
          skills,
          flashcards,
          exams
        })
      });
    } catch (err) {
      console.warn('[Sync Service] Auto-save skipped:', err);
    }
  };

  if (immediate) {
    runSync();
  } else {
    syncTimer = setTimeout(runSync, 1200);
  }
}

/**
 * Safe Reset Progression Request
 */
export async function requestProgressReset(confirmation: string): Promise<HunterUser> {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch('/api/progress/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ confirmation })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Reset failed' }));
    throw new Error(err.error || 'Reset failed');
  }

  const data = await res.json();
  try {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    localStorage.removeItem('studybuddy_hunter_quests');
    localStorage.removeItem('studybuddy_hunter_shadows');
    localStorage.removeItem('studybuddy_hunter_skills');
  } catch {
    // ignore
  }
  return data.user;
}
