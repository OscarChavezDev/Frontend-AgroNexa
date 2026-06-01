import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false
})
export class RegisterComponent implements AfterViewInit {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  showPassword = false;

  roles = [
    { value: 'productor',  icon: '🌾', label: 'Productor',   desc: 'Agricultor individual' },
    { value: 'asociacion', icon: '🤝', label: 'Asociación',  desc: 'Grupo de productores' },
    { value: 'institucion',icon: '🏛️', label: 'Institución', desc: 'Entidad técnica o educativa' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      apellido: ['', Validators.required],
      correo:   ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol:      ['productor', Validators.required]
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
        this.errorMsg = err.error?.message || 'Error al registrar con Google';
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
    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.successMsg = 'Cuenta creada. Redirigiendo al login…';
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Error al crear la cuenta';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get f() { return this.form.controls; }
}

