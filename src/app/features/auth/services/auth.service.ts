import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppUserRole = 'admin' | 'user';

export interface AuthSession {
  username: string;
  role: AppUserRole;
}

interface LoginResult {
  success: boolean;
  message?: string;
  role?: AppUserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'storefront:auth-session';
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  login(username: string, password: string): LoginResult {
    const normalizedUser = username.trim().toLowerCase();

    if (normalizedUser === 'admin' && password === 'admin123') {
      this.saveSession({ username: 'admin', role: 'admin' });
      return { success: true, role: 'admin' };
    }

    if (normalizedUser === 'user' && password === 'user123') {
      this.saveSession({ username: 'user', role: 'user' });
      return { success: true, role: 'user' };
    }

    return {
      success: false,
      message: 'Credenciales invalidas. Usa admin/admin123 o user/user123.'
    };
  }

  logout(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.storageKey);
  }

  getSession(): AuthSession | null {
    if (!this.isBrowser) {
      return null;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (
        typeof parsed.username === 'string' &&
        (parsed.role === 'admin' || parsed.role === 'user')
      ) {
        return {
          username: parsed.username,
          role: parsed.role
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getSession()?.role === 'admin';
  }

  isAuthenticated(): boolean {
    return !!this.getSession();
  }

  private saveSession(session: AuthSession): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }
}
