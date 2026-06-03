import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { User, LoginRequest, RegisterRequest, LoginResponse, RegisterResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {
    if (this.hasValidToken()) {
      this.currentUserSubject.next(this.getUserFromStorage());
    } else {
      this.clearStoredSession();
    }
  }

  get currentUser(): User | null {
    if (!this.hasValidToken()) {
      this.clearStoredSession();
      return null;
    }
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    if (!this.hasValidToken()) {
      this.clearStoredSession();
      return false;
    }
    return true;
  }

  get isAdmin(): boolean {
    return this.currentUser?.rol === 'admin';
  }

  // El backend devuelve { id } al registrar — redirige al login
  register(data: RegisterRequest): Observable<ApiResponse<RegisterResponse>> {
    return this.api.post<ApiResponse<RegisterResponse>>(endpoint.AUTH_REGISTER, data);
  }

  // El backend devuelve { token, rol, plan } — luego llama /me para obtener el usuario completo
  login(data: LoginRequest): Observable<ApiResponse<User>> {
    return this.api.post<ApiResponse<LoginResponse>>(endpoint.AUTH_LOGIN, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.storeToken(res.data.token);
          if (res.data.wasReactivated) {
            localStorage.setItem('agro_welcome_back', 'true');
          } else {
            localStorage.removeItem('agro_welcome_back');
          }
        }
      }),
      switchMap(() => this.me())
    );
  }

  loginWithGoogle(idToken: string): Observable<ApiResponse<User>> {
    return this.api.post<ApiResponse<LoginResponse>>(endpoint.AUTH_GOOGLE, { idToken }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.storeToken(res.data.token);
          if (res.data.isNewUser) {
            localStorage.setItem('google_new_user', 'true');
          } else {
            localStorage.removeItem('google_new_user');
          }
          if (res.data.wasReactivated) {
            localStorage.setItem('agro_welcome_back', 'true');
          } else {
            localStorage.removeItem('agro_welcome_back');
          }
        }
      }),
      switchMap(() => this.me())
    );
  }

  updateProfile(data: Record<string, any>): Observable<ApiResponse<User>> {
    return this.api.put<ApiResponse<any>>(endpoint.USERS_ME, data).pipe(
      switchMap(() => this.me())
    );
  }

  subscribeToPlan(planCode: string): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(endpoint.SUSCRIPCIONES, { plan: planCode });
  }


  me(): Observable<ApiResponse<User>> {
    return this.api.get<ApiResponse<User>>(endpoint.AUTH_ME).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('user', JSON.stringify(res.data));
          this.currentUserSubject.next(res.data);
        }
      })
    );
  }

  getToken(): string | null {
    if (!this.hasValidToken()) {
      this.clearStoredSession();
      return null;
    }
    return localStorage.getItem('token');
  }

  logout(): void {
    this.clearStoredSession();
    this.router.navigate(['/login']);
  }

  private storeToken(token: string) {
    localStorage.setItem('token', token);
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = this.decodeTokenPayload(token);
    if (!payload || typeof payload['exp'] !== 'number') return false;

    return payload['exp'] * 1000 > Date.now();
  }

  private decodeTokenPayload(token: string): Record<string, any> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private clearStoredSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('agro_welcome_back');
    localStorage.removeItem('google_new_user');
    this.currentUserSubject.next(null);
  }

  private getUserFromStorage(): User | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  }
}
