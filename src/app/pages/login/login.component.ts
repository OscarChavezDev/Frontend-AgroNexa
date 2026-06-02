import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { OnboardingService } from '../../core/services/onboarding.service';

declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent implements AfterViewInit {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private onboarding: OnboardingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private analyticsService: AnalyticsService
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '150252966514-r2cbcos1n2mhl871c3iu0ga2t1e9o5le.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleCredentialResponse(response)
      });

      google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: 320, logo_alignment: 'left' }
      );
    }
  }

  private handleGoogleCredentialResponse(response: any): void {
    const idToken = response.credential;
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.authService.loginWithGoogle(idToken).subscribe({
      next: (res) => {
        try {
          const rol = res.data?.rol;
          this.analyticsService.trackEvent('login', { method: 'google', role: rol });
          if (rol === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } catch (e) {
          console.error('Error handling login response:', e);
          this.errorMsg = 'Error al procesar la sesión';
          this.loading = false;
        } finally {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al iniciar sesión con Google';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        try {
          const rol = res.data?.rol;
          this.analyticsService.trackEvent('login', { method: 'email', role: rol });
          if (rol === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.onboarding.checkAndStart();
            this.router.navigate(['/dashboard']);
          }
        } catch (e) {
          console.error('Error handling login response:', e);
          this.errorMsg = 'Error al procesar la sesión';
          this.loading = false;
        } finally {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Credenciales incorrectas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get f() { return this.form.controls; }
}

