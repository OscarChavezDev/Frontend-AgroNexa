import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService, endpoint } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { User, LoginRequest, RegisterRequest, LoginResponse, RegisterResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
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
          localStorage.setItem('token', res.data.token);
        }
      }),
      switchMap(() => this.me())
    );
  }

  loginWithGoogle(idToken: string): Observable<ApiResponse<User>> {
    return this.api.post<ApiResponse<LoginResponse>>(endpoint.AUTH_GOOGLE, { idToken }).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('token', res.data.token);
          if (res.data.isNewUser) {
            localStorage.setItem('google_new_user', 'true');
          } else {
            localStorage.removeItem('google_new_user');
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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
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
