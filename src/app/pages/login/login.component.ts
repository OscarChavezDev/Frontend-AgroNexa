import { Component, ChangeDetectorRef, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { PopupService } from '../../shared/services/popup.service';

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
    private ngZone: NgZone,
    private analyticsService: AnalyticsService,
    private popupService: PopupService
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngAfterViewInit(): void {
    this.waitForGoogleAndInit();
  }

  private waitForGoogleAndInit(attempts = 0): void {
    if (typeof google !== 'undefined') {
      this.initializeGoogleSignIn();
    } else if (attempts < 20) {
      setTimeout(() => this.waitForGoogleAndInit(attempts + 1), 250);
    }
  }

  private initializeGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: '150252966514-r2cbcos1n2mhl871c3iu0ga2t1e9o5le.apps.googleusercontent.com',
      callback: (response: any) => this.ngZone.run(() => this.handleGoogleCredentialResponse(response))
    });

    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: 320, logo_alignment: 'left' }
    );
  }

  private handleGoogleCredentialResponse(response: any): void {
    const idToken = response.credential;
    this.loading = true;
    this.errorMsg = '';

    this.authService.loginWithGoogle(idToken).subscribe({
      next: (res) => {
        this.loading = false;
        const isNewUser = localStorage.getItem('google_new_user') === 'true';
        localStorage.removeItem('google_new_user');
        const rol = res.data?.rol;
        this.analyticsService.trackEvent('login', { method: 'google', role: rol });

        if (isNewUser) {
          localStorage.setItem('agro_new_registration', 'true');
          this.router.navigate(['/register'], { queryParams: { mode: 'selectRole' } });
        } else if (rol === 'admin') {
          this.popupService.success('¡Bienvenido!', 'Sesión de administrador iniciada correctamente.');
          this.router.navigate(['/admin']);
        } else {
          this.popupService.success('¡Bienvenido!', 'Sesión iniciada correctamente.');
          this.onboarding.checkAndStart();
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al iniciar sesión con Google';
        this.loading = false;
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
            this.popupService.success('¡Bienvenido!', 'Sesión de administrador iniciada correctamente.');
            this.router.navigate(['/admin']);
          } else {
            this.popupService.success('¡Bienvenido!', 'Sesión iniciada correctamente.');
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
        this.errorMsg = this.mensajeErrorLogin(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Traduce el error HTTP a un mensaje claro (distingue red/CORS de credenciales). */
  private mensajeErrorLogin(err: any): string {
    // status 0 = la petición no llegó a completarse: sin conexión, servidor caído o bloqueo CORS.
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión o inténtalo más tarde.';
    }
    if (err?.status === 401) {
      return 'Credenciales incorrectas. Verifica tu correo y contraseña.';
    }
    if (err?.status === 403) {
      return err.error?.message || 'Tu cuenta no tiene acceso. Contacta al administrador.';
    }
    if (err?.status >= 500) {
      return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
    }
    return err?.error?.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.';
  }

  get f() { return this.form.controls; }
}

